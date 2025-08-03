import BaseCondition from "./BaseCondition.js";

/**
 * SurvivalCondition - Check basic survival requirements
 *
 * Validates that the civilization meets basic survival criteria
 * such as having fuel, materials, or other essential resources.
 */
export class SurvivalCondition extends BaseCondition {
  validateConfig() {
    super.validateConfig();

    if (!this.config.turns || this.config.turns < 1) {
      throw new Error("SurvivalCondition requires positive turns count");
    }
  }

  evaluate() {
    // Basic survival: must have fuel > 0
    const fuel = this.playerStorage.getFuel();
    const hasBasicResources = fuel > 0;

    // Check additional survival requirements if specified
    if (this.config.requirements) {
      return (
        hasBasicResources &&
        this.config.requirements.every((req) => this.checkRequirement(req))
      );
    }

    return hasBasicResources;
  }

  checkRequirement(requirement) {
    switch (requirement) {
      case "fuel_positive":
        return this.playerStorage.getFuel() > 0;
      case "materials_positive":
        return this.playerStorage.getMaterials() > 0;
      case "buildings_exist":
        return this.gameState.buildings.length > 0;
      default:
        console.warn(`[SurvivalCondition] Unknown requirement: ${requirement}`);
        return true;
    }
  }

  getCheckData() {
    return {
      fuel: this.playerStorage.getFuel(),
      materials: this.playerStorage.getMaterials(),
      waste: this.playerStorage.getWaste(),
      buildings: this.gameState.buildings.length,
      turn: this.gameState.currentTurn,
      requirements:
        this.config.requirements?.map((req) => ({
          requirement: req,
          met: this.checkRequirement(req),
        })) || [],
    };
  }

  getProgress() {
    // Survival is binary - either alive or dead
    return this.isMet ? 1.0 : 0.0;
  }
}

/**
 * FuelDepletionCondition - Check for fuel depletion (lose condition)
 *
 * Triggers when fuel reaches zero, indicating civilization collapse.
 */
export class FuelDepletionCondition extends BaseCondition {
  evaluate() {
    const fuel = this.playerStorage.getFuel();
    return fuel <= 0; // Condition is MET when fuel is depleted (lose condition)
  }

  getCheckData() {
    const fuel = this.playerStorage.getFuel();
    const fuelConsumption =
      this.gameState.fuelConsumptionBase +
      this.gameState.buildings.length *
        this.gameState.fuelConsumptionPerBuilding;

    return {
      currentFuel: fuel,
      fuelConsumption: fuelConsumption,
      turnsRemaining: this.playerStorage.getTurnsRemaining(fuelConsumption),
      isDepleted: fuel <= 0,
    };
  }

  getProgress() {
    // For lose conditions, progress toward "losing"
    const fuel = this.playerStorage.getFuel();
    if (fuel <= 0) return 1.0; // Fully "progressed" to defeat

    // Show how close we are to running out
    const fuelConsumption =
      this.gameState.fuelConsumptionBase +
      this.gameState.buildings.length *
        this.gameState.fuelConsumptionPerBuilding;
    const turnsRemaining =
      this.playerStorage.getTurnsRemaining(fuelConsumption);

    // Warning level: < 3 turns = high progress toward defeat
    if (turnsRemaining <= 3) {
      return Math.max(0.7, (3 - turnsRemaining) / 3);
    }

    return 0.0;
  }

  onFirstMet() {
    super.onFirstMet();
    console.log(
      `[FuelDepletionCondition] CIVILIZATION COLLAPSE: Fuel depleted on turn ${this.gameState.currentTurn}`,
    );
  }
}

/**
 * TurnLimitCondition - Check for turn limit exceeded (lose condition)
 *
 * Triggers when the maximum allowed turns for a level is exceeded.
 */
export class TurnLimitCondition extends BaseCondition {
  validateConfig() {
    super.validateConfig();

    if (!this.config.maxTurns || this.config.maxTurns < 1) {
      throw new Error("TurnLimitCondition requires positive maxTurns");
    }
  }

  evaluate() {
    return this.gameState.currentTurn > this.config.maxTurns;
  }

  getCheckData() {
    return {
      currentTurn: this.gameState.currentTurn,
      maxTurns: this.config.maxTurns,
      turnsRemaining: Math.max(
        0,
        this.config.maxTurns - this.gameState.currentTurn,
      ),
      isExceeded: this.gameState.currentTurn > this.config.maxTurns,
    };
  }

  getProgress() {
    const current = this.gameState.currentTurn;
    const max = this.config.maxTurns;

    if (current > max) return 1.0; // Time limit exceeded

    // Show progress toward time limit
    return Math.min(current / max, 1.0);
  }

  onFirstMet() {
    super.onFirstMet();
    console.log(
      `[TurnLimitCondition] TIME LIMIT EXCEEDED: Turn ${this.gameState.currentTurn} > ${this.config.maxTurns}`,
    );
  }
}

/**
 * StorageExceededCondition - Check for storage limit violations (lose condition)
 *
 * Triggers when resource storage exceeds specified limits.
 * Used in later levels for "lean" gameplay constraints.
 */
export class StorageExceededCondition extends BaseCondition {
  validateConfig() {
    super.validateConfig();

    if (!this.config.resource) {
      throw new Error("StorageExceededCondition requires resource type");
    }

    if (!this.config.limit || this.config.limit < 0) {
      throw new Error("StorageExceededCondition requires positive limit");
    }
  }

  evaluate() {
    const resource = this.config.resource;
    let currentAmount = 0;

    switch (resource) {
      case "fuel":
        currentAmount = this.playerStorage.getFuel();
        break;
      case "materials":
        currentAmount = this.playerStorage.getMaterials();
        break;
      case "waste":
        currentAmount = this.playerStorage.getWaste();
        break;
      default:
        console.warn(
          `[StorageExceededCondition] Unknown resource: ${resource}`,
        );
        return false;
    }

    return currentAmount > this.config.limit;
  }

  getCheckData() {
    const resource = this.config.resource;
    let currentAmount = 0;

    switch (resource) {
      case "fuel":
        currentAmount = this.playerStorage.getFuel();
        break;
      case "materials":
        currentAmount = this.playerStorage.getMaterials();
        break;
      case "waste":
        currentAmount = this.playerStorage.getWaste();
        break;
    }

    return {
      resource: resource,
      currentAmount: currentAmount,
      limit: this.config.limit,
      excess: Math.max(0, currentAmount - this.config.limit),
      isExceeded: currentAmount > this.config.limit,
    };
  }

  getProgress() {
    const data = this.getCheckData();

    if (data.isExceeded) return 1.0;

    // Show how close we are to the limit
    return Math.min(data.currentAmount / data.limit, 1.0);
  }

  onFirstMet() {
    super.onFirstMet();
    const data = this.getCheckData();
    console.log(
      `[StorageExceededCondition] STORAGE LIMIT EXCEEDED: ${data.resource} = ${data.currentAmount} > ${data.limit}`,
    );
  }
}

/**
 * ResourceDepletionCondition - Check for any critical resource depletion
 *
 * Generic condition for checking if any essential resource reaches zero.
 * More flexible than FuelDepletionCondition for future use.
 */
export class ResourceDepletionCondition extends BaseCondition {
  validateConfig() {
    super.validateConfig();

    if (!this.config.resource) {
      throw new Error("ResourceDepletionCondition requires resource type");
    }
  }

  evaluate() {
    const resource = this.config.resource;
    let currentAmount = 0;

    switch (resource) {
      case "fuel":
        currentAmount = this.playerStorage.getFuel();
        break;
      case "materials":
        currentAmount = this.playerStorage.getMaterials();
        break;
      case "waste":
        currentAmount = this.playerStorage.getWaste();
        break;
      default:
        console.warn(
          `[ResourceDepletionCondition] Unknown resource: ${resource}`,
        );
        return false;
    }

    return currentAmount <= 0;
  }

  getCheckData() {
    const resource = this.config.resource;
    let currentAmount = 0;

    switch (resource) {
      case "fuel":
        currentAmount = this.playerStorage.getFuel();
        break;
      case "materials":
        currentAmount = this.playerStorage.getMaterials();
        break;
      case "waste":
        currentAmount = this.playerStorage.getWaste();
        break;
    }

    return {
      resource: resource,
      currentAmount: currentAmount,
      isDepleted: currentAmount <= 0,
    };
  }

  getProgress() {
    const data = this.getCheckData();
    return data.isDepleted ? 1.0 : 0.0;
  }

  onFirstMet() {
    super.onFirstMet();
    const data = this.getCheckData();
    console.log(
      `[ResourceDepletionCondition] RESOURCE DEPLETED: ${data.resource} reached zero`,
    );
  }
}
