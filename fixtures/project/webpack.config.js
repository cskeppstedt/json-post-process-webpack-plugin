const ManifestPlugin = require('webpack-manifest-plugin')
const publicPath = 'http://cdn.com/assets/'

module.exports = {
  entry: './index.js',

  output: {
    publicPath: publicPath,
    filename: '[name]-[hash].js'
  },

  plugins: [
    new ManifestPlugin({
      publicPath: publicPath
    })
  ]
}
