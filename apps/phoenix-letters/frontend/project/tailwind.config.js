/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Phoenix Ecosystem Colors
        phoenix: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#ff4500", // Primary Phoenix Orange
          600: "#ff6b35", // Secondary Phoenix Orange
          700: "#ff8c42", // Accent Phoenix Orange
          800: "#c2410c",
          900: "#9a3412",
        },
        luna: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1", // Primary Luna Indigo
          600: "#8b5cf6", // Secondary Luna Violet
          700: "#06b6d4", // Accent Luna Cyan
          800: "#4338ca",
          900: "#3730a3",
        },
        // System Colors
        success: {
          500: "#10b981", // Emerald
        },
        warning: {
          500: "#f59e0b", // Amber
        },
        error: {
          500: "#ef4444", // Red
        },
        info: {
          500: "#3b82f6", // Blue
        },
        // Legacy shadcn colors for compatibility
        primary: {
          DEFAULT: "#ff4500", // Phoenix primary
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#6366f1", // Luna primary
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
      backgroundImage: {
        // Phoenix-Luna Ecosystem Gradients
        'phoenix-gradient': 'linear-gradient(135deg, #ff4500 0%, #ff6b35 50%, #ff8c42 100%)',
        'luna-gradient': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
        // Legacy gradients for compatibility
        'gradient-primary': 'linear-gradient(135deg, #ff4500 0%, #ff6b35 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'gradient-success': 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        'gradient-warning': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};