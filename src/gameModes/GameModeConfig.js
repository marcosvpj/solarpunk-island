/**
 * Game Mode Configuration
 *
 * Defines the different game modes available in Floating Islands
 * and their specific configurations and behaviors.
 */

// Game mode identifiers
export const GAME_MODES = {
  STORY: "story",
  LONG_TOMORROW: "long_tomorrow",
};

// Game mode configurations
export const GAME_MODE_CONFIG = {
  [GAME_MODES.STORY]: {
    name: "Story Mode",
    shortName: "Story",
    description:
      "Experience discrete challenges with clear objectives and victory conditions. Perfect for learning the game mechanics.",
    longDescription:
      "Story Mode offers structured gameplay with specific goals and victory conditions. Each level is self-contained with predefined challenges, resource availability, and win/loss conditions. Ideal for newcomers and players who prefer focused, objective-driven experiences.",
    features: [
      "Discrete challenge levels",
      "Clear victory conditions",
      "Structured progression",
      "Tutorial integration",
      "Achievement tracking",
    ],
    icon: "story", // Future: icon reference
    color: "#4169E1", // Royal Blue
    unlocked: true,
    persistent: false, // Sessions don't carry over
    hasMetaProgression: false,
  },

  [GAME_MODES.LONG_TOMORROW]: {
    name: "The Long Tomorrow",
    shortName: "Long Tomorrow",
    description:
      "Build a living, evolving civilization where every decision creates permanent changes across multiple sessions.",
    longDescription:
      "The Long Tomorrow transforms your colony into a persistent, evolving world. Each session builds upon the archaeological record of previous runs, where abandoned buildings become interactive ruins, parks grow into forests, and your choices create lasting cultural and environmental changes. Unlock permanent upgrades through achievement-driven research across four specialization paths.",
    features: [
      "Persistent world evolution",
      "Archaeological memory system",
      "Cross-session meta-progression",
      "Research specialization trees",
      "Interactive ruin system",
      "Ecological transformation",
      "Cultural sediment layers",
    ],
    icon: "long_tomorrow", // Future: icon reference
    color: "#00bcd4", // Cyan (matches game theme)
    unlocked: true, // Will be true for now, could be unlocked via story progress
    persistent: true, // Sessions carry over
    hasMetaProgression: true,

    // Long Tomorrow specific configuration
    researchTrees: [
      "archaeologist", // Ruin mastery
      "naturalist", // Ecological harmony
      "survivor", // Disaster mastery
      "innovator", // Technology focus
    ],

    maxMemorialPercentage: 0.3, // Maximum 30% of island can be memorialized
    soilMemoryDuration: 3, // Sessions enriched soil persists without farming
    resourceDecayRate: 0.1, // 10% decay of uncollected piles between sessions
    contaminationSpreadRate: 0.05, // Rate at which contamination spreads per session
  },
};

// Default game mode (used for new players)
export const DEFAULT_GAME_MODE = GAME_MODES.STORY;

// Get game mode configuration
export function getGameModeConfig(gameMode) {
  return GAME_MODE_CONFIG[gameMode] || GAME_MODE_CONFIG[DEFAULT_GAME_MODE];
}

// Check if game mode supports persistence
export function isGameModePersistent(gameMode) {
  const config = getGameModeConfig(gameMode);
  return config.persistent;
}

// Check if game mode has meta-progression
export function hasMetaProgression(gameMode) {
  const config = getGameModeConfig(gameMode);
  return config.hasMetaProgression;
}

// Get available game modes (unlocked only)
export function getAvailableGameModes() {
  return Object.entries(GAME_MODE_CONFIG)
    .filter(([mode, config]) => config.unlocked)
    .map(([mode, config]) => ({
      mode,
      ...config,
    }));
}

// Validate game mode
export function isValidGameMode(gameMode) {
  return Object.hasOwnProperty.call(GAME_MODE_CONFIG, gameMode);
}

// Game mode display order (for UI)
export const GAME_MODE_DISPLAY_ORDER = [
  GAME_MODES.STORY,
  GAME_MODES.LONG_TOMORROW,
];

export default {
  GAME_MODES,
  GAME_MODE_CONFIG,
  DEFAULT_GAME_MODE,
  getGameModeConfig,
  isGameModePersistent,
  hasMetaProgression,
  getAvailableGameModes,
  isValidGameMode,
  GAME_MODE_DISPLAY_ORDER,
};
