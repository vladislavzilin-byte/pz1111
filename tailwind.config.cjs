module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { red: "#ff4747", orange: "#ff6a00" }
      },
      boxShadow: { card: "0 2px 10px rgba(0,0,0,0.06)" }
    }
  },
  plugins: [],
}
