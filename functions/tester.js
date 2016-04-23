// 'use strict';

function catchError(method) {
  var result;

  try {
    result = method();
  } catch (error) {
    result = error;
  }

  return result;
}

function checkForAsyncTest(kangaxTest, testID, methodAsString) {
  if (/asyncTestPassed/.exec(methodAsString) !== null) {
    asyncTests[testID] = kangaxTest;
  }
}

function deindent(methodAsString) {
  var lines = methodAsString.split("\n");
  var indent = null;
  lines = lines.map(function(line) {
    if (indent === null) {
      var leftTrimmedLine = line.replace(/^\s*/, '');
      indent = line.length - leftTrimmedLine.length;
      if (indent === 0) {
        indent = null;
      } else {
        indent = Math.max(0, indent - 2);
      }
    }
    return line[0] === ' ' ? line.substring(indent) : line;
  });
  return lines.join("\n");
}

function getResult(methodAsString) {
  return catchError(function() {
    return eval('function asyncTestPassed() { updateTestResults(' + testID + '); };' + "\n" + methodAsString);
  });
}

function getTest(test) {
  if (typeof test === 'function') {
    return test.toString();
  }
}

// called by asyncTestPassed so we can update test result to be true
/* eslint-disable no-unused-vars */
function updateTestResults(testID) {
  asyncTests[testID].result = true;
}
/* eslint-enable no-unused-vars */

function wrapTestFunction(testString) {
  // test is wrapped in multiline comments
  if (testString.match(/[^]*\/\*([^]*)\*\/\}$/)) {
    return '(function (){' + deindent(testString.match(/[^]*\/\*([^]*)\*\/\}$/)[1]) + '})()';
  } else {
    return '(' + deindent(testString) + ')()';
  }
}

var asyncTests = {};
var testID = 0;

module.exports = function(kangaxTest) {
  var testString = getTest(kangaxTest.exec);

  if (testString) {
    checkForAsyncTest(kangaxTest, ++testID, testString);
    var wrappedTest = wrapTestFunction(testString);
    kangaxTest.calledFunction = wrappedTest;
    kangaxTest.value = getResult(wrappedTest);
    kangaxTest.result = kangaxTest.value instanceof Error ? false : kangaxTest.value;
    kangaxTest.testID = testID;
  }

  if (kangaxTest.hasOwnProperty('subtests')) {
    kangaxTest.subtests = kangaxTest.subtests.map(module.exports);
  }

  if (typeof kangaxTest.result === 'undefined' && kangaxTest.subtests) {
    var summaryResult = true;
    for (var i = 0; i < kangaxTest.subtests.length; i++) {
      if (!kangaxTest.subtests[i].result) {
        summaryResult = false;
      }
    }
    kangaxTest.result = summaryResult;
  }

  return kangaxTest;
}

module.exports.asyncTests = asyncTests;
