import fs from 'fs-extra';
import path from 'path';
import { assertDirectory } from '../_internal/assertPath';
import compareNames from '../_internal/compareNames';
import type { ExportForm } from '../_internal/exportForms';
import { EXPORT_FORMS, isIdentifierName } from '../_internal/exportForms';
import toPosixPath from '../_internal/toPosixPath';
import isMatchingPath, { type IsMatchingPathOptions } from '../isMatchingPath';
import {
  DEFAULT_EXCLUDE,
  DEFAULT_EXPORT_ALL,
  DEFAULT_EXPORT_ALL_AS,
  DEFAULT_EXPORT_DEFAULT,
  DEFAULT_EXPORT_DEFAULT_AND_NAMED,
  DEFAULT_EXPORT_TYPE_ALL,
  DEFAULT_IGNORE,
  DEFAULT_INCLUDE,
} from './constants';
import type { GenerateIndexFilesOptions } from './types';

/**
 * 条件を判定する順のexportの形式
 * 複数の形式の条件に一致した場合は、先に一致したものを使う\
 * 範囲の広い`exportAll`は最後に判定し、個別の指定を優先する
 */
const EXPORT_FORM_ORDER = [
  'exportAllAs',
  'exportDefault',
  'exportDefaultAndNamed',
  'exportDefaultAs',
  'exportTypeAll',
  'exportAll',
] as const satisfies readonly ExportForm[];

type ExportItem = {
  /**
   * exportの形式
   */
  form: ExportForm;

  /**
   * export名・モジュール名に使う名前
   */
  name: string;

  /**
   * 対象のパス
   */
  itemPath: string;
};

type PrivateGenerateIndexFilesResult = {
  /**
   * 子要素のリスト
   */
  children: string[];

  /**
   * 出力したindexファイルのパス
   */
  indexPaths: string[];

  /**
   * indexファイルを生成したか（`dryRun`では生成する予定か）
   */
  hasIndex: boolean;
};

/**
 * 対象のディレクトリ配下のindexファイルを作成する\
 * 対象ファイルで出力形式が特に指定されていない場合は下記の形式で出力\
 * `export { default as ${name} } from './${name}';`\
 * `srcPath`がディレクトリでない場合や、名前がexport名に使えない場合は例外を投げる
 */
export default function generateIndexFiles(
  options: GenerateIndexFilesOptions = {},
): string[] {
  const {
    srcPath = 'src',
    indexFileName = 'index.ts',
    ignore = DEFAULT_IGNORE,
    include = DEFAULT_INCLUDE,
    exclude = DEFAULT_EXCLUDE,
    omitNamedWithDefault = false,
    exportAll = DEFAULT_EXPORT_ALL,
    exportAllAs = DEFAULT_EXPORT_ALL_AS,
    exportDefault = DEFAULT_EXPORT_DEFAULT,
    exportDefaultAndNamed = DEFAULT_EXPORT_DEFAULT_AND_NAMED,
    exportTypeAll = DEFAULT_EXPORT_TYPE_ALL,
    eol = '\n',
    encoding = 'utf8',
    ...rest
  } = options;
  assertDirectory(srcPath);
  const indexRegex = _createRegex(indexFileName);

  // indexファイルの作成処理を実行
  const result = _generateIndexFiles(toPosixPath(srcPath), indexRegex, {
    indexFileName,
    ignore,
    include,
    exclude,
    omitNamedWithDefault,
    exportAll,
    exportAllAs,
    exportDefault,
    exportDefaultAndNamed,
    exportTypeAll,
    eol,
    encoding,
    ...rest,
  });

  return result.indexPaths;
}

function _generateIndexFiles(
  targetPath: string,
  indexRegex: RegExp,
  options: GenerateIndexFilesOptions & { indexFileName: string },
): PrivateGenerateIndexFilesResult {
  const {
    indexFileName,
    ignore,
    include,
    exclude,
    omitNamedWithDefault,
    dryRun,
    transform,
    eol,
    encoding,
  } = options;
  const items = fs.readdirSync(targetPath);
  items.sort(compareNames);
  const exportItems: ExportItem[] = [];

  const indexPaths: string[] = [];
  for (const item of items) {
    const itemPath = path.posix.join(targetPath, item);
    const isDirectory = fs.statSync(itemPath).isDirectory();
    // ディレクトリは`.`を含んでいてもそのままの名前を使う
    const name = isDirectory ? item : path.posix.parse(item).name;

    let children: string[] | undefined;
    let hasIndex = false;
    if (isDirectory) {
      if (
        !isMatchingPath(itemPath, ignore, { conditionOptions: { indexRegex } })
      ) {
        // ディレクトリの場合は先に子要素を処理
        const dirResult = _generateIndexFiles(itemPath, indexRegex, options);
        indexPaths.push(...dirResult.indexPaths);
        children = dirResult.children;
        hasIndex = dirResult.hasIndex;
      } else {
        // 処理しないディレクトリは既存のindexファイルの有無で判定
        hasIndex = fs
          .readdirSync(itemPath)
          .some((child) => indexRegex.test(child));
      }
    }
    const isMatchingPathOptions: IsMatchingPathOptions<object> = {
      conditionOptions: { indexRegex, children, hasIndex },
    };

    if (
      !indexRegex.test(item) &&
      isMatchingPath(itemPath, include, isMatchingPathOptions) &&
      !isMatchingPath(itemPath, exclude, isMatchingPathOptions)
    ) {
      // indexではない場合
      // 条件に一致した形式を使い、未指定の場合はexportDefaultAs
      const form =
        EXPORT_FORM_ORDER.find((candidate) =>
          isMatchingPath(itemPath, options[candidate], isMatchingPathOptions),
        ) ?? 'exportDefaultAs';
      exportItems.push({ form, name, itemPath });
    }
  }

  const indexPath = path.posix.join(targetPath, indexFileName);
  if (!exportItems.length) {
    if (items.some((item) => indexRegex.test(item))) {
      console.warn(
        `${indexPath}: There is nothing to export. The existing index file is left as is and is not exported from the parent directory.`,
      );
    }
    return { children: items, indexPaths, hasIndex: false };
  }

  // デフォルトエクスポートと名前付きエクスポートの混在を許さない場合は名前付きエクスポートを除外
  const types = exportItems.map(({ form }) => EXPORT_FORMS[form].type);
  const omitNamed =
    omitNamedWithDefault &&
    types.some((type) => type === 'default' || type === 'both') &&
    types.some((type) => type === 'named' || type === 'both');
  let exports: string[] = [];
  for (const { form, name, itemPath } of exportItems) {
    const exportForm = EXPORT_FORMS[form];
    if (omitNamed && exportForm.type === 'named') {
      continue;
    }
    if (omitNamed && form === 'exportDefaultAndNamed') {
      exports.push(
        EXPORT_FORMS.exportDefaultAndNamed.generateDefaultOnly(name),
      );
      continue;
    }
    if (exportForm.exportsName && !isIdentifierName(name)) {
      throw new Error(
        `"${itemPath}" cannot be exported as "${name}" because it is not a valid identifier. Rename it, or export it with exportDefault, exportAll or exportTypeAll.`,
      );
    }
    exports.push(exportForm.generate(name));
  }
  if (transform) {
    exports = transform(exports);
  }

  if (!dryRun) {
    // indexファイルの出力
    fs.writeFileSync(indexPath, exports.join(eol) + eol, {
      encoding,
    });
    console.info(indexPath);
  } else {
    console.info(indexPath + '-------------------------------------');
    console.info(exports.join(eol) + eol);
  }
  indexPaths.push(path.resolve(indexPath));

  return { children: items, indexPaths, hasIndex: true };
}

function _createRegex(str: string) {
  return new RegExp(
    `^${str.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&')}$`,
    'i',
  );
}
