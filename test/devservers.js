'use strict'

var path = require('path')
var test = require('tape')
var fs = require('vigour-fs-promised')
var budo = require('budo')
var postcssify = require('../')
var setupTestRepos = require('./setuptestrepos')

var out = path.join(__dirname, '_files', 'out')
var jsOut = out + '.js'
var cssOut = out + '.css'
var cssMap = cssOut + '.map'

test('links:budo', function (t) {
  setupTestRepos(true)
    .then(() => {
      var expected = path.join(__dirname, '_files', 'expected')
      var jsExpected = expected + '_modules.js'
      var cssExpected = expected + '_modules.css'
      var cssExpectedMap = cssExpected + '.map'

      var devServer = budo(path.join(__dirname, '..', '..', 'postcssify-test-repos', 'linked', 'postcssify-test-subject', 'subject.js'), {
        live: true,
        stream: process.stdout, // log to stdout
        css: cssOut,
        verbose: true,
        browserify: {
          debug: true,
          outfile: jsOut,
          transform: [
            [postcssify, {
              out: cssOut,
              map: cssMap,
              force: ['out', 'map']
            }]
          ]
        }
      })

      devServer.on('exit', function () {
        console.log('exit', arguments)
      })
      devServer.on('error', function (err) {
        console.log('error', arguments)
        t.fail('budo errored: ' + err + '\n')
      })
      devServer.on('connect', function () {
        console.log('connect', arguments)
        // Promise.all([
        //   fs.readFileAsync(jsOut, 'utf8'),
        //   fs.readFileAsync(jsExpected, 'utf8'),
        //   fs.readFileAsync(cssOut, 'utf8'),
        //   fs.readFileAsync(cssExpected, 'utf8'),
        //   fs.readFileAsync(cssMap, 'utf8'),
        //   fs.readFileAsync(cssExpectedMap, 'utf8')
        // ]).then((contents) => {
        //   t.equal(contents[0], contents[1], 'JS bundle with map')
        //   t.equal(contents[2], contents[3], 'CSS bundle')
        //   t.equal(contents[4], contents[5], 'CSS map')
        // }).catch((reason) => {
        //   console.error('reading files', reason)
        // })
        // .then(() => {
        //   return Promise.all([
        //     // fs.removeAsync(jsOut),
        //     // fs.removeAsync(cssOut),
        //     // fs.removeAsync(cssMap)
        //   ])
        // })
        // .then(() => {
        //   t.end()
        // })
      })
      devServer.on('pending', function () {
        console.log('pending', arguments)
      })
      devServer.on('update', function () {
        console.log('update', arguments)
      })
      devServer.on('reload', function () {
        console.log('reload', arguments)
      })
      devServer.on('watch', function () {
        console.log('watch', arguments)
      })
    })
})
