import eslint from "@eslint/js";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";
import angular from "angular-eslint";

export default tseslint.config(
    {
        ignores: ["projects/**/*", "*/**/test.ts", "*/**/typings.d.ts"],
    },
    {
        files: ["**/*.ts"],
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
            ...angular.configs.tsRecommended,
        ],
        processor: angular.processInlineTemplates,
        plugins: {
            "simple-import-sort": simpleImportSort,
        },
        rules: {
            "@angular-eslint/use-lifecycle-interface": "error",

            "@angular-eslint/component-selector": ["error", {
                prefix: "mho",
                style: "kebab-case",
                type: "element",
            }],

            "@angular-eslint/directive-selector": ["error", {
                prefix: "mho",
                style: "camelCase",
                type: "attribute",
            }],

            indent: ["error", 4, {
                SwitchCase: 1,
                FunctionDeclaration: {
                    parameters: 'first'
                },
                FunctionExpression: {
                    parameters: 'first'
                },
                CallExpression: {
                    arguments: 'first'
                },
                ArrayExpression: 'first',
                ObjectExpression: 'first',
                ImportDeclaration: 'first'
            }],
            semi: ["warn", "always"],
            quotes: ["warn", "single"],
            "simple-import-sort/imports": "error",
            "object-curly-spacing": ["warn", "always"],
            eqeqeq: ["error", "always"],
            "@typescript-eslint/no-inferrable-types": "off",
            "@typescript-eslint/explicit-function-return-type": "error",
            "@typescript-eslint/explicit-member-accessibility": "error",

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

            "@typescript-eslint/array-type": "warn"
        },
    },
    {
        files: ["**/*.html"],
        extends: [
            ...angular.configs.templateRecommended,
        ],
        rules: {},
    },
);
