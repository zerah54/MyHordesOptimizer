import path from "node:path";
import {fileURLToPath} from "node:url";
import js from "@eslint/js";
import {FlatCompat} from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname, recommendedConfig: js.configs.recommended, allConfig: js.configs.all
});

export default [{
    ignores: ["projects/**/*", "*/**/test.ts", "*/**/typings.d.ts"],
}, ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:@angular-eslint/recommended", "plugin:@angular-eslint/template/process-inline-templates",).map(config => ({
    ...config, files: ["**/*.ts"],
})), {
    files: ["**/*.ts"],

    languageOptions: {
        ecmaVersion: 5, sourceType: "script",

        parserOptions: {
            project: ["tsconfig.json", "e2e/tsconfig.json"], createDefaultProgram: true,
        },
    },

    rules: {
        "@angular-eslint/use-lifecycle-interface": "error",

        "@angular-eslint/component-selector": ["error", {
            prefix: "mho", style: "kebab-case", type: "element",
        }],

        "@angular-eslint/directive-selector": ["error", {
            prefix: "mho", style: "camelCase", type: "attribute",
        }],

        semi: ["warn", "always"],
        quotes: ["warn", "single"],
        "object-curly-spacing": ["warn", "always"],
        eqeqeq: ["error", "always"],
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/explicit-function-return-type": "error",

        "@typescript-eslint/typedef": ["error", {
            arrayDestructuring: true,
            arrowParameter: true,
            memberVariableDeclaration: true,
            objectDestructuring: true,
            parameter: true,
            propertyDeclaration: true,
            variableDeclaration: true,
            variableDeclarationIgnoreFunction: true,
        }],

        "@typescript-eslint/array-type": "warn",
    },
}, ...compat.extends("plugin:@angular-eslint/template/recommended").map(config => ({
    ...config, files: ["**/*.html"],
})), {
    files: ["**/*.html"], rules: {},
}];