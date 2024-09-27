/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    fontFamily: {
      sans: ["Geist Sans", "sans-serif"],
      serif: ["Times New Roman", "serif"],
      fun: ["Rampart One", "sans-serif"],
      curly: ["My Soul", "sans-serif"],
    },
    extend: {
      colors: {
        background: "#1a1a1a",
        dark: "#8A8A8A",
        "soft-white": "#E6E6E6",
      },
    },
  },
  plugins: [],
};
