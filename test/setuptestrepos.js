'use strict'

var path = require('path')
var fs = require('vigour-fs-promised')
var spawn = require('vigour-spawn')

const basepath = path.join(__dirname, '..', '..', 'postcssify-test-repos')
const statePath = path.join(basepath, 'state.json')

const repos = [
  { name: 'postcssify-test-subject',
    links: [
      'postcssify-test-subject-dep2',
      'postcssify-test-subject-dep-dep'
    ]
  },
  { name: 'postcssify-test-subject-dep',
    links: [
      'postcssify-test-subject-dep2'
    ]
  },
  { name: 'postcssify-test-subject-dep-dep' },
  { name: 'postcssify-test-subject-dep2' }
]
const subjectRepo = repos[0]

var _state

module.exports = exports = function setupTestRepos (linked) {
  var target = linked ? 'linked' : 'unlinked'
  var ready = false
  var state
  return exports.getState()
    .then((st) => {
      state = st
      // console.log('state', state)
      if (!state[target]) {
        return exports.clone(target)
      }
      if (state[target] === 'cloned') {
        return exports.install(target)
      }
      if (state[target] === 'installed') {
        if (linked) {
          return exports.link(target)
        } else {
          ready = true
        }
      }
      if (state[target] === 'ready' || state[target] === 'linked') {
        ready = true
      }
    })
    .then(() => {
      if (!ready) {
        return setupTestRepos(linked)
      } else {
        return exports.modifyState(function (theState) {
          theState[target] = 'ready'
          return theState
        })
      }
    })
}

exports.getState = function getState () {
  if (_state) {
    return Promise.resolve(_state)
  }
  return fs.existsAsync(statePath)
    .then((exists) => {
      if (exists) {
        return fs.readJSONAsync(statePath)
      }
      return {}
    })
}

exports.setState = function setState (newState) {
  return fs.writeJSONAsync(statePath, newState, { mkdirp: true })
}

exports.modifyState = function modifyState (modifier) {
  return exports.getState()
    .then(modifier)
    .then((newState) => {
      return exports.setState(newState)
    })
}

exports.clone = function clone (target) {
  var arr = []
  if (target === 'linked') {
    for (let i = 0, len = repos.length; i < len; i += 1) {
      arr.push(exports.toGitURL(repos[i].name))
    }
  } else {
    arr.push(exports.toGitURL(subjectRepo.name))
  }
  var wd = path.join(basepath, target)
  return fs.mkdirpAsync(wd)
    .then(() => {
      return Promise.all(arr.map(function (item) {
        // console.log('cloning', item, wd)
        spawn(`git clone ${item}`, { cwd: wd })
      }))
    })
    .then(() => {
      return exports.modifyState(function stateCloned (state) {
        state[target] = 'cloned'
        return state
      })
    })
}

exports.install = function install (target) {
  var toWD = exports.toWD(target)
  var arr = []
  if (target === 'linked') {
    for (let i = 0, len = repos.length; i < len; i += 1) {
      arr.push(repos[i].name)
    }
  } else {
    arr.push(subjectRepo.name)
  }
  return Promise.all(arr.map(function (item) {
    var wd = toWD(item)
    return spawn('npm install', { cwd: wd })
      .then(() => {
        console.log('A')
        return spawn('npm link postcssify', { cwd: wd })
      })
  }))
    .then(() => {
      console.log('B')
      return exports.modifyState(function stateInstalled (state) {
        state[target] = 'installed'
        return state
      })
    })
}

exports.link = function link (target) {
  var toWD = exports.toWD(target)
  var proms = []
  var links = {}
  for (let i = 0, len = repos.length; i < len; i += 1) {
    if (repos[i].links) {
      for (let j = 0, len = repos[i].links.length; j < len; j += 1) {
        let prom = Promise.resolve()
        if (!links[repos[i].links[j]]) {
          links[repos[i].links[j]] = true
          prom = prom.then(() => {
            // console.log('globally linking', toWD(repos[i].links[j]))
            return spawn('npm link', { cwd: toWD(repos[i].links[j]) })
          })
        }
        prom = prom.then(() => {
          // console.log('linking', repos[i].links[j], toWD(repos[i].name))
          return spawn('npm link ' + repos[i].links[j], { cwd: toWD(repos[i].name) })
        })
        proms.push(prom)
      }
    }
  }
  return Promise.all(proms)
    .then(() => {
      exports.modifyState(function stateLinked (state) {
        state[target] = 'linked'
        return state
      })
    })
}

exports.toGitURL = function toGitURL (repoName) {
  return `git@github.com:vigour-io/${repoName}.git`
}

exports.toWD = function toWDFactory (target) {
  return function toWD (item) {
    return path.join(basepath, target, item)
  }
}
