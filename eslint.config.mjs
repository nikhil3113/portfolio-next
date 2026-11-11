import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["components/ui/terminal.tsx"],
    rules: {
      // motion.create wraps the dynamic `as` element and is memoized on that
      // prop, so the created component is stable across renders.
      "react-hooks/static-components": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;
