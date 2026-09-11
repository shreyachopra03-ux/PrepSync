import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f5ff",
          100: "#dbe7ff",
          500: "#3b5bfd",
          600: "#2c46e0",
          700: "#2338b3",
        },
      },
    },
  },
  plugins: [],
};

export default config;
