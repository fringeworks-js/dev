import * as prettier from 'prettier';
import createPrettierConfig from './createPrettierConfig';

describe('createPrettierConfig', () => {
  it('コードスタイルの既定値', async () => {
    const source = 'const a = {b: "c"}\nconst f = x => [a, x]\n';
    const formatted = await prettier.format(source, {
      ...createPrettierConfig(),
      filepath: 'a.ts',
    });
    expect(formatted).toBe("const a = { b: 'c' };\nconst f = (x) => [a, x];\n");
  });

  describe('import の整理', () => {
    const source = [
      "import { b, a } from './b';",
      "import { c } from './a';",
      '',
      'export const d = a + c;',
      '',
    ].join('\n');

    it('既定では並べ替えだけを行い、使っていない import を残す', async () => {
      const formatted = await prettier.format(source, {
        ...createPrettierConfig(),
        filepath: 'a.ts',
      });
      expect(formatted).toBe(
        [
          "import { c } from './a';",
          "import { a, b } from './b';",
          '',
          'export const d = a + c;',
          '',
        ].join('\n'),
      );
    });

    it('removeUnusedImports: true の場合は使っていない import を削除する', async () => {
      const formatted = await prettier.format(source, {
        ...createPrettierConfig({ removeUnusedImports: true }),
        filepath: 'a.ts',
      });
      expect(formatted).toBe(
        [
          "import { c } from './a';",
          "import { a } from './b';",
          '',
          'export const d = a + c;',
          '',
        ].join('\n'),
      );
    });
  });

  it('package.json のキーを並べ替える', async () => {
    const source = '{"version": "1.0.0", "name": "a"}';
    const formatted = await prettier.format(source, {
      ...createPrettierConfig(),
      filepath: 'package.json',
    });
    expect(formatted).toBe('{\n  "name": "a",\n  "version": "1.0.0"\n}\n');
  });
});
