import type { Config } from 'jest';

const config: Config = {
  roots: ['<rootDir>/src'],
  testRegex: '.*\\.int\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironment: 'node'
};

export default config;
