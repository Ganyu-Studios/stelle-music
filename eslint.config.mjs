import eslintcf from "@marcrock22/eslintcf";
import { configs as seyfert } from "@slipher/eslint-plugin";
import tseslint from "typescript-eslint";

/**
 * oxfmt owns layout and import order. A few `@stylistic` rules make the same
 * decisions as the formatter and cannot be aligned with it (line breaks after
 * arrows, extra parentheses, single-statement bodies, bracket list style), so
 * they stay off: enabling them causes a fix -> format -> fix loop.
 *
 * Keep the blanket disable (new eslintcf rules stay off until reviewed) and
 * re-enable only the rules whose output is a fixed point of oxfmt.
 */
const stylisticConfig = eslintcf.find((config) => config.plugins?.["@stylistic"]);
const perfectionistConfig = eslintcf.find((config) => config.plugins?.perfectionist);

const formatterOwnedRules = new Set([
    "@stylistic/exp-jsx-props-style",
    "@stylistic/implicit-arrow-linebreak",
    "@stylistic/list-style",
    "@stylistic/no-extra-parens",
    "@stylistic/nonblock-statement-body-position",
]);

const disableStylistic = Object.fromEntries(Object.keys(stylisticConfig?.rules ?? {}).map((rule) => [rule, "off"]));
const reenableStylistic = Object.fromEntries(
    Object.entries(stylisticConfig?.rules ?? {}).filter(([rule]) => !formatterOwnedRules.has(rule)),
);
const alignStylistic = {
    // Safe to enforce once the options match `.oxfmtrc.json`.
    "@stylistic/quotes": ["error", "double"],
    "@stylistic/comma-dangle": ["error", "always-multiline"],
    // eslintcf uses the rule's "always" default; oxfmt keeps short ternaries on one line.
    "@stylistic/multiline-ternary": ["error", "always-multiline"],
};

/**
 * `perfectionist/sort-imports` would fight oxfmt's `sortImports`; the rest only
 * reorder AST members. All of them stay off because the configured ordering is
 * opinionated and would require a separate refactor.
 */
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
            ...reenableStylistic,
            ...alignStylistic,
            ...disablePerfectionist,
            ...curatedRules,
        },
    },
);
