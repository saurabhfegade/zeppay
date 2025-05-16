import { extendTheme } from "@chakra-ui/react";
import { mode, StyleFunctionProps } from "@chakra-ui/theme-tools"; // Import StyleFunctionProps
import { coinbase_color } from "../../../config"; // Assuming config.ts is at the root

// Helper to generate a basic color ramp.
// For a real design system, these would be more carefully chosen.
const generateColorRamp = (baseColor: string) => {
  // This is a very simplistic ramp generator.
  // In a real scenario, you'd use a tool or predefined values.
  // For now, we'll just use the base color for the 500 shade.
  return {
    50: "#e6f0ff", // Lighter shade
    100: "#ccdfff",
    200: "#b3ceff",
    300: "#99bdff",
    400: "#80acff",
    500: baseColor, // Coinbase Blue
    600: "#0042cc", // Darker shade
    700: "#003299",
    800: "#002166",
    900: "#001133",
  };
};

// This string will be used in _app.tsx with a Global styles component for robust @font-face injection
export const coinbaseFontsGlobalStyles = `
  @font-face {
    font-family: 'Coinbase Sans';
    src: url('/fonts/Coinbase-Sans/Coinbase_Sans-Extra_Light-web-1.32.woff2') format('woff2');
    font-weight: 200;
    font-style: normal;
  }
  @font-face {
    font-family: 'Coinbase Sans';
    src: url('/fonts/Coinbase-Sans/Coinbase_Sans-Extra_Light_Italic-web-1.32.woff2') format('woff2');
    font-weight: 200;
    font-style: italic;
  }
  @font-face {
    font-family: 'Coinbase Sans';
    src: url('/fonts/Coinbase-Sans/Coinbase_Sans-Light-web-1.32.woff2') format('woff2');
    font-weight: 300;
    font-style: normal;
  }
  @font-face {
    font-family: 'Coinbase Sans';
    src: url('/fonts/Coinbase-Sans/Coinbase_Sans-Light_Italic-web-1.32.woff2') format('woff2');
    font-weight: 300;
    font-style: italic;
  }
  @font-face {
    font-family: 'Coinbase Sans';
    src: url('/fonts/Coinbase-Sans/Coinbase_Sans-Regular-web-1.32.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
  }
  @font-face {
    font-family: 'Coinbase Sans';
    src: url('/fonts/Coinbase-Sans/Coinbase_Sans-Regular_Italic-web-1.32.woff2') format('woff2');
    font-weight: 400;
    font-style: italic;
  }
  @font-face {
    font-family: 'Coinbase Sans';
    src: url('/fonts/Coinbase-Sans/Coinbase_Sans-Medium-web-1.32.woff2') format('woff2');
    font-weight: 500;
    font-style: normal;
  }
  @font-face {
    font-family: 'Coinbase Sans';
    src: url('/fonts/Coinbase-Sans/Coinbase_Sans-Medium_Italic-web-1.32.woff2') format('woff2');
    font-weight: 500;
    font-style: italic;
  }
  @font-face {
    font-family: 'Coinbase Sans';
    src: url('/fonts/Coinbase-Sans/Coinbase_Sans-Bold-web-1.32.woff2') format('woff2');
    font-weight: 700;
    font-style: normal;
  }
  @font-face {
    font-family: 'Coinbase Sans';
    src: url('/fonts/Coinbase-Sans/Coinbase_Sans-Bold_Italic-web-1.32.woff2') format('woff2');
    font-weight: 700;
    font-style: italic;
  }
`;

export const theme = extendTheme({
  styles: {
    global: (props: StyleFunctionProps) => ({
      "html, body": {
        fontFamily: "body",
        color: mode("black", "whiteAlpha.900")(props), // Use black for light, white for dark
        bg: mode("white", "gray.800")(props), // Use white for light, dark gray for dark
        lineHeight: "base",
      },
    }),
  },
  colors: {
    brand: generateColorRamp(coinbase_color),
    black: "#000000",
    white: "#FFFFFF",
    // You might want to keep some gray shades for borders, placeholders, etc.
    // The default Chakra gray is quite good, or you can customize.
    // For simplicity, I'm leaving the default gray palette that Chakra provides.
  },
  fonts: {
    heading: "'Coinbase Sans', sans-serif", // Ensure quotes if font name has spaces
    body: "'Coinbase Sans', sans-serif",
  },
  semanticTokens: {
    colors: {
      background: { default: "white", _dark: "gray.800" },
      text: { default: "black", _dark: "whiteAlpha.900" },
      primary: { default: "brand.500", _dark: "brand.300" },
      secondaryText: { default: "gray.600", _dark: "gray.400" },
      // You can define more semantic colors like 'error', 'success', 'warning'
      // and map them to your brand colors or standard ones.
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "medium",
      },
      variants: {
        solid: (props: StyleFunctionProps) => {
          if (props.colorScheme === "brand") {
            return {
              bg: mode("brand.500", "brand.300")(props),
              color: mode("white", "gray.800")(props),
              _hover: {
                bg: mode("brand.600", "brand.400")(props),
              },
            };
          }
          return {};
        },
      },
    },
    Heading: {
      baseStyle: {
        fontFamily: "heading",
        fontWeight: "bold", // Default to bold for headings
      },
    },
    Text: {
      baseStyle: {
        fontFamily: "body",
      },
    },
    // You can override other component styles here
  },
});
