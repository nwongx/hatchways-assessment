const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Raleway", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        gray: {
          200: "#E0E0E0",
          250: "#EFEFEF",
          350: "#8F8F8F",
        },
      },
    },
  },
  plugins: [],
};
