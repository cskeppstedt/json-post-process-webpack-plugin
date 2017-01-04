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
  }

  return function (assetKey) {
    return matcher(assetKey)
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
            return actionAsPromise(action)(json, assetKey).then((newJson) => {
              const newContent = JSON.stringify(newJson, null, 2);
              compilation.assets[assetKey] = {
                source: function() {
                  return newContent
                },
                size: function() {
                  return newContent.length;
                }
              }
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

module.exports = JsonPostProcessPlugin
