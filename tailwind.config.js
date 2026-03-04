/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // iOS System Green (primary tint — grocery/food context)
        primary: {
          50:  '#F0FEF4',
          100: '#DCFCE7',
          500: '#34C759',   // iOS systemGreen
          600: '#30B050',   // slightly darker for pressed state
          700: '#248A3D',
        },
        // iOS System Colors
        ios: {
          bg:        '#F2F2F7',   // systemGroupedBackground
          card:      '#FFFFFF',   // systemBackground
          gray:      '#8E8E93',   // systemGray (secondary label)
          gray2:     '#AEAEB2',   // systemGray2
          separator: '#E5E5EA',   // systemGray5 (used as separator)
          blue:      '#007AFF',   // systemBlue
          red:       '#FF3B30',   // systemRed
          orange:    '#FF9500',   // systemOrange
          label:     '#1C1C1E',   // label (primary text)
        },
        accent: '#007AFF',
      },
    },
  },
  plugins: [],
};
