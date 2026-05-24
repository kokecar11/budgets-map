import { nextJsConfig } from "@workspace/eslint-config/next-js"

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  // Guard: ban raw Intl constructors and hardcoded locale tags outside the formatting lib
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["lib/format.ts", "lib/dates.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "NewExpression[callee.object.name='Intl'][callee.property.name='NumberFormat']",
          message:
            "Use formatCurrency() from @/lib/format instead of new Intl.NumberFormat().",
        },
        {
          selector:
            "NewExpression[callee.object.name='Intl'][callee.property.name='DateTimeFormat']",
          message:
            "Use fmtDateLocal() from @/lib/dates instead of new Intl.DateTimeFormat().",
        },
        {
          selector: "Literal[value='es-MX']",
          message:
            "Hardcoded locale tag 'es-MX' is banned. Import LOCALE_TAG from @/lib/dates.",
        },
        {
          selector: "Literal[value='en-US']",
          message:
            "Hardcoded locale tag 'en-US' is banned. Import LOCALE_TAG from @/lib/dates.",
        },
      ],
    },
  },
]
