function JsonPostProcessPlugin (options) {
  this.matchers = options.matchers || []
}

JsonPostProcessPlugin.prototype.apply = function (compiler) {
  const matchers = this.matchers

  compiler.plugin('emit', function(compilation, emitCallback) {
    if (hasInvalidMatchers(matchers)) {
      return emitCallback(new Error('`matcher` must be a RegExp'))
    }

    const allPromises = Object.keys(compilation.assets).reduce((acc, assetKey) => {
      return acc.concat(
        matchers
          .filter(({ matcher }) => matcher.test(assetKey))
          .map(({ action }) => action)
          .map(runAction(compilation, assetKey))
      )
    }, [])

    Promise
      .all(allPromises)
      .then(() => emitCallback(), emitCallback)
  })
}

const runAction = (compilation, assetKey) => action => {
  const json = JSON.parse(compilation.assets[assetKey].source())
  return actionAsPromise(action)(json, assetKey).then((newContent) => {
    compilation.assets[assetKey] = makeAsset(newContent)
  })
}

const actionAsPromise = (action) => (json, assetKey) => {
  try {
    const result = action(json, assetKey)
    return (result instanceof Promise) ? result : Promise.resolve(result)
  } catch (e) {
    return Promise.reject(e)
  }
}

const makeAsset = (content) => {
  const json = JSON.stringify(content, null, 2)
  return { source: () => json, size: () => size.length }
}

const hasInvalidMatchers = (matchers) => (
  matchers.filter(({ matcher }) => !(matcher instanceof RegExp)).length > 0
)

module.exports = JsonPostProcessPlugin
