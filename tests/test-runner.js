/**
 * Simple Test Runner
 * A lightweight test framework that works in browser and Node.js
 */

const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Define a test
 * @param {string} name - Test name
 * @param {Function} fn - Test function
 */
export function test(name, fn) {
  try {
    fn();
    testResults.passed++;
    testResults.tests.push({ name, passed: true });
    console.log(`  ✓ ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, passed: false, error: error.message });
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
  }
}

/**
 * Define a test suite
 * @param {string} name - Suite name
 * @param {Function} fn - Suite function containing tests
 */
export function describe(name, fn) {
  console.log(`\n${name}`);
  fn();
}

/**
 * Assert that a condition is true
 * @param {boolean} condition - Condition to check
 * @param {string} message - Error message if assertion fails
 */
export function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Assert that two values are equal
 * @param {*} actual - Actual value
 * @param {*} expected - Expected value
 * @param {string} message - Optional error message
 */
export function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

/**
 * Assert that two values are deeply equal
 * @param {*} actual - Actual value
 * @param {*} expected - Expected value
 * @param {string} message - Optional error message
 */
export function assertDeepEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(message || `Expected ${expectedStr}, got ${actualStr}`);
  }
}

/**
 * Assert that a function throws an error
 * @param {Function} fn - Function to test
 * @param {string} message - Optional error message
 */
export function assertThrows(fn, message = 'Expected function to throw') {
  let threw = false;
  try {
    fn();
  } catch (e) {
    threw = true;
  }
  if (!threw) {
    throw new Error(message);
  }
}

/**
 * Assert that a value is truthy
 * @param {*} value - Value to check
 * @param {string} message - Optional error message
 */
export function assertTruthy(value, message) {
  if (!value) {
    throw new Error(message || `Expected truthy value, got ${JSON.stringify(value)}`);
  }
}

/**
 * Assert that a value is falsy
 * @param {*} value - Value to check
 * @param {string} message - Optional error message
 */
export function assertFalsy(value, message) {
  if (value) {
    throw new Error(message || `Expected falsy value, got ${JSON.stringify(value)}`);
  }
}

/**
 * Get test results summary
 * @returns {Object} Test results
 */
export function getResults() {
  return { ...testResults };
}

/**
 * Print test summary
 */
export function printSummary() {
  console.log('\n----------------------------------------');
  console.log(`Tests: ${testResults.passed} passed, ${testResults.failed} failed`);
  console.log('----------------------------------------');

  if (testResults.failed > 0) {
    console.log('\nFailed tests:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
  }

  return testResults.failed === 0;
}

/**
 * Reset test results (useful for re-running tests)
 */
export function resetResults() {
  testResults.passed = 0;
  testResults.failed = 0;
  testResults.tests = [];
}
