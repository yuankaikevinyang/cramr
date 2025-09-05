// Test setup file
// This runs before each test

// Set test environment variables
process.env.NODE_ENV = 'test';

// Increase timeout for database operations
jest.setTimeout(10000);
