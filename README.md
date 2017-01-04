# JSON Post Process Webpack Plugin

[![Build Status](https://travis-ci.org/cskeppstedt/json-post-process-webpack-plugin.svg)](https://travis-ci.org/cskeppstedt/json-post-process-webpack-plugin)

Simple [webpack](http://webpack.github.io/) plugin that allows you to modify json files during the emit-phase (when all modules have been sealed and compiled). You can add stuff, remove stuff, or replace the contents completely.

The plugin was written to solve a problem I encountered personally, and so it was only built it for that specific use case. It relies on the native `Promise` implementation of node, and uses `const` etc., so it will depend on a somewhat recent version of nodejs.

## Usage

Given a webpack project, install it as a local development dependency:

```bash
npm install --save-dev json-post-process-webpack-plugin
```

Then, simply configure it as a plugin in the webpack config:

```javascript
var JsonPostProcessPlugin = require('json-post-process-webpack-plugin')

module.exports = {
  plugins: [
    new JsonPostProcessPlugin({
      matchers: [{
        matcher: /^json-file-in-your-build.json$/,
        action: (currentJsonContent) => ({ ...currentJsonContent, someNewStuff: '...' })
      }]
    })
  ]
}
```

## Matchers API

The matchers option is an array of objects that have a `matcher` property (must be a `RegExp`), and an `action` property, which must be a function. The `action` function should either return the new JSON, or a Promise that will resolve the new JSON.

- `matcher` is a RegExpt, and is being tested against the asset name, that is, the filenames in your build-folder.
- `action` is a function that receives 2 arguments: `json` (JSON content of the file), and `assetKey` (the filename that was matched by the `matcher`)
