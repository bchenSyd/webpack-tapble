## webpack.config.js , mode="developerment" -> options.optimization.nodeEnv
```js
/opt/git/webpack4-test/node_modules/webpack/lib/WebpackOptionsDefaulter.js #296
this.set(
			"optimization.nodeEnv",
			"make",
			options => options.mode || "production"
		);
```



## options.optimization.nodeEnv -> DefinePlugin({ "process.env.NODE_ENV})
```js
/opt/git/webpack4-test/node_modules/webpack/lib/WebpackOptionsApply.js#333
if (options.optimization.nodeEnv) {
			new DefinePlugin({
				"process.env.NODE_ENV": JSON.stringify(options.optimization.nodeEnv)
			}).apply(compiler);
		}
```	
		

## babel-loader compile code
```js		
///opt/git/webpack4-test/node_modules/webpack/lib/NormalModule.js

// line 400
_buildcallback = err=>{
 try {
        const result = this.parser.parse(
            this._ast || this._source.source(), //  webpack/lib/OriginalSource.js::source { return this._value; } , which is babel-loader
                                                //  transpiled code (type: string);
         
            {
                current: this,
                module: this,
                compilation: compilation,
                options: options
            },

            (err, result) => {
                if (err) {
                    handleParseError(err);
                } else {
                    handleParseResult(result);
                }
            }
        );
}




// line 227
doBuild(options, compilation, resolver, fs, _buildcallback) {
		const loaderContext = this.createLoaderContext(
			resolver,
			options,
			compilation,
			fs
		);

		debugger;
		runLoaders(
			{
				resource: this.resource,  //  "/opt/git/webpack4-test/src/jannis.js"
				loaders: this.loaders,    // ["/opt/git/webpack4-test/node_modules/babel-loader/lib/index.js" ]
				context: loaderContext,
				readResource: fs.readFile.bind(fs)
			},
			(err, result) => {
				if (result) {
				    /* babel transpiled result:
							"'use strict';

							if (process.env.NODE_ENV === 'production') {
								console.log(1);
							} else {
								console.log(2);
							}"
					
                    */
                    
                _buildcallback(); // line#400, see above
                }
        )
```
                


## webpack parse the es5 result
```js
// opt/git/webpack4-test/node_modules/webpack/lib/Parser.js
parse(source, initialState) {
		let ast;
		let comments;
		if (typeof source === "object" && source !== null) {
			ast = source;
			comments = source.comments;
		} else {
            comments = [];
            // ast built here! line1947
			ast = Parser.parse(source, {
				sourceType: this.sourceType,
				onComment: comments
			});
        }

        //#####################################################################
        // line1969
        this.walkStatements(ast.body); // parse loop; main loop; parse body ; parse root tree
        //#####################################################################

```
       
define plugin already hooked up to parser
```js
///opt/git/webpack4-test/node_modules/webpack/lib/DefinePlugin.js line#100
parser.hooks.evaluateIdentifier
            .for(key) // key is   "process.env.NODE_ENV"
            .tap("DefinePlugin", expr => {
                debugger;
                if (recurse) return;
                recurse = true;
                const res = parser.evaluate(code); // code is "production", should be better named as 'value'
                recurse = false;
                res.setRange(expr.range);
                return res;
            });





// /opt/git/webpack4-test/node_modules/webpack/lib/Parser.js

  // line#186
this.hooks.evaluate.for("BinaryExpression").tap("Parser", expr => {

  // line#301
else if (expr.operator === "==" || expr.operator === "===") {
				
        left = this.evaluateExpression(expr.left); // left expression is "MemberExpress"
        debugger;
        right = this.evaluateExpression(expr.right);// right expression is "Liernal", type :String;
        
        const res = new BasicEvaluatedExpression();
        return res.setBoolean(left.string === right.string);  -----------
                                                                         |
                                                                         |
                                                                         |   
```                                                                      
                                                                         |
## final: constPlugin remove the else branch
```js                                                                    |
///opt/git/webpack4-test/node_modules/webpack/lib/ConstPlugin.js         |
	parser.hooks.statementIf.tap("ConstPlugin", statement => {   // I would like to participate in parsing `If` statement
      // if (a===b),'a===b' is test, where both a and b are memberExpression
      const param = parser.evaluateExpression(statement.test); <---------|
        const bool = param.asBool();
        if (typeof bool === "boolean") {
            if (statement.test.type !== "Literal") {
                const dep = new ConstDependency(`${bool}`, param.range);
                dep.loc = statement.loc;
                parser.state.current.addDependency(dep);
            }
            const branchToRemove = bool
                ? statement.alternate
                : statement.consequent;
            if (branchToRemove) {
                // now remove the branch
            }
```