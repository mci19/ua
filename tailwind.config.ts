import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1440px" },
    },
    extend: {
      colors: {
        "ua-red": {
          DEFAULT: "#D32737",
          600: "#B91E2C",
          700: "#9C1825",
        },
        "ua-navy": {
          DEFAULT: "#1B365F",
          600: "#152B4B",
          700: "#0F2138",
        },
        "ua-gray": {
          DEFAULT: "#9E9C9C",
          light: "#DBDBDB",
          ultralight: "#F4F4F5",
        },
        success: "#2F7D32",
        warning: "#C77700",
        danger: "#D32737",
        border: "hsl(220 14% 90%)",
        input: "hsl(220 14% 90%)",
        ring: "#1B365F",
        background: "#FFFFFF",
        foreground: "#0F172A",
        muted: { DEFAULT: "#F4F4F5", foreground: "#52525B" },
        accent: { DEFAULT: "#F4F4F5", foreground: "#0F172A" },
      },
      borderRadius: {
        DEFAULT: "4px",
        lg: "8px",
        md: "6px",
        sm: "2px",
      },
      fontFamily: {
        sans: ["var(--font-open-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        title: ["1.5rem", { lineHeight: "2rem", fontWeight: "700" }],
        header: ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600" }],
        body: ["1.125rem", { lineHeight: "1.625rem" }],
        label: ["1rem", { lineHeight: "1.5rem", fontWeight: "500" }],
        small: ["0.875rem", { lineHeight: "1.25rem" }],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [animate],
};

export default config;
