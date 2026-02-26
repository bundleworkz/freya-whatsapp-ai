/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        freya: {
          primary: "#2E7D6F",
          dark: "#1B4D43",
          light: "#E8F5F1",
          accent: "#D4A574",
        },
      },
    },
  },
  plugins: [],
};
