const expect = require('chai').expect
const webpack = require('webpack')
const fs = require('fs-extra')
const path = require('path')
const JsonPostProcessPlugin = require('.')

const sourceProject = path.join(__dirname, '../fixtures/project')
const targetProject = path.join(__dirname, '../tmp/project')
const targetProjectConfig = path.join(targetProject, 'webpack.config.js')
const targetBuild = path.join(__dirname, '../tmp/build')
const originalPlugins = require(targetProjectConfig).plugins

const setupWithMatchers = (matchers) => {
  fs.emptyDirSync(targetProject)
  fs.copySync(sourceProject, targetProject)
  fs.remove(targetBuild)

  const config = require(targetProjectConfig)
  config.context = targetProject
  config.output.path = targetBuild
  config.plugins = [].concat(originalPlugins).concat([
    new JsonPostProcessPlugin({
      matchers: matchers
    })
  ])

  return config
}

describe('json-post-process-webpack-plugin (integration)', () => {
  describe('happy path', () => {
    beforeEach(function (done) {
      const config = setupWithMatchers([{
        matcher: /^manifest.json$/,
        action: (json) => Object.assign({}, json, { modified: 'json' })
      }])
      webpack(config, done)
    })

    it('should add a property to manifest.json', () => {
      const manifestPath = path.join(targetBuild, 'manifest.json')
      const contents = fs.readJSONSync(manifestPath)
      expect(contents).to.eql({
        '1.1-38960d7571b50dd9b785.js': 'http://cdn.com/assets/1.1-38960d7571b50dd9b785.js',
        '2.2-38960d7571b50dd9b785.js': 'http://cdn.com/assets/2.2-38960d7571b50dd9b785.js',
        'main.js': 'http://cdn.com/assets/main-38960d7571b50dd9b785.js',
        modified: 'json'
      })
    })
  })
  describe('failing matcher', () => {
    it('should propagate an error in the compilation', (done) => {
      const config = setupWithMatchers([{
        matcher: (assetKey) => Promise.reject(new Error('major failure')),
        action: (json) => Object.assign({}, json, { modified: 'json' })
      }])
      webpack(config, function (err) {
        try {
          expect(err).to.be.an('error')
          expect(err.message).to.match(/major failure/)
          done()
        } catch (e) {
          done(e)
        }
      })
    })
  })
  describe('failing action', () => {
    it('should propagate an error to the compilation', (done) => {
      const config = setupWithMatchers([{
        matcher: (assetKey) => Promise.resolve(true),
        action: (json) => Promise.reject(new Error('minor failure'))
      }])
      webpack(config, function (err) {
        try {
          expect(err).to.be.an('error')
          expect(err.message).to.match(/minor failure/)
          done()
        } catch (e) {
          done(e)
        }
      })
    })
  })
})
