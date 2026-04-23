import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "Inter", "system-ui", "sans-serif"],
        serif: ["'Instrument Serif'", "Georgia", "serif"],
        mono: ["'Space Mono'", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(3.5rem, 7vw, 6rem)", { lineHeight: "0.98", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(2.75rem, 5.5vw, 4.5rem)", { lineHeight: "1.02", letterSpacing: "-0.028em" }],
        "display-md": ["clamp(2rem, 4vw, 3rem)", { lineHeight: "1.05", letterSpacing: "-0.022em" }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
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
        chat: {
          bubble: "hsl(var(--chat-bubble))",
        },
        step: {
          icon: "hsl(var(--step-icon))",
        },
        testimonial: {
          bg: "hsl(var(--testimonial-bg))",
        },
        section: {
          alt: "hsl(var(--section-alt))",
        },
        // Extended premium palette — glows available as bg/text utilities
        gold: { glow: "hsl(var(--gold-glow))" },
        violet: { glow: "hsl(var(--violet-glow))" },
        coral: { glow: "hsl(var(--coral-glow))" },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      boxShadow: {
        // Legacy names retained for backwards compat; values re-tuned for dark theme
        warm: "0 8px 24px -8px hsl(0 0% 0% / 0.45)",
        "warm-lg": "0 20px 48px -12px hsl(0 0% 0% / 0.6)",
        "primary-glow": "0 8px 32px -6px hsl(var(--primary) / 0.45)",
        // Premium depth stack
        "premium-sm": "0 1px 0 hsl(0 0% 100% / 0.04) inset, 0 2px 8px hsl(0 0% 0% / 0.4)",
        "premium-md": "0 1px 0 hsl(0 0% 100% / 0.05) inset, 0 4px 12px hsl(0 0% 0% / 0.4), 0 16px 40px -12px hsl(0 0% 0% / 0.5)",
        "premium-lg": "0 1px 0 hsl(0 0% 100% / 0.06) inset, 0 8px 24px -8px hsl(0 0% 0% / 0.5), 0 32px 72px -16px hsl(0 0% 0% / 0.7)",
        "ring-primary": "0 0 0 1px hsl(var(--primary) / 0.28), 0 20px 48px -12px hsl(var(--primary) / 0.28)",
      },
      backgroundImage: {
        "mesh-hero":
          "radial-gradient(ellipse 60% 80% at 20% 20%, hsl(var(--gold-glow) / 0.22), transparent 55%), radial-gradient(ellipse 50% 70% at 85% 30%, hsl(var(--violet-glow) / 0.18), transparent 60%), radial-gradient(ellipse 70% 60% at 60% 95%, hsl(var(--coral-glow) / 0.14), transparent 60%), linear-gradient(180deg, hsl(235 18% 6%) 0%, hsl(235 20% 4%) 100%)",
        "gradient-warm":
          "linear-gradient(110deg, hsl(var(--gold-glow)) 0%, hsl(var(--coral-glow)) 55%, hsl(var(--violet-glow)) 100%)",
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
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "float-subtle": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "orb-drift-a": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(40px, -30px, 0) scale(1.08)" },
        },
        "orb-drift-b": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(-50px, 40px, 0) scale(1.12)" },
        },
        "orb-drift-c": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(30px, 50px, 0) scale(0.94)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        float: "float 4s ease-in-out infinite",
        "float-subtle": "float-subtle 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        "orb-drift-a": "orb-drift-a 22s ease-in-out infinite",
        "orb-drift-b": "orb-drift-b 28s ease-in-out infinite",
        "orb-drift-c": "orb-drift-c 26s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
