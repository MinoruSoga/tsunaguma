const config = {
  preset: 'ts-jest',
  automock: false,
  verbose: true,
  testEnvironment: 'node',
  testMatch: ['**/src/**/?(*.)+(spec|test).[tj]s?(x)'],
  transform: {
    '^.+\\.[jt]s?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.spec.json',
        isolatedModules: false,
      },
    ],
  },
  moduleFileExtensions: ['js', 'json', 'jsx', 'node', 'ts', 'tsx'],
  watchPathIgnorePatterns: ['<rootDir>/node_modules/'],
}

module.exports = config
