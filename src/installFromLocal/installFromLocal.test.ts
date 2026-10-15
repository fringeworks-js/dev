import path from 'path';
import {
  createTempDir,
  exists,
  readFile,
  removeTempDir,
} from '../../test/tempDir';
import installFromLocal from './installFromLocal';

describe('installFromLocal', () => {
  let dir: string;
  let localNodeModulesPath: string;
  let packageJsonPath: string;
  let nodeModulesPath: string;

  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    dir = createTempDir({
      'project/package.json': JSON.stringify({
        dependencies: {
          foo: 'file:../local/node_modules/foo',
          bar: '../local/node_modules/bar',
          baz: '^1.0.0',
        },
        devDependencies: {
          qux: 'file:../local2/node_modules/qux',
          missing: 'file:../local/node_modules/missing',
        },
      }),
      'project/node_modules/foo/old.js': '',
      'local/node_modules/foo/index.js': 'foo',
      'local/node_modules/bar/index.js': 'bar',
      'local2/node_modules/qux/index.js': 'qux',
    });
    localNodeModulesPath = path.join(dir, 'local/node_modules');
    packageJsonPath = path.join(dir, 'project/package.json');
    nodeModulesPath = path.join(dir, 'project/node_modules');
  });

  afterEach(() => {
    removeTempDir(dir);
    vi.restoreAllMocks();
  });

  it('localNodeModulesPath配下を指す依存関係をコピーする', () => {
    installFromLocal(localNodeModulesPath, {
      packageJsonPath,
      nodeModulesPath,
    });
    expect(readFile(dir, 'project/node_modules/foo/index.js')).toBe('foo');
    expect(readFile(dir, 'project/node_modules/bar/index.js')).toBe('bar');
    // 名前の先頭が同じだけの別のディレクトリは対象外
    expect(exists(dir, 'project/node_modules/qux')).toBe(false);
    expect(exists(dir, 'project/node_modules/baz')).toBe(false);
    expect(exists(dir, 'project/node_modules/missing')).toBe(false);
  });

  it('既にインストールされているものは削除してからコピーする', () => {
    installFromLocal(localNodeModulesPath, {
      packageJsonPath,
      nodeModulesPath,
    });
    expect(exists(dir, 'project/node_modules/foo/old.js')).toBe(false);
  });

  it('依存関係のパスはpackage.jsonのあるディレクトリを基準に解決する', () => {
    // カレントディレクトリはテスト対象のディレクトリと無関係
    expect(process.cwd()).not.toBe(path.join(dir, 'project'));
    installFromLocal(localNodeModulesPath, {
      packageJsonPath,
      nodeModulesPath,
    });
    expect(exists(dir, 'project/node_modules/foo/index.js')).toBe(true);
  });

  it('dryRunではコピーしない', () => {
    installFromLocal(localNodeModulesPath, {
      packageJsonPath,
      nodeModulesPath,
      dryRun: true,
    });
    expect(exists(dir, 'project/node_modules/foo/old.js')).toBe(true);
    expect(exists(dir, 'project/node_modules/bar')).toBe(false);
  });

  it('localNodeModulesPathやpackage.jsonが存在しない場合は例外を投げる', () => {
    expect(() =>
      installFromLocal(path.join(dir, 'missing'), {
        packageJsonPath,
        nodeModulesPath,
      }),
    ).toThrow('does not exist');
    expect(() =>
      installFromLocal(localNodeModulesPath, {
        packageJsonPath: path.join(dir, 'missing.json'),
        nodeModulesPath,
      }),
    ).toThrow('does not exist');
  });
});
