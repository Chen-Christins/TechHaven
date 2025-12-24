import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";

export default defineConfig([
    { ignores: ["dist", "node_modules", "src/sample", ".prettierrc.cjs"] },
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        plugins: { js },
        extends: ["js/recommended"],
        languageOptions: { globals: globals.browser },
        settings: { react: { version: "detect" } },
    },
    tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    reactHooks.configs["recommended-latest"],
    {
        rules: {
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-empty-object-type": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_|^err|^error|^ev|^event",
                    varsIgnorePattern: "^_|^err|^error|^ev|^event",
                    caughtErrorsIgnorePattern: "^_|^e$|^err|^error",
                },
            ],
            "@typescript-eslint/no-unused-expressions": "off",
            "no-case-declarations": "off",
            "no-dupe-else-if": "off",
            "no-useless-catch": "off",
            "prefer-const": "off",
            "react/display-name": "off",
            "react/react-in-jsx-scope": "off",
            "react/no-unescaped-entities": "off",
            "react-hooks/exhaustive-deps": "warn",
        },
    },
]);
