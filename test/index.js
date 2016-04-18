'use strict'

var path = require('path')
var test = require('tape')
var browserify = require('browserify')
var fs = require('vigour-fs-promised')
var postcssify = require('../')

test('defaults', function (t) {
  t.plan(1)
  var brow = browserify()
  var outFile = path.join(__dirname, '_files', 'out.css')
  var expected = path.join(__dirname, '_files', 'expected.css')
  brow.plugin(postcssify, {
    plugins: [
      'postcss-cssnext'
    ],
    out: outFile
  })
  brow.add(path.join(__dirname, '_files', 'entry.js'))
  brow.bundle(function onComplete (err) {
    if (err) {
      t.fail('browserify errored: ' + err)
    }
    // TODO fix the plugin so this `setTimeout` is no longer necessary
    setTimeout(function () {
      Promise.all([
        fs.readFileAsync(outFile, 'utf8'),
        fs.readFileAsync(expected, 'utf8')
      ]).then((contents) => {
        t.equal(contents[0], contents[1], 'produces the expected css')
      }).catch((reason) => {
        console.error('reading files', reason)
      })
      .then(() => {
        return fs.removeAsync(outFile)
      })
    }, 1500)
  })
})
