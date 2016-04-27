'use strict'

require('./before.css')
var component = require('./component')
console.log('component', component)
require('./after.css')
require('./requiredtwice.css')

// commented requires should be ignored: require('ignored.css')
