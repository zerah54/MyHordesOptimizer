import path from "node:path";
import {fileURLToPath} from "node:url";
import js from "@eslint/js";
import {FlatCompat} from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["projects/**/*", "*/**/test.ts", "*/**/typings.d.ts"],
}, ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
).map(config => ({
    ...config,
    files: ["**/*.ts"],
})), {
    files: ["**/*.ts"],

    languageOptions: {
        ecmaVersion: 5,
        sourceType: "script",

        parserOptions: {
            project: ["tsconfig.json", "e2e/tsconfig.json"],
            createDefaultProgram: true,
        },
    },

    rules: {
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
        "sort-imports": ["error", {
            ignoreCase: false,
            ignoreDeclarationSort: false,
            ignoreMemberSort: false,
            memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
            allowSeparatedGroups: false
        }],
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
}, {
    files: ["**/*.html"],
    rules: {},
}];
