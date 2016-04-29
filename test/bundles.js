'use strict'

var path = require('path')
var test = require('tape')
var browserify = require('browserify')
var fs = require('vigour-fs-promised')
var postcssify = require('../')

test('bundles', function (t) {
  t.plan(3)
  var out = path.join(__dirname, '_files', 'out')
  var jsOut = out + '.js'
  var jsws = fs.createWriteStream(jsOut)
  var cssOut = out + '.css'
  var cssMap = cssOut + '.map'

  var expected = path.join(__dirname, '_files', 'expected')
  var jsExpected = expected + '.js'
  var cssExpected = expected + '.css'
  var cssExpectedMap = cssExpected + '.map'

  var brow = browserify()
  brow.transform(postcssify, {
    out: cssOut,
    map: cssMap
  })
  brow.add(path.join(__dirname, '_files', 'entry.js'))
  brow.bundle(function onComplete (err) {
    if (err) {
      t.fail('browserify errored: ' + err)
    }
    // TODO fix the plugin so this `setTimeout` is no longer necessary
    setTimeout(function () {
      Promise.all([
        fs.readFileAsync(jsOut, 'utf8'),
        fs.readFileAsync(jsExpected, 'utf8'),
        fs.readFileAsync(cssOut, 'utf8'),
        fs.readFileAsync(cssExpected, 'utf8'),
        fs.readFileAsync(cssMap, 'utf8'),
        fs.readFileAsync(cssExpectedMap, 'utf8')
      ]).then((contents) => {
        t.equal(contents[0], contents[1], 'JS bundle')
        t.equal(contents[2], contents[3], 'CSS bundle')
        t.equal(contents[4], contents[5], 'CSS source map')
      }).catch((reason) => {
        console.error('reading files', reason)
      })
      .then(() => {
        return Promise.all([
          fs.removeAsync(jsOut),
          fs.removeAsync(cssOut),
          fs.removeAsync(cssMap)
        ])
      })
    }, 1500)
  }).pipe(jsws)
})
