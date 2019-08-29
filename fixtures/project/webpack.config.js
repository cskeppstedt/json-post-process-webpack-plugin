const WebpackAssetsManifest = require('webpack-assets-manifest')
const publicPath = 'http://cdn.com/assets/'

module.exports = {
  entry: {
    index: './index.js'
  },

  output: {
    publicPath: publicPath,
    filename: '[name]-[hash:8].js'
  },

  plugins: [new WebpackAssetsManifest({ publicPath: true })]
}
