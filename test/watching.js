'use strict'

var path = require('path')
var test = require('tape')
var fs = require('vigour-fs-promised')

var postcssify = require('../')
var setupTestRepos = require('./setuptestrepos')
var browserify = require('browserify')
var watchify = require('watchify')

var out = path.join(__dirname, '_files', 'out')
var jsOut = out + '.js'
var cssOut = out + '.css'
var cssMap = cssOut + '.map'

test('links:watchify', function (t) {
  t.plan(6)
  var expected = path.join(__dirname, '_files', 'expected')
  var jsExpected = expected + '_modules.js'
  var cssExpected = expected + '_modules.css'
  var cssExpectedMap = cssExpected + '.map'
  setupTestRepos(true)
    .then(() => {
      var brow = browserify({
        entries: [path.join(__dirname, '..', '..', 'postcssify-test-repos', 'linked', 'postcssify-test-subject', 'subject.js')],
        cache: {},
        packageCache: {},
        plugin: [
          watchify
        ],
        transform: [
          [postcssify, {
            out: cssOut,
            map: cssMap,
            force: ['out', 'map']
          }]
        ],
        debug: true,
        outfile: jsOut
      })

      brow.on('update', bundle)
      brow.on('log', function () {
        console.log('reading')
        // Promise.all([
        //   fs.readFileAsync(jsOut, 'utf8'),
        //   fs.readFileAsync(jsExpected, 'utf8'),
        //   fs.readFileAsync(cssOut, 'utf8'),
        //   fs.readFileAsync(cssExpected, 'utf8'),
        //   fs.readFileAsync(cssMap, 'utf8'),
        //   fs.readFileAsync(cssExpectedMap, 'utf8')
        // ])
        //   .then((contents) => {
        //     t.equal(contents[0], contents[1], 'JS bundle with map')
        //     t.equal(contents[2], contents[3], 'CSS bundle')
        //     t.equal(contents[4], contents[5], 'CSS map')
        //   }).catch((reason) => {
        //     console.error('reading files', reason)
        //   })
          // .then(() => {
          //   return Promise.all([
          //     fs.removeAsync(jsOut),
          //     fs.removeAsync(cssOut),
          //     fs.removeAsync(cssMap)
          //   ])
          // })
      })
      bundle()

      function bundle (ids) {
        console.log('BUNDLE', arguments)
        brow.bundle().pipe(fs.createWriteStream(jsOut))
      }
    })
})
