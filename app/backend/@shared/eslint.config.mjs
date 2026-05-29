import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import { importSortConfig, sharedRules } from '../../../eslint.config.base.mjs';

const ignores = [
  'dist/**',
  'node_modules/**',
  'coverage/**',
  'eslint.config.mjs',
  'vite.config.ts',
];

export const createBackendConfig = (dir) => [
  { ignores },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  importSortConfig,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        project: true,
        tsconfigRootDir: dir,
      },
    },
    rules: sharedRules,
  },
  prettier,
];

export default createBackendConfig(import.meta.dirname);
