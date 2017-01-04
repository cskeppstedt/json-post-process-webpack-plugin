function JsonPostProcessPlugin (options) {
  this.matchers = options.matchers || []
}

function regexMatcherAsPromise (matcher) {
  return function (assetKey) {
    try {
      return Promise.resolve(matcher.test(assetKey))
    } catch (e) {
      return Promise.reject(e)
    }
  }
}

function matcherAsPromise (matcher) {
  if (matcher instanceof RegExp) {
    return regexMatcherAsPromise(matcher)
  } else {
    return () => Promise.reject(new TypeError('`matcher` must be a RegExp'))
  }
}

function actionAsPromise (action) {
  return function (json, assetKey) {
    try {
      const result = action(json, assetKey)
      if (result instanceof Promise) {
        return result
      } else {
        return Promise.resolve(result)
      }
    } catch (e) {
      return Promise.reject(e)
    }
  }
}

JsonPostProcessPlugin.prototype.apply = function (compiler) {
  const matchers = this.matchers
  compiler.plugin('emit', function(compilation, emitCallback) {
    const allPromises = []

    for (var assetKey in compilation.assets) {
      matchers.forEach(({ matcher, action }) => {
        const matcherPromise = matcherAsPromise(matcher)(assetKey).then((matchResult) => {
          if (matchResult) {
            const json = JSON.parse(compilation.assets[assetKey].source())
            return actionAsPromise(action)(json, assetKey).then((newContent) => {
              compilation.assets[assetKey] = makeAsset(newContent)
            })
          }
        })

        allPromises.push(matcherPromise)
      })
    }

    Promise.all(allPromises)
      .then(() => emitCallback())
      .catch((err) => emitCallback(err))
  })
}

const makeAsset = (content) => {
  const json = JSON.stringify(content, null, 2)
  return {
    source: () => json,
    size: () => size.length
  }
}

module.exports = JsonPostProcessPlugin
