/** @type {import('eslint').Linter.RulesRecord} */
export const sharedRules = {
  '@typescript-eslint/explicit-function-return-type': 'error',
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': 'error',
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/no-unnecessary-condition': 'warn',
  '@typescript-eslint/consistent-type-imports': 'error',
  '@typescript-eslint/no-shadow': 'error',
  '@typescript-eslint/prefer-readonly': 'error',
  '@typescript-eslint/only-throw-error': 'error',
  '@typescript-eslint/require-await': 'warn',
  eqeqeq: ['error', 'always'],
  curly: ['error', 'all'],
  'no-console': ['warn', { allow: ['warn', 'error'] }],
};
