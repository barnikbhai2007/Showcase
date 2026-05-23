import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*']
  },
  {
    files: ['**/*.rules'],
    plugins: {
      'firebase-security-rules': firebaseRulesPlugin
    },
    // We must manually configure the processor if we use the flat config, or rely on the recommended set.
  },
  firebaseRulesPlugin.configs['flat/recommended']
];
