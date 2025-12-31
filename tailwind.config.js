/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark navy base
        navy: {
          950: "#0a0c14",
          900: "#0f1221",
          800: "#161a2e",
          700: "#1e2340",
          600: "#282e52",
        },
        // Rich gold accents
        gold: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        // Warm amber for secondary highlights
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
        // Slate for text and borders
        slate: {
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
        },
      },
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        body: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Bigger scale
        'xs': ['0.8rem', { lineHeight: '1.2' }],
        'sm': ['0.925rem', { lineHeight: '1.4' }],
        'base': ['1.0625rem', { lineHeight: '1.6' }],
        'lg': ['1.2rem', { lineHeight: '1.5' }],
        'xl': ['1.375rem', { lineHeight: '1.4' }],
        '2xl': ['1.625rem', { lineHeight: '1.3' }],
        '3xl': ['2rem', { lineHeight: '1.2' }],
        '4xl': ['2.5rem', { lineHeight: '1.1' }],
        '5xl': ['3.25rem', { lineHeight: '1.05' }],
        '6xl': ['4rem', { lineHeight: '1' }],
        '7xl': ['5rem', { lineHeight: '1' }],
        '8xl': ['6.5rem', { lineHeight: '0.95' }],
      },
      spacing: {
        section: "2rem",
      },
      borderRadius: {
        container: "1rem",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2s linear infinite",
        "sparkle": "sparkle 2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        sparkle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.8)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gold-shimmer": "linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24, #f59e0b)",
      },
    },
  },
  plugins: [],
};
