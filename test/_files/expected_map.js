(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('./moreafter.css');
},{"./moreafter.css":7}],2:[function(require,module,exports){
require('./morebefore.css');
},{"./morebefore.css":8}],3:[function(require,module,exports){
require('./moreComponent.css');
},{"./moreComponent.css":6}],4:[function(require,module,exports){
'use strict'

require('./requiredtwice.css')
require('./component.css')

module.exports = exports = 'component'

},{"./component.css":3,"./requiredtwice.css":9}],5:[function(require,module,exports){
'use strict'

require('./before.css')
var component = require('./component')
console.log('component', component)
require('./after.css')
require('./requiredtwice.css')

// commented requires should be ignored: require('ignored.css')

},{"./after.css":1,"./before.css":2,"./component":4,"./requiredtwice.css":9}],6:[function(require,module,exports){

},{}],7:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],8:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],9:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ0ZXN0L19maWxlcy9hZnRlci5jc3MiLCJ0ZXN0L19maWxlcy9iZWZvcmUuY3NzIiwidGVzdC9fZmlsZXMvY29tcG9uZW50LmNzcyIsInRlc3QvX2ZpbGVzL2NvbXBvbmVudC5qcyIsInRlc3QvX2ZpbGVzL2VudHJ5LmpzIiwidGVzdC9fZmlsZXMvbW9yZUNvbXBvbmVudC5jc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJyZXF1aXJlKCcuL21vcmVhZnRlci5jc3MnKTsiLCJyZXF1aXJlKCcuL21vcmViZWZvcmUuY3NzJyk7IiwicmVxdWlyZSgnLi9tb3JlQ29tcG9uZW50LmNzcycpOyIsIid1c2Ugc3RyaWN0J1xuXG5yZXF1aXJlKCcuL3JlcXVpcmVkdHdpY2UuY3NzJylcbnJlcXVpcmUoJy4vY29tcG9uZW50LmNzcycpXG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9ICdjb21wb25lbnQnXG4iLCIndXNlIHN0cmljdCdcblxucmVxdWlyZSgnLi9iZWZvcmUuY3NzJylcbnZhciBjb21wb25lbnQgPSByZXF1aXJlKCcuL2NvbXBvbmVudCcpXG5jb25zb2xlLmxvZygnY29tcG9uZW50JywgY29tcG9uZW50KVxucmVxdWlyZSgnLi9hZnRlci5jc3MnKVxucmVxdWlyZSgnLi9yZXF1aXJlZHR3aWNlLmNzcycpXG5cbi8vIGNvbW1lbnRlZCByZXF1aXJlcyBzaG91bGQgYmUgaWdub3JlZDogcmVxdWlyZSgnaWdub3JlZC5jc3MnKVxuIiwiIl19
