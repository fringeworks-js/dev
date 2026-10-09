import type { IsMatchingPathCondition } from './isMatchingPath';

/**
 * types.ts
 */
export const TYPES: IsMatchingPathCondition = {
  valueType: 'base',
  entryType: 'file',
  conditions: /^types\.ts$/i,
};

/**
 * constants.ts
 */
export const CONSTANTS: IsMatchingPathCondition = {
  valueType: 'base',
  entryType: 'file',
  conditions: /^constants\.(ts|tsx)$/i,
};

/**
 * TypeScriptとJavaScript
 */
export const TS_JS: IsMatchingPathCondition = {
  valueType: 'base',
  entryType: 'file',
  conditions: /.+\.(ts|tsx|js|jsx)$/i,
};

/**
 * テストディレクトリ配下
 */
export const TEST_DIR: IsMatchingPathCondition = {
  valueType: 'path',
  conditions: /.+\/__test__\/.+/i,
};

/**
 * テストファイル
 */
export const TEST_FILE: IsMatchingPathCondition = {
  valueType: 'base',
  conditions: /.*\.test\.(ts|tsx|js|jsx)$/i,
};

/**
 * ファイル名またはディレクトリ名が`_`で始まる
 */
export const PRIVATE: IsMatchingPathCondition = {
  valueType: 'base',
  conditions: /^_/,
};

/**
 * 除外する対象のデフォルト値
 */
export const DEFAULT_EXCLUDE = [
  // __test__フォルダ配下の全てを除外
  TEST_DIR,
  // ディレクトリ名、ファイル名が_で始まるものを除外
  PRIVATE,
];
