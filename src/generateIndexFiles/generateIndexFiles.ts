import fs from "fs-extra";
import os from "os";
import { posix as path } from "path";
import isMatchingPath from "../isMatchingPath";
import {
  DEFAULT_EXCLUDE,
  DEFAULT_EXPORT_ALL,
  DEFAULT_EXPORT_ALL_AS,
  DEFAULT_EXPORT_DEFAULT,
  DEFAULT_EXPORT_DEFAULT_AND_NAMED,
  DEFAULT_EXPORT_TYPE_ALL,
  DEFAULT_IGNORE,
  DEFAULT_INCLUDE,
} from "./constants";
import type { GenerateIndexFilesOptions } from "./types";

/**
 * exportの形式
 * 複数の形式の条件に一致した場合は、ここに定義した順で先に一致したものを使う\
 * 範囲の広い`exportAll`は最後に判定し、個別の指定を優先する
 *
 * - type: exportの種類。デフォルトと名前付きの混在を判定するのに使う
 * - generate: exportのコード
 * - generateDefaultOnly: 名前付きエクスポートを除外する場合のコード
 */
const EXPORTS = {
  exportAllAs: {
    type: "named",
    generate: (name: string) => `export * as ${name} from './${name}';`,
  },
  exportDefault: {
    type: "default",
    generate: (name: string) => `export { default } from './${name}';`,
  },
  exportDefaultAndNamed: {
    type: "both",
    // organize-importsで整形した場合と同じ順序で出力する
    generate: (name: string) =>
      `export { default as ${name}, default } from './${name}';`,
    generateDefaultOnly: (name: string) =>
      `export { default } from './${name}';`,
  },
  exportDefaultAs: {
    type: "named",
    generate: (name: string) =>
      `export { default as ${name} } from './${name}';`,
  },
  exportTypeAll: {
    type: "type",
    generate: (name: string) => `export type * from './${name}';`,
  },
  exportAll: {
    type: "named",
    generate: (name: string) => `export * from './${name}';`,
  },
} as const;

type ExportCode = {
  type: (typeof EXPORTS)[keyof typeof EXPORTS]["type"];
  code: string;
  defaultOnlyCode?: string;
};

/**
 * 対象のディレクトリ配下のindexファイルを作成する\
 * 対象ファイルで出力形式が特に指定されていない場合は下記の形式で出力\
 * `export { default as ${name} } from './${name}';`
 */
export default function generateIndexFiles(
  options: GenerateIndexFilesOptions = {},
) {
  const {
    srcPath = "src",
    indexFileName = "index.ts",
    ignore = DEFAULT_IGNORE,
    include = DEFAULT_INCLUDE,
    exclude = DEFAULT_EXCLUDE,
    includeNamedWithDefault = true,
    exportAll = DEFAULT_EXPORT_ALL,
    exportAllAs = DEFAULT_EXPORT_ALL_AS,
    exportDefault = DEFAULT_EXPORT_DEFAULT,
    exportDefaultAndNamed = DEFAULT_EXPORT_DEFAULT_AND_NAMED,
    exportTypeAll = DEFAULT_EXPORT_TYPE_ALL,
    eol = os.EOL,
    encoding = "utf8",
    ...rest
  } = options;
  const indexRegex = _createRegex(indexFileName);

  // indexファイルの作成処理を実行
  _generateIndexFiles(srcPath, indexRegex, {
    indexFileName,
    ignore,
    include,
    exclude,
    includeNamedWithDefault,
    exportAll,
    exportAllAs,
    exportDefault,
    exportDefaultAndNamed,
    exportTypeAll,
    eol,
    encoding,
    ...rest,
  });
}

function _generateIndexFiles(
  targetPath: string,
  indexRegex: RegExp,
  options: GenerateIndexFilesOptions,
) {
  const {
    indexFileName,
    ignore,
    include,
    exclude,
    includeNamedWithDefault,
    exportAll,
    exportAllAs,
    exportDefault,
    exportDefaultAndNamed,
    exportDefaultAs,
    exportTypeAll,
    dryRun,
    transform,
    eol,
    encoding,
  } = options;
  const exportTargets = {
    exportAll,
    exportAllAs,
    exportDefault,
    exportDefaultAndNamed,
    exportDefaultAs,
    exportTypeAll,
  };
  const stat = fs.statSync(targetPath);
  if (!stat.isDirectory()) {
    console.error(`"${targetPath}" is not directory.`);
  }
  const items = fs.readdirSync(targetPath);
  items.sort((a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1));
  const exportCodes: ExportCode[] = [];
  let hasDefaultExport = false;
  let hasNamedExport = false;

  for (const item of items) {
    const itemPath = path.join(targetPath, item);
    const { name } = path.parse(itemPath);
    const stat = fs.statSync(itemPath);

    let children;
    if (
      stat.isDirectory() &&
      !isMatchingPath(itemPath, ignore, { conditionOptions: { indexRegex } })
    ) {
      // ディレクトリの場合は先に子要素を処理
      children = _generateIndexFiles(itemPath, indexRegex, options);
    }
    const isMatchingPathOptions = {
      conditionOptions: { indexRegex, children },
    };

    if (
      !indexRegex.test(item) &&
      isMatchingPath(itemPath, include, isMatchingPathOptions) &&
      !isMatchingPath(itemPath, exclude, isMatchingPathOptions)
    ) {
      // indexではない場合
      let isExported = false;
      for (const type in EXPORTS) {
        const exportType = type as keyof typeof EXPORTS;
        const exportTarget = exportTargets[exportType];
        if (
          exportTarget &&
          isMatchingPath(itemPath, exportTarget, isMatchingPathOptions)
        ) {
          // 条件に一致した場合はexportのコードを生成
          const EXPORT = EXPORTS[exportType];
          exportCodes.push({
            type: EXPORT.type,
            code: EXPORT.generate(name),
            defaultOnlyCode:
              "generateDefaultOnly" in EXPORT
                ? EXPORT.generateDefaultOnly(name)
                : undefined,
          });
          // exportの種類に応じたフラグを立てる
          if (EXPORT.type === "named" || EXPORT.type === "both") {
            hasNamedExport = true;
          }
          if (EXPORT.type === "default" || EXPORT.type === "both") {
            hasDefaultExport = true;
          }
          isExported = true;
          break;
        }
      }
      if (!isExported) {
        // 未指定の場合はexportDefaultAs
        exportCodes.push({
          type: EXPORTS.exportDefaultAs.type,
          code: EXPORTS.exportDefaultAs.generate(name),
        });
        hasNamedExport = true;
      }
    }
  }

  if (exportCodes.length) {
    let exports: string[];
    if (hasDefaultExport && hasNamedExport && !includeNamedWithDefault) {
      // デフォルトエクスポートと名前付きエクスポートの混在を許さない場合は名前付きエクスポートを除外
      exports = exportCodes.reduce<string[]>((result, exportCode) => {
        if (exportCode.type === "both") {
          result.push(exportCode.defaultOnlyCode!);
        } else if (exportCode.type !== "named") {
          result.push(exportCode.code);
        }
        return result;
      }, []);
    } else {
      exports = exportCodes.map((exportCode) => exportCode.code);
    }
    if (transform) {
      exports = transform(exports);
    }

    const indexPath = path.join(targetPath, indexFileName);
    if (!dryRun) {
      // indexファイルの出力
      fs.writeFileSync(indexPath, exports.join(eol) + eol, {
        encoding,
      });
      console.info(indexPath);
    } else {
      console.info(indexPath + "-------------------------------------");
      console.info(exports.join(eol) + eol);
    }
  }

  return items;
}

function _createRegex(str: string) {
  return new RegExp(
    `^${str.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, "\\$&")}$`,
    "i",
  );
}
