/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

const Hook = require("./Hook");
const HookCodeFactory = require("./HookCodeFactory");


function __generated_normal_module_factory() {
	var _fn0 = _x[0]; // buildin one;
	var _result0 = _fn0(factory);
	if (_result0 !== undefined) {
		factory = _result0; // this the default factory function that native NMF (normal module factory) returns
	}
	var _fn1 = _x[1]; // plugin one;


	// ######################################################################################################################
	//      the result of 1st plugin(native plugin), becomes the parameter of 2nd plugin
			var _result1 = _fn1(factory); 
	// ######################################################################################################################
	
	
	if (_result1 !== undefined) {
		factory = _result1; // this is the plugin NMF (normal module factory);
	}

	// plugin version of NMF will override the default version of NMF
	return factory;
}



class SyncWaterfallHookCodeFactory extends HookCodeFactory {
	content({ onError, onResult, onDone, rethrowIfPossible }) {
		const fBody = this.callTapsSeries({
			onError: (i, err) => onError(err),
			onResult: (i, result, next) => {
				let code = "";

				//**********************************************
				//     repeat this;
				code += `if(${result} !== undefined) {\n`;
				code += `${this._args[0]} = ${result};\n`;
				code += `}\n`;
				//**********************************************
				code += next();

				return code;
			},
			onDone: () => onResult(this._args[0]), // depends on call type, in the 'sync' case, it simply returns result; 
			rethrowIfPossible
		});
		debugger;
		return fBody;
	}
}

const factory = new SyncWaterfallHookCodeFactory();

class SyncWaterfallHook extends Hook {
	constructor(args) {
		super(args);
		if (args.length < 1) throw new Error("Waterfall hooks must have at least one argument");
	}

	tapAsync() {
		throw new Error("tapAsync is not supported on a SyncWaterfallHook");
	}

	tapPromise() {
		throw new Error("tapPromise is not supported on a SyncWaterfallHook");
	}

	compile(options) {
		factory.setup(this, options);
		return factory.create(options);
	}
}

module.exports = SyncWaterfallHook;
