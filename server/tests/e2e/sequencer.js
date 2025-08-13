const TestSequencer = require("@jest/test-sequencer").default;

class CustomSequencer extends TestSequencer {
  sort(tests) {
    // Define the order of test execution
    const testOrder = [
      // 1. Database and setup tests
      "database",
      "setup",

      // 2. Authentication tests
      "auth",
      "login",
      "logout",
      "refresh-token",
      "reset-password",

      // 3. Core entity tests
      "tenants",
      "users",
      "roles",
      "permissions",
      "modules",
      "menus",

      // 4. Support system tests
      "support",
      "tickets",
      "replies",
      "attachments",

      // 5. Audit and device tests
      "audit",
      "devices",

      // 6. Integration tests
      "integration",
      "e2e",
    ];

    return tests.sort((testA, testB) => {
      const getTestOrder = (testPath) => {
        const testName = testPath.toLowerCase();
        const orderIndex = testOrder.findIndex((order) =>
          testName.includes(order)
        );
        return orderIndex === -1 ? testOrder.length : orderIndex;
      };

      const orderA = getTestOrder(testA.path);
      const orderB = getTestOrder(testB.path);

      if (orderA === orderB) {
        // If same order, sort alphabetically
        return testA.path.localeCompare(testB.path);
      }

      return orderA - orderB;
    });
  }
}

module.exports = CustomSequencer;
