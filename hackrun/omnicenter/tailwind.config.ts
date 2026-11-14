import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: { ink: "#12332E", capim: "#C9962B", papel: "#F7F8F4", giz: "#E3E8E2", sos: "#C62828", musgo: "#4A5B57" },
    fontFamily: { titulo: ["var(--f-titulo)", "system-ui"], corpo: ["var(--f-corpo)", "system-ui"] },
  } },
  plugins: [],
} satisfies Config;
