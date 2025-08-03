import BaseCondition from "./BaseCondition.js";

/**
 * BuildingCountCondition - Check for specific number of buildings
 *
 * Validates that a certain number of buildings of a specific type exist.
 * Can check for exact count, minimum, or maximum buildings.
 */
export class BuildingCountCondition extends BaseCondition {
  validateConfig() {
    super.validateConfig();

    if (!this.config.building) {
      throw new Error("BuildingCountCondition requires building type");
    }

    if (
      this.config.min === undefined &&
      this.config.max === undefined &&
      this.config.exact === undefined
    ) {
      throw new Error(
        "BuildingCountCondition requires min, max, or exact count",
      );
    }
  }

  evaluate() {
    const buildings = this.gameState.buildings.filter((building) => {
      // Match building type
      if (building.type !== this.config.building) {
        return false;
      }

      // Match production mode if specified (for refineries)
      if (this.config.productionMode) {
        const buildingMode = building.productionMode || "none";
        return buildingMode === this.config.productionMode;
      }

      return true;
    });

    const count = buildings.length;

    // Check exact count
    if (this.config.exact !== undefined) {
      return count === this.config.exact;
    }

    // Check minimum
    if (this.config.min !== undefined && count < this.config.min) {
      return false;
    }

    // Check maximum
    if (this.config.max !== undefined && count > this.config.max) {
      return false;
    }

    return true;
  }

  getCheckData() {
    const buildings = this.gameState.buildings.filter((building) => {
      if (building.type !== this.config.building) return false;
      if (this.config.productionMode && building.productionMode) {
        return building.productionMode === this.config.productionMode;
      }
      return true;
    });

    return {
      currentCount: buildings.length,
      requiredMin: this.config.min,
      requiredMax: this.config.max,
      requiredExact: this.config.exact,
      buildings: buildings.map((b) => ({
        type: b.type,
        level: b.level,
        productionMode: b.productionMode || null,
        position: { q: b.hex.q, r: b.hex.r },
      })),
    };
  }

  getProgress() {
    if (this.isMet) return 1.0;

    const data = this.getCheckData();
    const current = data.currentCount;

    if (this.config.exact !== undefined) {
      return Math.min(current / this.config.exact, 1.0);
    }

    if (this.config.min !== undefined) {
      return Math.min(current / this.config.min, 1.0);
    }

    return 0.0;
  }
}

/**
 * BuildingActiveCondition - Check that buildings are operational
 *
 * Validates that buildings are not just built, but actively functioning.
 * Useful for checking refinery production modes, power states, etc.
 */
export class BuildingActiveCondition extends BaseCondition {
  validateConfig() {
    super.validateConfig();

    if (!this.config.building) {
      throw new Error("BuildingActiveCondition requires building type");
    }
  }

  evaluate() {
    const buildings = this.gameState.buildings.filter((building) => {
      if (building.type !== this.config.building) {
        return false;
      }

      // Check if building is active/operational
      return this.isBuildingActive(building);
    });

    const count = buildings.length;

    if (this.config.exact !== undefined) {
      return count === this.config.exact;
    }

    if (this.config.min !== undefined) {
      return count >= this.config.min;
    }

    return count > 0;
  }

  isBuildingActive(building) {
    // For refineries, check production mode and ability to produce
    if (building.type === "refinery") {
      const canProduce = building.canProduce && building.canProduce();
      return building.productionMode !== "none" && canProduce;
    }

    // For other buildings, check if they're not destroyed and functioning
    return !building.isDestroyed && building.level > 0;
  }

  getCheckData() {
    const allBuildings = this.gameState.buildings.filter(
      (b) => b.type === this.config.building,
    );
    const activeBuildings = allBuildings.filter((b) =>
      this.isBuildingActive(b),
    );

    return {
      totalCount: allBuildings.length,
      activeCount: activeBuildings.length,
      buildings: allBuildings.map((b) => ({
        type: b.type,
        level: b.level,
        isActive: this.isBuildingActive(b),
        productionMode: b.productionMode || null,
        position: { q: b.hex.q, r: b.hex.r },
      })),
    };
  }

  getProgress() {
    if (this.isMet) return 1.0;

    const data = this.getCheckData();
    const current = data.activeCount;

    if (this.config.exact !== undefined) {
      return Math.min(current / this.config.exact, 1.0);
    }

    if (this.config.min !== undefined) {
      return Math.min(current / this.config.min, 1.0);
    }

    return current > 0 ? 1.0 : 0.0;
  }
}

/**
 * ConsecutiveTurnsCondition - Check condition maintained over multiple turns
 *
 * Validates that certain requirements are met for a consecutive number of turns.
 * Essential for Level 1's "survive 3 turns with both refineries" requirement.
 */
export class ConsecutiveTurnsCondition extends BaseCondition {
  constructor(config, gameState, playerStorage) {
    super(config, gameState, playerStorage);

    // Track consecutive turn state
    this.consecutiveCount = 0;
    this.lastMetTurn = null;
    this.requirementTracker = new Map();
  }

  validateConfig() {
    super.validateConfig();

    if (!this.config.turns || this.config.turns < 1) {
      throw new Error(
        "ConsecutiveTurnsCondition requires positive turns count",
      );
    }

    if (!this.config.requirements || this.config.requirements.length === 0) {
      throw new Error("ConsecutiveTurnsCondition requires requirements array");
    }
  }

  evaluate() {
    const currentTurn = this.gameState.currentTurn;
    const requirementsMet = this.checkRequirements();

    console.log(
      `[ConsecutiveTurnsCondition] Turn ${currentTurn}: requirements met = ${requirementsMet}`,
    );

    if (requirementsMet) {
      // Requirements are met this turn
      if (this.lastMetTurn === null) {
        // First time requirements are met
        this.consecutiveCount = 1;
        console.log(
          `[ConsecutiveTurnsCondition] Starting new sequence: ${this.consecutiveCount}/${this.config.turns}`,
        );
      } else if (this.lastMetTurn === currentTurn - 1) {
        // Consecutive turn - requirements were met last turn too
        this.consecutiveCount++;
        console.log(
          `[ConsecutiveTurnsCondition] Consecutive turn! Count now: ${this.consecutiveCount}/${this.config.turns}`,
        );
      } else if (this.lastMetTurn < currentTurn - 1) {
        // Sequence was broken, restart
        this.consecutiveCount = 1;
        console.log(
          `[ConsecutiveTurnsCondition] Sequence was broken, restarting: ${this.consecutiveCount}/${this.config.turns}`,
        );
      }
      // If lastMetTurn === currentTurn, we already processed this turn, don't change count

      this.lastMetTurn = currentTurn;
    } else {
      // Requirements not met, reset counter
      if (this.consecutiveCount > 0) {
        console.log(
          `[ConsecutiveTurnsCondition] Sequence broken! Resetting from ${this.consecutiveCount} to 0`,
        );
      }
      this.consecutiveCount = 0;
      this.lastMetTurn = null;
    }

    const isComplete = this.consecutiveCount >= this.config.turns;
    console.log(
      `[ConsecutiveTurnsCondition] Condition ${isComplete ? "COMPLETED" : "not complete"}: ${this.consecutiveCount}/${this.config.turns} consecutive turns`,
    );

    return isComplete;
  }

  checkRequirements() {
    return this.config.requirements.every((requirement) => {
      switch (requirement) {
        case "both_refineries_operational":
          return this.checkBothRefineriesOperational();
        case "fuel_positive":
          return this.playerStorage.getFuel() > 0;
        case "materials_positive":
          return this.playerStorage.getMaterials() > 0;
        default:
          console.warn(
            `[ConsecutiveTurnsCondition] Unknown requirement: ${requirement}`,
          );
          return false;
      }
    });
  }

  checkBothRefineriesOperational() {
    const refineries = this.gameState.buildings.filter(
      (b) => b.type === "refinery",
    );

    const fuelRefineries = refineries.filter((r) => {
      // For progression objectives, we only check if the mode is set correctly
      // Not whether they can produce right now (which depends on waste availability)
      return r.productionMode === "fuel";
    });

    const materialRefineries = refineries.filter((r) => {
      return r.productionMode === "materials";
    });

    return fuelRefineries.length >= 1 && materialRefineries.length >= 1;
  }

  getCheckData() {
    return {
      consecutiveCount: this.consecutiveCount,
      requiredCount: this.config.turns,
      lastMetTurn: this.lastMetTurn,
      currentRequirements: this.config.requirements.map((req) => ({
        requirement: req,
        met: this.checkSingleRequirement(req),
      })),
      progress: Math.min(this.consecutiveCount / this.config.turns, 1.0),
    };
  }

  checkSingleRequirement(requirement) {
    switch (requirement) {
      case "both_refineries_operational":
        return this.checkBothRefineriesOperational();
      case "fuel_positive":
        return this.playerStorage.getFuel() > 0;
      case "materials_positive":
        return this.playerStorage.getMaterials() > 0;
      default:
        return false;
    }
  }

  getProgress() {
    return Math.min(this.consecutiveCount / this.config.turns, 1.0);
  }

  reset() {
    super.reset();
    this.consecutiveCount = 0;
    this.lastMetTurn = null;
    this.requirementTracker.clear();
  }
}
