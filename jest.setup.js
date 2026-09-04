// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.mjs`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// The context providers log verbosely (task saves, listener attach/detach) for
// browser-console debugging - useful in dev, just noise in test output.
jest.spyOn(console, 'log').mockImplementation(() => {})
