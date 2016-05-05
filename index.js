'use strict'

var through = require('through2')
var Bundle = require('./bundle.js')
var bundle

module.exports = exports = function Transform (file, options) {
  // console.log('file', file)
  bundle = Bundle.getInstance(global, options)
  if (exports.isJSON(file)) {
    return through()
  }
  if (exports.isCSS(file)) {
    return exports.css(file, options)
  } else {
    // other, let's assume Javascript
    return exports.js(file, options)
  }
}

exports.css = function css (file, options) {
  var body = ''
  var tr = through(function cssChunk (buf, enc, next) {
    body += buf
    next()
  }, function cssFlush (next) {
    tr.push(bundle.addCSS(file, body, options))
    bundle.rebundle(next)
  })
  return tr
}

exports.js = function js (file, options) {
  var body = ''
  var tr = through(function jsChunk (buf, enc, next) {
    body += buf
    next()
  }, function jsFlush (next) {
    tr.push(bundle.addJS(file, body, options))
    bundle.rebundle(next)
  })
  return tr
}

exports.isJSON = function isJSON (str) {
  return str.match(/\.json$/)
}

exports.isCSS = function isCSS (str) {
  return str.match(/\.css$/)
}
