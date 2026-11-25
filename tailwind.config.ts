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
          // Locked 3-Color Brand Palette:
          // 1. Forest Green (#143F2D)
          // 2. Panel Green (#23523F)
          // 3. Off-White (#FAFCF9)
          'forest': '#143F2D',
          'panel': '#23523F',
          'off-white': '#FAFCF9',

          // Semantic aliases mapped strictly to the locked 3-color system + neutral green-grey borders/text
          'cloud-white': '#FAFCF9',
          'mint-cream': '#F1F5F3',
          'soft-sage': '#D5E0DA',
          'fresh-green': '#23523F',
          'emerald': '#23523F',
          'deep-green': '#143F2D',
          'warm-beige': '#F4F6F5',
          'muted-slate': '#4A6558',

          // Compatibility mappings
          'deep-forest': '#143F2D',
          'forest-green': '#23523F',
          'leaf-green': '#23523F',
          'warm-white': '#FAFCF9',
          'charcoal': '#143F2D',
        },
      },
      fontFamily: {
        manrope: ['var(--font-manrope)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(20, 63, 45, 0.05), 0 1px 2px rgba(20, 63, 45, 0.03)',
        'card': '0 4px 20px -2px rgba(20, 63, 45, 0.06), 0 2px 6px -1px rgba(20, 63, 45, 0.03)',
        'elevated': '0 12px 30px -4px rgba(20, 63, 45, 0.10), 0 4px 12px -2px rgba(20, 63, 45, 0.04)',
      },
    },
  },
  plugins: [],
};
export default config;
