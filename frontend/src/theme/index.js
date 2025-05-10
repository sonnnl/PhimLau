import { extendTheme } from "@chakra-ui/react";

const colors = {
  brand: {
    900: "#121212", // Darker background
    800: "#1A1A1A", // Input background, card hover
    700: "#2C2C2C", // Card background, borders
    600: "#404040", // Subtle text, placeholder hint
    500: "#808080", // Secondary text
    400: "#E0E0E0", // Primary text
    accent: "#DD6B20", // NEW: Chakra orange.600
    accentDark: "#C05621", // NEW: Chakra orange.700
    redGoogle: "#DB4437",
    redGoogleHover: "#C53727",
  },
  text: {
    primary: "#E0E0E0",
    secondary: "#808080", // Made it slightly darker for better contrast on lighter dark bg
    disabled: "#555555",
  },
  background: {
    primary: "#121212", // Main page background (darker)
    secondary: "#1A1A1A", // Header/Footer/Slightly lighter sections
    card: "#2C2C2C", // Default card background
    input: "#1A1A1A", // Input field background
    overlay: "rgba(0, 0, 0, 0.65)",
  },
};

const fonts = {
  heading: "'Inter', sans-serif",
  body: "'Inter', sans-serif",
};

const styles = {
  global: (props) => ({
    body: {
      bg: colors.background.primary,
      color: colors.text.primary,
      fontFamily: fonts.body,
      lineHeight: "base",
    },
    a: {
      color: colors.brand.accent,
      _hover: {
        // textDecoration: "underline", // Remove underline globally? Optional
        color: colors.brand.accentDark,
      },
    },
    "::placeholder": {
      color: colors.text.disabled,
    },
    "::-webkit-scrollbar": {
      width: "10px", // Slightly thicker scrollbar
    },
    "::-webkit-scrollbar-track": {
      background: colors.background.secondary,
    },
    "::-webkit-scrollbar-thumb": {
      background: colors.brand[600],
      borderRadius: "10px",
    },
    "::-webkit-scrollbar-thumb:hover": {
      background: colors.brand[500],
    },
  }),
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: "medium", // NEW: Giảm độ đậm
      borderRadius: "md", // Giữ bo góc vừa phải cho hiện đại
      _focus: {
        // Bỏ outline mặc định khi focus
        boxShadow: "none",
      },
    },
    variants: {
      // Nút chính màu accent
      solid: (props) => ({
        // Mặc định dùng colorScheme của Chakra, nhưng có thể override nếu cần
        // Ví dụ nút không có colorScheme sẽ dùng màu accent:
        ...(!props.colorScheme && {
          bg: colors.brand.accent,
          color: "white",
          _hover: {
            bg: colors.brand.accentDark,
          },
          _active: {
            bg: colors.brand.accentDark,
          },
        }),
      }),
      // Nút Google (dạng outline)
      google: {
        border: "1px solid",
        borderColor: "brand.redGoogle",
        color: "brand.redGoogle",
        bg: "transparent",
        _hover: {
          bg: "rgba(219, 68, 55, 0.05)", // Nền đỏ rất nhạt khi hover
          borderColor: "brand.redGoogleHover",
          color: "brand.redGoogleHover",
        },
        _active: {
          bg: "rgba(219, 68, 55, 0.1)",
        },
      },
      outline: (props) => ({
        borderColor: colors.brand.accent,
        color: colors.brand.accent,
        _hover: {
          bg: colors.brand.accent,
          color: "white",
        },
      }),
    },
  },
  Input: {
    variants: {
      // Kiểu input tùy chỉnh cho form tối
      filledDark: {
        field: {
          bg: colors.background.input,
          border: "1px solid",
          borderColor: colors.brand[700],
          color: colors.text.primary,
          _hover: {
            borderColor: colors.brand[600],
          },
          _focus: {
            borderColor: colors.brand.accent,
            boxShadow: `0 0 0 1px ${colors.brand.accent}`, // Shadow nhẹ khi focus
          },
          _invalid: {
            // Style khi có lỗi validation
            borderColor: "red.500",
            boxShadow: `0 0 0 1px red.500`,
          },
          _placeholder: {
            color: colors.text.disabled,
          },
        },
        // Style cho addon (ví dụ icon bên trái)
        addon: {
          border: "1px solid",
          borderColor: colors.brand[700],
          bg: colors.background.input,
          color: colors.text.secondary,
        },
      },
    },
    defaultProps: {
      variant: "filledDark", // Đặt làm variant mặc định cho Input
    },
  },
  FormLabel: {
    baseStyle: {
      color: colors.text.secondary,
      fontSize: "sm",
      mb: 1, // Khoảng cách dưới label nhỏ
    },
  },
  Heading: {
    baseStyle: {
      fontFamily: fonts.heading,
      color: colors.text.primary,
    },
  },
  Text: {
    baseStyle: {
      color: colors.text.primary,
    },
  },
  Divider: {
    baseStyle: {
      borderColor: colors.brand[700], // Màu divider
    },
  },
};

const config = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  colors,
  fonts,
  styles,
  components,
});

export default theme;
