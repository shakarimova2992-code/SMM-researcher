import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12081f",
        surface: "#180a2b",
        card: "#1f0f37",
        violet: {
          50: "#f4ecff",
          100: "#e6d4ff",
          200: "#cda6ff",
          300: "#b078ff",
          400: "#9750ff",
          500: "#8226ff",
          600: "#6d0fe0",
          700: "#5709b3",
          800: "#3d0680",
          900: "#26034d",
        },
        flame: {
          400: "#ff8a5c",
          500: "#ff5f6d",
          600: "#ff3d7f",
        },
        mint: {
          400: "#3df2c0",
          500: "#1fd8a4",
        },
        gold: {
          400: "#ffd166",
          500: "#ffb703",
        },
      },
      fontFamily: {
        display: ["Unbounded", "system-ui", "sans-serif"],
        body: ["Manrope", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #8226ff 0%, #ff3d7f 55%, #ffb703 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, rgba(130,38,255,0.25) 0%, rgba(255,61,127,0.2) 55%, rgba(255,183,3,0.18) 100%)",
        "radial-glow": "radial-gradient(circle at top, rgba(151,80,255,0.35), transparent 60%)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(151, 80, 255, 0.35)",
        card: "0 20px 60px -20px rgba(0,0,0,0.5)",
      },
      borderRadius: {
        xl2: "1.75rem",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseGlow: "pulseGlow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
