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
  val("pi()", Math.PI);
  val("5+5", 10);
  val("(5+5)", 10);
  val("5*  3", 15);
  val("5.2*3", 5.2*3);
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
  val("min(sort(1,2,3))", 1);
  val("max(2*7,5 + 3+4, 9^2)+1", 82);
  val("fact(170)", 7.257415615307994e+306);
  val("fact(171)", "Infinity");
  val("median(2,3,5)", 3);
  val("median(2,3,4,5)", 3.5);
  val("sum(2,3,4)", 9);
  val("mean(2,3,4)", 3);
  val("range(2,3,4)", 2);
  
  val("pi", Math.PI);
  
  val("abs(-4)", 4);
  val("abs(4)", 4);
  val("asin(0.5)", Math.asin(0.5)); //30*Math.PI/180);
  val("acos(0.5)", Math.acos(0.5)); //60*Math.PI/180);
  val("atan(1)", Math.atan(1));
  val("log(10)", 1);
  val("ln(1)", 0);
  val("rad_to_deg(30*pi/180)", (30*Math.PI/180)*180/Math.PI);
  val("deg_to_rad(30)", 30*Math.PI/180);
  val("sin(1)", Math.sin(1));
  val("cos(1)", Math.cos(1));
  val("tan(1)", Math.tan(1));
  val("pi()", Math.PI);
  val("if(1,2,3)", 2);
  val("max(1,2,3)", 3);
  val("min(1,2,3)", 1);
  val("sqrt(4)", 2);
  val("first(1,2,3,4)", 1);
  val("first(sort(5,3,1))", 1);
  val("first(reverse(5,3,1))", 1);
  val("first(5,6,7)", 5);
  val("last(5,6,7)", 7);
  val("at(sort(1,2,3), 1)", 2);
  var gt = false;
  for(var idx = 0; idx < 100; idx++) {
    var answer = calcCmd.compute("rand(5)").computedValue;
    if(answer < 0 || answer > 5) {
      errors++;
      assertions++;
      console.error("Random value generation should have been in the valid range");
      break;
    }
    if(answer > 1) {
      gt = true;
    }
  }
  assert(gt, "Not all random numbers should be less than one");
  // val("rand()", 
  val("length(1,2,3)", 3);
  val("mean(1,2,3)", 2);
  val("median(1,2,3,4)", 2.5);
  val("range(1,2,3,4,5)", 4);
  val("count(1,2,3,4,5,6,7)", 7);
  val("sum(1,2,3)", 6);
  // val("stdev(2,2,2)", 0);
  val("fact(3)", 6);
  val("perm(7, 2)", 42);
  val("comb(5, 2)", 10);
  val("ceil(6.10001)", 7);
  val("floor(5.99999)", 5);
  val("round(5.4)", 5);
  val("e()", Math.exp(1));
  val("e(3)", Math.exp(3));
  
  val("a=5", 5);
  val("a", 5);
  calcCmd.clearMemory();
  try {
    assertions++;
    val("a", 0);
    errors++;
    console.error("Variable should have been undefined");
  } catch(e) {
  }
  
  val("x=5", 5)
  val("x+(3^3*2)*(7-6*1)", 59);
  val("x+(3^3*2)*(7-6*1)", 59);
  val("x+(3^3*2)*(7-6*1)", 59);
  val("x=6", 6)
  val("x+(3^3*2)*(7-6*1)", 60);
  
  
  console.log("Finished " + assertions + " tests with " + errors + " errors");
})();
