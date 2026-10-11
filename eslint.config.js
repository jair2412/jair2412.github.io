import js from '@eslint/js'
import globals from 'globals'

export default [
  // Reglas recomendadas de ESLint para todo el código
  js.configs.recommended,

  // La API corre en Node.js (CommonJS): habilita globals como process y require
  {
    files: ['api/**/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
    rules: {
      // Express exige 4 parámetros en el manejador de errores (err, req, res, next)
      // aunque no se use "next". Por convención, los parámetros que empiezan
      // con "_" se declaran como no usados a propósito y ESLint los ignora.
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // El libro de visitas corre en el navegador: habilita document, fetch, etc.
  {
    files: ['libro-de-visitas.js'],
    languageOptions: { sourceType: 'script', globals: globals.browser },
  },

  // Carpetas que ESLint debe ignorar
  { ignores: ['node_modules/**', '_site/**', 'api/node_modules/**'] },
]
