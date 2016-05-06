'use strict'

var path = require('path')
var test = require('tape')
var browserify = require('browserify')
var fs = require('vigour-fs-promised')
var postcssify = require('../')
var setupTestRepos = require('./setuptestrepos')

var out = path.join(__dirname, '_files', 'out')
var jsOut = out + '.js'
var cssOut = out + '.css'
var cssMap = cssOut + '.map'

test('bundles', function (t) {
  var jsws = fs.createWriteStream(jsOut)

  var expected = path.join(__dirname, '_files', 'expected')
  var jsExpected = expected + '.js'
  var cssExpected = expected + '.css'
  var cssExpectedMap = cssExpected + '.map'

  var brow = browserify()
  brow.transform(postcssify, {
    plugins: [
      'postcss-cssnext'
    ],
    out: cssOut,
    map: cssMap,
    force: ['out', 'map']
  })
  brow.add(path.join(__dirname, '_files', 'entry.js'))
  brow.bundle(function onComplete (err) {
    if (err) {
      console.error('browserify error', err.stack || err)
      t.fail('browserify errored: ' + err + '\n')
    }

    Promise.all([
      fs.readFileAsync(jsOut, 'utf8'),
      fs.readFileAsync(jsExpected, 'utf8'),
      fs.readFileAsync(cssOut, 'utf8'),
      fs.readFileAsync(cssExpected, 'utf8'),
      fs.readFileAsync(cssMap, 'utf8'),
      fs.readFileAsync(cssExpectedMap, 'utf8')
    ]).then((contents) => {
      // console.log(jsOut, contents[0])
      t.equal(contents[0] === contents[1], true, 'JS bundle')
      // console.log(cssOut, contents[2])
      t.equal(contents[2] === contents[3], true, 'CSS bundle')
      // console.log(cssMap, contents[4])
      t.equals(contents[4] === contents[5], true, 'CSS source map')
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
    .then(() => {
      t.end()
    })
  }).pipe(jsws)
})

test('bundles with inline css maps', function (t) {
  var jsws = fs.createWriteStream(jsOut)

  var expected = path.join(__dirname, '_files', 'expected')
  var jsExpected = expected + '.js'
  var cssExpected = expected + '_inline.css'

  var brow = browserify()
  brow.transform(postcssify, {
    out: cssOut,
    map: true,
    plugins: [
      'postcss-cssnext'
    ],
    force: ['out', 'map']
  })
  brow.add(path.join(__dirname, '_files', 'entry.js'))
  brow.bundle(function onComplete (err) {
    if (err) {
      t.fail('browserify errored: ' + err + '\n')
    }

    Promise.all([
      fs.readFileAsync(jsOut, 'utf8'),
      fs.readFileAsync(jsExpected, 'utf8'),
      fs.readFileAsync(cssOut, 'utf8'),
      fs.readFileAsync(cssExpected, 'utf8')
    ]).then((contents) => {
      // console.log(jsOut, contents[0])
      t.equal(contents[0] === contents[1], true, 'JS bundle')
      // console.log(cssOut, contents[2])
      t.equal(contents[2] === contents[3], true, 'CSS bundle with inline map')
    }).catch((reason) => {
      console.error('reading files', reason)
    })
    .then(() => {
      return Promise.all([
        fs.removeAsync(jsOut),
        fs.removeAsync(cssOut)
      ])
    })
    .then(() => {
      t.end()
    })
  }).pipe(jsws)
})

test('source maps', function (t) {
  var jsws = fs.createWriteStream(jsOut)

  var expected = path.join(__dirname, '_files', 'expected')
  var jsExpected = expected + '_map.js'
  var cssExpected = expected + '_no-map.css'

  var brow = browserify({
    debug: true
  })
  brow.transform(postcssify, {
    out: cssOut,
    map: false,
    plugins: [
      'postcss-cssnext'
    ],
    force: ['out', 'map']
  })
  brow.add(path.join(__dirname, '_files', 'entry.js'))
  brow.bundle(function onComplete (err) {
    if (err) {
      t.fail('browserify errored: ' + err + '\n')
    }

    Promise.all([
      fs.readFileAsync(jsOut, 'utf8'),
      fs.readFileAsync(jsExpected, 'utf8'),
      fs.readFileAsync(cssOut, 'utf8'),
      fs.readFileAsync(cssExpected, 'utf8')
    ]).then((contents) => {
      // console.log(jsOut, contents[0])
      t.equal(contents[0] === contents[1], true, 'JS bundle with map')
      // console.log(cssOut, contents[2])
      t.equal(contents[2] === contents[3], true, 'CSS bundle without map')
    }).catch((reason) => {
      console.error('reading files', reason)
    })
    .then(() => {
      return Promise.all([
        fs.removeAsync(jsOut),
        fs.removeAsync(cssOut)
      ])
    })
    .then(() => {
      t.end()
    })
  }).pipe(jsws)
})

test('modules', function (t) {
  setupTestRepos()
    .then(() => {
      var jsws = fs.createWriteStream(jsOut)
      var expected = path.join(__dirname, '_files', 'expected')
      var jsExpected = expected + '_modules.js'
      var cssExpected = expected + '_modules.css'
      var cssExpectedMap = cssExpected + '.map'

      var brow = browserify({
        debug: true
      })
      brow.transform(postcssify, {
        out: cssOut,
        map: cssMap,
        force: ['out', 'map']
      })
      brow.add(path.join(__dirname, '..', '..', 'postcssify-test-repos', 'unlinked', 'postcssify-test-subject', 'subject.js'))
      brow.bundle(function onComplete (err) {
        if (err) {
          t.fail('browserify errored: ' + err + '\n')
        }

        Promise.all([
          fs.readFileAsync(jsOut, 'utf8'),
          fs.readFileAsync(jsExpected, 'utf8'),
          fs.readFileAsync(cssOut, 'utf8'),
          fs.readFileAsync(cssExpected, 'utf8'),
          fs.readFileAsync(cssMap, 'utf8'),
          fs.readFileAsync(cssExpectedMap, 'utf8')
        ]).then((contents) => {
          // console.log(jsOut, contents[0])
          t.equal(contents[0] === contents[1], true, 'JS bundle with map')
          // console.log(cssOut, contents[2])
          t.equal(contents[2] === contents[3], true, 'CSS bundle')
          // console.log(cssMap, contents[4])
          t.equal(contents[4] === contents[5], true, 'CSS map')
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
        .then(() => {
          t.end()
        })
      }).pipe(jsws)
    })
})

test('links', function (t) {
  setupTestRepos(true)
    .then(() => {
      var jsws = fs.createWriteStream(jsOut)
      var expected = path.join(__dirname, '_files', 'expected')
      var jsExpected = expected + '_modules.js'
      var cssExpected = expected + '_modules.css'
      var cssExpectedMap = cssExpected + '.map'

      var brow = browserify({
        debug: true
      })
      brow.transform(postcssify, {
        out: cssOut,
        map: cssMap,
        force: ['out', 'map']
      })

      brow.add(path.join(__dirname, '..', '..', 'postcssify-test-repos', 'linked', 'postcssify-test-subject', 'subject.js'))
      brow.bundle(function onComplete (err) {
        if (err) {
          t.fail('browserify errored: ' + err + '\n')
        }
        Promise.all([
          fs.readFileAsync(jsOut, 'utf8'),
          fs.readFileAsync(jsExpected, 'utf8'),
          fs.readFileAsync(cssOut, 'utf8'),
          fs.readFileAsync(cssExpected, 'utf8'),
          fs.readFileAsync(cssMap, 'utf8'),
          fs.readFileAsync(cssExpectedMap, 'utf8')
        ]).then((contents) => {
          // console.log(jsOut, contents[0])
          t.equal(contents[0] === contents[1], true, 'JS bundle with map')
          // console.log(cssOut, contents[2])
          t.equal(contents[2] === contents[3], true, 'CSS bundle')
          // console.log(cssMap, contents[4])
          t.equal(contents[4] === contents[5], true, 'CSS map')
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
        .then(() => {
          t.end()
        })
      }).pipe(jsws)
    })
})
