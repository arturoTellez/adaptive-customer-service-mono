import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kavak: {
          navy: '#002C5F',
          blue: '#003D82',
          'blue-light': '#0052A3',
          orange: '#FF6B35',
          'orange-light': '#FF8C61',
          gray: {
            50: '#F8FAFC',
            100: '#F1F5F9', 
            200: '#E2E8F0',
            300: '#CBD5E1',
            400: '#94A3B8',
            500: '#64748B',
            600: '#475569',
            700: '#334155',
            800: '#1E293B',
            900: '#0F172A',
          }
        }
      },
    },
  },
  plugins: [],
};
export default config;