// Real uuid ships ESM-only; tests don't need real randomness, just unique-enough ids.
let counter = 0;
module.exports = {
  v4: () => `test-uuid-${++counter}`,
};
