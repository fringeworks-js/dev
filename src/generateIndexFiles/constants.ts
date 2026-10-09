import fs from "fs-extra";
import { CONSTANTS, PRIVATE, TS_JS, TYPES } from "../constants";
import type { IsMatchingPathCondition } from "../isMatchingPath";

export {
  CONSTANTS,
  DEFAULT_EXCLUDE,
  PRIVATE,
  TEST_DIR,
  TEST_FILE,
  TS_JS,
  TYPES,
} from "../constants";

/**
 * 配下にindexファイルのあるディレクトリ
 */
export const HAS_INDEX_DIR: IsMatchingPathCondition = {
  entryType: "dir",
  conditions: (values, { indexRegex }) => {
    const items = fs.readdirSync(values.path);
    for (const item of items) {
      if (indexRegex.test(item)) {
        return true;
      }
    }
    return false;
  },
};

/**
 * 拡張子を除いたファイル名が親ディレクトリ名と同じ
 */
export const MAIN_FILE: IsMatchingPathCondition = {
  entryType: "file",
  conditions: (values) => {
    return values.name === values.dirbase;
  },
};

/**
 * 名前空間としてまとめてexportするディレクトリ（`export * as name`）
 */
export const NAMESPACE_DIR: IsMatchingPathCondition = {
  entryType: "dir",
  conditions: (values, { children }) => {
    const { base } = values;
    return (
      // 先頭が小文字
      base[0] === base[0].toLowerCase() &&
      // 子要素にディレクトリと同じ名称のファイルが無い
      children?.every((child: string) => child.split(".")[0] !== base)
    );
  },
};

/**
 * includeのデフォルト値
 */
export const DEFAULT_INCLUDE = [
  // TypeScript,JavaScriptのファイルを対象
  TS_JS,
  // 配下にindex.tsを持つディレクトリを対象
  HAS_INDEX_DIR,
];

/**
 * ignoreのデフォルト値
 * 名前が`_`で始まる非公開のディレクトリにはindexファイルを生成しない
 */
export const DEFAULT_IGNORE = [PRIVATE];

/**
 * exportTypeAllのデフォルト値
 */
export const DEFAULT_EXPORT_TYPE_ALL = [TYPES];

/**
 * exportAllのデフォルト値
 * 定数のファイルと、配下にindexファイルのあるディレクトリ（カテゴリーや機能のディレクトリ）
 */
export const DEFAULT_EXPORT_ALL = [CONSTANTS, HAS_INDEX_DIR];

/**
 * exportDefaultAndNamedのデフォルト値
 */
export const DEFAULT_EXPORT_DEFAULT_AND_NAMED = [MAIN_FILE];

/**
 * exportDefaultのデフォルト値
 */
export const DEFAULT_EXPORT_DEFAULT: IsMatchingPathCondition[] = [];

/**
 * exportAllAsのデフォルト値
 */
export const DEFAULT_EXPORT_ALL_AS: IsMatchingPathCondition[] = [];
