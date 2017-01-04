var dep1 = require('./dependency-1')
var dep2 = require('./dependency-2')

console.log('index:', dep1, dep2)

require.ensure([], function (require) {
  console.log(require('./dependency-3'))
})

require.ensure([], function (require) {
  console.log(require('./dependency-4'))
})
