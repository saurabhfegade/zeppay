import { extendTheme } from "@chakra-ui/react";

export const theme = extendTheme({
  colors: {
    brand: {
      50: '#f7fafc',
      100: '#edf2f7',
      200: '#e2e8f0',
      300: '#cbd5e0',
      400: '#a0aec0',
      500: '#718096',
      600: '#4a5568',
      700: '#2d3748',
      800: '#1a202c',
      900: '#171923',
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  semanticTokens: {
    colors: {
      // For semantic tokens, it's good practice to define for default (light) and _dark modes.
      // If only light mode is intended for now, direct values are fine, 
      // but using { default: ... } is more robust.
      background: { default: 'white' }, 
      text: { default: 'gray.800' },
    },
  },
  // You can add other theme customizations here, like component styles, global styles, etc.
}); 