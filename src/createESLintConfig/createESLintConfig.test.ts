import { ESLint } from 'eslint';
import createESLintConfig from './createESLintConfig';
import type { CreateESLintConfigOptions } from './types';

const rootDir = process.cwd();

function createESLint(options?: CreateESLintConfigOptions) {
  return new ESLint({
    cwd: rootDir,
    overrideConfigFile: true,
    overrideConfig: createESLintConfig(rootDir, options),
  });
}

async function lint(
  code: string,
  filePath: string,
  options?: CreateESLintConfigOptions,
) {
  const [result] = await createESLint(options).lintText(code, { filePath });
  return result!.messages.map((message) => message.ruleId);
}

describe('createESLintConfig', () => {
  it('tsconfigRootDir に rootDir を渡す', () => {
    const config = createESLintConfig('/path/to/package');
    const parserOptions = config.map(
      (item) => item.languageOptions?.parserOptions,
    );
    expect(parserOptions).toContainEqual({
      tsconfigRootDir: '/path/to/package',
    });
  });

  it('any を使うとエラー', async () => {
    expect(await lint('export const a: any = 1;\n', 'src/a.ts')).toEqual([
      '@typescript-eslint/no-explicit-any',
    ]);
  });

  it.each([
    'src/a.test.ts',
    'src/a.test-d.tsx',
    'e2e/a.e2e.spec.ts',
    'stories/a.stories.tsx',
    'stories/_internal/a.ts',
  ])(
    'テストと stories のファイル（%s）では any を許容する',
    async (filePath) => {
      expect(await lint('export const a: any = 1;\n', filePath)).toEqual([]);
    },
  );

  it('_ で始まる名前は使っていなくても許容する', async () => {
    const code = [
      'export function a(_b: number) {',
      '  const _c = 1;',
      '  try {',
      '    return 1;',
      '  } catch (_e) {',
      '    return 0;',
      '  }',
      '}',
      '',
    ].join('\n');
    expect(await lint(code, 'src/a.ts')).toEqual([]);
  });

  it('rest で残りを取り出すために分割代入した名前は許容する', async () => {
    const code =
      'export const a = ({ b, ...rest }: object & { b: 1 }) => rest;\n';
    expect(await lint(code, 'src/a.ts')).toEqual([]);
  });

  it('使っていない変数はエラー', async () => {
    expect(
      await lint('export function a() {\n  const b = 1;\n}\n', 'src/a.ts'),
    ).toEqual(['@typescript-eslint/no-unused-vars']);
  });

  it.each([
    'export function a(b: boolean) {\n  if (b) return 1;\n  return 0;\n}\n',
    'export function a(b: boolean) {\n  if (b) {\n    return 1;\n  } else return 0;\n}\n',
    'export function a(b: number[]) {\n  for (const c of b) console.log(c);\n}\n',
    'export function a(b: number) {\n  while (b > 0) b--;\n}\n',
  ])('本体を {} で囲まないと警告する（%#）', async (code) => {
    const [result] = await createESLint().lintText(code, {
      filePath: 'src/a.ts',
    });
    expect(result!.messages).toMatchObject([{ ruleId: 'curly', severity: 1 }]);
  });

  it('{} で囲まない本体は --fix で囲む', async () => {
    const eslint = new ESLint({
      cwd: rootDir,
      overrideConfigFile: true,
      overrideConfig: createESLintConfig(rootDir),
      fix: true,
    });
    const [result] = await eslint.lintText(
      'export function a(b: boolean) {\n  if (b) return 1;\n  return 0;\n}\n',
      { filePath: 'src/a.ts' },
    );
    expect(result!.output).toBe(
      'export function a(b: boolean) {\n  if (b) {return 1;}\n  return 0;\n}\n',
    );
  });

  it('アロー関数の本体は {} で囲まなくてもよい', async () => {
    expect(
      await lint('export const a = (b: number) => b * 2;\n', 'src/a.ts'),
    ).toEqual([]);
  });

  it('.tsx と src の外のファイルも対象にする', async () => {
    const code = 'export const a: any = 1;\n';
    expect(await lint(code, 'src/a.tsx')).toHaveLength(1);
    expect(await lint(code, 'scripts/a.ts')).toHaveLength(1);
    expect(await lint(code, 'vite.config.ts')).toHaveLength(1);
    // stories は any を許容するが、他のルールは適用する
    expect(
      await lint('export function a() {\n  const b = 1;\n}\n', 'stories/a.ts'),
    ).toEqual(['@typescript-eslint/no-unused-vars']);
  });

  it.each([
    'dist/index.mjs',
    'coverage/index.html',
    'storybook-static/index.js',
    'test-results/a.js',
  ])('%s は対象外', async (filePath) => {
    expect(await createESLint().isPathIgnored(filePath)).toBe(true);
  });

  describe('react', () => {
    const code = [
      "import { useState } from 'react';",
      '',
      'export function useA(b: boolean) {',
      '  if (b) {',
      '    useState(0);',
      '  }',
      '}',
      '',
    ].join('\n');

    it('既定では React のルールを含まない', async () => {
      expect(await lint(code, 'src/useA.ts')).toEqual([]);
    });

    it('true の場合は react-hooks のルールを追加する', async () => {
      expect(await lint(code, 'src/useA.ts', { react: true })).toContain(
        'react-hooks/rules-of-hooks',
      );
    });
  });
});
