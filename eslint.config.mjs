import theConfig from "@marcrock22/eslint";
import { config } from "typescript-eslint"

export default config(
    theConfig,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
    },
    {
        rules: {
            "@stylistic/quotes": ["error", "double"],
            "@typescript-eslint/no-invalid-void-type": "off",
            "@typescript-eslint/switch-exhaustiveness-check": "off",
            'no-shadow': 'off'
        }
    }
)