// Type definitions for Jest
// This file ensures TypeScript recognizes Jest globals in test files

import '@types/jest';

declare global {
  namespace jest {
    interface Matchers<R> {
      // Add any custom matchers here if needed
    }
  }
}
