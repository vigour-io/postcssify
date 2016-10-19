'use strict'
const config = require('./config')
module.exports = global.postcssify || (global.postcssify = {
  dest: config.dest,
  styles: {},
  resolved: {},
  paths: {},
  deps: {}
})
