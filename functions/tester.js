'use strict';

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

function getResult(methodAsString) {
  var result = catchError(function() {
    return eval(methodAsString);
  });
  return result instanceof Error ? false : result;
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
    return 'function asyncTestPassed() { updateTestResults(' + testID + '); }; (function (){' + testString.match(/[^]*\/\*([^]*)\*\/\}$/)[1] + '})()';
  } else {
    return 'function asyncTestPassed() { updateTestResults(' + testID + '); }; (' + testString + ')()';
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
    kangaxTest.result = getResult(wrappedTest);
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
