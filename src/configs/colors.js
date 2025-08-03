/**
 * Color Palette Configuration
 *
 * Defines a cohesive, minimalist color palette for the hex grid game.
 * Colors are exported as both hex strings (for CSS) and hex numbers (for PixiJS).
 */

// Base color definitions (hex strings)
const colorStrings = {
  // Dark theme backgrounds
  darkBase: "#0a1420", // Darkest backgrounds
  darkSurface: "#1a2332", // Elevated surfaces
  mediumSurface: "#2a3441", // Interactive elements
  lightSurface: "#3a4552", // Hover states

  // Accent colors (cyan family)
  primaryCyan: "#00bcd4", // Main accent color
  brightCyan: "#26c6da", // Highlights and emphasis
  mutedCyan: "#0097a7", // Active states

  // State colors
  success: "#4caf50", // Success states, positive hover
  warning: "#ff9800", // Warning states, selection
  error: "#f44336", // Error states

  // Text colors (cyan tints)
  primaryText: "#e1f5fe", // High contrast text
  secondaryText: "#b3e5fc", // Medium contrast text
  mutedText: "#81d4fa", // Low contrast text

  // Neutral colors
  white: "#ffffff", // Pure white for normal states
  black: "#000000", // Pure black for shadows
};

// Convert hex strings to hex numbers for PixiJS
const colorNumbers = {};
Object.keys(colorStrings).forEach((key) => {
  colorNumbers[key] = parseInt(colorStrings[key].replace("#", "0x"));
});

// Semantic color mappings for easy usage
export const colors = {
  // Background colors
  background: {
    primary: colorStrings.darkBase,
    secondary: colorStrings.darkSurface,
    elevated: colorStrings.mediumSurface,
    interactive: colorStrings.lightSurface,
  },

  // UI accent colors
  accent: {
    primary: colorStrings.primaryCyan,
    bright: colorStrings.brightCyan,
    muted: colorStrings.mutedCyan,
  },

  // State colors
  state: {
    success: colorStrings.success,
    warning: colorStrings.warning,
    error: colorStrings.error,
    normal: colorStrings.white,
  },

  // Text colors
  text: {
    primary: colorStrings.primaryText,
    secondary: colorStrings.secondaryText,
    muted: colorStrings.mutedText,
  },

  // Neutral colors
  neutral: {
    white: colorStrings.white,
    black: colorStrings.black,
  },
};

// PixiJS color numbers (for tints, fills, etc.)
export const pixiColors = {
  // Background colors
  background: {
    primary: colorNumbers.darkBase,
    secondary: colorNumbers.darkSurface,
    elevated: colorNumbers.mediumSurface,
    interactive: colorNumbers.lightSurface,
  },

  // UI accent colors
  accent: {
    primary: colorNumbers.primaryCyan,
    bright: colorNumbers.brightCyan,
    muted: colorNumbers.mutedCyan,
  },

  // State colors
  state: {
    success: colorNumbers.success,
    warning: colorNumbers.warning,
    error: colorNumbers.error,
    normal: colorNumbers.white,
  },

  // Text colors
  text: {
    primary: colorNumbers.primaryText,
    secondary: colorNumbers.secondaryText,
    muted: colorNumbers.mutedText,
  },

  // Neutral colors
  neutral: {
    white: colorNumbers.white,
    black: colorNumbers.black,
  },
};

// CSS custom properties export for style.css
export const cssVariables = Object.keys(colorStrings).reduce((acc, key) => {
  acc[`--color-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`] =
    colorStrings[key];
  return acc;
}, {});

// Legacy support - specific game element colors
export const gameColors = {
  // Hex states
  hexNormal: pixiColors.neutral.white,
  hexHover: pixiColors.state.success,
  hexSelected: pixiColors.state.warning,

  // UI elements
  tooltipBackground: pixiColors.background.secondary,
  tooltipBorder: pixiColors.accent.primary,
  menuBackground: pixiColors.background.elevated,
  progressBar: pixiColors.accent.primary,

  // Text colors for PixiJS (using hex numbers for PIXI 8.x compatibility)
  tooltipText: pixiColors.text.primary,
  buttonText: pixiColors.text.primary,
  textDisabled: pixiColors.text.secondary, // Light gray for disabled text
};

export default colors;
