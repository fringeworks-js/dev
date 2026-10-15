import writeExports from '../src/writeExports';

writeExports({
  extraExports: {
    // 各パッケージの tsconfig.json から extends する共通の設定
    './tsconfig.base.json': './tsconfig.base.json',
  },
});
