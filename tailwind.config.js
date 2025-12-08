/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        // iPhone 14/15 Pro Max landscape (6.7" - 2796×1290px)
        'iphone-pro-max-landscape': { 
          'raw': '(min-width: 844px) and (max-width: 932px) and (orientation: landscape)' 
        },
        // iPhone 14/15 Pro landscape (6.1" - 2556×1179px)  
        'iphone-pro-landscape': { 
          'raw': '(min-width: 844px) and (max-width: 852px) and (orientation: landscape)' 
        },
        // General landscape for mobile devices
        'mobile-landscape': {
          'raw': '(max-width: 932px) and (orientation: landscape)'
        }
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
}