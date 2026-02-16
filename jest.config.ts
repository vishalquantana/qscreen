import type { Config } from "jest";

const config: Config = {
  projects: [
    {
      displayName: "unit",
      testMatch: ["<rootDir>/__tests__/unit/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            tsconfig: "tsconfig.json",
            useESM: false,
          },
        ],
      },
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      testEnvironment: "node",
    },
    {
      displayName: "components",
      testMatch: ["<rootDir>/__tests__/components/**/*.test.tsx"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            tsconfig: "tsconfig.json",
            useESM: false,
          },
        ],
      },
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      testEnvironment: "jsdom",
      setupFilesAfterSetup: ["@testing-library/jest-dom"],
    },
    {
      displayName: "e2e",
      testMatch: ["<rootDir>/__tests__/e2e/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            tsconfig: "tsconfig.json",
            useESM: false,
          },
        ],
      },
      testEnvironment: "node",
      testTimeout: 60000,
    },
  ],
};

export default config;
