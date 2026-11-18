import eslintcf from "@marcrock22/eslintcf";
import { configs as seyfert } from "@slipher/eslint-plugin";
import tseslint from "typescript-eslint";

/**
 * oxfmt owns formatting and import order. `eslintcf` ships `@stylistic` and
 * `perfectionist` rules that would fight it (quotes, comma dangle, import
 * sorting), so those are disabled here while the rest of the config stays.
 */
const stylisticConfig = eslintcf.find((config) => config.plugins?.["@stylistic"]);
const perfectionistConfig = eslintcf.find((config) => config.plugins?.perfectionist);

const disableStylistic = Object.fromEntries(Object.keys(stylisticConfig?.rules ?? {}).map((rule) => [rule, "off"]));
const disablePerfectionist = Object.fromEntries(
    Object.keys(perfectionistConfig?.rules ?? {})
        .filter((rule) => rule.startsWith("perfectionist/"))
        .map((rule) => [rule, "off"]),
);

/**
 * Rules that contradict the project's intentional style or would require a
 * separate refactor. Keep this list small and justified.
 */
const curatedRules = {
    // The project uses single-line `if`s, explicit type annotations, mixed
    // `interface`/`type`, and `void` unions on purpose.
    curly: "off",
    "@typescript-eslint/class-methods-use-this": "off",
    "@typescript-eslint/consistent-type-definitions": "off",
    "@typescript-eslint/no-confusing-void-expression": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-invalid-void-type": "off",
    "@typescript-eslint/no-shadow": "off",
    "@typescript-eslint/no-use-before-define": "off",

    // Opinionated unicorn rules that do not match the current codebase.
    "unicorn/consistent-function-scoping": "off",
    "unicorn/custom-error-definition": "off",
    "unicorn/explicit-length-check": "off",
    "unicorn/no-await-expression-member": "off",
    "unicorn/no-keyword-prefix": "off",
    "unicorn/no-process-exit": "off",
    "unicorn/no-unreadable-array-destructuring": "off",
    "unicorn/prefer-simple-condition-first": "off",
    "unicorn/prefer-ternary": "off",
};

export default tseslint.config(
    {
        ignores: ["dist/**", "node_modules/**", "src/generated/**", "cache/**", "logs/**"],
    },
    ...eslintcf,
    ...seyfert.recommended,
    {
        files: ["**/*.ts"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            ...disableStylistic,
            ...disablePerfectionist,
            ...curatedRules,
        },
    },
);
