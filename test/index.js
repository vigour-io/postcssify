'use strict'

var path = require('path')
var test = require('tape')
var browserify = require('browserify')
var fs = require('vigour-fs-promised')
var postcssify = require('../')

test('defaults', function (t) {
  t.plan(2)
  var brow = browserify()
  var outFile = path.join(__dirname, '_files', 'out.css')
  var expected = path.join(__dirname, '_files', 'expected.css')
  var expectedMap = path.join(__dirname, '_files', 'expected.map')
  brow.plugin(postcssify, {
    filePlugins: [
      'postcss-import'
    ],
    plugins: [
      'postcss-cssnext'
    ],
    out: outFile,
    map: outFile + '.map'
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
        fs.readFileAsync(expected, 'utf8'),
        fs.readFileAsync(outFile + '.map', 'utf8'),
        fs.readFileAsync(expectedMap, 'utf8')
      ]).then((contents) => {
        t.equal(contents[0], contents[1], 'produces the expected css')
        t.equal(contents[2], contents[3], 'produces the expected source map')
      }).catch((reason) => {
        console.error('reading files', reason)
      })
      .then(() => {
        return fs.removeAsync(outFile)
      })
    }, 1500)
  })
})
