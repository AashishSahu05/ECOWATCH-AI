import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Approved 8-color palette
          'cloud-white': '#FAFCF9',
          'mint-cream': '#EFF7F0',
          'soft-sage': '#DCEBDD',
          'fresh-green': '#3B9B70',
          'emerald': '#237A55',
          'deep-green': '#194735',
          'lemon': '#D8EBA8',
          'warm-beige': '#F5F1E8',
          'muted-slate': '#3D5A4C',

          // Compatibility mappings for seamless aesthetic transition
          'deep-forest': '#194735',
          'forest-green': '#237A55',
          'leaf-green': '#3B9B70',
          'mint': '#D8EBA8',
          'warm-white': '#FAFCF9',
          'charcoal': '#194735',
        },
      },
      fontFamily: {
        manrope: ['var(--font-manrope)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(25, 71, 53, 0.04), 0 1px 2px rgba(25, 71, 53, 0.02)',
        'card': '0 4px 20px -2px rgba(25, 71, 53, 0.05), 0 2px 6px -1px rgba(25, 71, 53, 0.02)',
        'elevated': '0 12px 30px -4px rgba(25, 71, 53, 0.08), 0 4px 12px -2px rgba(25, 71, 53, 0.03)',
      },
    },
  },
  plugins: [],
};
export default config;
