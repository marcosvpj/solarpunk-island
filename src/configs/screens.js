/**
 * Screen Configuration
 *
 * Centralized configuration for all game screens and transitions.
 * This makes it easy to add new screens and maintain consistency.
 */

// Screen identifiers
export const SCREENS = {
  START: "start",
  PROGRESSION: "progression",
  GAME: "game",
  VICTORY: "victory",
  DEFEAT: "defeat",
  SETTINGS: "settings", // Future implementation
  PAUSE: "pause", // Future overlay implementation
  CREDITS: "credits", // Future implementation
};

// Transition types for screen changes
export const SCREEN_TRANSITIONS = {
  FADE: "fade",
  SLIDE_LEFT: "slide_left", // Future implementation
  SLIDE_RIGHT: "slide_right", // Future implementation
  INSTANT: "instant",
};

// Screen configuration with default settings
export const SCREEN_CONFIG = {
  [SCREENS.START]: {
    title: "Floating Islands: Survival & Recovery",
    showBackground: true,
    transition: SCREEN_TRANSITIONS.FADE,
    transitionDuration: 500,
  },
  [SCREENS.PROGRESSION]: {
    title: "Colony Progress",
    showBackground: true,
    transition: SCREEN_TRANSITIONS.FADE,
    transitionDuration: 500,
  },
  [SCREENS.GAME]: {
    title: "Game",
    showBackground: false, // Game has its own background
    transition: SCREEN_TRANSITIONS.FADE,
    transitionDuration: 300,
  },
  [SCREENS.VICTORY]: {
    title: "Level Completed",
    showBackground: true,
    transition: SCREEN_TRANSITIONS.FADE,
    transitionDuration: 500,
  },
  [SCREENS.DEFEAT]: {
    title: "Civilization Fallen",
    showBackground: true,
    transition: SCREEN_TRANSITIONS.FADE,
    transitionDuration: 500,
  },
  [SCREENS.SETTINGS]: {
    title: "Settings",
    showBackground: true,
    transition: SCREEN_TRANSITIONS.FADE,
    transitionDuration: 300,
  },
  [SCREENS.PAUSE]: {
    title: "Paused",
    showBackground: false, // Overlay on top of game
    transition: SCREEN_TRANSITIONS.FADE,
    transitionDuration: 200,
  },
};

// Default transition duration if not specified
export const DEFAULT_TRANSITION_DURATION = 400;

// Era system configuration (for progression screen)
export const ERAS = {
  STONE_AGE: {
    name: "Stone Age",
    color: 0x8b4513,
    description: "Survival basics and resource gathering",
    unlockTurn: 1,
  },
  BRONZE_AGE: {
    name: "Bronze Age",
    color: 0xcd7f32,
    description: "Advanced tools and infrastructure",
    unlockTurn: 50,
  },
  INDUSTRIAL_AGE: {
    name: "Industrial Age",
    color: 0x696969,
    description: "Automation and mass production",
    unlockTurn: 150,
  },
  SPACE_AGE: {
    name: "Space Age",
    color: 0x4169e1,
    description: "Advanced technology and exploration",
    unlockTurn: 300,
  },
};

// Get current era based on turn number
export function getCurrentEra(currentTurn) {
  const eras = Object.entries(ERAS);

  // Find the highest era that has been unlocked
  let currentEra = ERAS.STONE_AGE;
  for (const [key, era] of eras) {
    if (currentTurn >= era.unlockTurn) {
      currentEra = era;
    } else {
      break;
    }
  }

  return currentEra;
}

// Get progress to next era (0-1)
export function getEraProgress(currentTurn) {
  const eras = Object.entries(ERAS);
  const currentEra = getCurrentEra(currentTurn);

  // Find next era
  let nextEra = null;
  for (const [key, era] of eras) {
    if (era.unlockTurn > currentTurn) {
      nextEra = era;
      break;
    }
  }

  if (!nextEra) {
    return 1; // Max level reached
  }

  const currentEraIndex = eras.findIndex(([key, era]) => era === currentEra);
  const currentEraUnlock = currentEra.unlockTurn;
  const nextEraUnlock = nextEra.unlockTurn;

  const progress =
    (currentTurn - currentEraUnlock) / (nextEraUnlock - currentEraUnlock);
  return Math.max(0, Math.min(1, progress));
}
