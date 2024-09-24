/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        bg: "#1a1a1a",
        dark: "#8A8A8A",
        "soft-white": "#F0F0F0",
      },
    },
  },
  plugins: [],
};
