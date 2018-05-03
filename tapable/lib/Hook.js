/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

class Hook {
	constructor(args) {
		if (!Array.isArray(args)) args = [];
		this._args = args;
		this.taps = [];
		this.interceptors = [];
		this.call = this._call = this._createCompileDelegate("call", "sync");
		this.promise = this._promise = this._createCompileDelegate("promise", "promise");
		this.callAsync = this._callAsync = this._createCompileDelegate("callAsync", "async");
		this._x = undefined;
	}

	compile(options) {
		throw new Error("Abstract: should be overriden");
	}

	_createCall_on_the_fly(type) {
		// build up a function on the fly;
		return this.compile({
			taps: this.taps,
			interceptors: this.interceptors,
			args: this._args,
			type: type
		});
	}

	_createCompileDelegate(name, type) {
		const lazyCompileHook = (...args) => {
			// buidl AST tree here;
			this[name] = this._createCall_on_the_fly(type);

			// your plugin function called here; //bochen todo;
			function _call_the_dynamic_generated_function(){
				return this[name](...args)
			}
			return  _call_the_dynamic_generated_function.bind(this)();
		};

		return lazyCompileHook;
	}

	tap(options, fn) {
		if (typeof options === "string")
			options = { name: options };
		if (typeof options !== "object" || options === null)
			throw new Error("Invalid arguments to tap(options: Object, fn: function)");
		options = Object.assign({ type: "sync", fn: fn }, options);
		if (typeof options.name !== "string" || options.name === "")
			throw new Error("Missing name for tap");
		options = this._runRegisterInterceptors(options);
		this._insert(options);
	}

	tapAsync(options, fn) {
		if (typeof options === "string")
			options = { name: options };
		if (typeof options !== "object" || options === null)
			throw new Error("Invalid arguments to tapAsync(options: Object, fn: function)");
		options = Object.assign({ type: "async", fn: fn }, options);
		if (typeof options.name !== "string" || options.name === "")
			throw new Error("Missing name for tapAsync");
		options = this._runRegisterInterceptors(options);
		this._insert(options);
	}

	tapPromise(options, fn) {
		if (typeof options === "string")
			options = { name: options };
		if (typeof options !== "object" || options === null)
			throw new Error("Invalid arguments to tapPromise(options: Object, fn: function)");
		options = Object.assign({ type: "promise", fn: fn }, options);
		if (typeof options.name !== "string" || options.name === "")
			throw new Error("Missing name for tapPromise");
		options = this._runRegisterInterceptors(options);
		this._insert(options);
	}

	_runRegisterInterceptors(options) {
		for (const interceptor of this.interceptors) {
			if (interceptor.register) {
				const newOptions = interceptor.register(options);
				if (newOptions !== undefined)
					options = newOptions;
			}
		}
		return options;
	}

	withOptions(options) {
		const mergeOptions = opt => Object.assign({}, options, typeof opt === "string" ? { name: opt } : opt);

		// Prevent creating endless prototype chains
		options = Object.assign({}, options, this._withOptions);
		const base = this._withOptionsBase || this;
		const newHook = Object.create(base);

		newHook.tapAsync = (opt, fn) => base.tapAsync(mergeOptions(opt), fn),
			newHook.tap = (opt, fn) => base.tap(mergeOptions(opt), fn);
		newHook.tapPromise = (opt, fn) => base.tapPromise(mergeOptions(opt), fn);
		newHook._withOptions = options;
		newHook._withOptionsBase = base;
		return newHook;
	}

	isUsed() {
		return this.taps.length > 0 || this.interceptors.length > 0;
	}

	intercept(interceptor) {
		this._resetCompilation();
		this.interceptors.push(Object.assign({}, interceptor));
		if (interceptor.register) {
			for (let i = 0; i < this.taps.length; i++)
				this.taps[i] = interceptor.register(this.taps[i]);
		}
	}

	_resetCompilation() {
		this.call = this._call;
		this.callAsync = this._callAsync;
		this.promise = this._promise;
	}

	_insert(item) {
		this._resetCompilation();
		let before;
		if (typeof item.before === "string")
			before = new Set([item.before]);
		else if (Array.isArray(item.before)) {
			before = new Set(item.before);
		}
		let stage = 0;
		if (typeof item.stage === "number")
			stage = item.stage;
		let i = this.taps.length;
		// order by stage; first in best dressed when same stage;
		while (i > 0) {
			i--;
			const x = this.taps[i]; // nutch down the second last record;
			this.taps[i + 1] = x; // point last record to second last record;
			const xStage = x.stage || 0; // second last one's stage?
			if (before) {
				if (before.has(x.name)) {
					before.delete(x.name);
					continue;
				}
				if (before.size > 0) {
					continue;
				}
			}
			if (xStage > stage) { // if item.stage < second last record; continute;
				continue;
			}
			i++;
			break;
		}
		//	[ plugin1:stage=10 come #4, pluin2: stage=100, come #2, pluin3: stage=100, come#3, plugin4: stage=200, come#1 ]
		// order by stage first, so even though plugin4 comes first, it's at the end of array;
		// plugin2 and plugin3 has the same stage, but plugin2 comes first, it's ahead of plugin3
		this.taps[i] = item; // the right spot for the item.stage
	}
}

module.exports = Hook;
