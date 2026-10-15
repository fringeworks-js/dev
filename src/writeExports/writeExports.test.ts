import path from 'path';
import { createTempDir, readFile, removeTempDir } from '../../test/tempDir';
import writeExports from './writeExports';

describe('writeExports', () => {
  let dir: string;
  let packageJsonPath: string;
  let srcPath: string;

  beforeEach(() => {
    dir = createTempDir({
      'package.json': JSON.stringify({
        name: 'foo',
        exports: { './old': './old.ts' },
      }),
      'src/index.ts': '',
      'src/foo/index.ts': '',
    });
    packageJsonPath = path.join(dir, 'package.json');
    srcPath = path.join(dir, 'src');
  });

  afterEach(() => {
    removeTempDir(dir);
    vi.restoreAllMocks();
  });

  it('exportsを置き換える', () => {
    writeExports({ packageJsonPath, srcPath, prefix: './src/' });
    expect(JSON.parse(readFile(dir, 'package.json'))).toEqual({
      name: 'foo',
      exports: { '.': './src/index.ts', './foo': './src/foo/index.ts' },
    });
  });

  it('dryRunでは書き込まずにコンソールに出力する', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    writeExports({ packageJsonPath, srcPath, prefix: './src/', dryRun: true });
    expect(JSON.parse(readFile(dir, 'package.json')).exports).toEqual({
      './old': './old.ts',
    });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('./src/index.ts'));
  });

  it('package.jsonが存在しない場合は例外を投げる', () => {
    expect(() =>
      writeExports({
        packageJsonPath: path.join(dir, 'missing.json'),
        srcPath,
      }),
    ).toThrow('does not exist');
  });
});
