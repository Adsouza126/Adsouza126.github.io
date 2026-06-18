import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Rally brand — navy blue (structure) pulled from the logo.
        brand: {
          50: "#eef2f8",
          100: "#d9e1ee",
          200: "#b7c6dc",
          300: "#8ba1c2",
          400: "#6480a5",
          500: "#4E6A95", // secondary blue fill
          600: "#3f567b",
          700: "#334765",
          800: "#243a59",
          900: "#1A3154", // primary navy (logo outline)
        },
        // Accent orange — primary CTAs, active states, notifications.
        accent: {
          50: "#fcf0ec",
          100: "#f8dcd3",
          200: "#f1b8a7",
          300: "#e89177",
          400: "#dd6f50",
          500: "#D1694F", // hover / highlight
          600: "#CC502F", // primary CTA (RALLY text / pin)
          700: "#a83f22",
          800: "#8a3520",
          900: "#722d1d",
        },
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#1A3154",
          950: "#0f1d33",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.06)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
