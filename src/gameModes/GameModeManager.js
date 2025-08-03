/**
 * Game Mode Manager
 *
 * Manages the current game mode state and provides utilities
 * for game mode-specific behavior and transitions.
 */

import EventBus from "../engine/EventBus.js";
import {
  GAME_MODES,
  getGameModeConfig,
  isValidGameMode,
  DEFAULT_GAME_MODE,
} from "./GameModeConfig.js";

export class GameModeManager {
  constructor() {
    this.currentGameMode = DEFAULT_GAME_MODE;
    this.gameSession = null; // Current session data
    this.transitionData = null; // Data for mode transitions

    console.log(
      "[GameModeManager] Initialized with default mode:",
      this.currentGameMode,
    );
  }

  /**
   * Set the current game mode
   * @param {string} gameMode - The game mode to set
   * @param {Object} sessionData - Optional session data for the mode
   */
  setGameMode(gameMode, sessionData = null) {
    if (!isValidGameMode(gameMode)) {
      console.warn("[GameModeManager] Invalid game mode:", gameMode);
      return false;
    }

    const previousMode = this.currentGameMode;
    this.currentGameMode = gameMode;
    this.gameSession = sessionData;

    console.log(
      "[GameModeManager] Game mode changed:",
      previousMode,
      "->",
      gameMode,
    );

    // Emit mode change event
    EventBus.emit("gameMode:changed", {
      previousMode,
      currentMode: gameMode,
      sessionData,
    });

    return true;
  }

  /**
   * Get the current game mode
   * @returns {string} Current game mode
   */
  getCurrentGameMode() {
    return this.currentGameMode;
  }

  /**
   * Get the current game mode configuration
   * @returns {Object} Game mode configuration
   */
  getCurrentGameModeConfig() {
    return getGameModeConfig(this.currentGameMode);
  }

  /**
   * Check if current mode is story mode
   * @returns {boolean} True if story mode
   */
  isStoryMode() {
    return this.currentGameMode === GAME_MODES.STORY;
  }

  /**
   * Check if current mode is Long Tomorrow
   * @returns {boolean} True if Long Tomorrow mode
   */
  isLongTomorrowMode() {
    return this.currentGameMode === GAME_MODES.LONG_TOMORROW;
  }

  /**
   * Check if current mode supports persistence
   * @returns {boolean} True if mode supports persistence
   */
  supportsPersistence() {
    const config = this.getCurrentGameModeConfig();
    return config.persistent;
  }

  /**
   * Check if current mode has meta-progression
   * @returns {boolean} True if mode has meta-progression
   */
  hasMetaProgression() {
    const config = this.getCurrentGameModeConfig();
    return config.hasMetaProgression;
  }

  /**
   * Get session data for current game mode
   * @returns {Object|null} Session data
   */
  getSessionData() {
    return this.gameSession;
  }

  /**
   * Update session data
   * @param {Object} data - Session data to merge
   */
  updateSessionData(data) {
    if (this.gameSession) {
      this.gameSession = { ...this.gameSession, ...data };
    } else {
      this.gameSession = data;
    }

    EventBus.emit("gameMode:sessionUpdated", {
      gameMode: this.currentGameMode,
      sessionData: this.gameSession,
    });
  }

  /**
   * Start a new game session
   * @param {string} gameMode - Game mode to start
   * @param {Object} options - Session options
   */
  startNewSession(gameMode, options = {}) {
    console.log("[GameModeManager] Starting new session:", gameMode, options);

    const sessionData = {
      gameMode,
      startTime: Date.now(),
      isNewGame: true,
      sessionId: this.generateSessionId(),
      ...options,
    };

    this.setGameMode(gameMode, sessionData);

    EventBus.emit("gameMode:sessionStarted", {
      gameMode,
      sessionData,
    });

    return sessionData;
  }

  /**
   * Continue an existing session
   * @param {Object} saveData - Saved session data
   */
  continueSession(saveData) {
    console.log("[GameModeManager] Continuing session:", saveData.gameMode);

    const sessionData = {
      ...saveData,
      isNewGame: false,
      resumeTime: Date.now(),
    };

    this.setGameMode(saveData.gameMode, sessionData);

    EventBus.emit("gameMode:sessionResumed", {
      gameMode: saveData.gameMode,
      sessionData,
    });

    return sessionData;
  }

  /**
   * End the current session
   * @param {Object} endData - Session end data (victory, defeat, quit, etc.)
   */
  endSession(endData = {}) {
    console.log(
      "[GameModeManager] Ending session:",
      this.currentGameMode,
      endData,
    );

    const sessionEndData = {
      gameMode: this.currentGameMode,
      sessionData: this.gameSession,
      endTime: Date.now(),
      ...endData,
    };

    EventBus.emit("gameMode:sessionEnded", sessionEndData);

    // Store transition data for potential Long Tomorrow evolution
    if (this.isLongTomorrowMode()) {
      this.transitionData = sessionEndData;
    }

    return sessionEndData;
  }

  /**
   * Get transition data (for Long Tomorrow session evolution)
   * @returns {Object|null} Transition data
   */
  getTransitionData() {
    return this.transitionData;
  }

  /**
   * Clear transition data
   */
  clearTransitionData() {
    this.transitionData = null;
  }

  /**
   * Generate a unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get game mode specific configuration for game systems
   * @param {string} system - System name (e.g., 'victory', 'progression', 'save')
   * @returns {Object} System configuration for current mode
   */
  getSystemConfig(system) {
    const config = this.getCurrentGameModeConfig();

    // Return system-specific configuration based on game mode
    switch (system) {
      case "victory":
        return {
          hasVictoryConditions: this.isStoryMode(),
          allowsInfinitePlay: this.isLongTomorrowMode(),
          trackAchievements: true,
        };

      case "progression":
        return {
          hasMetaProgression: config.hasMetaProgression,
          persistent: config.persistent,
          researchTrees: config.researchTrees || [],
        };

      case "save":
        return {
          persistent: config.persistent,
          includeWorldHistory: this.isLongTomorrowMode(),
          includeResearchProgress: config.hasMetaProgression,
        };

      default:
        return {};
    }
  }

  /**
   * Reset game mode manager
   */
  reset() {
    console.log("[GameModeManager] Resetting to default mode");

    this.currentGameMode = DEFAULT_GAME_MODE;
    this.gameSession = null;
    this.transitionData = null;

    EventBus.emit("gameMode:reset");
  }
}

// Create singleton instance
const gameModeManager = new GameModeManager();
export default gameModeManager;
