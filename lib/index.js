function shouldRunAction (matcher, assetKey) {
  return matcher.test(assetKey)
}

function runAction (action, compilation, assetKey) {
  const json = JSON.parse(compilation.assets[assetKey].source())
  return actionAsPromise(action)(json, assetKey).then(newContent => {
    compilation.assets[assetKey] = makeAsset(newContent)
  })
}

function actionAsPromise (action) {
  return (json, assetKey) => {
    try {
      const result = action(json, assetKey)
      return result instanceof Promise ? result : Promise.resolve(result)
    } catch (e) {
      return Promise.reject(e)
    }
  }
}

function makeAsset (content) {
  const json = JSON.stringify(content, null, 2)
  return {
    source: () => json,
    size: () => json.length
  }
}

function hasInvalidMatchers (matchers) {
  return (
    matchers.filter(matcher => !(matcher.matcher instanceof RegExp)).length > 0
  )
}

function JsonPostProcessPlugin (options) {
  this.matchers = options.matchers || []
}

JsonPostProcessPlugin.prototype.apply = function (compiler) {
  const matchers = this.matchers

  compiler.hooks.emit.tapAsync(
    'JsonPostProcessPlugin',
    (compilation, callback) => {
      if (hasInvalidMatchers(matchers)) {
        return callback(new Error('`matcher` must be a RegExp'))
      }
      const allPromises = Object.keys(compilation.assets).reduce(
        (acc, assetKey) =>
          acc.concat(
            matchers
              .filter(matcher => shouldRunAction(matcher.matcher, assetKey))
              .map(matcher => runAction(matcher.action, compilation, assetKey))
          ),
        []
      )

      Promise.all(allPromises)
        .then(() => callback())
        .catch(err => callback(err))
    }
  )
}

module.exports = JsonPostProcessPlugin
