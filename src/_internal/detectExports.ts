import fs from 'fs-extra';
import ts from 'typescript';

/**
 * モジュールのexportの有無
 */
export type DetectedExports = {
  /**
   * デフォルトエクスポートがあるか
   */
  hasDefault: boolean;

  /**
   * 値の名前付きエクスポートがあるか（`export *`も含む）
   */
  hasValue: boolean;

  /**
   * 型の名前付きエクスポートがあるか
   */
  hasType: boolean;
};

/**
 * ファイルの拡張子に対応するScriptKind
 */
const SCRIPT_KINDS: Record<string, ts.ScriptKind> = {
  '.ts': ts.ScriptKind.TS,
  '.tsx': ts.ScriptKind.TSX,
  '.js': ts.ScriptKind.JS,
  '.jsx': ts.ScriptKind.JSX,
};

/**
 * ファイルのexportの有無を、TypeScriptの構文木から調べる
 * `export { a }`のように型か値かを構文から判別できないものは、値として扱う
 * @param filePath ファイルのパス
 */
export default function detectExports(filePath: string): DetectedExports {
  const source = fs.readFileSync(filePath, 'utf8');
  const extension = /\.[^./]+$/.exec(filePath)?.[0].toLowerCase() ?? '';
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    false,
    SCRIPT_KINDS[extension] ?? ts.ScriptKind.TS,
  );
  const result: DetectedExports = {
    hasDefault: false,
    hasValue: false,
    hasType: false,
  };

  for (const statement of sourceFile.statements) {
    if (ts.isExportAssignment(statement)) {
      // export default ... / export = ...
      result.hasDefault = true;
    } else if (ts.isExportDeclaration(statement)) {
      _detectExportDeclaration(statement, result);
    } else if (_hasModifier(statement, ts.SyntaxKind.ExportKeyword)) {
      if (_hasModifier(statement, ts.SyntaxKind.DefaultKeyword)) {
        result.hasDefault = true;
      } else if (
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement)
      ) {
        result.hasType = true;
      } else {
        result.hasValue = true;
      }
    }
  }
  return result;
}

/**
 * `export { ... }`・`export * from`の内容を調べる
 */
function _detectExportDeclaration(
  statement: ts.ExportDeclaration,
  result: DetectedExports,
) {
  const { exportClause, isTypeOnly } = statement;
  if (!exportClause || ts.isNamespaceExport(exportClause)) {
    // export * from / export * as name from
    if (isTypeOnly) {
      result.hasType = true;
    } else {
      result.hasValue = true;
    }
    return;
  }
  for (const element of exportClause.elements) {
    if (element.name.text === 'default') {
      result.hasDefault = true;
    } else if (isTypeOnly || element.isTypeOnly) {
      result.hasType = true;
    } else {
      result.hasValue = true;
    }
  }
}

/**
 * 修飾子があるか
 */
function _hasModifier(node: ts.Node, kind: ts.SyntaxKind) {
  return (
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === kind)
  );
}
