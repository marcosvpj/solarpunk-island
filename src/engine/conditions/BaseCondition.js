/**
 * BaseCondition - Abstract base class for all win/lose conditions
 *
 * Provides the foundation for modular condition checking system.
 * All specific condition types extend this class.
 */
export class BaseCondition {
  constructor(config, gameState, playerStorage) {
    this.config = config;
    this.gameState = gameState;
    this.playerStorage = playerStorage;

    // Condition state tracking
    this.isMet = false;
    this.isActive = true;
    this.checkCount = 0;
    this.firstMetTurn = null;
    this.lastCheckResult = null;

    // Validation
    this.validateConfig();

    console.log(
      `[BaseCondition] Created ${this.getType()} condition:`,
      this.getDescription(),
    );
  }

  /**
   * Get condition type identifier
   * @returns {string} Condition type
   */
  getType() {
    return this.constructor.name.replace("Condition", "").toLowerCase();
  }

  /**
   * Get human-readable description
   * @returns {string} Description text
   */
  getDescription() {
    return this.config.description || `${this.getType()} condition`;
  }

  /**
   * Check if condition is currently met
   * @returns {boolean} True if condition is satisfied
   */
  check() {
    if (!this.isActive) {
      return this.isMet;
    }

    this.checkCount++;
    const wasMet = this.isMet;

    // Perform the actual condition check (implemented by subclasses)
    this.isMet = this.evaluate();
    this.lastCheckResult = {
      turn: this.gameState.currentTurn,
      result: this.isMet,
      data: this.getCheckData(),
    };

    // Track when condition was first met
    if (this.isMet && !wasMet) {
      this.firstMetTurn = this.gameState.currentTurn;
      this.onFirstMet();
    }

    // Track when condition was lost
    if (!this.isMet && wasMet) {
      this.onLost();
    }

    return this.isMet;
  }

  /**
   * Evaluate the condition (abstract method - must be implemented by subclasses)
   * @returns {boolean} True if condition is met
   */
  evaluate() {
    throw new Error(
      `${this.constructor.name} must implement evaluate() method`,
    );
  }

  /**
   * Get additional data for the check result
   * @returns {Object} Additional check data
   */
  getCheckData() {
    return {};
  }

  /**
   * Validate configuration (can be overridden by subclasses)
   */
  validateConfig() {
    if (!this.config) {
      throw new Error(`${this.constructor.name} requires configuration`);
    }
  }

  /**
   * Called when condition is first met
   */
  onFirstMet() {
    console.log(
      `[${this.getType()}] Condition first met on turn ${this.firstMetTurn}: ${this.getDescription()}`,
    );
  }

  /**
   * Called when condition is lost after being met
   */
  onLost() {
    console.log(
      `[${this.getType()}] Condition lost on turn ${this.gameState.currentTurn}: ${this.getDescription()}`,
    );
  }

  /**
   * Get current progress toward meeting the condition (0-1)
   * @returns {number} Progress percentage
   */
  getProgress() {
    return this.isMet ? 1.0 : 0.0; // Basic implementation, subclasses can override
  }

  /**
   * Get detailed status for UI display
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      type: this.getType(),
      description: this.getDescription(),
      isMet: this.isMet,
      isActive: this.isActive,
      progress: this.getProgress(),
      checkCount: this.checkCount,
      firstMetTurn: this.firstMetTurn,
      lastCheck: this.lastCheckResult,
    };
  }

  /**
   * Reset condition state (useful for testing or level restart)
   */
  reset() {
    this.isMet = false;
    this.isActive = true;
    this.checkCount = 0;
    this.firstMetTurn = null;
    this.lastCheckResult = null;

    console.log(
      `[${this.getType()}] Condition reset: ${this.getDescription()}`,
    );
  }

  /**
   * Deactivate condition (stops checking)
   */
  deactivate() {
    this.isActive = false;
    console.log(
      `[${this.getType()}] Condition deactivated: ${this.getDescription()}`,
    );
  }

  /**
   * Reactivate condition (resumes checking)
   */
  activate() {
    this.isActive = true;
    console.log(
      `[${this.getType()}] Condition activated: ${this.getDescription()}`,
    );
  }

  /**
   * Get debug information
   * @returns {Object} Debug data
   */
  getDebugInfo() {
    return {
      type: this.getType(),
      config: this.config,
      state: {
        isMet: this.isMet,
        isActive: this.isActive,
        checkCount: this.checkCount,
        firstMetTurn: this.firstMetTurn,
      },
      gameData: {
        currentTurn: this.gameState.currentTurn,
        buildings: this.gameState.buildings.length,
        fuel: this.playerStorage?.getFuel() || 0,
      },
    };
  }
}

export default BaseCondition;
