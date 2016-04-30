(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('./moreafter.css');
},{"./moreafter.css":7}],2:[function(require,module,exports){
require('./morebefore.css');
},{"./morebefore.css":8}],3:[function(require,module,exports){
require('./moreComponent.css');
},{"./moreComponent.css":6}],4:[function(require,module,exports){
'use strict'

require('./entry.js')
require('./requiredtwice.css')
require('./component.css')

module.exports = exports = 'component'

},{"./component.css":3,"./entry.js":5,"./requiredtwice.css":10}],5:[function(require,module,exports){
'use strict'

require('./before.css')
var component = require('./component')
console.log('component', component)
require('./after.css')
require('./requiredtwice.css')

// commented requires should be ignored: require('ignored.css')

},{"./after.css":1,"./before.css":2,"./component":4,"./requiredtwice.css":10}],6:[function(require,module,exports){

},{}],7:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],8:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],9:[function(require,module,exports){
require('./requiredtwice.css');
},{"./requiredtwice.css":10}],10:[function(require,module,exports){
require('./other.css');
},{"./other.css":9}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ0ZXN0L19maWxlcy9hZnRlci5jc3MiLCJ0ZXN0L19maWxlcy9iZWZvcmUuY3NzIiwidGVzdC9fZmlsZXMvY29tcG9uZW50LmNzcyIsInRlc3QvX2ZpbGVzL2NvbXBvbmVudC5qcyIsInRlc3QvX2ZpbGVzL2VudHJ5LmpzIiwidGVzdC9fZmlsZXMvbW9yZUNvbXBvbmVudC5jc3MiLCJ0ZXN0L19maWxlcy9vdGhlci5jc3MiLCJ0ZXN0L19maWxlcy9yZXF1aXJlZHR3aWNlLmNzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7Ozs7OztBQ0FBOztBQ0FBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInJlcXVpcmUoJy4vbW9yZWFmdGVyLmNzcycpOyIsInJlcXVpcmUoJy4vbW9yZWJlZm9yZS5jc3MnKTsiLCJyZXF1aXJlKCcuL21vcmVDb21wb25lbnQuY3NzJyk7IiwiJ3VzZSBzdHJpY3QnXG5cbnJlcXVpcmUoJy4vZW50cnkuanMnKVxucmVxdWlyZSgnLi9yZXF1aXJlZHR3aWNlLmNzcycpXG5yZXF1aXJlKCcuL2NvbXBvbmVudC5jc3MnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSAnY29tcG9uZW50J1xuIiwiJ3VzZSBzdHJpY3QnXG5cbnJlcXVpcmUoJy4vYmVmb3JlLmNzcycpXG52YXIgY29tcG9uZW50ID0gcmVxdWlyZSgnLi9jb21wb25lbnQnKVxuY29uc29sZS5sb2coJ2NvbXBvbmVudCcsIGNvbXBvbmVudClcbnJlcXVpcmUoJy4vYWZ0ZXIuY3NzJylcbnJlcXVpcmUoJy4vcmVxdWlyZWR0d2ljZS5jc3MnKVxuXG4vLyBjb21tZW50ZWQgcmVxdWlyZXMgc2hvdWxkIGJlIGlnbm9yZWQ6IHJlcXVpcmUoJ2lnbm9yZWQuY3NzJylcbiIsIiIsInJlcXVpcmUoJy4vcmVxdWlyZWR0d2ljZS5jc3MnKTsiLCJyZXF1aXJlKCcuL290aGVyLmNzcycpOyJdfQ==
