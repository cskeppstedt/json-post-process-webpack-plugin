const expect = require('chai').expect
const webpack = require('webpack')
const fs = require('fs-extra')
const path = require('path')
const JsonPostProcessPlugin = require('.')

const sourceProject = path.join(__dirname, '../fixtures/project')
const targetProject = path.join(__dirname, '../tmp/project')
const targetProjectConfig = path.join(targetProject, 'webpack.config.js')
const targetBuild = path.join(__dirname, '../tmp/build')

const setupWithMatchers = matchers => {
  fs.emptyDirSync(targetProject)
  fs.copySync(sourceProject, targetProject)
  fs.remove(targetBuild)

  const config = require(targetProjectConfig)

  return Object.assign({}, config, {
    context: targetProject,
    output: Object.assign({}, config.output, {
      path: targetBuild
    }),
    plugins: [].concat(config.plugins).concat([
      new JsonPostProcessPlugin({
        matchers: matchers
      })
    ])
  })
}

describe('json-post-process-webpack-plugin (integration)', () => {
  describe('adding a property, with synchronous action', () => {
    beforeEach(function (done) {
      const config = setupWithMatchers([
        {
          matcher: /^manifest.json$/,
          action: json => Object.assign({}, json, { added: 'a property' })
        }
      ])
      webpack(config, done)
    })

    it('should add a property to manifest.json', () => {
      const manifestPath = path.join(targetBuild, 'manifest.json')
      const contents = fs.readJSONSync(manifestPath)
      expect(contents).to.eql({
        'index.js': 'http://cdn.com/assets/index-06d15791.js',
        added: 'a property'
      })
    })
  })

  describe('adding a property for the matched assetKey, with synchronous action', () => {
    beforeEach(function (done) {
      const config = setupWithMatchers([
        {
          matcher: /^manifest.json$/,
          action: (json, assetKey) =>
            Object.assign({}, json, { [assetKey]: 'modified!' })
        }
      ])
      webpack(config, done)
    })

    it('should add a property based on assetKey in manifest.json', () => {
      const manifestPath = path.join(targetBuild, 'manifest.json')
      const contents = fs.readJSONSync(manifestPath)
      expect(contents).to.eql({
        'index.js': 'http://cdn.com/assets/index-06d15791.js',
        'manifest.json': 'modified!'
      })
    })
  })

  describe('returning new content, with Promise action', () => {
    beforeEach(function (done) {
      const config = setupWithMatchers([
        {
          matcher: /^manifest.json$/,
          action: (json, assetKey) =>
            Promise.resolve({ something: 'completely different' })
        }
      ])
      webpack(config, done)
    })

    it('should write the new json to manifest.json', () => {
      const manifestPath = path.join(targetBuild, 'manifest.json')
      const contents = fs.readJSONSync(manifestPath)
      expect(contents).to.eql({
        something: 'completely different'
      })
    })
  })

  describe('undefined/invalid matcher', () => {
    it('should propagate an error in the compilation', done => {
      const config = setupWithMatchers([
        {
          matcher: null,
          action: json => { }
        }
      ])
      webpack(config, function (err) {
        try {
          expect(err).to.be.an('error')
          expect(err.message).to.equal('`matcher` must be a RegExp')
          done()
        } catch (assertErr) {
          done(assertErr)
        }
      })
    })
  })

  describe('rejecting action', () => {
    it('should propagate an error to the compilation', done => {
      const config = setupWithMatchers([
        {
          matcher: /^.*.json$/,
          action: json => Promise.reject(new Error('minor failure'))
        }
      ])
      webpack(config, function (err) {
        try {
          expect(err).to.be.an('error')
          expect(err.message).to.match(/minor failure/)
          done()
        } catch (assertErr) {
          done(assertErr)
        }
      })
    })
  })
})
