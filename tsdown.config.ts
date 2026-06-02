import distPackage from '@niche-works/rollup-plugin-dist-package';
import copy from 'rollup-plugin-copy';
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/**/*.ts'],
  unbundle: true,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ['cjs', 'esm'],
  minify: false,
  inputOptions: {
    external(source, _importer, isResolved) {
      if (!isResolved) {
        return (
          !source.startsWith('.') &&
          !source.startsWith('/') &&
          !source.startsWith('src/')
        );
      }
    },
  },
  plugins: [
    distPackage({
      content: {
        exports: {
          '.': {
            import: './index.mjs',
            require: './index.cjs',
          },
          './*': {
            import: './*/index.mjs',
            require: './*/index.cjs',
          },
          './constants': {
            import: './constants.mjs',
            require: './constants.cjs',
          },
          './*/constants': {
            import: './*/constants.mjs',
            require: './*/constants.cjs',
          },
        },
      },
      resolveWorkspaceDeps: true,
    }),
    copy({
      targets: [
        {
          src: ['LICENSE', 'README.md', 'README.ja.md'],
          dest: 'dist',
        },
      ],
    }),
  ],
});
