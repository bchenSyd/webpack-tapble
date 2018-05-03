/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

const Hook = require("./Hook");
const HookCodeFactory = require("./HookCodeFactory");

/* bailHook example;

var _context;
var _x = this._x;
var _fn0 = _x[0];
var _result0 = _fn0(options);
if (_result0 !== undefined) {
	return _result0;
} else {
	var _fn1 = _x[1];
	var _result1 = _fn1(options);
	if (_result1 !== undefined) {
		return _result1;
	} else {
		var _fn2 = _x[2];
		var _result2 = _fn2(options);
		if (_result2 !== undefined) {
			return _result2;
		} else {


			// keep nesting _x[3], _x[4], _x[5]


		}
	}
}

*/

class SyncBailHookCodeFactory extends HookCodeFactory {
	content({ onError, onResult, onDone, rethrowIfPossible }) {
		return this.callTapsSeries({
			onError: (i, err) => onError(err),
			// as soon as a plugin return a Result, bail out;
			onResult: (i, result, next) => `if(${result} !== undefined) {\n${onResult(result)};\n} else {\n${next()}}\n`,
			onDone,
			rethrowIfPossible
		});
	}
}

const factory = new SyncBailHookCodeFactory();

class SyncBailHook extends Hook {
	tapAsync() {
		throw new Error("tapAsync is not supported on a SyncBailHook");
	}

	tapPromise() {
		throw new Error("tapPromise is not supported on a SyncBailHook");
	}

	compile(options) {
		factory.setup(this, options);
		return factory.create(options);
	}
}

module.exports = SyncBailHook;
