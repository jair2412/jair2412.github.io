// ESLint 9, configuración plana. Node para la API y las pruebas, navegador para el frontend.
import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  { rules: { "no-unused-vars": ["error", { argsIgnorePattern: "^_" }] } },   // los middlewares de Express necesitan 4 argumentos
  { ignores: ["node_modules/", "api/node_modules/", "coverage/", "_site/"] },
  {
    files: ["api/**/*.js", "tests/**/*.js", "scripts/**/*.mjs", "eslint.config.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: globals.node },
  },
  {
    // web/public: el libro de visitas del LAB-04. libro-de-visitas.js: el de mi perfil en GitHub Pages
    files: ["web/public/**/*.js", "libro-de-visitas.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "script", globals: globals.browser },
  },
];
