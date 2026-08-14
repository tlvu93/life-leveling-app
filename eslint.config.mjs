import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * Flat config. `eslint-config-next` v16 ships native flat configs, so the
 * `@eslint/eslintrc` FlatCompat shim that was needed under v15 is gone.
 * `next lint` was removed in Next.js 16 — run ESLint directly (`npm run lint`).
 */
const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "apps/mobile/**",
      "next-env.d.ts",
      "src/generated/**",
    ],
  },
  ...coreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Surface accidentally-unused code, but let `_`-prefixed bindings through
      // so intentionally-ignored destructured values stay readable.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
      "no-var": "error",

      // React Compiler rule, newly an error in eslint-config-next 16.
      //
      // Every remaining hit is one of two shapes that cannot be fixed locally:
      //   1. an async loader called from a mount effect (and also from a manual
      //      refresh button) that flips `isLoading` before its first `await`;
      //   2. a `localStorage` read that must stay in an effect because
      //      `localStorage` does not exist during SSR.
      //
      // Clearing them means moving client-side data fetching to Suspense/`use()`
      // or `useSyncExternalStore`, which is its own piece of work. Downgraded to
      // a warning so it stays visible instead of being suppressed per-line.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
