/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4CAF50",
        lightGreen: "#E8F5E9",
        darkText: "#1F2937",
        grayText: "#6B7280",
        border: "#E5E7EB",
        background: "#FFFFFF",
        bg: "#FFFFFF",
        text: "#1F2937",
      },
      boxShadow: {
        card: "0 6px 18px rgba(31, 41, 55, 0.06)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};
