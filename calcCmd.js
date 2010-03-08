var calcCmd = {};
(function() {
  var methods = {};
  var predefinedVariables = {};
  var variables = {};
  var expressions = [
    {regex: /\s+/, token: 'whitespace'},
    {regex: /[a-zA-Z][a-zA-Z0-9_\.]*/, token: 'variable'},
    {regex: /[0-9]*\.?[0-9]+/, token: 'number'},
    {regex: /\+/, token: 'add'},
    {regex: /\-/, token: 'subtract'},
    {regex: /\*/, token: 'multiply'},
    {regex: /\//, token: 'divide'},
    {regex: /\(/, token: 'open_paren'},
    {regex: /\)/, token: 'close_paren'},
    {regex: /\,/, token: 'comma'},
    {regex: /\^/, token: 'power'},
    {regex: /\=/, token: 'equals'}
  ];
  var parseToken = function(command, index) {
    var value = command.substring(index);
    var item = {};
    for(var idx in expressions) {
      var expression = expressions[idx];
      var match = value.match(expression.regex);
      if(match && match[0] && value.indexOf(match[0]) == 0) {
        item.token = expression.token;
        item.value = match[0];
        item.newIndex = index + match[0].length;
        return item;
      }
    }
    return null;
  };
  var parseSyntax = function(command) {
    var index = 0;
    var result = [];
    while(index < command.length) {
      var item = parseToken(command, index);
      if(!item) {
        throw("unrecognized token at " + index);
      }
      index = item.newIndex;
      result.push(item);
    }
    return result;
  };
  var syntaxIndex = 0;
  var parseArgument = function(syntax) {
    var result = null;
    switch(syntax[syntaxIndex].token) {
    case 'number':
      result = syntax[syntaxIndex];
      break;
    case 'subtract':
      if(syntax[syntaxIndex + 1] && syntax[syntaxIndex + 1].token == 'number') {
        syntax[syntaxIndex + 1].value = "-" + syntax[syntaxIndex + 1].value;
        syntaxIndex++;
        result = syntax[syntaxIndex];
      } else {
        throw("expecting a number at " + syntax[syntaxIndex].newIndex);
      }
      break;
    case 'variable':
      if(syntax[syntaxIndex + 1] && syntax[syntaxIndex + 1].token == 'open_paren') {
        result = syntax[syntaxIndex];
        result.token = 'method'
        result.arguments = []
        var ender = 'comma';
        syntaxIndex = syntaxIndex + 2;
        while(ender == 'comma') {
          result.arguments.push(parseExpression(syntax, ['comma', 'close_paren']));
          ender = syntax[syntaxIndex].token;
          syntaxIndex++;
        }
        syntaxIndex--;
        if(ender != 'close_paren') {
          throw("expecting close parenthesis at " + syntax[syntaxIndex].newIndex);
        }
      } else {
        result = syntax[syntaxIndex];
      }
      break;
    case 'open_paren':
      result = syntax[syntaxIndex];
      result.token = 'parenthesized_expression';
      syntaxIndex++;
      result.expression = parseExpression(syntax, ['close_paren']);
      break;
    }
    if(!result) {
      var index = (syntax && syntax[syntaxIndex] && syntax[syntaxIndex].newIndex) || 0;
      var type = (syntax && syntax[syntaxIndex] && syntax[syntaxIndex].token) || "nothing"
      throw("expecting a value at " + index + ", got a " + type);
    }
    syntaxIndex++;
    return result;
  };
  var parseModifier = function(syntax) {
    switch(syntax[syntaxIndex].token) {
    case 'add':      
      return syntax[syntaxIndex++];
      break;
    case 'subtract':
      return syntax[syntaxIndex++];
      break;
    case 'multiply':
      return syntax[syntaxIndex++];
      break;
    case 'divide':
      return syntax[syntaxIndex++];
      break;
    case 'power':
      return syntax[syntaxIndex++];
      break;
    }
    var value = (syntax && syntax[syntaxIndex] && syntax[syntaxIndex].token) || 'value';
    var index = (syntax && syntax[syntaxIndex] && syntax[syntaxIndex].newIndex) || 0;
    throw("unexpected " + value + " at " + index);
  };
  
  var parseExpression = function(syntax, enders) {
    var result = {
      token: 'expression',
      newIndex: syntax[syntaxIndex].newIndex
    };
    result.expressionItems = []
    result.expressionItems.push(parseArgument(syntax));
    if(syntaxIndex > syntax.length) {
      return result;
    }
    var ended = false;
    while(syntaxIndex < syntax.length && !ended) {
      for(var idx in enders) {
        if(syntax[syntaxIndex].token == enders[idx]) {
          ended = true;
        }
      }
      if(!ended) {
        result.expressionItems.push(parseModifier(syntax));
        result.expressionItems.push(parseArgument(syntax));
      }
    }
    return result;
  };
  var parseFullExpression = function(syntax) {
    var newSyntax = [];
    for(var idx in syntax) {
      if(syntax[idx].token != 'whitespace') {
        newSyntax.push(syntax[idx]);
      }
    }
    syntax = newSyntax;
    var result = null;
    syntaxIndex = 0;
    if(syntax[syntaxIndex].token == 'variable' && syntax.length > 1 && syntax[syntaxIndex + 1].token == 'equals') {
      result = {
        token: 'variable_assignment',
        newIndex: syntax[syntaxIndex].newIndex
      }
      result.variable = syntax[syntaxIndex];
      if(syntax.length > 2) {
        syntaxIndex = 2;
        result.assignmentExpression = parseExpression(syntax);
      } else {
        throw("Expecting value at " + syntax[syntaxIndex + 1].newIndex);
      }
    } else {
      result = parseExpression(syntax);
    }
    return result;
  };
  var computeExpression = function(tree) {
    //if(tree.expressionItems.length > 3) { debugger; }
    var round0 = tree.expressionItems;
    var round1 = [round0[0]];
    for(var idx = 1; idx < round0.length; idx += 2) {
      var item = round0[idx];
      if(item.token == 'power') {
        var left = round1.pop();
        var right = round0[idx + 1];
        round1.push(numberItem(Math.pow(compute(left), compute(right))));
      } else {
        round1.push(round0[idx]);
        round1.push(round0[idx + 1]);
      }
    }
    var round2 = [round1[0]];
    for(var idx = 1; idx < round1.length; idx += 2) {
      var item = round1[idx];
      if(item.token == 'multiply') {
        var left = round2.pop();
        var right = round1[idx + 1];
        round2.push(numberItem(compute(left) * compute(right)));
      } else if(item.token == 'divide') {
        var left = round2.pop();
        var right = round1[idx + 1];
        round2.push(numberItem(compute(left) / compute(right)));
      } else {
        round2.push(round1[idx]);
        round2.push(round1[idx + 1]);
      }
    }
    var round3 = [round2[0]];
    for(var idx = 1; idx < round2.length; idx += 2) {
      var item = round2[idx];
      if(item.token == 'add') {
        var left = round3.pop();
        var right = round2[idx + 1];
        round3.push(numberItem(compute(left) + compute(right)));
      } else if(item.token == 'subtract') {
        var left = round3.pop();
        var right = round2[idx + 1];
        round3.push(numberItem(compute(left) - compute(right)));
      } else {
        round3.push(round2[idx]);
        round3.push(round2[idx + 1]);
      }
    }
    if(round3.length == 0) {
      throw("expressions should have at least one value");
    } else if(round3.length > 1) {
      throw("unexpected modifier: " + round3[1].token);
    } else {
      return compute(round3[0]);
    }
  };
  var numberItem = function(number) {
    return {
      token: 'number',
      value: number,
      calculatedValue: number
    }
  };
  var compute = function(tree) {
    switch(tree.token) {
    case 'number':
      return parseFloat(tree.value);
      break;
    case 'expression':
      return computeExpression(tree);
      break;
    case 'parenthesized_expression':
      return compute(tree.expression);
      break;
    case 'variable_assignment':
      variables[tree.variable.value] = compute(tree.assignmentExpression);
      return variables[tree.variable.value];
      break;
    case 'variable':
      if(!variables || !variables[tree.value]) {
        throw("undefined variable " + tree.value);
      }
      return variables[tree.value];
      break;
    case 'method':
      var args = []
      for(var idx in tree.arguments) {
        var value = compute(tree.arguments[idx]);
        tree.arguments[idx].computedValue = value;
        args.push(value);
      }
      return methods[tree.value].apply(null, args);
      break;
    }
    throw("Unexpected token type: " + tree.token);
  };
  calcCmd.clearMemory = function() {
    variables = {};
  };
  calcCmd.compute = function(command) {
    var result = {};
    command = command.toString();
    result.command = command;
    result.syntax = parseSyntax(command);
    result.tree = parseFullExpression(result.syntax);
    result.computedValue = compute(result.tree);
    return result;
  };
  var isFunction = function(arg) {
    return true;
  }
  calcCmd.addFunction = function(methodName, method) {
    if(typeof(methodName) == 'string' && isFunction(method)) {
      methods[methodName] = method;
      return true;
    }
    return false;
  };
  calcCmd.addPredefinedVariable = function(variableName, value) {
    value = parseFloat(value);
    if(typeof(variableName) == 'string' && (value || value == 0)) {
      predefinedVariables[variableName] = value;
    }
  };
})();
(function() {
  var f = function(name, func) { calcCmd.addFunction(name, func); }
  
  f('abs', function(val) { return Math.abs(val) });
  f('asin', function(x) { return Math.asin(x); });
  f('acos', function(x) { return Math.acos(x); });
  f('atan', function(x) { return Math.atan(x); });
  f('log', function(x, base) { return (Math.log(x) / Math.log(base || 10)); });
  f('ln', function(x) { return Math.log(x); });
  f('sin', function(x) { return Math.sin(x); });
  f('cos', function(x) { return Math.cos(x); });
  f('tan', function(x) { return Math.tan(x); });
  f('pi', function(x) { return Math.PI; });
  f('if', function(bool, pass, fail) { return bool ? pass : fail; });
  f('row', function(x) { return 0; });
  f('max', function() { 
    var max = arguments[0];
    for(var idx = 1; idx < arguments.length; idx++) {
      if(arguments[idx] > max) {
        max = arguments[idx];
      }
    }
    return max;
  });
  f('min', function() { 
    var min = arguments[0];
    for(var idx = 1; idx < arguments.length; idx++) {
      if(arguments[idx] < min) {
        min = arguments[idx];
      }
    }
    return min;
  });
  f('sqrt', function(x) { return Math.sqrt(x); });
  f('srt', function(x) { return arguments.sort; });
  f('first', function() { return arguments[0]; });
  f('last', function() { return arguments[arguments.length - 1]; });
  f('at', function(x) { return arguments[x]; });
  f('ran', function(x) { return (Math.random() * (x || 1)); });
  f('rand', function(x) { return (Math.random() * (x || 1)); });
  f('poly', function(x) { return 0; });
  f('integral', function(x) { return 0; });
  f('length', function() { return arguments.length; });
  f('mean', function() { return 0; });
  f('mode', function() { return 0; });
  f('count', function() { return arguments.length; });
  f('sum', function() { return 0; });
  f('stdev', function() { return 0; });
  f('fact', function() { return 0; });
  f('perm', function() { return 0; });
  f('comb', function() { return 0; });
  f('ceil', function(x) { return Math.ceil(x); });
  f('floor', function(x) { return Math.floor(x); });
  f('round', function(x) { return Math.round(x); });
  f('e', function(x) { return Math.exp(x || 1); });
})();
(function() {
  var errors = 0;
  var assertions = 0;
  var assert = function(bool, message) {
    assertions++;
    if(bool) { 
    } else {
      console.error("FAILURE: " + message);
      errors++;
    }
  };
  var val = function(arg, result) { 
    var answer = calcCmd.compute(arg).computedValue;
    assert((answer == result), arg + " should equal " + result + ", not " + answer);
  };
  val("5+5", 10);
  val("(5+5)", 10);
  val("5*  3", 15);
  val("5.2*3", 15.6);
  val("5.2*.3", 1.56);
  val("5*-3", -15);
  val("5+-3", 2);
  val("5--3", 8);
  val("5+2*3", 11);
  val("(5+2)*3", 21);
  val("5/3", 5/3);
  val("5*2-3/6", 9.5);
  val("3^3", 27);
  val("(3^3*2)", 54);
  val("5+(3^3*2)*(7-6*1)", 59);
  val("3^(2+1)", 27);
  
  val("a=2", 2);
  val("a", 2);
  val("a+3", 5);
  val("b=2+3*3", 11);
  val("b+a-6", 7);
  val("bob_jones=15", 15);
  val("sam = bob_jones / 5", 3);
  val("sam", 3);
  
  val("abs(-2)", 2);
  val("min(4)", 4);
  val("min(2,3,4)", 2);
  val("max(2*7,5 + 3+4, 9^2)+1", 82);
  console.log("Finished " + assertions + " tests with " + errors + " errors");
})();
