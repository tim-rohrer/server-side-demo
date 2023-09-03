/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { JestConfigWithTsJest } from "ts-jest"

const config: JestConfigWithTsJest = {
  globalSetup: "../testEnv/setup.ts",
  globalTeardown: "../testEnv/teardown.ts",
  extensionsToTreatAsEsm: [".ts"],
  verbose: true,
  rootDir: "src",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },

  fakeTimers: {
    enableGlobally: true,
    doNotFake: ["nextTick", "setImmediate"],
  },
}

export default config
