(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
/*jshint onevar: false, indent:4 */
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = function (fn) {
              // not a direct alias for IE10 compatibility
              setImmediate(fn);
            };
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(done) );
        });
        function done(err) {
          if (err) {
              callback(err);
              callback = function () {};
          }
          else {
              completed += 1;
              if (completed >= arr.length) {
                  callback();
              }
          }
        }
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback();
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        if (!callback) {
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err) {
                    callback(err);
                });
            });
        } else {
            var results = [];
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err, v) {
                    results[x.index] = v;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        var remainingTasks = keys.length
        if (!remainingTasks) {
            return callback();
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            remainingTasks--
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (!remainingTasks) {
                var theCallback = callback;
                // prevent final callback from calling itself if it errors
                callback = function () {};

                theCallback(null, results);
            }
        });

        _each(keys, function (k) {
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var attempts = [];
        // Use defaults if times not passed
        if (typeof times === 'function') {
            callback = task;
            task = times;
            times = DEFAULT_TIMES;
        }
        // Make sure times is a number
        times = parseInt(times, 10) || DEFAULT_TIMES;
        var wrappedTask = function(wrappedCallback, wrappedResults) {
            var retryAttempt = function(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            };
            while (times) {
                attempts.push(retryAttempt(task, !(times-=1)));
            }
            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || callback)(data.err, data.result);
            });
        }
        // If a callback is passed, run this as a controll flow
        return callback ? wrappedTask() : wrappedTask
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!_isArray(tasks)) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (test.apply(null, args)) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (!test.apply(null, args)) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            started: false,
            paused: false,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            kill: function () {
              q.drain = null;
              q.tasks = [];
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (!q.paused && workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                if (q.paused === true) { return; }
                q.paused = true;
                q.process();
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                q.process();
            }
        };
        return q;
    };
    
    async.priorityQueue = function (worker, concurrency) {
        
        function _compareTasks(a, b){
          return a.priority - b.priority;
        };
        
        function _binarySearch(sequence, item, compare) {
          var beg = -1,
              end = sequence.length - 1;
          while (beg < end) {
            var mid = beg + ((end - beg + 1) >>> 1);
            if (compare(item, sequence[mid]) >= 0) {
              beg = mid;
            } else {
              end = mid - 1;
            }
          }
          return beg;
        }
        
        function _insert(q, data, priority, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  priority: priority,
                  callback: typeof callback === 'function' ? callback : null
              };
              
              q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }
        
        // Start with a normal queue
        var q = async.queue(worker, concurrency);
        
        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
          _insert(q, data, priority, callback);
        };
        
        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            drained: true,
            push: function (data, callback) {
                if (!_isArray(data)) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    cargo.drained = false;
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain && !cargo.drained) cargo.drain();
                    cargo.drained = true;
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0, tasks.length);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.nextTick(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    async.compose = function (/* functions... */) {
      return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'))
},{"_process":2}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],3:[function(require,module,exports){
/**
 * Restful Resources service for AngularJS apps
 * @version v1.4.0 - 2014-04-25 * @link https://github.com/mgonto/restangular
 * @author Martin Gontovnikas <martin@gon.to>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */!function(){var a=angular.module("restangular",[]);a.provider("Restangular",function(){var a={};a.init=function(a,b){function c(a,b,c,d){var e={};return _.each(_.keys(d),function(f){var g=d[f];g.params=_.extend({},g.params,a.defaultRequestParams[g.method.toLowerCase()]),_.isEmpty(g.params)&&delete g.params,e[f]=a.isSafe(g.method)?function(){return b(_.extend(g,{url:c}))}:function(a){return b(_.extend(g,{url:c,data:a}))}}),e}a.configuration=b;var d=["get","head","options","trace","getlist"];b.isSafe=function(a){return _.contains(d,a.toLowerCase())};var e=/^https?:\/\//i;b.isAbsoluteUrl=function(a){return _.isUndefined(b.absoluteUrl)||_.isNull(b.absoluteUrl)?a&&e.test(a):b.absoluteUrl},b.absoluteUrl=_.isUndefined(b.absoluteUrl)?!0:b.absoluteUrl,a.setSelfLinkAbsoluteUrl=function(a){b.absoluteUrl=a},b.baseUrl=_.isUndefined(b.baseUrl)?"":b.baseUrl,a.setBaseUrl=function(a){return b.baseUrl=/\/$/.test(a)?a.substring(0,a.length-1):a,this},b.extraFields=b.extraFields||[],a.setExtraFields=function(a){return b.extraFields=a,this},b.defaultHttpFields=b.defaultHttpFields||{},a.setDefaultHttpFields=function(a){return b.defaultHttpFields=a,this},b.withHttpValues=function(a,c){return _.defaults(c,a,b.defaultHttpFields)},b.encodeIds=_.isUndefined(b.encodeIds)?!0:b.encodeIds,a.setEncodeIds=function(a){b.encodeIds=a},b.defaultRequestParams=b.defaultRequestParams||{get:{},post:{},put:{},remove:{},common:{}},a.setDefaultRequestParams=function(a,c){var d=[],e=c||a;return _.isUndefined(c)?d.push("common"):_.isArray(a)?d=a:d.push(a),_.each(d,function(a){b.defaultRequestParams[a]=e}),this},a.requestParams=b.defaultRequestParams,b.defaultHeaders=b.defaultHeaders||{},a.setDefaultHeaders=function(c){return b.defaultHeaders=c,a.defaultHeaders=b.defaultHeaders,this},a.defaultHeaders=b.defaultHeaders,b.methodOverriders=b.methodOverriders||[],a.setMethodOverriders=function(a){var c=_.extend([],a);return b.isOverridenMethod("delete",c)&&c.push("remove"),b.methodOverriders=c,this},b.jsonp=_.isUndefined(b.jsonp)?!1:b.jsonp,a.setJsonp=function(a){b.jsonp=a},b.isOverridenMethod=function(a,c){var d=c||b.methodOverriders;return!_.isUndefined(_.find(d,function(b){return b.toLowerCase()===a.toLowerCase()}))},b.urlCreator=b.urlCreator||"path",a.setUrlCreator=function(a){if(!_.has(b.urlCreatorFactory,a))throw new Error("URL Path selected isn't valid");return b.urlCreator=a,this},b.restangularFields=b.restangularFields||{id:"id",route:"route",parentResource:"parentResource",restangularCollection:"restangularCollection",cannonicalId:"__cannonicalId",etag:"restangularEtag",selfLink:"href",get:"get",getList:"getList",put:"put",post:"post",remove:"remove",head:"head",trace:"trace",options:"options",patch:"patch",getRestangularUrl:"getRestangularUrl",getRequestedUrl:"getRequestedUrl",putElement:"putElement",addRestangularMethod:"addRestangularMethod",getParentList:"getParentList",clone:"clone",ids:"ids",httpConfig:"_$httpConfig",reqParams:"reqParams",one:"one",all:"all",several:"several",oneUrl:"oneUrl",allUrl:"allUrl",customPUT:"customPUT",customPOST:"customPOST",customDELETE:"customDELETE",customGET:"customGET",customGETLIST:"customGETLIST",customOperation:"customOperation",doPUT:"doPUT",doPOST:"doPOST",doDELETE:"doDELETE",doGET:"doGET",doGETLIST:"doGETLIST",fromServer:"fromServer",withConfig:"withConfig",withHttpConfig:"withHttpConfig",singleOne:"singleOne",plain:"plain",save:"save"},a.setRestangularFields=function(a){return b.restangularFields=_.extend(b.restangularFields,a),this},b.isRestangularized=function(a){return!!a[b.restangularFields.one]||!!a[b.restangularFields.all]},b.setFieldToElem=function(a,b,c){var d=a.split("."),e=b;return _.each(_.initial(d),function(a){e[a]={},e=e[a]}),e[_.last(d)]=c,this},b.getFieldFromElem=function(a,b){var c=a.split("."),d=b;return _.each(c,function(a){d&&(d=d[a])}),angular.copy(d)},b.setIdToElem=function(a,c){return b.setFieldToElem(b.restangularFields.id,a,c),this},b.getIdFromElem=function(a){return b.getFieldFromElem(b.restangularFields.id,a)},b.isValidId=function(a){return""!==a&&!_.isUndefined(a)&&!_.isNull(a)},b.setUrlToElem=function(a,c){return b.setFieldToElem(b.restangularFields.selfLink,a,c),this},b.getUrlFromElem=function(a){return b.getFieldFromElem(b.restangularFields.selfLink,a)},b.useCannonicalId=_.isUndefined(b.useCannonicalId)?!1:b.useCannonicalId,a.setUseCannonicalId=function(a){return b.useCannonicalId=a,this},b.getCannonicalIdFromElem=function(a){var c=a[b.restangularFields.cannonicalId],d=b.isValidId(c)?c:b.getIdFromElem(a);return d},b.responseInterceptors=b.responseInterceptors||[],b.defaultResponseInterceptor=function(a){return a},b.responseExtractor=function(a,c,d,e,f,g){var h=angular.copy(b.responseInterceptors);h.push(b.defaultResponseInterceptor);var i=a;return _.each(h,function(a){i=a(i,c,d,e,f,g)}),i},a.addResponseInterceptor=function(a){return b.responseInterceptors.push(a),this},a.setResponseInterceptor=a.addResponseInterceptor,a.setResponseExtractor=a.addResponseInterceptor,b.requestInterceptors=b.requestInterceptors||[],b.defaultInterceptor=function(a,b,c,d,e,f,g){return{element:a,headers:e,params:f,httpConfig:g}},b.fullRequestInterceptor=function(a,c,d,e,f,g,h){var i=angular.copy(b.requestInterceptors),j=b.defaultInterceptor(a,c,d,e,f,g,h);return _.reduce(i,function(a,b){return _.extend(a,b(a.element,c,d,e,a.headers,a.params,a.httpConfig))},j)},a.addRequestInterceptor=function(a){return b.requestInterceptors.push(function(b,c,d,e,f,g,h){return{headers:f,params:g,element:a(b,c,d,e),httpConfig:h}}),this},a.setRequestInterceptor=a.addRequestInterceptor,a.addFullRequestInterceptor=function(a){return b.requestInterceptors.push(a),this},a.setFullRequestInterceptor=a.addFullRequestInterceptor,b.errorInterceptor=b.errorInterceptor||function(){},a.setErrorInterceptor=function(a){return b.errorInterceptor=a,this},b.onBeforeElemRestangularized=b.onBeforeElemRestangularized||function(a){return a},a.setOnBeforeElemRestangularized=function(a){return b.onBeforeElemRestangularized=a,this},b.onElemRestangularized=b.onElemRestangularized||function(a){return a},a.setOnElemRestangularized=function(a){return b.onElemRestangularized=a,this},b.shouldSaveParent=b.shouldSaveParent||function(){return!0},a.setParentless=function(a){return _.isArray(a)?b.shouldSaveParent=function(b){return!_.contains(a,b)}:_.isBoolean(a)&&(b.shouldSaveParent=function(){return!a}),this},b.suffix=_.isUndefined(b.suffix)?null:b.suffix,a.setRequestSuffix=function(a){return b.suffix=a,this},b.transformers=b.transformers||{},a.addElementTransformer=function(c,d,e){var f=null,g=null;2===arguments.length?g=d:(g=e,f=d);var h=b.transformers[c];return h||(h=b.transformers[c]=[]),h.push(function(a,b){return _.isNull(f)||a==f?g(b):b}),a},a.extendCollection=function(b,c){return a.addElementTransformer(b,!0,c)},a.extendModel=function(b,c){return a.addElementTransformer(b,!1,c)},b.transformElem=function(a,c,d,e,f){if(!f&&!b.transformLocalElements&&!a[b.restangularFields.fromServer])return a;var g=b.transformers[d],h=a;return g&&_.each(g,function(a){h=a(c,h)}),b.onElemRestangularized(h,c,d,e)},b.transformLocalElements=_.isUndefined(b.transformLocalElements)?!1:b.transformLocalElements,a.setTransformOnlyServerElements=function(a){b.transformLocalElements=!a},b.fullResponse=_.isUndefined(b.fullResponse)?!1:b.fullResponse,a.setFullResponse=function(a){return b.fullResponse=a,this},b.urlCreatorFactory={};var f=function(){};f.prototype.setConfig=function(a){return this.config=a,this},f.prototype.parentsArray=function(a){for(var b=[];a;)b.push(a),a=a[this.config.restangularFields.parentResource];return b.reverse()},f.prototype.resource=function(a,d,e,f,g,h,i,j){var k=_.defaults(g||{},this.config.defaultRequestParams.common),l=_.defaults(f||{},this.config.defaultHeaders);i&&(b.isSafe(j)?l["If-None-Match"]=i:l["If-Match"]=i);var m=this.base(a);if(h){var n="";/\/$/.test(m)||(n+="/"),n+=h,m+=n}return this.config.suffix&&-1===m.indexOf(this.config.suffix,m.length-this.config.suffix.length)&&!this.config.getUrlFromElem(a)&&(m+=this.config.suffix),a[this.config.restangularFields.httpConfig]=void 0,c(this.config,d,m,{getList:this.config.withHttpValues(e,{method:"GET",params:k,headers:l}),get:this.config.withHttpValues(e,{method:"GET",params:k,headers:l}),jsonp:this.config.withHttpValues(e,{method:"jsonp",params:k,headers:l}),put:this.config.withHttpValues(e,{method:"PUT",params:k,headers:l}),post:this.config.withHttpValues(e,{method:"POST",params:k,headers:l}),remove:this.config.withHttpValues(e,{method:"DELETE",params:k,headers:l}),head:this.config.withHttpValues(e,{method:"HEAD",params:k,headers:l}),trace:this.config.withHttpValues(e,{method:"TRACE",params:k,headers:l}),options:this.config.withHttpValues(e,{method:"OPTIONS",params:k,headers:l}),patch:this.config.withHttpValues(e,{method:"PATCH",params:k,headers:l})})};var g=function(){};g.prototype=new f,g.prototype.base=function(a){var c=this;return _.reduce(this.parentsArray(a),function(a,d){var e,f=c.config.getUrlFromElem(d);if(f){if(c.config.isAbsoluteUrl(f))return f;e=f}else if(e=d[c.config.restangularFields.route],d[c.config.restangularFields.restangularCollection]){var g=d[c.config.restangularFields.ids];g&&(e+="/"+g.join(","))}else{var h;h=c.config.useCannonicalId?c.config.getCannonicalIdFromElem(d):c.config.getIdFromElem(d),b.isValidId(h)&&!d.singleOne&&(e+="/"+(c.config.encodeIds?encodeURIComponent(h):h))}return a.replace(/\/$/,"")+"/"+e},this.config.baseUrl)},g.prototype.fetchUrl=function(a,b){var c=this.base(a);return b&&(c+="/"+b),c},g.prototype.fetchRequestedUrl=function(a,c){function d(a){var b=[];for(var c in a)a.hasOwnProperty(c)&&b.push(c);return b.sort()}function e(a,b,c){for(var e=d(a),f=0;f<e.length;f++)b.call(c,a[e[f]],e[f]);return e}function f(a,b){return encodeURIComponent(a).replace(/%40/gi,"@").replace(/%3A/gi,":").replace(/%24/g,"$").replace(/%2C/gi,",").replace(/%20/g,b?"%20":"+")}var g=this.fetchUrl(a,c),h=a[b.restangularFields.reqParams];if(!h)return g;var i=[];return e(h,function(a,b){null!=a&&void 0!=a&&(angular.isArray(a)||(a=[a]),angular.forEach(a,function(a){angular.isObject(a)&&(a=angular.toJson(a)),i.push(f(b)+"="+f(a))}))}),g+(this.config.suffix||"")+(-1===g.indexOf("?")?"?":"&")+i.join("&")},b.urlCreatorFactory.path=g};var b={};a.init(this,b),this.$get=["$http","$q",function(c,d){function e(b){function f(a,c,d,e,f){if(c[b.restangularFields.route]=d,c[b.restangularFields.getRestangularUrl]=_.bind(P.fetchUrl,P,c),c[b.restangularFields.getRequestedUrl]=_.bind(P.fetchRequestedUrl,P,c),c[b.restangularFields.addRestangularMethod]=_.bind(L,c),c[b.restangularFields.clone]=_.bind(r,c,c),c[b.restangularFields.reqParams]=_.isEmpty(e)?null:e,c[b.restangularFields.withHttpConfig]=_.bind(z,c),c[b.restangularFields.plain]=_.bind(p,c,c),c[b.restangularFields.one]=_.bind(g,c,c),c[b.restangularFields.all]=_.bind(h,c,c),c[b.restangularFields.several]=_.bind(i,c,c),c[b.restangularFields.oneUrl]=_.bind(j,c,c),c[b.restangularFields.allUrl]=_.bind(k,c,c),c[b.restangularFields.fromServer]=!!f,a&&b.shouldSaveParent(d)){var l=b.getIdFromElem(a),m=b.getUrlFromElem(a),n=_.union(_.values(_.pick(b.restangularFields,["route","singleOne","parentResource"])),b.extraFields),o=_.pick(a,n);b.isValidId(l)&&b.setIdToElem(o,l),b.isValidId(m)&&b.setUrlToElem(o,m),c[b.restangularFields.parentResource]=o}else c[b.restangularFields.parentResource]=null;return c}function g(a,c,d,e){if(_.isNumber(c)||_.isNumber(a)){var f="You're creating a Restangular entity with the number ";throw f+="instead of the route or the parent. You can't call .one(12)",new Error(f)}var g={};return b.setIdToElem(g,d),b.setFieldToElem(b.restangularFields.singleOne,g,e),s(a,g,c,!1)}function h(a,b){return t(a,[],b,!1)}function i(a,c){var d=[];return d[b.restangularFields.ids]=Array.prototype.splice.call(arguments,2),t(a,d,c,!1)}function j(a,c,d){if(!c)throw new Error("Route is mandatory when creating new Restangular objects.");var e={};return b.setUrlToElem(e,d,c),s(a,e,c,!1)}function k(a,c,d){if(!c)throw new Error("Route is mandatory when creating new Restangular objects.");var e={};return b.setUrlToElem(e,d,c),t(a,e,c,!1)}function l(a,c,d){return a.call=_.bind(m,a),a.get=_.bind(n,a),a[b.restangularFields.restangularCollection]=c,c&&(a.push=_.bind(m,a,"push")),a.$object=d,a}function m(a){var c=d.defer(),e=arguments,f={};return this.then(function(b){var d=Array.prototype.slice.call(e,1),g=b[a];g.apply(b,d),f=b,c.resolve(b)}),l(c.promise,this[b.restangularFields.restangularCollection],f)}function n(a){var c=d.defer(),e={};return this.then(function(b){e=b[a],c.resolve(e)}),l(c.promise,this[b.restangularFields.restangularCollection],e)}function o(a,c,d,e){return _.extend(e,d),b.fullResponse?a.resolve(_.extend(c,{data:d})):(a.resolve(d),void 0)}function p(a){if(_.isArray(a)){var c=[];return _.each(a,function(a){c.push(p(a))}),c}return _.omit(a,_.values(_.omit(b.restangularFields,"id")))}function q(a){a[b.restangularFields.customOperation]=_.bind(K,a),_.each(["put","post","get","delete"],function(b){_.each(["do","custom"],function(c){var d,e="delete"===b?"remove":b,f=c+b.toUpperCase();d="put"!==e&&"post"!==e?K:function(a,b,c,d,e){return _.bind(K,this)(a,c,d,e,b)},a[f]=_.bind(d,a,e)})}),a[b.restangularFields.customGETLIST]=_.bind(y,a),a[b.restangularFields.doGETLIST]=a[b.restangularFields.customGETLIST]}function r(a,c){var d=angular.copy(a,c);return s(d[b.restangularFields.parentResource],d,d[b.restangularFields.route],!0)}function s(a,c,d,e,g,h){var i=b.onBeforeElemRestangularized(c,!1,d),j=f(a,i,d,h,e);return b.useCannonicalId&&(j[b.restangularFields.cannonicalId]=b.getIdFromElem(j)),g&&(j[b.restangularFields.getParentList]=function(){return g}),j[b.restangularFields.restangularCollection]=!1,j[b.restangularFields.get]=_.bind(C,j),j[b.restangularFields.getList]=_.bind(y,j),j[b.restangularFields.put]=_.bind(E,j),j[b.restangularFields.post]=_.bind(F,j),j[b.restangularFields.remove]=_.bind(D,j),j[b.restangularFields.head]=_.bind(G,j),j[b.restangularFields.trace]=_.bind(H,j),j[b.restangularFields.options]=_.bind(I,j),j[b.restangularFields.patch]=_.bind(J,j),j[b.restangularFields.save]=_.bind(A,j),q(j),b.transformElem(j,!1,d,O,!0)}function t(a,c,d,e,g){var h=b.onBeforeElemRestangularized(c,!0,d),i=f(a,h,d,g,e);return i[b.restangularFields.restangularCollection]=!0,i[b.restangularFields.post]=_.bind(F,i,null),i[b.restangularFields.remove]=_.bind(D,i),i[b.restangularFields.head]=_.bind(G,i),i[b.restangularFields.trace]=_.bind(H,i),i[b.restangularFields.putElement]=_.bind(w,i),i[b.restangularFields.options]=_.bind(I,i),i[b.restangularFields.patch]=_.bind(J,i),i[b.restangularFields.get]=_.bind(v,i),i[b.restangularFields.getList]=_.bind(y,i,null),q(i),b.transformElem(i,!0,d,O,!0)}function u(a,b,c){var d=t(a,b,c,!1);return _.each(d,function(b){s(a,b,c,!1)}),d}function v(a,b,c){return this.customGET(a.toString(),b,c)}function w(a,c,e){var f=this,g=this[a],h=d.defer(),i=[];return i=b.transformElem(i,!0,g[b.restangularFields.route],O),g.put(c,e).then(function(b){var c=r(f);c[a]=b,i=c,h.resolve(c)},function(a){h.reject(a)}),l(h.promise,!0,i)}function x(a,c,d,e,f,g){var h=b.responseExtractor(a,c,d,e,f,g),i=f.headers("ETag");return h&&i&&(h[b.restangularFields.etag]=i),h}function y(a,e,f){var g=this,h=d.defer(),i="getList",j=P.fetchUrl(this,a),k=a||g[b.restangularFields.route],m=b.fullRequestInterceptor(null,i,k,j,f||{},e||{},this[b.restangularFields.httpConfig]||{}),n=[];n=b.transformElem(n,!0,k,O);var p="getList";return b.jsonp&&(p="jsonp"),P.resource(this,c,m.httpConfig,m.headers,m.params,a,this[b.restangularFields.etag],i)[p]().then(function(c){var d=c.data,e=c.config.params,f=x(d,i,k,j,c,h);if((_.isUndefined(f)||""===f)&&(f=[]),!_.isArray(f))throw new Error("Response for getList SHOULD be an array and not an object or something else");var l=_.map(f,function(c){return g[b.restangularFields.restangularCollection]?s(g[b.restangularFields.parentResource],c,g[b.restangularFields.route],!0,f):s(g,c,a,!0,f)});l=_.extend(f,l),g[b.restangularFields.restangularCollection]?o(h,c,t(g[b.restangularFields.parentResource],l,g[b.restangularFields.route],!0,e),n):o(h,c,t(g,l,a,!0,e),n)},function(a){304===a.status&&g[b.restangularFields.restangularCollection]?o(h,a,g,n):b.errorInterceptor(a,h)!==!1&&h.reject(a)}),l(h.promise,!0,n)}function z(a){return this[b.restangularFields.httpConfig]=a,this}function A(a,c){return this[b.restangularFields.fromServer]?this[b.restangularFields.put](a,c):_.bind(B,this)("post",void 0,a,void 0,c)}function B(a,e,f,g,h){var i=this,j=d.defer(),k=f||{},m=e||this[b.restangularFields.route],n=P.fetchUrl(this,e),q=g||this,r=q[b.restangularFields.etag]||("post"!=a?this[b.restangularFields.etag]:null);_.isObject(q)&&b.isRestangularized(q)&&(q=p(q));var t=b.fullRequestInterceptor(q,a,m,n,h||{},k||{},this[b.restangularFields.httpConfig]||{}),u={};u=b.transformElem(u,!1,m,O);var v=function(c){var d=c.data,f=c.config.params,g=x(d,a,m,n,c,j);g?"post"!==a||i[b.restangularFields.restangularCollection]?(data=s(i[b.restangularFields.parentResource],g,i[b.restangularFields.route],!0,null,f),data[b.restangularFields.singleOne]=i[b.restangularFields.singleOne],o(j,c,data,u)):o(j,c,s(i,g,e,!0,null,f),u):o(j,c,void 0,u)},w=function(c){304===c.status&&b.isSafe(a)?o(j,c,i,u):b.errorInterceptor(c,j)!==!1&&j.reject(c)},y=a,z=_.extend({},t.headers),A=b.isOverridenMethod(a);return A?(y="post",z=_.extend(z,{"X-HTTP-Method-Override":"remove"===a?"DELETE":a})):b.jsonp&&"get"===y&&(y="jsonp"),b.isSafe(a)?A?P.resource(this,c,t.httpConfig,z,t.params,e,r,y)[y]({}).then(v,w):P.resource(this,c,t.httpConfig,z,t.params,e,r,y)[y]().then(v,w):P.resource(this,c,t.httpConfig,z,t.params,e,r,y)[y](t.element).then(v,w),l(j.promise,!1,u)}function C(a,b){return _.bind(B,this)("get",void 0,a,void 0,b)}function D(a,b){return _.bind(B,this)("remove",void 0,a,void 0,b)}function E(a,b){return _.bind(B,this)("put",void 0,a,void 0,b)}function F(a,b,c,d){return _.bind(B,this)("post",a,c,b,d)}function G(a,b){return _.bind(B,this)("head",void 0,a,void 0,b)}function H(a,b){return _.bind(B,this)("trace",void 0,a,void 0,b)}function I(a,b){return _.bind(B,this)("options",void 0,a,void 0,b)}function J(a,b,c){return _.bind(B,this)("patch",void 0,b,a,c)}function K(a,b,c,d,e){return _.bind(B,this)(a,b,c,e,d)}function L(a,c,d,e,f,g){var h;h="getList"===c?_.bind(y,this,d):_.bind(K,this,c,d);var i=function(a,b,c){var d=_.defaults({params:a,headers:b,elem:c},{params:e,headers:f,elem:g});return h(d.params,d.headers,d.elem)};this[a]=b.isSafe(c)?i:function(a,b,c){return i(b,c,a)}}function M(c){var d=angular.copy(_.omit(b,"configuration"));return a.init(d,d),c(d),e(d)}function N(a,b){var c={},d=(b||O).all(a);return c.one=_.bind(g,b||O,b,a),c.post=_.bind(d.post,d),c.getList=_.bind(d.getList,d),c}var O={},P=new b.urlCreatorFactory[b.urlCreator];return P.setConfig(b),a.init(O,b),O.copy=_.bind(r,O),O.service=_.bind(N,O),O.withConfig=_.bind(M,O),O.one=_.bind(g,O,null),O.all=_.bind(h,O,null),O.several=_.bind(i,O,null),O.oneUrl=_.bind(j,O,null),O.allUrl=_.bind(k,O,null),O.stripRestangular=_.bind(p,O),O.restangularizeElement=_.bind(s,O),O.restangularizeCollection=_.bind(u,O),O}return e(b)}]})}();
},{}],4:[function(require,module,exports){
/*
Copyright (c) 2014 Ramesh Nair (hiddentao.com)

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/


(function() {
  var cls, getValueHandler, registerValueHandler, squel, _extend, _ref, _ref1, _ref2, _ref3, _ref4, _without,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  cls = {};

  _extend = function() {
    var dst, k, sources, src, v, _i, _len;
    dst = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (sources) {
      for (_i = 0, _len = sources.length; _i < _len; _i++) {
        src = sources[_i];
        if (src) {
          for (k in src) {
            if (!__hasProp.call(src, k)) continue;
            v = src[k];
            dst[k] = v;
          }
        }
      }
    }
    return dst;
  };

  _without = function() {
    var dst, obj, p, properties, _i, _len;
    obj = arguments[0], properties = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    dst = _extend({}, obj);
    for (_i = 0, _len = properties.length; _i < _len; _i++) {
      p = properties[_i];
      delete dst[p];
    }
    return dst;
  };

  cls.DefaultQueryBuilderOptions = {
    autoQuoteTableNames: false,
    autoQuoteFieldNames: false,
    autoQuoteAliasNames: true,
    nameQuoteCharacter: '`',
    tableAliasQuoteCharacter: '`',
    fieldAliasQuoteCharacter: '"',
    valueHandlers: [],
    numberedParameters: false,
    replaceSingleQuotes: false,
    singleQuoteReplacement: '\'\'',
    separator: ' '
  };

  cls.globalValueHandlers = [];

  registerValueHandler = function(handlers, type, handler) {
    var typeHandler, _i, _len;
    if ('function' !== typeof type && 'string' !== typeof type) {
      throw new Error("type must be a class constructor or string denoting 'typeof' result");
    }
    if ('function' !== typeof handler) {
      throw new Error("handler must be a function");
    }
    for (_i = 0, _len = handlers.length; _i < _len; _i++) {
      typeHandler = handlers[_i];
      if (typeHandler.type === type) {
        typeHandler.handler = handler;
        return;
      }
    }
    return handlers.push({
      type: type,
      handler: handler
    });
  };

  getValueHandler = function() {
    var handlerLists, handlers, typeHandler, value, _i, _j, _len, _len1;
    value = arguments[0], handlerLists = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    for (_i = 0, _len = handlerLists.length; _i < _len; _i++) {
      handlers = handlerLists[_i];
      for (_j = 0, _len1 = handlers.length; _j < _len1; _j++) {
        typeHandler = handlers[_j];
        if (typeHandler.type === typeof value || (typeof typeHandler.type !== 'string' && value instanceof typeHandler.type)) {
          return typeHandler.handler;
        }
      }
    }
    return void 0;
  };

  cls.registerValueHandler = function(type, handler) {
    return registerValueHandler(cls.globalValueHandlers, type, handler);
  };

  cls.Cloneable = (function() {
    function Cloneable() {}

    Cloneable.prototype.clone = function() {
      var newInstance;
      newInstance = new this.constructor;
      return _extend(newInstance, JSON.parse(JSON.stringify(this)));
    };

    return Cloneable;

  })();

  cls.BaseBuilder = (function(_super) {
    __extends(BaseBuilder, _super);

    function BaseBuilder(options) {
      var defaults;
      defaults = JSON.parse(JSON.stringify(cls.DefaultQueryBuilderOptions));
      this.options = _extend({}, defaults, options);
    }

    BaseBuilder.prototype.registerValueHandler = function(type, handler) {
      registerValueHandler(this.options.valueHandlers, type, handler);
      return this;
    };

    BaseBuilder.prototype._getObjectClassName = function(obj) {
      var arr;
      if (obj && obj.constructor && obj.constructor.toString) {
        arr = obj.constructor.toString().match(/function\s*(\w+)/);
        if (arr && arr.length === 2) {
          return arr[1];
        }
      }
      return void 0;
    };

    BaseBuilder.prototype._sanitizeCondition = function(condition) {
      if (!(condition instanceof cls.Expression)) {
        if ("string" !== typeof condition) {
          throw new Error("condition must be a string or Expression instance");
        }
      }
      return condition;
    };

    BaseBuilder.prototype._sanitizeName = function(value, type) {
      if ("string" !== typeof value) {
        throw new Error("" + type + " must be a string");
      }
      return value;
    };

    BaseBuilder.prototype._sanitizeField = function(item, formattingOptions) {
      var quoteChar;
      if (formattingOptions == null) {
        formattingOptions = {};
      }
      if (item instanceof cls.QueryBuilder) {
        item = "(" + item + ")";
      } else {
        item = this._sanitizeName(item, "field name");
        if (this.options.autoQuoteFieldNames) {
          quoteChar = this.options.nameQuoteCharacter;
          if (formattingOptions.ignorePeriodsForFieldNameQuotes) {
            item = "" + quoteChar + item + quoteChar;
          } else {
            item = item.split('.').map(function(v) {
              if ('*' === v) {
                return v;
              } else {
                return "" + quoteChar + v + quoteChar;
              }
            }).join('.');
          }
        }
      }
      return item;
    };

    BaseBuilder.prototype._sanitizeTable = function(item, allowNested) {
      var sanitized;
      if (allowNested == null) {
        allowNested = false;
      }
      if (allowNested) {
        if ("string" === typeof item) {
          sanitized = item;
        } else if (item instanceof cls.QueryBuilder && item.isNestable()) {
          return item;
        } else {
          throw new Error("table name must be a string or a nestable query instance");
        }
      } else {
        sanitized = this._sanitizeName(item, 'table name');
      }
      if (this.options.autoQuoteTableNames) {
        return "" + this.options.nameQuoteCharacter + sanitized + this.options.nameQuoteCharacter;
      } else {
        return sanitized;
      }
    };

    BaseBuilder.prototype._sanitizeTableAlias = function(item) {
      var sanitized;
      sanitized = this._sanitizeName(item, "table alias");
      if (this.options.autoQuoteAliasNames) {
        return "" + this.options.tableAliasQuoteCharacter + sanitized + this.options.tableAliasQuoteCharacter;
      } else {
        return sanitized;
      }
    };

    BaseBuilder.prototype._sanitizeFieldAlias = function(item) {
      var sanitized;
      sanitized = this._sanitizeName(item, "field alias");
      if (this.options.autoQuoteAliasNames) {
        return "" + this.options.fieldAliasQuoteCharacter + sanitized + this.options.fieldAliasQuoteCharacter;
      } else {
        return sanitized;
      }
    };

    BaseBuilder.prototype._sanitizeLimitOffset = function(value) {
      value = parseInt(value);
      if (0 > value || isNaN(value)) {
        throw new Error("limit/offset must be >= 0");
      }
      return value;
    };

    BaseBuilder.prototype._sanitizeValue = function(item) {
      var itemType, typeIsValid;
      itemType = typeof item;
      if (null === item) {

      } else if ("string" === itemType || "number" === itemType || "boolean" === itemType) {

      } else if (item instanceof cls.QueryBuilder && item.isNestable()) {

      } else {
        typeIsValid = void 0 !== getValueHandler(item, this.options.valueHandlers, cls.globalValueHandlers);
        if (!typeIsValid) {
          throw new Error("field value must be a string, number, boolean, null or one of the registered custom value types");
        }
      }
      return item;
    };

    BaseBuilder.prototype._escapeValue = function(value) {
      if (true !== this.options.replaceSingleQuotes) {
        return value;
      }
      return value.replace(/\'/g, this.options.singleQuoteReplacement);
    };

    BaseBuilder.prototype._formatCustomValue = function(value) {
      var customHandler;
      customHandler = getValueHandler(value, this.options.valueHandlers, cls.globalValueHandlers);
      if (customHandler) {
        value = customHandler(value);
      }
      return value;
    };

    BaseBuilder.prototype._formatValueAsParam = function(value) {
      var _this = this;
      if (Array.isArray(value)) {
        return value.map(function(v) {
          return _this._formatValueAsParam(v);
        });
      } else {
        if (value instanceof cls.QueryBuilder && value.isNestable()) {
          return "" + value;
        } else {
          return this._formatCustomValue(value);
        }
      }
    };

    BaseBuilder.prototype._formatValue = function(value, formattingOptions) {
      var _this = this;
      if (formattingOptions == null) {
        formattingOptions = {};
      }
      value = this._formatCustomValue(value);
      if (Array.isArray(value)) {
        value = value.map(function(v) {
          return _this._formatValue(v);
        });
        value = "(" + (value.join(', ')) + ")";
      } else {
        if (null === value) {
          value = "NULL";
        } else if ("boolean" === typeof value) {
          value = value ? "TRUE" : "FALSE";
        } else if (value instanceof cls.QueryBuilder) {
          value = "(" + value + ")";
        } else if ("number" !== typeof value) {
          value = this._escapeValue(value);
          value = formattingOptions.dontQuote ? "" + value : "'" + value + "'";
        }
      }
      return value;
    };

    return BaseBuilder;

  })(cls.Cloneable);

  cls.Expression = (function(_super) {
    __extends(Expression, _super);

    Expression.prototype.tree = null;

    Expression.prototype.current = null;

    function Expression() {
      var _this = this;
      Expression.__super__.constructor.call(this);
      this.tree = {
        parent: null,
        nodes: []
      };
      this.current = this.tree;
      this._begin = function(op) {
        var new_tree;
        new_tree = {
          type: op,
          parent: _this.current,
          nodes: []
        };
        _this.current.nodes.push(new_tree);
        _this.current = _this.current.nodes[_this.current.nodes.length - 1];
        return _this;
      };
    }

    Expression.prototype.and_begin = function() {
      return this._begin('AND');
    };

    Expression.prototype.or_begin = function() {
      return this._begin('OR');
    };

    Expression.prototype.end = function() {
      if (!this.current.parent) {
        throw new Error("begin() needs to be called");
      }
      this.current = this.current.parent;
      return this;
    };

    Expression.prototype.and = function(expr, param) {
      if (!expr || "string" !== typeof expr) {
        throw new Error("expr must be a string");
      }
      this.current.nodes.push({
        type: 'AND',
        expr: expr,
        para: param
      });
      return this;
    };

    Expression.prototype.or = function(expr, param) {
      if (!expr || "string" !== typeof expr) {
        throw new Error("expr must be a string");
      }
      this.current.nodes.push({
        type: 'OR',
        expr: expr,
        para: param
      });
      return this;
    };

    Expression.prototype.toString = function() {
      if (null !== this.current.parent) {
        throw new Error("end() needs to be called");
      }
      return this._toString(this.tree);
    };

    Expression.prototype.toParam = function() {
      if (null !== this.current.parent) {
        throw new Error("end() needs to be called");
      }
      return this._toString(this.tree, true);
    };

    Expression.prototype._toString = function(node, paramMode) {
      var child, inStr, nodeStr, params, str, _i, _len, _ref;
      if (paramMode == null) {
        paramMode = false;
      }
      str = "";
      params = [];
      _ref = node.nodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        if (child.expr != null) {
          nodeStr = child.expr;
          if (child.para != null) {
            if (!paramMode) {
              nodeStr = nodeStr.replace('?', this._formatValue(child.para));
            } else {
              params = params.concat(this._formatValueAsParam(child.para));
              if (Array.isArray(child.para)) {
                inStr = Array.apply(null, new Array(child.para.length)).map(function() {
                  return '?';
                });
                nodeStr = nodeStr.replace('?', "(" + (inStr.join(', ')) + ")");
              }
            }
          }
        } else {
          nodeStr = this._toString(child, paramMode);
          if (paramMode) {
            params = params.concat(nodeStr.values);
            nodeStr = nodeStr.text;
          }
          if ("" !== nodeStr) {
            nodeStr = "(" + nodeStr + ")";
          }
        }
        if ("" !== nodeStr) {
          if ("" !== str) {
            str += " " + child.type + " ";
          }
          str += nodeStr;
        }
      }
      if (paramMode) {
        return {
          text: str,
          values: params
        };
      } else {
        return str;
      }
    };

    /*
    Clone this expression.
    
    Note that the algorithm contained within this method is probably non-optimal, so please avoid cloning large
    expression trees.
    */


    Expression.prototype.clone = function() {
      var newInstance, _cloneTree;
      newInstance = new this.constructor;
      (_cloneTree = function(node) {
        var child, _i, _len, _ref, _results;
        _ref = node.nodes;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          child = _ref[_i];
          if (child.expr != null) {
            _results.push(newInstance.current.nodes.push(JSON.parse(JSON.stringify(child))));
          } else {
            newInstance._begin(child.type);
            _cloneTree(child);
            if (!this.current === child) {
              _results.push(newInstance.end());
            } else {
              _results.push(void 0);
            }
          }
        }
        return _results;
      })(this.tree);
      return newInstance;
    };

    return Expression;

  })(cls.BaseBuilder);

  cls.Block = (function(_super) {
    __extends(Block, _super);

    function Block() {
      _ref = Block.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Block.prototype.exposedMethods = function() {
      var attr, ret, value;
      ret = {};
      for (attr in this) {
        value = this[attr];
        if (typeof value === "function" && attr.charAt(0) !== '_' && !cls.Block.prototype[attr]) {
          ret[attr] = value;
        }
      }
      return ret;
    };

    Block.prototype.buildStr = function(queryBuilder) {
      return '';
    };

    Block.prototype.buildParam = function(queryBuilder) {
      return {
        text: this.buildStr(queryBuilder),
        values: []
      };
    };

    return Block;

  })(cls.BaseBuilder);

  cls.StringBlock = (function(_super) {
    __extends(StringBlock, _super);

    function StringBlock(options, str) {
      StringBlock.__super__.constructor.call(this, options);
      this.str = str;
    }

    StringBlock.prototype.buildStr = function(queryBuilder) {
      return this.str;
    };

    return StringBlock;

  })(cls.Block);

  cls.AbstractTableBlock = (function(_super) {
    __extends(AbstractTableBlock, _super);

    function AbstractTableBlock(options) {
      AbstractTableBlock.__super__.constructor.call(this, options);
      this.tables = [];
    }

    AbstractTableBlock.prototype._table = function(table, alias) {
      if (alias == null) {
        alias = null;
      }
      if (alias) {
        alias = this._sanitizeTableAlias(alias);
      }
      table = this._sanitizeTable(table, this.options.allowNested || false);
      if (this.options.singleTable) {
        this.tables = [];
      }
      return this.tables.push({
        table: table,
        alias: alias
      });
    };

    AbstractTableBlock.prototype.buildStr = function(queryBuilder) {
      var table, tables, _i, _len, _ref1;
      if (0 >= this.tables.length) {
        throw new Error("_table() needs to be called");
      }
      tables = "";
      _ref1 = this.tables;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        table = _ref1[_i];
        if ("" !== tables) {
          tables += ", ";
        }
        if ("string" === typeof table.table) {
          tables += table.table;
        } else {
          tables += "(" + table.table + ")";
        }
        if (table.alias) {
          tables += " " + table.alias;
        }
      }
      return tables;
    };

    return AbstractTableBlock;

  })(cls.Block);

  cls.UpdateTableBlock = (function(_super) {
    __extends(UpdateTableBlock, _super);

    function UpdateTableBlock() {
      _ref1 = UpdateTableBlock.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    UpdateTableBlock.prototype.table = function(table, alias) {
      if (alias == null) {
        alias = null;
      }
      return this._table(table, alias);
    };

    return UpdateTableBlock;

  })(cls.AbstractTableBlock);

  cls.FromTableBlock = (function(_super) {
    __extends(FromTableBlock, _super);

    function FromTableBlock() {
      _ref2 = FromTableBlock.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    FromTableBlock.prototype.from = function(table, alias) {
      if (alias == null) {
        alias = null;
      }
      return this._table(table, alias);
    };

    FromTableBlock.prototype.buildStr = function(queryBuilder) {
      var tables;
      if (0 >= this.tables.length) {
        throw new Error("from() needs to be called");
      }
      tables = FromTableBlock.__super__.buildStr.call(this, queryBuilder);
      return "FROM " + tables;
    };

    return FromTableBlock;

  })(cls.AbstractTableBlock);

  cls.IntoTableBlock = (function(_super) {
    __extends(IntoTableBlock, _super);

    function IntoTableBlock(options) {
      IntoTableBlock.__super__.constructor.call(this, options);
      this.table = null;
    }

    IntoTableBlock.prototype.into = function(table) {
      return this.table = this._sanitizeTable(table, false);
    };

    IntoTableBlock.prototype.buildStr = function(queryBuilder) {
      if (!this.table) {
        throw new Error("into() needs to be called");
      }
      return "INTO " + this.table;
    };

    return IntoTableBlock;

  })(cls.Block);

  cls.GetFieldBlock = (function(_super) {
    __extends(GetFieldBlock, _super);

    function GetFieldBlock(options) {
      GetFieldBlock.__super__.constructor.call(this, options);
      this._fields = [];
    }

    GetFieldBlock.prototype.fields = function(_fields, options) {
      var alias, field, _results;
      if (options == null) {
        options = {};
      }
      _results = [];
      for (field in _fields) {
        alias = _fields[field];
        _results.push(this.field(field, alias, options));
      }
      return _results;
    };

    GetFieldBlock.prototype.field = function(field, alias, options) {
      if (alias == null) {
        alias = null;
      }
      if (options == null) {
        options = {};
      }
      field = this._sanitizeField(field, options);
      if (alias) {
        alias = this._sanitizeFieldAlias(alias);
      }
      return this._fields.push({
        name: field,
        alias: alias
      });
    };

    GetFieldBlock.prototype.buildStr = function(queryBuilder) {
      var field, fields, _i, _len, _ref3;
      fields = "";
      _ref3 = this._fields;
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        field = _ref3[_i];
        if ("" !== fields) {
          fields += ", ";
        }
        fields += field.name;
        if (field.alias) {
          fields += " AS " + field.alias;
        }
      }
      if ("" === fields) {
        return "*";
      } else {
        return fields;
      }
    };

    return GetFieldBlock;

  })(cls.Block);

  cls.AbstractSetFieldBlock = (function(_super) {
    __extends(AbstractSetFieldBlock, _super);

    function AbstractSetFieldBlock(options) {
      AbstractSetFieldBlock.__super__.constructor.call(this, options);
      this.fieldOptions = [];
      this.fields = [];
      this.values = [];
    }

    AbstractSetFieldBlock.prototype._set = function(field, value, options) {
      var index;
      if (options == null) {
        options = {};
      }
      if (this.values.length > 1) {
        throw new Error("Cannot call set or setFields on multiple rows of fields.");
      }
      if (void 0 !== value) {
        value = this._sanitizeValue(value);
      }
      index = this.fields.indexOf(this._sanitizeField(field, options));
      if (index !== -1) {
        this.values[0][index] = value;
        this.fieldOptions[0][index] = options;
      } else {
        this.fields.push(this._sanitizeField(field, options));
        index = this.fields.length - 1;
        if (Array.isArray(this.values[0])) {
          this.values[0][index] = value;
          this.fieldOptions[0][index] = options;
        } else {
          this.values.push([value]);
          this.fieldOptions.push([options]);
        }
      }
      return this;
    };

    AbstractSetFieldBlock.prototype._setFields = function(fields, options) {
      var field;
      if (options == null) {
        options = {};
      }
      if (typeof fields !== 'object') {
        throw new Error("Expected an object but got " + typeof fields);
      }
      for (field in fields) {
        if (!__hasProp.call(fields, field)) continue;
        this._set(field, fields[field], options);
      }
      return this;
    };

    AbstractSetFieldBlock.prototype._setFieldsRows = function(fieldsRows, options) {
      var field, i, index, value, _i, _ref3, _ref4;
      if (options == null) {
        options = {};
      }
      if (!Array.isArray(fieldsRows)) {
        throw new Error("Expected an array of objects but got " + typeof fieldsRows);
      }
      this.fields = [];
      this.values = [];
      for (i = _i = 0, _ref3 = fieldsRows.length; 0 <= _ref3 ? _i < _ref3 : _i > _ref3; i = 0 <= _ref3 ? ++_i : --_i) {
        _ref4 = fieldsRows[i];
        for (field in _ref4) {
          if (!__hasProp.call(_ref4, field)) continue;
          index = this.fields.indexOf(this._sanitizeField(field, options));
          if (0 < i && -1 === index) {
            throw new Error('All fields in subsequent rows must match the fields in the first row');
          }
          if (-1 === index) {
            this.fields.push(this._sanitizeField(field, options));
            index = this.fields.length - 1;
          }
          value = this._sanitizeValue(fieldsRows[i][field]);
          if (Array.isArray(this.values[i])) {
            this.values[i][index] = value;
            this.fieldOptions[i][index] = options;
          } else {
            this.values[i] = [value];
            this.fieldOptions[i] = [options];
          }
        }
      }
      return this;
    };

    AbstractSetFieldBlock.prototype.buildStr = function() {
      throw new Error('Not yet implemented');
    };

    AbstractSetFieldBlock.prototype.buildParam = function() {
      throw new Error('Not yet implemented');
    };

    return AbstractSetFieldBlock;

  })(cls.Block);

  cls.SetFieldBlock = (function(_super) {
    __extends(SetFieldBlock, _super);

    function SetFieldBlock() {
      _ref3 = SetFieldBlock.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    SetFieldBlock.prototype.set = function(field, value, options) {
      return this._set(field, value, options);
    };

    SetFieldBlock.prototype.setFields = function(fields, options) {
      return this._setFields(fields, options);
    };

    SetFieldBlock.prototype.buildStr = function(queryBuilder) {
      var field, fieldOptions, i, str, value, _i, _ref4;
      if (0 >= this.fields.length) {
        throw new Error("set() needs to be called");
      }
      str = "";
      for (i = _i = 0, _ref4 = this.fields.length; 0 <= _ref4 ? _i < _ref4 : _i > _ref4; i = 0 <= _ref4 ? ++_i : --_i) {
        field = this.fields[i];
        if ("" !== str) {
          str += ", ";
        }
        value = this.values[0][i];
        fieldOptions = this.fieldOptions[0][i];
        if (typeof value === 'undefined') {
          str += field;
        } else {
          str += "" + field + " = " + (this._formatValue(value, fieldOptions));
        }
      }
      return "SET " + str;
    };

    SetFieldBlock.prototype.buildParam = function(queryBuilder) {
      var field, i, str, vals, value, _i, _ref4;
      if (0 >= this.fields.length) {
        throw new Error("set() needs to be called");
      }
      str = "";
      vals = [];
      for (i = _i = 0, _ref4 = this.fields.length; 0 <= _ref4 ? _i < _ref4 : _i > _ref4; i = 0 <= _ref4 ? ++_i : --_i) {
        field = this.fields[i];
        if ("" !== str) {
          str += ", ";
        }
        value = this.values[0][i];
        if (typeof value === 'undefined') {
          str += field;
        } else {
          str += "" + field + " = ?";
          vals.push(this._formatValueAsParam(value));
        }
      }
      return {
        text: "SET " + str,
        values: vals
      };
    };

    return SetFieldBlock;

  })(cls.AbstractSetFieldBlock);

  cls.InsertFieldValueBlock = (function(_super) {
    __extends(InsertFieldValueBlock, _super);

    function InsertFieldValueBlock() {
      _ref4 = InsertFieldValueBlock.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    InsertFieldValueBlock.prototype.set = function(field, value, options) {
      if (options == null) {
        options = {};
      }
      return this._set(field, value, options);
    };

    InsertFieldValueBlock.prototype.setFields = function(fields, options) {
      return this._setFields(fields, options);
    };

    InsertFieldValueBlock.prototype.setFieldsRows = function(fieldsRows, options) {
      return this._setFieldsRows(fieldsRows, options);
    };

    InsertFieldValueBlock.prototype._buildVals = function() {
      var formattedValue, i, j, vals, _i, _j, _ref5, _ref6;
      vals = [];
      for (i = _i = 0, _ref5 = this.values.length; 0 <= _ref5 ? _i < _ref5 : _i > _ref5; i = 0 <= _ref5 ? ++_i : --_i) {
        for (j = _j = 0, _ref6 = this.values[i].length; 0 <= _ref6 ? _j < _ref6 : _j > _ref6; j = 0 <= _ref6 ? ++_j : --_j) {
          formattedValue = this._formatValue(this.values[i][j], this.fieldOptions[i][j]);
          if ('string' === typeof vals[i]) {
            vals[i] += ', ' + formattedValue;
          } else {
            vals[i] = '' + formattedValue;
          }
        }
      }
      return vals;
    };

    InsertFieldValueBlock.prototype._buildValParams = function() {
      var i, j, params, vals, _i, _j, _ref5, _ref6;
      vals = [];
      params = [];
      for (i = _i = 0, _ref5 = this.values.length; 0 <= _ref5 ? _i < _ref5 : _i > _ref5; i = 0 <= _ref5 ? ++_i : --_i) {
        for (j = _j = 0, _ref6 = this.values[i].length; 0 <= _ref6 ? _j < _ref6 : _j > _ref6; j = 0 <= _ref6 ? ++_j : --_j) {
          params.push(this._formatValueAsParam(this.values[i][j]));
          if ('string' === typeof vals[i]) {
            vals[i] += ', ?';
          } else {
            vals[i] = '?';
          }
        }
      }
      return {
        vals: vals,
        params: params
      };
    };

    InsertFieldValueBlock.prototype.buildStr = function(queryBuilder) {
      if (0 >= this.fields.length) {
        throw new Error("set() needs to be called");
      }
      return "(" + (this.fields.join(', ')) + ") VALUES (" + (this._buildVals().join('), (')) + ")";
    };

    InsertFieldValueBlock.prototype.buildParam = function(queryBuilder) {
      var i, params, str, vals, _i, _ref5, _ref6;
      if (0 >= this.fields.length) {
        throw new Error("set() needs to be called");
      }
      str = "";
      _ref5 = this._buildValParams(), vals = _ref5.vals, params = _ref5.params;
      for (i = _i = 0, _ref6 = this.fields.length; 0 <= _ref6 ? _i < _ref6 : _i > _ref6; i = 0 <= _ref6 ? ++_i : --_i) {
        if ("" !== str) {
          str += ", ";
        }
        str += this.fields[i];
      }
      return {
        text: "(" + str + ") VALUES (" + (vals.join('), (')) + ")",
        values: params
      };
    };

    return InsertFieldValueBlock;

  })(cls.AbstractSetFieldBlock);

  cls.DistinctBlock = (function(_super) {
    __extends(DistinctBlock, _super);

    function DistinctBlock(options) {
      DistinctBlock.__super__.constructor.call(this, options);
      this.useDistinct = false;
    }

    DistinctBlock.prototype.distinct = function() {
      return this.useDistinct = true;
    };

    DistinctBlock.prototype.buildStr = function(queryBuilder) {
      if (this.useDistinct) {
        return "DISTINCT";
      } else {
        return "";
      }
    };

    return DistinctBlock;

  })(cls.Block);

  cls.GroupByBlock = (function(_super) {
    __extends(GroupByBlock, _super);

    function GroupByBlock(options) {
      GroupByBlock.__super__.constructor.call(this, options);
      this.groups = [];
    }

    GroupByBlock.prototype.group = function(field) {
      field = this._sanitizeField(field);
      return this.groups.push(field);
    };

    GroupByBlock.prototype.buildStr = function(queryBuilder) {
      var f, groups, _i, _len, _ref5;
      groups = "";
      if (0 < this.groups.length) {
        _ref5 = this.groups;
        for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
          f = _ref5[_i];
          if ("" !== groups) {
            groups += ", ";
          }
          groups += f;
        }
        groups = "GROUP BY " + groups;
      }
      return groups;
    };

    return GroupByBlock;

  })(cls.Block);

  cls.OffsetBlock = (function(_super) {
    __extends(OffsetBlock, _super);

    function OffsetBlock(options) {
      OffsetBlock.__super__.constructor.call(this, options);
      this.offsets = null;
    }

    OffsetBlock.prototype.offset = function(start) {
      start = this._sanitizeLimitOffset(start);
      return this.offsets = start;
    };

    OffsetBlock.prototype.buildStr = function(queryBuilder) {
      if (this.offsets) {
        return "OFFSET " + this.offsets;
      } else {
        return "";
      }
    };

    return OffsetBlock;

  })(cls.Block);

  cls.WhereBlock = (function(_super) {
    __extends(WhereBlock, _super);

    function WhereBlock(options) {
      WhereBlock.__super__.constructor.call(this, options);
      this.wheres = [];
    }

    WhereBlock.prototype.where = function() {
      var c, condition, finalCondition, finalValues, idx, inValues, item, nextValue, t, values, _i, _j, _len, _ref5;
      condition = arguments[0], values = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      condition = this._sanitizeCondition(condition);
      finalCondition = "";
      finalValues = [];
      if (condition instanceof cls.Expression) {
        t = condition.toParam();
        finalCondition = t.text;
        finalValues = t.values;
      } else {
        for (idx = _i = 0, _ref5 = condition.length; 0 <= _ref5 ? _i < _ref5 : _i > _ref5; idx = 0 <= _ref5 ? ++_i : --_i) {
          c = condition.charAt(idx);
          if ('?' === c && 0 < values.length) {
            nextValue = values.shift();
            if (Array.isArray(nextValue)) {
              inValues = [];
              for (_j = 0, _len = nextValue.length; _j < _len; _j++) {
                item = nextValue[_j];
                inValues.push(this._sanitizeValue(item));
              }
              finalValues = finalValues.concat(inValues);
              finalCondition += "(" + (((function() {
                var _k, _len1, _results;
                _results = [];
                for (_k = 0, _len1 = inValues.length; _k < _len1; _k++) {
                  item = inValues[_k];
                  _results.push('?');
                }
                return _results;
              })()).join(', ')) + ")";
            } else {
              finalCondition += '?';
              finalValues.push(this._sanitizeValue(nextValue));
            }
          } else {
            finalCondition += c;
          }
        }
      }
      if ("" !== finalCondition) {
        return this.wheres.push({
          text: finalCondition,
          values: finalValues
        });
      }
    };

    WhereBlock.prototype.buildStr = function(queryBuilder) {
      var c, idx, pIndex, where, whereStr, _i, _j, _len, _ref5, _ref6;
      if (0 >= this.wheres.length) {
        return "";
      }
      whereStr = "";
      _ref5 = this.wheres;
      for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
        where = _ref5[_i];
        if ("" !== whereStr) {
          whereStr += ") AND (";
        }
        if (0 < where.values.length) {
          pIndex = 0;
          for (idx = _j = 0, _ref6 = where.text.length; 0 <= _ref6 ? _j < _ref6 : _j > _ref6; idx = 0 <= _ref6 ? ++_j : --_j) {
            c = where.text.charAt(idx);
            if ('?' === c) {
              whereStr += this._formatValue(where.values[pIndex++]);
            } else {
              whereStr += c;
            }
          }
        } else {
          whereStr += where.text;
        }
      }
      return "WHERE (" + whereStr + ")";
    };

    WhereBlock.prototype.buildParam = function(queryBuilder) {
      var ret, v, value, where, whereStr, _i, _j, _len, _len1, _ref5, _ref6;
      ret = {
        text: "",
        values: []
      };
      if (0 >= this.wheres.length) {
        return ret;
      }
      whereStr = "";
      _ref5 = this.wheres;
      for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
        where = _ref5[_i];
        if ("" !== whereStr) {
          whereStr += ") AND (";
        }
        whereStr += where.text;
        _ref6 = where.values;
        for (_j = 0, _len1 = _ref6.length; _j < _len1; _j++) {
          v = _ref6[_j];
          ret.values.push(this._formatValueAsParam(v));
          value = this._formatValueAsParam(value);
        }
      }
      ret.text = "WHERE (" + whereStr + ")";
      return ret;
    };

    return WhereBlock;

  })(cls.Block);

  cls.OrderByBlock = (function(_super) {
    __extends(OrderByBlock, _super);

    function OrderByBlock(options) {
      OrderByBlock.__super__.constructor.call(this, options);
      this.orders = [];
      this._values = [];
    }

    OrderByBlock.prototype.order = function() {
      var asc, field, values;
      field = arguments[0], asc = arguments[1], values = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      if (asc == null) {
        asc = true;
      }
      field = this._sanitizeField(field);
      this._values = values;
      return this.orders.push({
        field: field,
        dir: asc ? true : false
      });
    };

    OrderByBlock.prototype._buildStr = function(toParam) {
      var c, fstr, idx, o, orders, pIndex, _i, _j, _len, _ref5, _ref6;
      if (toParam == null) {
        toParam = false;
      }
      if (0 < this.orders.length) {
        pIndex = 0;
        orders = "";
        _ref5 = this.orders;
        for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
          o = _ref5[_i];
          if ("" !== orders) {
            orders += ", ";
          }
          fstr = "";
          if (!toParam) {
            for (idx = _j = 0, _ref6 = o.field.length; 0 <= _ref6 ? _j < _ref6 : _j > _ref6; idx = 0 <= _ref6 ? ++_j : --_j) {
              c = o.field.charAt(idx);
              if ('?' === c) {
                fstr += this._formatValue(this._values[pIndex++]);
              } else {
                fstr += c;
              }
            }
          } else {
            fstr = o.field;
          }
          orders += "" + fstr + " " + (o.dir ? 'ASC' : 'DESC');
        }
        return "ORDER BY " + orders;
      } else {
        return "";
      }
    };

    OrderByBlock.prototype.buildStr = function(queryBuilder) {
      return this._buildStr();
    };

    OrderByBlock.prototype.buildParam = function(queryBuilder) {
      var _this = this;
      return {
        text: this._buildStr(true),
        values: this._values.map(function(v) {
          return _this._formatValueAsParam(v);
        })
      };
    };

    return OrderByBlock;

  })(cls.Block);

  cls.LimitBlock = (function(_super) {
    __extends(LimitBlock, _super);

    function LimitBlock(options) {
      LimitBlock.__super__.constructor.call(this, options);
      this.limits = null;
    }

    LimitBlock.prototype.limit = function(max) {
      max = this._sanitizeLimitOffset(max);
      return this.limits = max;
    };

    LimitBlock.prototype.buildStr = function(queryBuilder) {
      if (this.limits) {
        return "LIMIT " + this.limits;
      } else {
        return "";
      }
    };

    return LimitBlock;

  })(cls.Block);

  cls.JoinBlock = (function(_super) {
    __extends(JoinBlock, _super);

    function JoinBlock(options) {
      JoinBlock.__super__.constructor.call(this, options);
      this.joins = [];
    }

    JoinBlock.prototype.join = function(table, alias, condition, type) {
      if (alias == null) {
        alias = null;
      }
      if (condition == null) {
        condition = null;
      }
      if (type == null) {
        type = 'INNER';
      }
      table = this._sanitizeTable(table, true);
      if (alias) {
        alias = this._sanitizeTableAlias(alias);
      }
      if (condition) {
        condition = this._sanitizeCondition(condition);
      }
      this.joins.push({
        type: type,
        table: table,
        alias: alias,
        condition: condition
      });
      return this;
    };

    JoinBlock.prototype.left_join = function(table, alias, condition) {
      if (alias == null) {
        alias = null;
      }
      if (condition == null) {
        condition = null;
      }
      return this.join(table, alias, condition, 'LEFT');
    };

    JoinBlock.prototype.right_join = function(table, alias, condition) {
      if (alias == null) {
        alias = null;
      }
      if (condition == null) {
        condition = null;
      }
      return this.join(table, alias, condition, 'RIGHT');
    };

    JoinBlock.prototype.outer_join = function(table, alias, condition) {
      if (alias == null) {
        alias = null;
      }
      if (condition == null) {
        condition = null;
      }
      return this.join(table, alias, condition, 'OUTER');
    };

    JoinBlock.prototype.left_outer_join = function(table, alias, condition) {
      if (alias == null) {
        alias = null;
      }
      if (condition == null) {
        condition = null;
      }
      return this.join(table, alias, condition, 'LEFT OUTER');
    };

    JoinBlock.prototype.buildStr = function(queryBuilder) {
      var j, joins, _i, _len, _ref5;
      joins = "";
      _ref5 = this.joins || [];
      for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
        j = _ref5[_i];
        if (joins !== "") {
          joins += " ";
        }
        joins += "" + j.type + " JOIN ";
        if ("string" === typeof j.table) {
          joins += j.table;
        } else {
          joins += "(" + j.table + ")";
        }
        if (j.alias) {
          joins += " " + j.alias;
        }
        if (j.condition) {
          joins += " ON (" + j.condition + ")";
        }
      }
      return joins;
    };

    return JoinBlock;

  })(cls.Block);

  cls.QueryBuilder = (function(_super) {
    __extends(QueryBuilder, _super);

    function QueryBuilder(options, blocks) {
      var block, methodBody, methodName, _fn, _i, _len, _ref5, _ref6,
        _this = this;
      QueryBuilder.__super__.constructor.call(this, options);
      this.blocks = blocks || [];
      _ref5 = this.blocks;
      for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
        block = _ref5[_i];
        _ref6 = block.exposedMethods();
        _fn = function(block, name, body) {
          return _this[name] = function() {
            body.apply(block, arguments);
            return _this;
          };
        };
        for (methodName in _ref6) {
          methodBody = _ref6[methodName];
          if (this[methodName] != null) {
            throw new Error("" + (this._getObjectClassName(this)) + " already has a builder method called: " + methodName);
          }
          _fn(block, methodName, methodBody);
        }
      }
    }

    QueryBuilder.prototype.registerValueHandler = function(type, handler) {
      var block, _i, _len, _ref5;
      _ref5 = this.blocks;
      for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
        block = _ref5[_i];
        block.registerValueHandler(type, handler);
      }
      QueryBuilder.__super__.registerValueHandler.call(this, type, handler);
      return this;
    };

    QueryBuilder.prototype.updateOptions = function(options) {
      var block, _i, _len, _ref5, _results;
      this.options = _extend({}, this.options, options);
      _ref5 = this.blocks;
      _results = [];
      for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
        block = _ref5[_i];
        _results.push(block.options = _extend({}, block.options, options));
      }
      return _results;
    };

    QueryBuilder.prototype.toString = function() {
      var block;
      return ((function() {
        var _i, _len, _ref5, _results;
        _ref5 = this.blocks;
        _results = [];
        for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
          block = _ref5[_i];
          _results.push(block.buildStr(this));
        }
        return _results;
      }).call(this)).filter(function(v) {
        return 0 < v.length;
      }).join(this.options.separator);
    };

    QueryBuilder.prototype.toParam = function() {
      var block, blocks, i, result, _ref5;
      result = {
        text: '',
        values: []
      };
      blocks = (function() {
        var _i, _len, _ref5, _results;
        _ref5 = this.blocks;
        _results = [];
        for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
          block = _ref5[_i];
          _results.push(block.buildParam(this));
        }
        return _results;
      }).call(this);
      result.text = ((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = blocks.length; _i < _len; _i++) {
          block = blocks[_i];
          _results.push(block.text);
        }
        return _results;
      })()).filter(function(v) {
        return 0 < v.length;
      }).join(this.options.separator);
      result.values = (_ref5 = []).concat.apply(_ref5, (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = blocks.length; _i < _len; _i++) {
          block = blocks[_i];
          _results.push(block.values);
        }
        return _results;
      })());
      if (this.options.numberedParameters) {
        i = 0;
        result.text = result.text.replace(/\?/g, function() {
          return "$" + (++i);
        });
      }
      return result;
    };

    QueryBuilder.prototype.clone = function() {
      var block;
      return new this.constructor(this.options, (function() {
        var _i, _len, _ref5, _results;
        _ref5 = this.blocks;
        _results = [];
        for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
          block = _ref5[_i];
          _results.push(block.clone());
        }
        return _results;
      }).call(this));
    };

    QueryBuilder.prototype.isNestable = function() {
      return false;
    };

    return QueryBuilder;

  })(cls.BaseBuilder);

  cls.Select = (function(_super) {
    __extends(Select, _super);

    function Select(options, blocks) {
      if (blocks == null) {
        blocks = null;
      }
      blocks || (blocks = [
        new cls.StringBlock(options, 'SELECT'), new cls.DistinctBlock(options), new cls.GetFieldBlock(options), new cls.FromTableBlock(_extend({}, options, {
          allowNested: true
        })), new cls.JoinBlock(_extend({}, options, {
          allowNested: true
        })), new cls.WhereBlock(options), new cls.GroupByBlock(options), new cls.OrderByBlock(options), new cls.LimitBlock(options), new cls.OffsetBlock(options)
      ]);
      Select.__super__.constructor.call(this, options, blocks);
    }

    Select.prototype.isNestable = function() {
      return true;
    };

    return Select;

  })(cls.QueryBuilder);

  cls.Update = (function(_super) {
    __extends(Update, _super);

    function Update(options, blocks) {
      if (blocks == null) {
        blocks = null;
      }
      blocks || (blocks = [new cls.StringBlock(options, 'UPDATE'), new cls.UpdateTableBlock(options), new cls.SetFieldBlock(options), new cls.WhereBlock(options), new cls.OrderByBlock(options), new cls.LimitBlock(options)]);
      Update.__super__.constructor.call(this, options, blocks);
    }

    return Update;

  })(cls.QueryBuilder);

  cls.Delete = (function(_super) {
    __extends(Delete, _super);

    function Delete(options, blocks) {
      if (blocks == null) {
        blocks = null;
      }
      blocks || (blocks = [
        new cls.StringBlock(options, 'DELETE'), new cls.FromTableBlock(_extend({}, options, {
          singleTable: true
        })), new cls.JoinBlock(options), new cls.WhereBlock(options), new cls.OrderByBlock(options), new cls.LimitBlock(options)
      ]);
      Delete.__super__.constructor.call(this, options, blocks);
    }

    return Delete;

  })(cls.QueryBuilder);

  cls.Insert = (function(_super) {
    __extends(Insert, _super);

    function Insert(options, blocks) {
      if (blocks == null) {
        blocks = null;
      }
      blocks || (blocks = [new cls.StringBlock(options, 'INSERT'), new cls.IntoTableBlock(options), new cls.InsertFieldValueBlock(options)]);
      Insert.__super__.constructor.call(this, options, blocks);
    }

    return Insert;

  })(cls.QueryBuilder);

  squel = {
    VERSION: '3.8.1',
    expr: function() {
      return new cls.Expression;
    },
    select: function(options, blocks) {
      return new cls.Select(options, blocks);
    },
    update: function(options, blocks) {
      return new cls.Update(options, blocks);
    },
    insert: function(options, blocks) {
      return new cls.Insert(options, blocks);
    },
    "delete": function(options, blocks) {
      return new cls.Delete(options, blocks);
    },
    registerValueHandler: cls.registerValueHandler
  };

  squel.remove = squel["delete"];

  squel.cls = cls;

  if (typeof define !== "undefined" && define !== null ? define.amd : void 0) {
    define(function() {
      return squel;
    });
  } else if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
    module.exports = squel;
  } else {
    if (typeof window !== "undefined" && window !== null) {
      window.squel = squel;
    }
  }

  squel.flavours = {};

  squel.useFlavour = function(flavour) {
    if (squel.flavours[flavour] instanceof Function) {
      squel.flavours[flavour].call(null, squel);
    } else {
      throw new Error("Flavour not available: " + flavour);
    }
    return squel;
  };

  /*
  Copyright (c) Ramesh Nair (hiddentao.com)
  
  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation
  files (the "Software"), to deal in the Software without
  restriction, including without limitation the rights to use,
  copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the
  Software is furnished to do so, subject to the following
  conditions:
  
  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
  OTHER DEALINGS IN THE SOFTWARE.
  */


  squel.flavours['postgres'] = function() {
    cls = squel.cls;
    cls.DefaultQueryBuilderOptions.numberedParameters = true;
    cls.ReturningBlock = (function(_super) {
      __extends(ReturningBlock, _super);

      function ReturningBlock(options) {
        ReturningBlock.__super__.constructor.call(this, options);
        this._str = null;
      }

      ReturningBlock.prototype.returning = function(ret) {
        return this._str = this._sanitizeField(ret);
      };

      ReturningBlock.prototype.buildStr = function() {
        if (this._str) {
          return "RETURNING " + this._str;
        } else {
          return "";
        }
      };

      return ReturningBlock;

    })(cls.Block);
    cls.Insert = (function(_super) {
      __extends(Insert, _super);

      function Insert(options, blocks) {
        if (blocks == null) {
          blocks = null;
        }
        blocks || (blocks = [new cls.StringBlock(options, 'INSERT'), new cls.IntoTableBlock(options), new cls.InsertFieldValueBlock(options), new cls.ReturningBlock(options)]);
        Insert.__super__.constructor.call(this, options, blocks);
      }

      return Insert;

    })(cls.QueryBuilder);
    cls.Update = (function(_super) {
      __extends(Update, _super);

      function Update(options, blocks) {
        if (blocks == null) {
          blocks = null;
        }
        blocks || (blocks = [new cls.StringBlock(options, 'UPDATE'), new cls.UpdateTableBlock(options), new cls.SetFieldBlock(options), new cls.WhereBlock(options), new cls.OrderByBlock(options), new cls.LimitBlock(options), new cls.ReturningBlock(options)]);
        Update.__super__.constructor.call(this, options, blocks);
      }

      return Update;

    })(cls.QueryBuilder);
    return cls.Delete = (function(_super) {
      __extends(Delete, _super);

      function Delete(options, blocks) {
        if (blocks == null) {
          blocks = null;
        }
        blocks || (blocks = [
          new cls.StringBlock(options, 'DELETE'), new cls.FromTableBlock(_extend({}, options, {
            singleTable: true
          })), new cls.JoinBlock(options), new cls.WhereBlock(options), new cls.OrderByBlock(options), new cls.LimitBlock(options), new cls.ReturningBlock(options)
        ]);
        Delete.__super__.constructor.call(this, options, blocks);
      }

      return Delete;

    })(cls.QueryBuilder);
  };

  /*
  Copyright (c) Ramesh Nair (hiddentao.com)
  
  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation
  files (the "Software"), to deal in the Software without
  restriction, including without limitation the rights to use,
  copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the
  Software is furnished to do so, subject to the following
  conditions:
  
  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
  OTHER DEALINGS IN THE SOFTWARE.
  */


  squel.flavours['mysql'] = function() {
    var _ref5;
    cls = squel.cls;
    cls.MysqlOnDuplicateKeyUpdateBlock = (function(_super) {
      __extends(MysqlOnDuplicateKeyUpdateBlock, _super);

      function MysqlOnDuplicateKeyUpdateBlock() {
        _ref5 = MysqlOnDuplicateKeyUpdateBlock.__super__.constructor.apply(this, arguments);
        return _ref5;
      }

      MysqlOnDuplicateKeyUpdateBlock.prototype.onDupUpdate = function(field, value, options) {
        return this._set(field, value, options);
      };

      MysqlOnDuplicateKeyUpdateBlock.prototype.buildStr = function() {
        var field, fieldOptions, i, str, value, _i, _ref6;
        str = "";
        for (i = _i = 0, _ref6 = this.fields.length; 0 <= _ref6 ? _i < _ref6 : _i > _ref6; i = 0 <= _ref6 ? ++_i : --_i) {
          field = this.fields[i];
          if ("" !== str) {
            str += ", ";
          }
          value = this.values[0][i];
          fieldOptions = this.fieldOptions[0][i];
          if (typeof value === 'undefined') {
            str += field;
          } else {
            str += "" + field + " = " + (this._formatValue(value, fieldOptions));
          }
        }
        if (str === "") {
          return "";
        } else {
          return "ON DUPLICATE KEY UPDATE " + str;
        }
      };

      MysqlOnDuplicateKeyUpdateBlock.prototype.buildParam = function(queryBuilder) {
        var field, i, str, vals, value, _i, _ref6;
        str = "";
        vals = [];
        for (i = _i = 0, _ref6 = this.fields.length; 0 <= _ref6 ? _i < _ref6 : _i > _ref6; i = 0 <= _ref6 ? ++_i : --_i) {
          field = this.fields[i];
          if ("" !== str) {
            str += ", ";
          }
          value = this.values[0][i];
          if (typeof value === 'undefined') {
            str += field;
          } else {
            str += "" + field + " = ?";
            vals.push(this._formatValueAsParam(value));
          }
        }
        return {
          text: str === "" ? "" : "ON DUPLICATE KEY UPDATE " + str,
          values: vals
        };
      };

      return MysqlOnDuplicateKeyUpdateBlock;

    })(cls.AbstractSetFieldBlock);
    return cls.Insert = (function(_super) {
      __extends(Insert, _super);

      function Insert(options, blocks) {
        if (blocks == null) {
          blocks = null;
        }
        blocks || (blocks = [new cls.StringBlock(options, 'INSERT'), new cls.IntoTableBlock(options), new cls.InsertFieldValueBlock(options), new cls.MysqlOnDuplicateKeyUpdateBlock(options)]);
        Insert.__super__.constructor.call(this, options, blocks);
      }

      return Insert;

    })(cls.QueryBuilder);
  };

  /*
  Copyright (c) Ramesh Nair (hiddentao.com)
  
  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation
  files (the "Software"), to deal in the Software without
  restriction, including without limitation the rights to use,
  copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the
  Software is furnished to do so, subject to the following
  conditions:
  
  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
  OTHER DEALINGS IN THE SOFTWARE.
  */


  _extend = function() {
    var dst, k, sources, src, v, _i, _len;
    dst = arguments[0], sources = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (sources) {
      for (_i = 0, _len = sources.length; _i < _len; _i++) {
        src = sources[_i];
        if (src) {
          for (k in src) {
            if (!__hasProp.call(src, k)) continue;
            v = src[k];
            dst[k] = v;
          }
        }
      }
    }
    return dst;
  };

  squel.flavours['mssql'] = function() {
    cls = squel.cls;
    cls.DefaultQueryBuilderOptions.replaceSingleQuotes = true;
    cls.DefaultQueryBuilderOptions.autoQuoteAliasNames = false;
    squel.registerValueHandler(Date, function(date) {
      return "" + (date.getUTCFullYear()) + "-" + (date.getUTCMonth() + 1) + "-" + (date.getUTCDate()) + " " + (date.getUTCHours()) + ":" + (date.getUTCMinutes()) + ":" + (date.getUTCSeconds());
    });
    cls.MssqlLimitOffsetTopBlock = (function(_super) {
      var LimitBlock, OffsetBlock, ParentBlock, TopBlock, _limit, _ref5, _ref6, _ref7;

      __extends(MssqlLimitOffsetTopBlock, _super);

      function MssqlLimitOffsetTopBlock(options) {
        MssqlLimitOffsetTopBlock.__super__.constructor.call(this, options);
        this.limits = null;
        this.offsets = null;
      }

      _limit = function(max) {
        max = this._sanitizeLimitOffset(max);
        return this._parent.limits = max;
      };

      ParentBlock = (function(_super1) {
        __extends(ParentBlock, _super1);

        function ParentBlock(parent) {
          ParentBlock.__super__.constructor.call(this, parent.options);
          this._parent = parent;
        }

        return ParentBlock;

      })(cls.Block);

      LimitBlock = (function(_super1) {
        __extends(LimitBlock, _super1);

        function LimitBlock() {
          _ref5 = LimitBlock.__super__.constructor.apply(this, arguments);
          return _ref5;
        }

        LimitBlock.prototype.limit = _limit;

        LimitBlock.prototype.buildStr = function(queryBuilder) {
          if (this._parent.limits && this._parent.offsets) {
            return "FETCH NEXT " + this._parent.limits + " ROWS ONLY";
          } else {
            return "";
          }
        };

        return LimitBlock;

      })(ParentBlock);

      TopBlock = (function(_super1) {
        __extends(TopBlock, _super1);

        function TopBlock() {
          _ref6 = TopBlock.__super__.constructor.apply(this, arguments);
          return _ref6;
        }

        TopBlock.prototype.top = _limit;

        TopBlock.prototype.buildStr = function(queryBuilder) {
          if (this._parent.limits && !this._parent.offsets) {
            return "TOP (" + this._parent.limits + ")";
          } else {
            return "";
          }
        };

        return TopBlock;

      })(ParentBlock);

      OffsetBlock = (function(_super1) {
        __extends(OffsetBlock, _super1);

        function OffsetBlock() {
          this.offset = __bind(this.offset, this);
          _ref7 = OffsetBlock.__super__.constructor.apply(this, arguments);
          return _ref7;
        }

        OffsetBlock.prototype.offset = function(start) {
          start = this._sanitizeLimitOffset(start);
          return this._parent.offsets = start;
        };

        OffsetBlock.prototype.buildStr = function(queryBuilder) {
          if (this._parent.offsets) {
            return "OFFSET " + this._parent.offsets + " ROWS";
          } else {
            return "";
          }
        };

        return OffsetBlock;

      })(ParentBlock);

      MssqlLimitOffsetTopBlock.prototype.LIMIT = function(options) {
        this.constructor(options);
        return new LimitBlock(this);
      };

      MssqlLimitOffsetTopBlock.prototype.TOP = function(options) {
        this.constructor(options);
        return new TopBlock(this);
      };

      MssqlLimitOffsetTopBlock.prototype.OFFSET = function(options) {
        this.constructor(options);
        return new OffsetBlock(this);
      };

      return MssqlLimitOffsetTopBlock;

    }).call(this, cls.Block);
    cls.MssqlUpdateTopBlock = (function(_super) {
      var _limit;

      __extends(MssqlUpdateTopBlock, _super);

      function MssqlUpdateTopBlock(options) {
        MssqlUpdateTopBlock.__super__.constructor.call(this, options);
        this.limits = null;
      }

      _limit = function(max) {
        max = this._sanitizeLimitOffset(max);
        return this.limits = max;
      };

      MssqlUpdateTopBlock.prototype.limit = _limit;

      MssqlUpdateTopBlock.prototype.top = _limit;

      MssqlUpdateTopBlock.prototype.buildStr = function(queryBuilder) {
        if (this.limits) {
          return "TOP (" + this.limits + ")";
        } else {
          return "";
        }
      };

      return MssqlUpdateTopBlock;

    })(cls.Block);
    cls.MssqlInsertFieldValueBlock = (function(_super) {
      __extends(MssqlInsertFieldValueBlock, _super);

      function MssqlInsertFieldValueBlock(options) {
        MssqlInsertFieldValueBlock.__super__.constructor.call(this, options);
        this.outputs = [];
      }

      MssqlInsertFieldValueBlock.prototype.output = function(fields) {
        var f, _i, _len, _results;
        if ('string' === typeof fields) {
          return this.outputs.push("INSERTED." + (this._sanitizeField(fields)));
        } else {
          _results = [];
          for (_i = 0, _len = fields.length; _i < _len; _i++) {
            f = fields[_i];
            _results.push(this.outputs.push("INSERTED." + (this._sanitizeField(f))));
          }
          return _results;
        }
      };

      MssqlInsertFieldValueBlock.prototype.buildStr = function(queryBuilder) {
        if (0 >= this.fields.length) {
          throw new Error("set() needs to be called");
        }
        return "(" + (this.fields.join(', ')) + ") " + (this.outputs.length !== 0 ? "OUTPUT " + (this.outputs.join(', ')) + " " : '') + "VALUES (" + (this._buildVals().join('), (')) + ")";
      };

      MssqlInsertFieldValueBlock.prototype.buildParam = function(queryBuilder) {
        var i, params, str, vals, _i, _ref5, _ref6;
        if (0 >= this.fields.length) {
          throw new Error("set() needs to be called");
        }
        str = "";
        _ref5 = this._buildValParams(), vals = _ref5.vals, params = _ref5.params;
        for (i = _i = 0, _ref6 = this.fields.length; 0 <= _ref6 ? _i < _ref6 : _i > _ref6; i = 0 <= _ref6 ? ++_i : --_i) {
          if ("" !== str) {
            str += ", ";
          }
          str += this.fields[i];
        }
        return {
          text: "(" + str + ") " + (this.outputs.length !== 0 ? "OUTPUT " + (this.outputs.join(', ')) + " " : '') + "VALUES (" + (vals.join('), (')) + ")",
          values: params
        };
      };

      return MssqlInsertFieldValueBlock;

    })(cls.InsertFieldValueBlock);
    cls.MssqlUpdateOutputBlock = (function(_super) {
      __extends(MssqlUpdateOutputBlock, _super);

      function MssqlUpdateOutputBlock(options) {
        MssqlUpdateOutputBlock.__super__.constructor.call(this, options);
        this._outputs = [];
      }

      MssqlUpdateOutputBlock.prototype.outputs = function(_outputs) {
        var alias, output, _results;
        _results = [];
        for (output in _outputs) {
          alias = _outputs[output];
          _results.push(this.output(output, alias));
        }
        return _results;
      };

      MssqlUpdateOutputBlock.prototype.output = function(output, alias) {
        if (alias == null) {
          alias = null;
        }
        output = this._sanitizeField(output);
        if (alias) {
          alias = this._sanitizeFieldAlias(alias);
        }
        return this._outputs.push({
          name: "INSERTED." + output,
          alias: alias
        });
      };

      MssqlUpdateOutputBlock.prototype.buildStr = function(queryBuilder) {
        var output, outputs, _i, _len, _ref5;
        outputs = "";
        if (this._outputs.length > 0) {
          _ref5 = this._outputs;
          for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
            output = _ref5[_i];
            if ("" !== outputs) {
              outputs += ", ";
            }
            outputs += output.name;
            if (output.alias) {
              outputs += " AS " + output.alias;
            }
          }
          outputs = "OUTPUT " + outputs;
        }
        return outputs;
      };

      return MssqlUpdateOutputBlock;

    })(cls.Block);
    cls.Select = (function(_super) {
      __extends(Select, _super);

      function Select(options, blocks) {
        var limitOffsetTopBlock;
        if (blocks == null) {
          blocks = null;
        }
        limitOffsetTopBlock = new cls.MssqlLimitOffsetTopBlock(options);
        blocks || (blocks = [
          new cls.StringBlock(options, 'SELECT'), new cls.DistinctBlock(options), limitOffsetTopBlock.TOP(options), new cls.GetFieldBlock(options), new cls.FromTableBlock(_extend({}, options, {
            allowNested: true
          })), new cls.JoinBlock(_extend({}, options, {
            allowNested: true
          })), new cls.WhereBlock(options), new cls.GroupByBlock(options), new cls.OrderByBlock(options), limitOffsetTopBlock.OFFSET(options), limitOffsetTopBlock.LIMIT(options)
        ]);
        Select.__super__.constructor.call(this, options, blocks);
      }

      Select.prototype.isNestable = function() {
        return true;
      };

      return Select;

    })(cls.QueryBuilder);
    cls.Update = (function(_super) {
      __extends(Update, _super);

      function Update(options, blocks) {
        if (blocks == null) {
          blocks = null;
        }
        blocks || (blocks = [new cls.StringBlock(options, 'UPDATE'), new cls.MssqlUpdateTopBlock(options), new cls.UpdateTableBlock(options), new cls.SetFieldBlock(options), new cls.MssqlUpdateOutputBlock(options), new cls.WhereBlock(options)]);
        Update.__super__.constructor.call(this, options, blocks);
      }

      return Update;

    })(cls.QueryBuilder);
    cls.Delete = (function(_super) {
      __extends(Delete, _super);

      function Delete(options, blocks) {
        if (blocks == null) {
          blocks = null;
        }
        blocks || (blocks = [
          new cls.StringBlock(options, 'DELETE'), new cls.FromTableBlock(_extend({}, options, {
            singleTable: true
          })), new cls.JoinBlock(options), new cls.WhereBlock(options), new cls.OrderByBlock(options), new cls.LimitBlock(options)
        ]);
        Delete.__super__.constructor.call(this, options, blocks);
      }

      return Delete;

    })(cls.QueryBuilder);
    return cls.Insert = (function(_super) {
      __extends(Insert, _super);

      function Insert(options, blocks) {
        if (blocks == null) {
          blocks = null;
        }
        blocks || (blocks = [new cls.StringBlock(options, 'INSERT'), new cls.IntoTableBlock(options), new cls.MssqlInsertFieldValueBlock(options)]);
        Insert.__super__.constructor.call(this, options, blocks);
      }

      return Insert;

    })(cls.QueryBuilder);
  };

}).call(this);

},{}],5:[function(require,module,exports){
//     Underscore.js 1.7.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.7.0';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var createCallback = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  _.iteratee = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return createCallback(value, context, argCount);
    if (_.isObject(value)) return _.matches(value);
    return _.property(value);
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    if (obj == null) return obj;
    iteratee = createCallback(iteratee, context);
    var i, length = obj.length;
    if (length === +length) {
      for (i = 0; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    if (obj == null) return [];
    iteratee = _.iteratee(iteratee, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length),
        currentKey;
    for (var index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index = 0, currentKey;
    if (arguments.length < 3) {
      if (!length) throw new TypeError(reduceError);
      memo = obj[keys ? keys[index++] : index++];
    }
    for (; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== + obj.length && _.keys(obj),
        index = (keys || obj).length,
        currentKey;
    if (arguments.length < 3) {
      if (!index) throw new TypeError(reduceError);
      memo = obj[keys ? keys[--index] : --index];
    }
    while (index--) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    predicate = _.iteratee(predicate, context);
    _.some(obj, function(value, index, list) {
      if (predicate(value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    predicate = _.iteratee(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(_.iteratee(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    if (obj == null) return true;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    if (obj == null) return false;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (obj.length !== +obj.length) obj = _.values(obj);
    return _.indexOf(obj, target) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = obj && obj.length === +obj.length ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = low + high >>> 1;
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return obj.length === +obj.length ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = _.iteratee(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    for (var i = 0, length = input.length; i < length; i++) {
      var value = input[i];
      if (!_.isArray(value) && !_.isArguments(value)) {
        if (!strict) output.push(value);
      } else if (shallow) {
        push.apply(output, value);
      } else {
        flatten(value, shallow, strict, output);
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (array == null) return [];
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = _.iteratee(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i];
      if (isSorted) {
        if (!i || seen !== value) result.push(value);
        seen = value;
      } else if (iteratee) {
        var computed = iteratee(value, i, array);
        if (_.indexOf(seen, computed) < 0) {
          seen.push(computed);
          result.push(value);
        }
      } else if (_.indexOf(result, value) < 0) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true, []));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    if (array == null) return [];
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = array.length; i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(slice.call(arguments, 1), true, true, []);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function(array) {
    if (array == null) return [];
    var length = _.max(arguments, 'length').length;
    var results = Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var idx = array.length;
    if (typeof from == 'number') {
      idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
    }
    while (--idx >= 0) if (array[idx] === item) return idx;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var Ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    args = slice.call(arguments, 2);
    bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      Ctor.prototype = func.prototype;
      var self = new Ctor;
      Ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (_.isObject(result)) return result;
      return self;
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = hasher ? hasher.apply(this, arguments) : key;
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last > 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed before being called N times.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      } else {
        func = null;
      }
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    if (!_.isObject(obj)) return obj;
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
      source = arguments[i];
      for (prop in source) {
        if (hasOwnProperty.call(source, prop)) {
            obj[prop] = source[prop];
        }
      }
    }
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj, iteratee, context) {
    var result = {}, key;
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      iteratee = createCallback(iteratee, context);
      for (key in obj) {
        var value = obj[key];
        if (iteratee(value, key, obj)) result[key] = value;
      }
    } else {
      var keys = concat.apply([], slice.call(arguments, 1));
      obj = new Object(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        if (key in obj) result[key] = obj[key];
      }
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(concat.apply([], slice.call(arguments, 1)), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    if (!_.isObject(obj)) return obj;
    for (var i = 1, length = arguments.length; i < length; i++) {
      var source = arguments[i];
      for (var prop in source) {
        if (obj[prop] === void 0) obj[prop] = source[prop];
      }
    }
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (
      aCtor !== bCtor &&
      // Handle Object.create(x) cases
      'constructor' in a && 'constructor' in b &&
      !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
        _.isFunction(bCtor) && bCtor instanceof bCtor)
    ) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size, result;
    // Recursively compare objects and arrays.
    if (className === '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size === b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      size = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      result = _.keys(b).length === size;
      if (result) {
        while (size--) {
          // Deep compare each member
          key = keys[size];
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around an IE 11 bug.
  if (typeof /./ !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    var pairs = _.pairs(attrs), length = pairs.length;
    return function(obj) {
      if (obj == null) return !length;
      obj = new Object(obj);
      for (var i = 0; i < length; i++) {
        var pair = pairs[i], key = pair[0];
        if (pair[1] !== obj[key] || !(key in obj)) return false;
      }
      return true;
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = createCallback(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? object[property]() : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],6:[function(require,module,exports){
angular.module('ngCordova.plugins.sqlite', [])

    .factory('$cordovaSQLite', ['$q', function ($q) {

        return  {
            openDB: function (dbName) {
                return  window.sqlitePlugin.openDatabase({name: dbName});
            },


            openDBBackground: function (dbName) {
                return window.sqlitePlugin.openDatabase({name: dbName, bgType: 1});
            },

            execute: function (db, query, binding) {
                q = $q.defer();
                db.transaction(function (tx) {
                    tx.executeSql(query, binding, function (tx, result) {
                            q.resolve(result);
                        },
                        //function (transaction, error) {
                        function (tx, error) {
                            q.reject(error);
                        });
                });
                return q.promise;
            },

            nestedExecute: function (db, query1, query2, binding1, binding2) {
                q = $q.defer();

                db.transaction(function (tx) {
                        tx.executeSql(query1, binding1, function (tx, result) {
                            q.resolve(result);
                            tx.executeSql(query2, binding2, function (tx, res) {
                                q.resolve(res);
                            })
                        })
                    },
                    //function (transaction, error) {
                    function (tx, error) {
                        q.reject(error);
                    });

                return q.promise;
            }

            // more methods here
        }
    }]);

},{}],7:[function(require,module,exports){

/*
require 'restangular'

require './common/factories/cordovaSQLite'

require './db/DBSchemas'

require './services/AggregationModel'
require './services/AggregationRest'
require './services/Database'
require './services/ProviderRestangular'
require './services/SideMenu'
 */
var TestApp;

require('underscore');

require('restangular');

TestApp = (function() {
  function TestApp() {
    return ['restangular', 'ngCordova.plugins.sqlite'];
  }

  return TestApp;

})();

module.exports = TestApp;

angular.module('shared_view.module', TestApp());



},{"restangular":3,"underscore":5}],8:[function(require,module,exports){
var DBSchemas;

DBSchemas = (function() {
  function DBSchemas() {
    return {
      create: {
        notes: 'CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY, title TEXT, content TEXT, createTime DATETIME, modifyTime DATETIME, state INTEGER, tags TEXT, color INTEGER DEFAULT -1, selected INTEGER DEFAULT -1)',
        notes_attach: 'CREATE TABLE IF NOT EXISTS notes_attach(id INTEGER PRIMARY KEY, url TEXT, noteId INTEGER, createTime DATETIME)',
        notes_tag: 'CREATE TABLE IF NOT EXISTS notes_tag(id INTEGER PRIMARY KEY, name TEXT, createTime DATETIME, latestTime DATETIME, useCount INTEGER, pinyin TEXT, fpinyin TEXT, selected INTEGER DEFAULT -1)',
        notes_tag_set: 'CREATE TABLE IF NOT EXISTS notes_tag_set(tagId INTEGER, noteId INTEGER, FOREIGN KEY(tagId) REFERENCES notes_tag(id), FOREIGN KEY(noteId) REFERENCES notes(id))',
        rss_list: 'CREATE TABLE IF NOT EXISTS rss_list(id INTEGER PRIMARY KEY, title TEXT, link TEXT, desc TEXT, image TEXT, url TEXT, createTime DATETIME, updateTime DATETIME)',
        rss_items: 'CREATE TABLE IF NOT EXISTS rss_items(id INTEGER PRIMARY KEY, rssId INTEGER, title TEXT, link TEXT, category TEXT, description TEXT, pubDate DATETIME, author TEXT, comments TEXT, source TEXT, FOREIGN KEY(rssId) REFERENCES rss_list(id))',
        subscripts: 'CREATE TABLE IF NOT EXISTS subscripts(rssId INTEGER, createTime DATETIME, FOREIGN KEY(rssId) REFERENCES rss_list(id))'
      },
      insert: {
        notes: 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(:title, :content, :createTime, :modifyTime, 1, :tags)'
      },
      select: {
        notes: 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(:title, :content, :createTime, :modifyTime, 1, :tags)'
      }

      /*
      create: [
        {
          notes: 'CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY, title TEXT, content TEXT, createTime DATETIME, modifyTime DATETIME, state INTEGER, tags TEXT, color INTEGER DEFAULT -1, selected INTEGER DEFAULT -1)'
        },
      ],
      
      insert: [
        {
          notes: 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(:title, :content, :createTime, :modifyTime, 1, :tags)'
        },
      ],
      
      select: [
        {
          notes: 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(:title, :content, :createTime, :modifyTime, 1, :tags)'
        },
      ]
       */
    };
  }

  return DBSchemas;

})();

module.exports = DBSchemas;

angular.module('shared_view.module').constant('DBSCHEMAS', DBSchemas());



},{}],9:[function(require,module,exports){
var AggregationModel, async, squel;

async = require('async');

squel = require('squel');

AggregationModel = (function() {
  function AggregationModel(DBSCHEMAS, databaseService) {
    var DefaultChars, Digits, dataLoaded, dealGetLatestPosts, dealGetPostsWithTag, dealGetTags, items, process, process2, randomString, resultTransactions, _color, _keyword, _pageSize, _postInfo, _provider, _tagInfo;
    this.globalTags = array();
    resultTransactions = array();
    items = {};
    dataLoaded = false;
    this.currentNode = void 0;
    this.state = 'initial';
    this.processResultTransactions = function(filterOn, callback) {
      if (databaseService.db === void 0) {
        databaseService.connect();
      }

      /*
      async.series([
      
          dealGetTags
          process
      
           *dealGetTags(callback)
           *process(filterOn, callback)
        ],
        callback(items))
       */

      /*
      async.series [
        (cb) -> dealGetTags cb
        (cb) -> process cb
      ], callback
       */

      /*
      async.series [
        (callback) ->
      
          dealGetTags callback
      
           * do some stuff ...
           *callback null, "one"
        (callback) ->
      
          process callback
      
           * do some more stuff ...
           *callback null, "two"
      
       * optional callback
      ], (err, results) ->
      
        if err
          console.log err
      
        if results
          console.log results
       */
      dealGetTags(callback);
      return items;
    };
    dealGetTags = function(callback) {
      var params2, query;
      resultTransactions = array();
      items = {};
      params2 = ["facebook"];
      query = squel.select().from(squel.select().from('notes_tag'), 't').field('t.*').from(squel.select().from('notes_tag_set'), 'ts').field('ts.noteId', 'postCount').from(squel.select().from('notes'), 'n').where(squel.expr().and("t.id = ts.tagId").and("ts.noteId = n.id").and("n.content = 'facebook'").and("n.state <> 0")).group("ts.tagId").order("useCount", false).order("latestTime", false).limit(100).toString();
      return databaseService.db.transaction(function(tx) {
        return tx.executeSql(query, [], (function(tx, result) {
          var i, _i, _ref;
          for (i = _i = 0, _ref = result.rows.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            resultTransactions.push(result.rows.item(i));
          }
          console.log("dealGetTags");
          return process(callback);
        }), function(tx, error) {
          return console.log(error);
        });
      });
    };
    process = function(callback) {
      debugger;
      var firstLetter, i;
      firstLetter = void 0;
      i = 0;
      while (i < resultTransactions.length) {
        firstLetter = resultTransactions[i]['name'].substring(0, 1).toUpperCase();
        if (!items[firstLetter]) {
          items[firstLetter] = [];
        }
        items[firstLetter].push(resultTransactions[i]);
        i++;
      }
      if (callback) {
        return callback(items);
      }
    };
    process2 = function(callback) {
      var firstLetter, i;
      firstLetter = void 0;
      i = 0;
      while (i < resultTransactions.length) {
        firstLetter = resultTransactions[i]['title'].substring(0, 1).toUpperCase();
        console.log(firstLetter);
        if (!items[firstLetter]) {
          items[firstLetter] = [];
        }
        items[firstLetter].push(resultTransactions[i]);
        i++;
      }

      /*
      for value, index in items
        element = JSON.parse(value);
       */

      /*
      j = 0
      while j < items.length
      
        console.log items[j]['firstLetter']
      
        items[j]['firstLetter'] = 'K'
      
        console.log items[j]['firstLetter']
       */

      /*
      for i in [0 ... items.length]
        items[i] result.rows.item(i)
      
      items[firstLetter]
      firstLetter = firstLetter + rs.random(20,'ABCD0987');   # ABCD0987
       */
      if (callback) {
        return callback(items);
      }
    };
    this.currentItems = {};
    this.selectedItem;
    _tagInfo = void 0;
    _postInfo = void 0;
    _pageSize = void 0;
    _provider = void 0;
    this.initGetPostsWithTagToken = function(tag, provider, filterOn, callback) {
      resultTransactions = array();
      items = {};
      _tagInfo = tag;
      _provider = provider;
      if (databaseService.db === void 0) {
        databaseService.connect();
      }

      /*
      async.series([
          dealGetPostsWithTag()
      
           *process(filterOn)
          process2(filterOn)
        ],
        callback(items))
       */
      dealGetPostsWithTag(callback);
      return items;
    };
    dealGetPostsWithTag = function(callback) {
      var expr, query;
      resultTransactions = void 0;
      resultTransactions = array();
      expr = squel.expr();

      /*
      if _postInfo
      
        expr = expr.and("modifyTime < ?", squel.select().field('modifyTime').from('notes').where("id = ?", _postInfo.id))
       */

      /*
      condictionString = ""
      
      if (_postInfo != null)
      
         *params[":id"] = _postInfo.id;
        condictionString += " AND modifyTime < (SELECT modifyTime FROM notes WHERE id=:id)";
      
       *"SELECT id,title,modifyTime,content,color,selected FROM notes WHERE state = 1 AND content = :contentId AND ';'||tags||';' like '%;'||:keyword||';%'" + condictionString + " ORDER BY title ASC LIMIT 0," + _pageSize.toString(), params
       */
      query = squel.select().field('id').field('title').field('modifyTime').field('content').field('color').field('selected').from('notes').where('tags LIKE ?', '%' + _tagInfo.name + '%').toParam();
      return databaseService.db.transaction(function(tx) {
        return tx.executeSql(query.text, query.values, (function(tx, result) {
          var i, _i, _ref;
          for (i = _i = 0, _ref = result.rows.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            resultTransactions.push(result.rows.item(i));
          }
          console.log("dealGetPostsWithTag");
          return process2(callback);
        }), function(tx, error) {
          return console.log(error);
        });
      });
    };
    _keyword = void 0;
    _color = -1;
    this.initGetLatestPostsToken = function(lastPost, pageSize, keyword, color, filterOn, callback) {
      _postInfo = lastPost;
      _pageSize = pageSize;
      _keyword = keyword;
      _color = color;
      if (databaseService.db === void 0) {
        databaseService.connect();
      }
      async.series([dealGetLatestPosts(), process(filterOn)], callback(items));
      return items;
    };
    dealGetLatestPosts = function() {
      var expr, query;
      expr = squel.expr();
      if (_keyword) {
        expr = expr.and("title like = ?", _keyword).or("content like = ?", _keyword).or("tags like = ?", _keyword);
      }
      if (_color !== 0xffffff && _color >= 0) {
        expr = expr.and("color = ?", _color);
      }
      if (_postInfo !== null) {
        expr.and("modifyTime < ?", squel.select().field('modifyTime').from('notes').where("id = ?", _postInfo.id));
      }
      query = squel.select().from('notes').field('id').field('title').field('modifyTime').field('color').field('selected').where(expr.and("state = '1'")).order("title", true).limit(0, 100).toString();
      return databaseService.db.transaction(function(tx) {
        return tx.executeSql(query, [], (function(tx, result) {
          var i, _i, _ref;
          for (i = _i = 0, _ref = result.rows.length; _i <= _ref; i = _i += 1) {
            console.log(result.rows.item(i));
          }
          console.log("result.rows.length");
          console.log(result.rows.length);
          return console.log("dealGetUsedTags");
        }), function(tx, error) {
          return console.log(error);
        });
      });
    };
    this.getFirst = function(number) {
      var query;
      query = squel.select().from('notes').limit(number).toString();
      return databaseService.db.transaction(function(tx) {
        return tx.executeSql(query, [], (function(tx, result) {
          var i, output, _i, _ref;
          output = [];
          for (i = _i = 0, _ref = result.rows.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            output.push(result.rows.item(i));
          }
          console.log("getFirst");
          return output;
        }), function(tx, error) {
          return console.log(error);
        });
      });
    };
    this.getAllByName = function(name) {
      var query;
      query = squel.select().from('notes').where('tags LIKE ?', '%' + name.toLowerCase() + '%').order("name", true).toParam();
      return databaseService.db.transaction(function(tx) {
        return tx.executeSql(query.text, query.values, (function(tx, result) {
          var i, output, _i, _ref;
          output = [];
          for (i = _i = 0, _ref = result.rows.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            output.push(result.rows.item(i));
          }
          console.log("getAllByName");
          return output;
        }), function(tx, error) {
          return console.log(error);
        });
      });
    };
    Digits = '0123456789';
    DefaultChars = Digits + 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
    randomString = function(length, chars) {
      var chosen;
      if (length == null) {
        length = 32;
      }
      if (chars == null) {
        chars = DefaultChars;
      }
      chosen = [];
      while (chosen.length < length) {
        chosen.push(chars[Math.floor(Math.random() * chars.length)]);
      }
      return chosen.join('');
    };
  }

  return AggregationModel;

})();

module.exports = AggregationModel;

angular.module('shared_view.module').service('aggregationModelService', ['DBSCHEMAS', 'databaseService', AggregationModel]);



},{"async":1,"squel":4}],10:[function(require,module,exports){
var AggregationRest, async, squel;

async = require('async');

squel = require('squel');

AggregationRest = (function() {
  function AggregationRest(Restangular, aggregationModelService, $cordovaSQLite, DBSCHEMAS, databaseService) {
    var dbCheck, dbCheckIntervalId, dealGetLatestPosts, dealGetPostInfo, dealGetPostsWithTag, dealGetUsedTags, dealSetPostColor, dealSetPostState, existsTagResultHandler, existsTagResultHandler_, expectedDBCallbacks, failureInsert, importFriends, initGetLatestPostsToken, initGetPostInfoToken, initGetPostsWithTagToken, initGetTagsToken, initGetUsedTagsToken, initMaskPostColor, initMaskPostState, lastInsertRowID, preProcess, preProcess2, preProcess_, successInsert, updateUsedTags, updateUsedTagsCallAbsoluteCounter, updateUsedTagsCallRelativeCounter, userData, _color, _keyword, _pageNo, _pageSize, _postInfo;
    userData = void 0;
    this.getTags__ = function() {

      /*
      
      var offset:int = (_pageNo - 1) * 100;
      
      			//var token:SqliteDatabaseToken = _facade.documentDatabase.createCommandToken("SELECT t.*,COUNT(ts.noteId) as postCount FROM notes_tag t,notes_tag_set ts,notes n WHERE t.id = ts.tagId AND ts.noteId = n.id AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT " + offset + ",30");
      
      			//working
      			//var token:SqliteDatabaseToken = _facade.documentDatabase.createCommandToken("SELECT t.*,COUNT(ts.noteId) as postCount FROM notes_tag t,notes_tag_set ts,notes n WHERE t.id = ts.tagId AND ts.noteId = n.id AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT " + offset + ",100");
      
      			var params:Dictionary = new Dictionary();
      			params[":contentId"] = _provider;
      			var token:SqliteDatabaseToken = _facade.documentDatabase.createCommandToken("SELECT t.*,COUNT(ts.noteId) as postCount FROM notes_tag t,notes_tag_set ts,notes n WHERE t.id = ts.tagId AND ts.noteId = n.id AND n.content = :contentId AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT 100", params);
       */
      var params2;
      if (databaseService.db === void 0) {
        databaseService.connect();
      }
      params2 = ["facebook"];
      return $cordovaSQLite.execute(databaseService.db, 'SELECT * FROM notes_tag', []).then(function(data) {
        var i, result;
        i = 0;
        while (i < data.rows.length) {
          result = data.rows.item(i);
          console.log(result);
          i++;
        }
      });
    };
    this.imported = false;
    this.getUsers = function(type, callback) {
      window.localStorage.setItem("state", "first");
      if (databaseService.db === void 0) {
        databaseService.connect();
      }
      return Restangular.one('friends').customPOST(JSON.stringify({}), "", {}, {
        "Content-Type": "application/json",
        "providerId": "facebook",
        "apikey": "markus.gritsch.5"
      }).then(function(result) {
        return async.forEachSeries(result.socialFriends, preProcess, function(err) {
          console.log("Error in preProcess" != null);
          if (callback) {
            return callback();
          }
        });
      });
    };
    preProcess = function(socialFriend, callback) {
      var account, children, currentEntity, element, email, firstName, groupList, groupListLen, groupListLenght, j, lastName, name, tags;
      name = "";
      firstName = "";
      lastName = "";
      email = "";
      groupList = null;
      if (socialFriend.fullName === void 0 || socialFriend.fullName === null) {
        name = "";
      } else {
        name = socialFriend.fullName.capitalize(true);
      }
      if (socialFriend.firstName === void 0 || socialFriend.firstName === null) {
        firstName = "";
      } else {
        firstName = socialFriend.firstName.capitalize(true);
      }
      if (socialFriend.lastName === void 0 || socialFriend.lastName === null) {
        lastName = "";
      } else {
        lastName = socialFriend.lastName.capitalize(true);
      }
      if (socialFriend.email === void 0 || socialFriend.email === null) {
        email = "";
      } else {
        email = socialFriend.email.capitalize(true);
      }
      if (socialFriend.groupList === void 0 || socialFriend.groupList === null) {
        groupList = array();
      } else {
        groupList = array(socialFriend.groupList);
      }
      account = {
        name: name,
        firstName: firstName,
        lastName: lastName,
        email: email,
        groupList: groupList,
        type: "1",
        startBalance: "1",
        insertDate: "1",
        startDate: "1",
        description: "1",
        synchDate: "1",
        visible: "1",
        importColumnsOrder: "1",
        importDateFormat: "1",
        uid: "1",
        bankAccountUID: "1",
        transferToBankAccountUID: "2",
        transferAmount: "10",
        insertDate: new Date(),
        date: new Date(),
        description: "",
        tagColor: "",
        amount: 5.56789,
        totalAmount: 5.56789,
        category: "Social Networks",
        entity: "Counter 0",
        item: {
          categoriesInTransaction: {
            categoryUID: "100",
            transactionUID: "101",
            amount: 5.56789,
            synchDate: new Date(),
            deleted: false
          }
        }
      };
      if (account.name === "") {
        if (account.firstName !== "" && account.lastName !== "") {
          account.name = account.firstName.concat(" ").concat(account.lastName);
        }
      }
      if (account.name === "") {
        account.name = account.email;
      }
      if (account.name === "") {

      } else {
        if (account.groupList.length === 0) {
          tags = null;
          tags = "";
          tags = tags.concat("Unorganized");
          currentEntity = null;
          aggregationModelService.globalTags.each(function(entity) {
            if (entity.name === "Unorganized") {
              currentEntity = entity;
            }
          });
          if (currentEntity == null) {
            children = array();
            children.push(account);
            element = {
              id: aggregationModelService.globalTags.length,
              parent: null,
              name: "Unorganized",
              canSelect: true,
              children: children,
              insertDate: new Date(),
              date: new Date(),
              amount: 5.56789,
              totalAmount: 5.56789,
              item: {
                insertDate: new Date(),
                date: new Date()
              }
            };
            aggregationModelService.globalTags.push(element);
          } else {
            currentEntity.children.push(account);
          }
          account.tags = tags;
          importFriends(account, callback);
        } else {
          tags = null;
          tags = "";
          groupListLenght = account.groupList.length;
          j = 0;
          groupListLen = groupListLenght;
          while (j < groupListLen) {
            tags = tags.concat(account.groupList[j]);
            currentEntity = null;
            aggregationModelService.globalTags.each(function(entity) {
              if (entity.name === account.groupList[j]) {
                currentEntity = entity;
              }
            });
            if (currentEntity == null) {
              children = array();
              children.push(account);
              element = {
                id: aggregationModelService.globalTags.length,
                parent: null,
                name: account.groupList[j],
                canSelect: true,
                children: children,
                insertDate: new Date(),
                date: new Date(),
                amount: 5.56789,
                totalAmount: 5.56789,
                item: {
                  insertDate: new Date(),
                  date: new Date()
                }
              };
              aggregationModelService.globalTags.push(element);
            } else {
              currentEntity.children.push(account);
            }
            if (j < (groupListLenght - 1)) {
              tags = tags.concat(";");
            }
            j++;
          }
          account.tags = tags;
          importFriends(account, callback);
        }
      }
      return aggregationModelService.globalTags.sort("name", "ascending");
    };
    preProcess_ = function(socialFriend, callback) {

      /*
      fs.exists dirName, (exists) ->
        unless exists
          callback() if callback
          return
        fs.remove dirName, (error) ->
          callback() if callback
       */
      var i, _i, _ref, _tags;
      console.log(socialFriend);
      if (socialFriend.groupList.length === 0) {
        _tags = null;
        _tags = "";
        _tags = _tags.concat("Unorganized");
        socialFriend.tags = _tags;
        return importFriends(socialFriend, callback);
      } else {
        _tags = null;
        _tags = "";
        for (i = _i = 0, _ref = socialFriend.groupList.length; _i <= _ref; i = _i += 1) {
          _tags = _tags.concat(socialFriend.groupList[i]);
          if (i < (socialFriend.groupList.length - 1)) {
            _tags = _tags.concat(";");
          }
        }
        socialFriend.tags = _tags;
        return importFriends(socialFriend, callback);
      }
    };
    preProcess2 = function(globalTag, callback) {
      var query;
      console.log("globalTag is");
      query = squel.select().from("notes_tag").where('name = "' + globalTag.name + '"').toString();
      $cordovaSQLite.execute(databaseService.db, query, []).then(function(data) {
        console.log("data.insertId is");
        return console.log(data.insertId);
      });
      userData = globalTag;
      if (callback) {
        return callback();
      }
    };
    this.getUsersFromLocalDB = function(callback) {

      /*
      async.forEachSeries socialFriends, cleanDir, ->
        callback() if callback
       */
      if (databaseService.db === void 0) {
        databaseService.connect();
      }
      return $cordovaSQLite.execute(databaseService.db, 'SELECT * FROM notes', []).then(function(data) {
        var i, result;
        i = 0;
        while (i < data.rows.length) {
          result = data.rows.item(i);
          console.log(result);
          i++;
        }
      });
    };
    lastInsertRowID = -1;

    /*
    connect = ->
      devicePath = if $cordovaDevice.getPlatform() == "iOS" then steroids.app.path else steroids.app.absolutePath
      dbPath =  devicePath + "/data/database";
       *db = $cordovaSQLite.openDB(dbPath)
      db = $cordovaSQLite.openDBBackground(dbPath)
    
      initializeDatabase()
    
    initializeDatabase = ->
      $cordovaSQLite.execute(db, DBSCHEMAS.create.notes, [])
    
      $cordovaSQLite.execute(db, DBSCHEMAS.create.notes_attach, [])
    
      $cordovaSQLite.execute(db, DBSCHEMAS.create.notes_tag, [])
    
      $cordovaSQLite.execute(db, DBSCHEMAS.create.notes_tag_set, [])
    
      $cordovaSQLite.execute(db, DBSCHEMAS.create.rss_list, [])
      $cordovaSQLite.execute(db, DBSCHEMAS.create.rss_items, [])
      $cordovaSQLite.execute(db, DBSCHEMAS.create.subscripts, [])
     */
    expectedDBCallbacks = 0;
    dbCheckIntervalId = 0;

    /*
    importFriends = (account, index, count) ->
    
      date = new Date();
      params2 = [account.name, "facebook", date.toUTCString(), date.toUTCString(), 1, account.tags]
    
      insert = 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(?, ?, ?, ?, ?, ?)'
    
      db.transaction (tx) ->
        tx.executeSql insert, params2, successInsert, failureInsert
    
         *tx.executeSql "INSERT INTO mytable (thing) VALUES (" + i + ")", [], successInsert, failureInsert
        expectedDBCallbacks++
     */

    /*
    importFriends = (account, index, count) ->
    
      date = new Date();
      params1 = [account.name, "facebook", date.toUTCString(), date.toUTCString(), 1, account.tags]
    
      query1 = 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(?, ?, ?, ?, ?, ?)'
    
      params2 = undefined
    
      if aggregationModelService.globalTags != null && aggregationModelService.globalTags.length > 0
    
        aggregationModelService.globalTags.each (tagName) ->
    
          params2 = [tagName.name]
    
          userData = tagName;
    
      $cordovaSQLite.nestedExecute(db, query1, 'SELECT * FROM notes_tag WHERE name = ?', params1, params2).then (data) ->
    
        existsTagResultHandler data.rows
     */
    successInsert = function(tx, result) {
      expectedDBCallbacks--;
      updateUsedTags();
    };
    failureInsert = function(tx, error) {
      expectedDBCallbacks--;
      console.log("failureInsert");
    };
    dbCheck = function() {
      if (expectedDBCallbacks === 0) {
        clearInterval(dbCheckIntervalId);
        allDone();
      }
    };

    /*
    importFriends = (account, index, count) ->
    
      date = new Date();
      params2 = [account.name, "facebook", date.toUTCString(), date.toUTCString(), 1, account.tags]
    
      insert = 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(?, ?, ?, ?, ?, ?)'
    
    
      db.transaction (tx) ->
        tx.executeSql insert, params2, ((tx, result) ->
    
          lastInsertRowID = data.insertId
    
          updateUsedTags()
    
          return
    
        ), (tx, error) ->
    
          console.log "error in transaction"
    
          return
     */
    importFriends = function(account, callback) {
      var date, insert, params2, query;
      date = new Date();
      params2 = [account.name, "facebook", date.toUTCString(), date.toUTCString(), 1, account.tags];
      insert = 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(?, ?, ?, ?, ?, ?)';
      query = squel.insert().into("notes").set("title", account.name).set("content", "facebook").set("createTime", date.toUTCString()).set("modifyTime", date.toUTCString()).set("state", 1).set("tags", account.tags).toParam();
      $cordovaSQLite.execute(databaseService.db, query.text, query.values).then(function(data) {
        lastInsertRowID = data.insertId;
        console.log("lastInsertRowID is");
        console.log(lastInsertRowID);
        updateUsedTags(callback);

        /*
        var post:Object = new Object();
        post.id = _id;
        post.title = _title;
        post.modifyTime = new Date();
        post.tags = _tags;
         */
      });
    };
    updateUsedTagsCallRelativeCounter = 0;
    updateUsedTagsCallAbsoluteCounter = 0;
    updateUsedTags = function(callback) {
      var pkey;
      if (aggregationModelService.globalTags !== null && aggregationModelService.globalTags.length > 0) {

        /*
        async.forEachSeries aggregationModelService.globalTags, preProcess2, (err) ->
        
          console.log "Error in preProcess2"?
        
          callback() if callback
         */
        pkey = "name";
        async.forEachSeries(aggregationModelService.globalTags, function(globalTag, callback) {
          var params2, query, queryLastRowID;
          params2 = [globalTag.name];
          query = "SELECT * FROM notes_tag WHERE name = ?";
          queryLastRowID = "SELECT last_insert_rowid() FROM notes_tag";

          /*
          $cordovaSQLite.execute(db, queryLastRowID, []).then (data) ->
            console.log "Last Row ID:"
            console.log data
           */
          databaseService.db.transaction(function(tx) {
            return tx.executeSql(query, params2, (function(tx, result) {
              console.log(result);
              return existsTagResultHandler(result.rows, callback);
            }), function(tx, error) {
              return console.log(error);
            });
          });

          /*
           *$cordovaSQLite.execute(db, query, []).then (data) ->
          $cordovaSQLite.execute(db, query, params2).then (data) ->
           *$cordovaSQLite.execute(db, query.text, query.values).then (data) ->
          
             *console.log("data.insertId is");
             *console.log(data.insertId);
          
            console.log("data.insertId is");
            console.log data
          
            i = 0
          
            while i < data.rows.length
               *$scope.result = data.rows.item(i)
              result = data.rows.item(i)
          
               *console.log $scope.result
              console.log result
          
              i++
          
             *existsTagResultHandler data.rows, callback
            existsTagResultHandler data, callback
           */
          userData = globalTag.name;

          /*
          console.log 'updateUsedTagsCallRelativeCounter is'
          console.log updateUsedTagsCallRelativeCounter
          
          updateUsedTagsCallAbsoluteCounter++
          
          console.log 'updateUsedTagsCallAbsoluteCounter is'
          console.log updateUsedTagsCallAbsoluteCounter
          
          callback() if callback
           */
        }, function(err) {
          console.log("Error in inline preProcess2" != null);
          if (callback) {
            return callback();
          }
        });

        /*
        aggregationModelService.globalTags.each (tagName) ->
        
           *params = []
          params = new dictionary()
          params[":name"] = tagName.name
        
          params2 = [tagName.name]
        
           *$cordovaSQLite.execute(db, DBSCHEMAS.select.notes, []).then (data) ->
           *$cordovaSQLite.execute(db, 'SELECT * FROM notes_tag WHERE name = :name', params).then (data) ->
        
           *query = squel.select().from("notes_tag").where("name = ?", tagName.name).toString()
          query = squel.select().from("notes_tag").where('name = "' + tagName.name + '"').toString()
        
           *$cordovaSQLite.execute(db, 'SELECT * FROM notes_tag WHERE name = ?', params2).then (data) ->
          $cordovaSQLite.execute(db, query, []).then (data) ->
        
            console.log("data.insertId is");
            console.log(data.insertId);
        
            existsTagResultHandler data.rows, callback
             *existsTagResultHandler(callback)
        
            return
        
        
          userData = tagName;
           *userData = tagName.name;
         */
      } else {
        console.log('updateUsedTagsCallRelativeCounter is');
        console.log(updateUsedTagsCallRelativeCounter);
        updateUsedTagsCallAbsoluteCounter++;
        console.log('updateUsedTagsCallAbsoluteCounter is');
        console.log(updateUsedTagsCallAbsoluteCounter);
        if (callback) {
          callback();
        }
      }
    };
    existsTagResultHandler_ = function(recordset, callback) {
      console.log("existsTagResultHandler called");
      if (callback) {
        callbackRoot();
      }
      return console.log("Callback from existsTagResultHandler");
    };
    existsTagResultHandler = function(recordset, callback) {
      var insert, params, params2, params22, query, query_, tagId, update, utc;
      console.log("existsTagResultHandler called");
      tagId = 0;
      if ((recordset != null) && recordset.length > 0) {
        console.log("before - existsTagResultHandler - notes_tag - update");
        tagId = recordset.item(0).id;
        console.log("tagId is:");
        console.log(tagId);
        params2 = [moment(new Date()).unix(), tagId];
        update = "UPDATE notes_tag SET latestTime = ? WHERE id = ?";
        utc = moment(new Date()).unix();
        query = squel.update().table('notes_tag').setFields({
          "useCount: useCount + 1": void 0
        }).set('latestTime', utc).where('id = "' + tagId + '"').toParam();

        /*
        $cordovaSQLite.execute(db, query.text, query.values).then (data) ->
        
          console.log("existsTagResultHandler - notes_tag - update");
        
          updateUsedTagsCallRelativeCounter++
        
          callback() if callback
        
           *return
         */
        console.log("before - existsTagResultHandler - notes_tag - update - before transaction");
        databaseService.db.transaction(function(tx) {
          return tx.executeSql(query.text, query.values, (function(tx, result) {
            console.log(result);
            updateUsedTagsCallRelativeCounter++;
            return console.log("existsTagResultHandler - notes_tag - update");
          }), function(tx, error) {
            return console.log(error);
          });
        });
      } else {
        console.log("before - existsTagResultHandler - notes_tag - insert");

        /*
        recordset = data.rows
        
        tagId = recordset[0].id;
        
        
        console.log "tagId is:"
        console.log tagId
         */
        params = [];
        params[":createTime"] = moment(new Date()).unix();
        params2 = [userData, moment(new Date()).unix(), moment(new Date()).unix(), 1, "", ""];
        insert = 'INSERT INTO notes_tag(name, createTime, latestTime, useCount, pinyin, fpinyin) VALUES(?, ?, ?, ?, ?, ?)';
        utc = moment(new Date()).unix();
        query_ = squel.insert().into("notes_tag").set("name", userData).set("createTime", "utc").set("latestTime", "utc").set("useCount", 1).set("pinyin", "").set("fpinyin", "").toParam();
        $cordovaSQLite.execute(databaseService.db, query_.text, query_.values).then(function(data) {
          console.log("existsTagResultHandler - notes_tag - insert");
          return updateUsedTagsCallRelativeCounter++;
        });
        tagId = lastInsertRowID;
      }
      params22 = [tagId, lastInsertRowID];
      insert = 'INSERT INTO notes_tag_set(tagId, noteId) VALUES(?, ?)';
      query = squel.insert().into("notes_tag_set").set("tagId", tagId).set("noteId", lastInsertRowID).toParam();
      $cordovaSQLite.execute(databaseService.db, query.text, query.values).then(function(data) {
        console.log("existsTagResultHandler - notes_tag_set - insert");
        console.log('updateUsedTagsCallRelativeCounter is');
        console.log(updateUsedTagsCallRelativeCounter);
        updateUsedTagsCallAbsoluteCounter++;
        console.log('updateUsedTagsCallAbsoluteCounter is');
        console.log(updateUsedTagsCallAbsoluteCounter);
        if (callback) {
          callback();
        }
      });
    };

    /*
    private function dealGetTags():void
    		{
    			//var offset:int = (_pageNo - 1) * 30;
    			var offset:int = (_pageNo - 1) * 100;
    
    			//var token:SqliteDatabaseToken = _facade.documentDatabase.createCommandToken("SELECT t.*,COUNT(ts.noteId) as postCount FROM notes_tag t,notes_tag_set ts,notes n WHERE t.id = ts.tagId AND ts.noteId = n.id AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT " + offset + ",30");
    
    			//working
    			//var token:SqliteDatabaseToken = _facade.documentDatabase.createCommandToken("SELECT t.*,COUNT(ts.noteId) as postCount FROM notes_tag t,notes_tag_set ts,notes n WHERE t.id = ts.tagId AND ts.noteId = n.id AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT " + offset + ",100");
    
    			var params:Dictionary = new Dictionary();
    			params[":contentId"] = _provider;
    			var token:SqliteDatabaseToken = _facade.documentDatabase.createCommandToken("SELECT t.*,COUNT(ts.noteId) as postCount FROM notes_tag t,notes_tag_set ts,notes n WHERE t.id = ts.tagId AND ts.noteId = n.id AND n.content = :contentId AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT 100", params);
    
    			token.addEventListener(SqliteDatabaseEvent.RESULT, getTagsResultHandler);
    			token.addEventListener(SqliteDatabaseEvent.ERROR, getTagsErrorHandler);
    			token.start();
    		}
     */
    _pageNo = -1;
    _pageSize = -1;
    initGetTagsToken = function(pageNo) {
      return _pageNo = -1;
    };
    this.getTags = function() {
      var params2, query;
      params2 = ["facebook"];
      query = squel.select().from(squel.select().from('notes_tag'), 't').field('t.*').from(squel.select().from('notes_tag_set'), 'ts').field('ts.noteId', 'postCount').from(squel.select().from('notes'), 'n').where(squel.expr().and("t.id = ts.tagId").and("ts.noteId = n.id").and("n.content = 'facebook'").and("n.state <> 0")).group("ts.tagId").order("useCount", false).order("latestTime", false).limit(100).toString();
      return databaseService.db.transaction(function(tx) {
        return tx.executeSql(query, [], (function(tx, result) {
          var i, _i, _ref;
          for (i = _i = 0, _ref = result.rows.length; _i <= _ref; i = _i += 1) {
            console.log(result.rows.item(i));
          }
          console.log("result.rows.length");
          console.log(result.rows.length);
          console.log("dealGetTags");
        }), function(tx, error) {
          console.log(error);
        });
      });
    };

    /*
    public function initGetPostsWithTagToken(tag:Object, lastPost:Object = null, pageSize:int = 100, provider:String = null):void
    		{
    			_tagInfo = tag;
    			_postInfo = lastPost;
    			_pageSize = pageSize;
    
    			_provider = provider;
    
    			_dealFunc = dealGetPostsWithTag;
    		}
     */
    initGetPostsWithTagToken = function(tag, lastPost, pageSize, provider) {
      var _postInfo, _provider, _tagInfo;
      _tagInfo = tag;
      _postInfo = lastPost;
      _pageSize = pageSize;
      return _provider = provider;
    };
    dealGetPostsWithTag = function() {
      var condictionString, query;
      condictionString = "";
      if (_postInfo !== null) {
        condictionString += " AND modifyTime < (SELECT modifyTime FROM notes WHERE id=:id)";
      }
      query = squel.select().from('notes').field('id').field('title').field('modifyTime').field('content').field('color').field('selected').where(squel.expr().and("state = '1'").and("content = 'facebook'").and("';'||tags||';' like '%;'||';%'").and("modifyTime" < squel.select().from('notes').where("id = ?", _postInfo.id))).order("title", true).limit(0, 100).toString();
      return databaseService.db.transaction(function(tx) {
        return tx.executeSql(query, [], (function(tx, result) {
          var i, _i, _ref;
          for (i = _i = 0, _ref = result.rows.length; _i <= _ref; i = _i += 1) {
            console.log(result.rows.item(i));
          }
          console.log("result.rows.length");
          console.log(result.rows.length);
          return console.log("dealGetPostsWithTag");
        }), function(tx, error) {
          return console.log(error);
        });
      });

      /*
      var condictionString:String = "";
      			var params:Dictionary = new Dictionary();
      			params[":keyword"] = _tagInfo.id == 0 ? "" : _tagInfo.name;
      
      			//problem !!!
      			params[":contentId"] = _provider;
      
      			if (_postInfo != null)
      			{
      				params[":id"] = _postInfo.id;
      				condictionString += " AND modifyTime < (SELECT modifyTime FROM notes WHERE id=:id)";
      			}
       */
    };
    initGetUsedTagsToken = function() {
      return dealGetUsedTags();
    };
    dealGetUsedTags = function() {
      var query;
      query = squel.select().from('notes_tag').where(squel.expr().and("state = '1'").and("content = 'facebook'")).order("useCount", false).order("latestTime", false).limit(0, 10).toString();
      return databaseService.db.transaction(function(tx) {
        return tx.executeSql(query, [], (function(tx, result) {
          var i, _i, _ref;
          for (i = _i = 0, _ref = result.rows.length; _i <= _ref; i = _i += 1) {
            console.log(result.rows.item(i));
          }
          console.log("result.rows.length");
          console.log(result.rows.length);
          return console.log("dealGetUsedTags");
        }), function(tx, error) {
          return console.log(error);
        });
      });
    };
    initGetPostInfoToken = function(id, keyword) {
      var _id, _keyword;
      _id = id;
      return _keyword = keyword;
    };
    dealGetPostInfo = function() {
      var query;
      query = squel.select().from('notes').field('id').field('title').field('createTime').field('content').field('tags').field('color').field('selected').where(squel.expr().and("state = '1'").and("id = ?", _id)).toString();
      return databaseService.db.transaction(function(tx) {
        return tx.executeSql(query, [], (function(tx, result) {
          var i, _i, _ref;
          for (i = _i = 0, _ref = result.rows.length; _i <= _ref; i = _i += 1) {
            console.log(result.rows.item(i));
          }
          console.log("result.rows.length");
          console.log(result.rows.length);
          return console.log("dealGetUsedTags");
        }), function(tx, error) {
          return console.log(error);
        });
      });
    };
    initMaskPostColor = function(id, color) {
      var _color, _id;
      _id = id;
      return _color = color;
    };
    dealSetPostColor = function() {
      var query;
      query = squel.update().table('notes').set('color', _color).where('id = "' + _id + '"').toParam();
      return databaseService.db.transaction(function(tx) {
        return tx.executeSql(query.text, query.values, (function(tx, result) {
          var i, _i, _ref;
          for (i = _i = 0, _ref = result.rows.length; _i <= _ref; i = _i += 1) {
            console.log(result.rows.item(i));
          }
          console.log("result.rows.length");
          console.log(result.rows.length);
          return console.log("dealGetUsedTags");
        }), function(tx, error) {
          return console.log(error);
        });
      });
    };
    initMaskPostState = function(id, selected) {
      var _id, _selected;
      _id = id;
      return _selected = selected;
    };
    dealSetPostState = function() {
      var query;
      query = squel.update().table('notes').set('selected', _selected).where('id = "' + _id + '"').toParam();
      return databaseService.db.transaction(function(tx) {
        return tx.executeSql(query.text, query.values, (function(tx, result) {
          var i, _i, _ref;
          for (i = _i = 0, _ref = result.rows.length; _i <= _ref; i = _i += 1) {
            console.log(result.rows.item(i));
          }
          console.log("result.rows.length");
          console.log(result.rows.length);
          return console.log("dealGetUsedTags");
        }), function(tx, error) {
          return console.log(error);
        });
      });
    };
    _postInfo = void 0;
    _keyword = void 0;
    _color = -1;
    initGetLatestPostsToken = function(lastPost, pageSize, keyword, color) {
      _postInfo = lastPost;
      _pageSize = pageSize;
      _keyword = keyword;
      return _color = color;
    };
    dealGetLatestPosts = function() {
      var expr, query;
      expr = squel.expr();
      if (_keyword) {
        expr = expr.and("title like = ?", _keyword).or("content like = ?", _keyword).or("tags like = ?", _keyword);
      }
      if (_color !== 0xffffff && _color >= 0) {
        expr = expr.and("color = ?", _color);
      }
      if (_postInfo !== null) {
        expr.and("modifyTime < ?", squel.select().field('modifyTime').from('notes').where("id = ?", _id));
      }
      query = squel.select().from('notes').field('id').field('title').field('modifyTime').field('color').field('selected').where(expr.and("state = '1'").and("id = ?", _id)).order("title", true).limit(0, 100).toString();
      return databaseService.db.transaction(function(tx) {
        return tx.executeSql(query, [], (function(tx, result) {
          var i, _i, _ref;
          for (i = _i = 0, _ref = result.rows.length; _i <= _ref; i = _i += 1) {
            console.log(result.rows.item(i));
          }
          console.log("result.rows.length");
          console.log(result.rows.length);
          return console.log("dealGetUsedTags");
        }), function(tx, error) {
          return console.log(error);
        });
      });
    };
  }

  return AggregationRest;

})();


/*
@setItemType = ->
  prevDate = null

  currentBalance = "0,00"
  aggregationModelService.globalTags.each (entity) ->

     *var curDate = entity.date;
    curDate = entity.name.charAt(0)

    if not prevDate? or (prevDate isnt curDate)
      prevDate = curDate

      formattedBalance = "0,00"

       *working
      aggregationModelService.resultTransactions.push
        uid: prevDate
        date: curDate
        balance: currentBalance
        formattedBalance: formattedBalance
        type: "dateHeader"
        sortByElement: curDate

    entity.type = "transaction"

    aggregationModelService.resultTransactions.push entity
 */

module.exports = AggregationRest;

angular.module('shared_view.module').service('aggregationRestService', ['Restangular', 'aggregationModelService', '$cordovaSQLite', 'DBSCHEMAS', 'databaseService', AggregationRest]);



},{"async":1,"squel":4}],11:[function(require,module,exports){
var Database;

Database = (function() {
  function Database() {
    var lastInsertRowID, notes, notes_attach, notes_tag, notes_tag_set;
    this.db = void 0;
    notes = 'CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY, title TEXT, content TEXT, createTime DATETIME, modifyTime DATETIME, state INTEGER, tags TEXT, color INTEGER DEFAULT -1, selected INTEGER DEFAULT -1)';
    notes_attach = 'CREATE TABLE IF NOT EXISTS notes_attach(id INTEGER PRIMARY KEY, url TEXT, noteId INTEGER, createTime DATETIME)';
    notes_tag = 'CREATE TABLE IF NOT EXISTS notes_tag(id INTEGER PRIMARY KEY, name TEXT, createTime DATETIME, latestTime DATETIME, useCount INTEGER, pinyin TEXT, fpinyin TEXT, selected INTEGER DEFAULT -1)';
    notes_tag_set = 'CREATE TABLE IF NOT EXISTS notes_tag_set(tagId INTEGER, noteId INTEGER, FOREIGN KEY(tagId) REFERENCES notes_tag(id), FOREIGN KEY(noteId) REFERENCES notes(id))';
    lastInsertRowID = -1;
    this.connect = function() {
      if (window.openDatabase) {
        this.db = window.openDatabase('Millipede', '0.0', 'Storage quota test application', 5 * 1024 * 1024);
        this.initializeWebSqlDatabase();
      } else {
        console.log("Web DB not available");
        this.initializeSqlDatabase();
      }
      return this.db;
    };
    this.initializeSqlDatabase = function() {

      /*
      @db.run(DBSchemas.create.notes)
      
      @db.run(DBSchemas.create.notes_attach)
      
      @db.run(DBSchemas.create.notes_tag)
      
      @db.run(DBSchemas.create.notes_tag_set)
      
      @db.run(DBSchemas.create.rss_list)
      @db.run(DBSchemas.create.rss_items)
      @db.run(DBSchemas.create.subscripts)
       */
    };
    this.initializeWebSqlDatabase = function() {
      this.db.transaction(function(tx) {
        return tx.executeSql(notes, [], (function(tx, result) {
          return console.log(result);
        }), function(tx, error) {
          return console.log(error);
        });
      });
      this.db.transaction(function(tx) {
        return tx.executeSql(notes_attach, [], (function(tx, result) {
          return console.log(result);
        }), function(tx, error) {
          return console.log(error);
        });
      });
      this.db.transaction(function(tx) {
        return tx.executeSql(notes_tag, [], (function(tx, result) {
          return console.log(result);
        }), function(tx, error) {
          return console.log(error);
        });
      });
      return this.db.transaction(function(tx) {
        return tx.executeSql(notes_tag_set, [], (function(tx, result) {
          return console.log(result);
        }), function(tx, error) {
          return console.log(error);
        });
      });
    };
  }


  /*
  @instance: (=>
    instance = null
    =>
      instance = new @() if not instance
      instance
  )()
   */

  return Database;

})();

module.exports = Database;

angular.module('shared_view.module').service('databaseService', [Database]);



},{}],12:[function(require,module,exports){
var ProviderRestangular;

ProviderRestangular = (function() {
  function ProviderRestangular(RestangularProvider) {
    RestangularProvider.setBaseUrl('http://millipede.me:9001/');

    /*
    Restangular.withConfig (RestangularConfigurer) ->
      RestangularConfigurer.setBaseUrl "http://millipede.me:9001/"
     */
  }

  return ProviderRestangular;

})();

module.exports = ProviderRestangular;

angular.module('shared_view.module').config(['RestangularProvider', ProviderRestangular]);



},{}],13:[function(require,module,exports){
var SideMenu;

SideMenu = (function() {
  function SideMenu($serviceScope) {
    var SideMenuInstance;
    return SideMenuInstance = (function() {
      var a;

      a = -1;

      function SideMenuInstance() {
        var $scope;
        $scope = $serviceScope();
        this.login = function() {
          $scope.$emit("logged-in");
        };
      }

      return SideMenuInstance;

    })();
  }

  return SideMenu;

})();


/*
class SideMenu extends Factory
  constructor: ($serviceScope) ->
    return {

      $scope = $serviceScope

      login: ->

         * Can trigger events on scopes
        $scope.$emit "logged-in"
        
        return

    }
 */


/*
class SideMenu extends Service

  constructor: () ->

   *constructor: ($cordovaCamera, $cordovaContacts, GalleryService, $cordovaDevice) ->
 */

module.exports = SideMenu;

angular.module('shared_view.module').factory('SideMenu', ['$serviceScope', SideMenu]);



},{}]},{},[7,8,9,10,11,12,13,6]);
