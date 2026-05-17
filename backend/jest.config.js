export default {
  testEnvironment: 'node',
  testMatch: ["**/__tests__/**/*.mjs"],
  collectCoverageFrom: ["src/**/*.js"],
  coveragePathIgnorePatterns: ["/node_modules/"],
};
