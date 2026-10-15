import path from 'path';
import { createTempDir, readFile, removeTempDir } from '../../test/tempDir';
import generatePublishPackageJson from './generatePublishPackageJson';

describe('generatePublishPackageJson', () => {
  let dir: string;
  let packageJsonPath: string;
  let outputPackageJsonPath: string;

  beforeEach(() => {
    dir = createTempDir({
      'package.json': JSON.stringify({
        name: '@fringeworks/foo',
        version: '1.0.0',
        private: true,
        description: 'desc',
        keywords: ['foo'],
        repository: { type: 'git', url: 'git+https://example.com/foo.git' },
        bugs: 'https://example.com/foo/issues',
        homepage: 'https://example.com/foo',
        author: 'author',
        contributors: ['contributor'],
        license: 'MIT',
        type: 'module',
        engines: { node: '>=18' },
        sideEffects: false,
        main: './src/index.ts',
        exports: { '.': './src/index.ts' },
        scripts: { build: 'tsdown' },
        dependencies: { a: '^1.0.0' },
        peerDependencies: { react: '>=18' },
        peerDependenciesMeta: { react: { optional: true } },
        optionalDependencies: { b: '^1.0.0' },
        devDependencies: { c: '^1.0.0' },
      }),
    });
    packageJsonPath = path.join(dir, 'package.json');
    // 出力先のディレクトリは存在しない
    outputPackageJsonPath = path.join(dir, 'dist/package.json');
  });

  afterEach(() => {
    removeTempDir(dir);
  });

  it('公開に必要な項目を引き継ぎ、exportsを設定する', () => {
    generatePublishPackageJson({ packageJsonPath, outputPackageJsonPath });
    const output = JSON.parse(readFile(dir, 'dist/package.json'));
    expect(output).toEqual({
      name: '@fringeworks/foo',
      version: '1.0.0',
      description: 'desc',
      keywords: ['foo'],
      repository: { type: 'git', url: 'git+https://example.com/foo.git' },
      bugs: 'https://example.com/foo/issues',
      homepage: 'https://example.com/foo',
      author: 'author',
      contributors: ['contributor'],
      license: 'MIT',
      type: 'module',
      engines: { node: '>=18' },
      sideEffects: false,
      exports: {
        '.': {
          import: { types: './index.d.mts', default: './index.mjs' },
          require: { types: './index.d.cts', default: './index.cjs' },
        },
        './*': {
          import: { types: './*/index.d.mts', default: './*/index.mjs' },
          require: { types: './*/index.d.cts', default: './*/index.cjs' },
        },
      },
      dependencies: { a: '^1.0.0' },
      peerDependencies: { react: '>=18' },
      peerDependenciesMeta: { react: { optional: true } },
      optionalDependencies: { b: '^1.0.0' },
    });
  });

  it('既定ではインデント2つで書き込む', () => {
    generatePublishPackageJson({
      packageJsonPath,
      outputPackageJsonPath,
      exports: './index.mjs',
    });
    expect(readFile(dir, 'dist/package.json')).toContain(
      '\n  "name": "@fringeworks/foo",\n',
    );
  });

  it('jsonWriteOptionsで書き込みのオプションを変えられる', () => {
    generatePublishPackageJson({
      packageJsonPath,
      outputPackageJsonPath,
      jsonWriteOptions: { spaces: 4 },
    });
    expect(readFile(dir, 'dist/package.json')).toContain(
      '\n    "name": "@fringeworks/foo",\n',
    );
  });

  it('exports・transformで内容を変えられる', () => {
    generatePublishPackageJson({
      packageJsonPath,
      outputPackageJsonPath,
      exports: './index.mjs',
      transform: ({ dependencies, ...rest }) => rest,
    });
    const output = JSON.parse(readFile(dir, 'dist/package.json'));
    expect(output.exports).toBe('./index.mjs');
    expect(output).not.toHaveProperty('dependencies');
  });

  it('元のpackage.jsonに無い項目は出力しない', () => {
    dir = createTempDir({
      'package.json': JSON.stringify({ name: 'foo', version: '1.0.0' }),
    });
    generatePublishPackageJson({
      packageJsonPath: path.join(dir, 'package.json'),
      outputPackageJsonPath: path.join(dir, 'dist/package.json'),
      exports: './index.mjs',
    });
    expect(JSON.parse(readFile(dir, 'dist/package.json'))).toEqual({
      name: 'foo',
      version: '1.0.0',
      exports: './index.mjs',
    });
  });

  it('package.jsonが存在しない場合は例外を投げる', () => {
    expect(() =>
      generatePublishPackageJson({
        packageJsonPath: path.join(dir, 'missing.json'),
        outputPackageJsonPath,
      }),
    ).toThrow('does not exist');
  });
});
