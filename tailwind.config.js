/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        fg: "var(--color-fg)",
        muted: "var(--color-muted)",
        accent: "var(--color-accent)",
        "accent-fg": "var(--color-accent-fg)",
        border: "var(--color-border)",
        focus: "var(--color-focus)",
      },
      fontSize: {
        // All sizes scale off --font-scale so user text-size control affects everything.
        base: "calc(1rem * var(--font-scale, 1))",
        lg: "calc(1.125rem * var(--font-scale, 1))",
        xl: "calc(1.25rem * var(--font-scale, 1))",
        "2xl": "calc(1.5rem * var(--font-scale, 1))",
        "3xl": "calc(1.875rem * var(--font-scale, 1))",
        "4xl": "calc(2.25rem * var(--font-scale, 1))",
      },
      minHeight: { tap: "64px" },
      minWidth: { tap: "64px" },
    },
  },
  plugins: [],
};
