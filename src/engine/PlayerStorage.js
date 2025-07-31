import EventBus from "./EventBus.js";
import { getInitialResources } from "../configs/GameData.js";

/**
 * PlayerStorage - Manages global resource storage and limits
 *
 * Handles storage capacity calculation based on storage buildings,
 * resource validation, and collection limiting. Designed to work
 * with both global storage (current) and individual building storage (future).
 */
export class PlayerStorage {
  constructor(gameStateManager = null) {
    this.gameStateManager = gameStateManager;

    // Current storage state
    this.baseStorageLimit = 100; // Base storage capacity without buildings

    // Storage system mode
    this.useIndividualStorage = false; // Feature flag for future enhancement

    // Resource types - Core game economy (loaded from GameData.js)
    this.resourceTypes = getInitialResources();

    // Calculate total resources from initial values
    this.currentResources = Object.values(this.resourceTypes).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    // Subscribe to relevant events
    this.setupEventListeners();

    console.log(
      "[PlayerStorage] Initialized with base capacity:",
      this.baseStorageLimit,
    );
  }

  /**
   * Set up event listeners for storage-related events
   */
  setupEventListeners() {
    // Listen for storage building changes
    EventBus.on("storage:upgraded", this.handleStorageUpgraded.bind(this));
    EventBus.on("storage:destroyed", this.handleStorageDestroyed.bind(this));
    EventBus.on(
      "factory:buildingCreated",
      this.handleBuildingCreated.bind(this),
    );
    EventBus.on(
      "factory:buildingRemoved",
      this.handleBuildingRemoved.bind(this),
    );

    // Listen for resource events
    EventBus.on("resource:collected", this.handleResourceCollected.bind(this));
  }

  /**
   * Calculate current storage limit based on storage buildings
   * @returns {number} Total storage limit
   */
  getCurrentLimit() {
    if (this.useIndividualStorage) {
      return this.getIndividualStorageTotal();
    }

    // Global storage mode - sum up all storage building capacities
    const storageBuildings = this.getStorageBuildings();
    const buildingCapacity = storageBuildings.reduce((total, building) => {
      return total + building.getMaxCapacity();
    }, 0);

    return this.baseStorageLimit + buildingCapacity;
  }

  /**
   * Get current available storage space
   * @returns {number} Available storage space
   */
  getAvailableSpace() {
    return this.getCurrentLimit() - this.currentResources;
  }

  /**
   * Check if we can store the specified amount
   * @param {number} amount - Amount to store
   * @returns {boolean} True if can store the amount
   */
  canStore(amount) {
    return this.currentResources + amount <= this.getCurrentLimit();
  }

  /**
   * Add resources to storage
   * @param {number} amount - Amount to add
   * @param {string} resourceType - Type of resource (default: 'radioactive_waste')
   * @returns {number} Amount actually stored
   */
  addResources(amount, resourceType = "radioactive_waste") {
    console.log(
      `[PlayerStorage] addResources called with ${amount} ${resourceType}`,
    );
    console.log(
      `[PlayerStorage] Current state - resources: ${this.currentResources}, limit: ${this.getCurrentLimit()}`,
    );

    const availableSpace = this.getAvailableSpace();
    const actualAmount = Math.min(amount, availableSpace);

    console.log(
      `[PlayerStorage] Available space: ${availableSpace}, will add: ${actualAmount}`,
    );

    if (actualAmount > 0) {
      this.currentResources += actualAmount;

      // Track by resource type for future use
      if (
        Object.prototype.hasOwnProperty.call(this.resourceTypes, resourceType)
      ) {
        this.resourceTypes[resourceType] += actualAmount;
      }

      console.log(
        `[PlayerStorage] Updated - resources: ${this.currentResources}, resourceTypes:`,
        this.resourceTypes,
      );

      // Emit storage change event
      EventBus.emit("playerStorage:resourcesAdded", {
        amount: actualAmount,
        resourceType,
        newTotal: this.currentResources,
        currentLimit: this.getCurrentLimit(),
        availableSpace: this.getAvailableSpace(),
      });

      console.log(
        `[PlayerStorage] Added ${actualAmount} ${resourceType}, total: ${this.currentResources}/${this.getCurrentLimit()}`,
      );
      console.log(
        `[PlayerStorage] Event emitted: playerStorage:resourcesAdded`,
      );
    } else {
      console.log(
        `[PlayerStorage] No resources added - actualAmount: ${actualAmount}`,
      );
    }

    return actualAmount;
  }

  /**
   * Remove resources from storage
   * @param {number} amount - Amount to remove
   * @param {string} resourceType - Type of resource (default: 'radioactive_waste')
   * @returns {number} Amount actually removed
   */
  removeResources(amount, resourceType = "radioactive_waste") {
    const currentTypeAmount = this.resourceTypes[resourceType] || 0;
    const actualAmount = Math.min(
      amount,
      currentTypeAmount,
      this.currentResources,
    );

    if (actualAmount > 0) {
      this.currentResources -= actualAmount;

      if (
        Object.prototype.hasOwnProperty.call(this.resourceTypes, resourceType)
      ) {
        this.resourceTypes[resourceType] -= actualAmount;
      }

      // Emit storage change event
      EventBus.emit("playerStorage:resourcesRemoved", {
        amount: actualAmount,
        resourceType,
        newTotal: this.currentResources,
        currentLimit: this.getCurrentLimit(),
      });

      console.log(
        `[PlayerStorage] Removed ${actualAmount} ${resourceType}, total: ${this.currentResources}/${this.getCurrentLimit()}`,
      );
    }

    return actualAmount;
  }

  /**
   * Get all storage buildings
   * @returns {StorageBuilding[]} Array of storage buildings
   */
  getStorageBuildings() {
    if (this.gameStateManager) {
      return this.gameStateManager.getBuildingsByType("storage");
    }
    // Fallback: no storage buildings available
    return [];
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage statistics
   */
  getStorageStats() {
    const storageBuildings = this.getStorageBuildings();

    return {
      currentResources: this.currentResources,
      currentLimit: this.getCurrentLimit(),
      availableSpace: this.getAvailableSpace(),
      fillPercentage:
        this.getCurrentLimit() > 0
          ? this.currentResources / this.getCurrentLimit()
          : 0,
      baseLimit: this.baseStorageLimit,
      buildingCount: storageBuildings.length,
      buildingCapacity: this.getCurrentLimit() - this.baseStorageLimit,
      resourceTypes: { ...this.resourceTypes },
      useIndividualStorage: this.useIndividualStorage,
    };
  }

  /**
   * Calculate total storage for individual building mode (future)
   * @returns {number} Total individual storage capacity
   */
  getIndividualStorageTotal() {
    const storageBuildings = this.getStorageBuildings();
    return (
      this.baseStorageLimit +
      storageBuildings.reduce((total, building) => {
        return total + building.getAvailableCapacity();
      }, 0)
    );
  }

  /**
   * Enable individual storage mode (future enhancement)
   */
  enableIndividualStorage() {
    if (this.useIndividualStorage) return;

    this.useIndividualStorage = true;

    // Distribute current resources among storage buildings
    const storageBuildings = this.getStorageBuildings();
    let remainingResources = this.currentResources;

    storageBuildings.forEach((building) => {
      building.enableIndividualStorage();
      const amountToStore = Math.min(
        remainingResources,
        building.getMaxCapacity(),
      );
      if (amountToStore > 0) {
        building.addResources(amountToStore);
        remainingResources -= amountToStore;
      }
    });

    EventBus.emit("playerStorage:individualModeEnabled", {
      distributedResources: this.currentResources - remainingResources,
      remainingResources,
    });

    console.log("[PlayerStorage] Enabled individual storage mode");
  }

  /**
   * Handle storage building upgrade
   * @param {Object} data - Upgrade event data
   */
  handleStorageUpgraded(data) {
    const { building, capacityIncrease } = data;

    EventBus.emit("playerStorage:limitChanged", {
      change: capacityIncrease,
      newLimit: this.getCurrentLimit(),
      building: building,
    });

    console.log(
      `[PlayerStorage] Storage limit increased by ${capacityIncrease} to ${this.getCurrentLimit()}`,
    );
  }

  /**
   * Handle storage building destruction
   * @param {Object} data - Destruction event data
   */
  handleStorageDestroyed(data) {
    const { building, lostCapacity } = data;

    // Check if we need to remove excess resources
    const newLimit = this.getCurrentLimit();
    if (this.currentResources > newLimit) {
      const excessResources = this.currentResources - newLimit;
      this.currentResources = newLimit;

      EventBus.emit("playerStorage:excessResourcesLost", {
        lostAmount: excessResources,
        newTotal: this.currentResources,
        newLimit,
      });

      console.log(
        `[PlayerStorage] Lost ${excessResources} resources due to storage destruction`,
      );
    }

    EventBus.emit("playerStorage:limitChanged", {
      change: -lostCapacity,
      newLimit: newLimit,
      building: building,
    });

    console.log(
      `[PlayerStorage] Storage limit decreased by ${lostCapacity} to ${newLimit}`,
    );
  }

  /**
   * Handle building creation
   * @param {Object} data - Building creation event data
   */
  handleBuildingCreated(data) {
    const { building } = data;
    if (building.type === "storage") {
      EventBus.emit("playerStorage:limitChanged", {
        change: building.getMaxCapacity(),
        newLimit: this.getCurrentLimit(),
        building: building,
      });

      console.log(
        `[PlayerStorage] Storage limit increased to ${this.getCurrentLimit()}`,
      );
    }
  }

  /**
   * Handle building removal
   * @param {Object} data - Building removal event data
   */
  handleBuildingRemoved(data) {
    const { building } = data;
    if (building.type === "storage") {
      // This will be handled by handleStorageDestroyed
    }
  }

  /**
   * Handle resource collection (for validation)
   * @param {Object} _data - Resource collection event data (unused)
   */
  handleResourceCollected(_data) {
    // This could be used for automatic resource addition in the future
    // For now, resources are added manually through addResources()
  }

  /**
   * Reset storage to initial state
   */
  reset() {
    // Reset resources to default starting values (from GameData.js)
    this.resourceTypes = getInitialResources();

    // Recalculate total from reset values
    this.currentResources = Object.values(this.resourceTypes).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    EventBus.emit("playerStorage:reset", {
      newLimit: this.getCurrentLimit(),
    });

    console.log("[PlayerStorage] Reset to initial state");
  }

  /**
   * Get specific resource amount
   * @param {string} resourceType - Type of resource
   * @returns {number} Amount of specific resource
   */
  getResourceAmount(resourceType) {
    return this.resourceTypes[resourceType] || 0;
  }

  /**
   * Get fuel amount
   * @returns {number} Current fuel
   */
  getFuel() {
    return this.getResourceAmount("fuel");
  }

  /**
   * Get materials amount
   * @returns {number} Current materials
   */
  getMaterials() {
    return this.getResourceAmount("materials");
  }

  /**
   * Get radioactive waste amount
   * @returns {number} Current radioactive waste
   */
  getWaste() {
    return this.getResourceAmount("radioactive_waste");
  }

  /**
   * Get population amount
   * @returns {number} Current population
   */
  getPopulation() {
    return this.getResourceAmount("population");
  }

  /**
   * Get food amount
   * @returns {number} Current food
   */
  getFood() {
    return this.getResourceAmount("food");
  }

  /**
   * Consume fuel (for turn processing)
   * @param {number} amount - Amount of fuel to consume
   * @returns {boolean} True if consumption successful, false if insufficient fuel
   */
  consumeFuel(amount) {
    const currentFuel = this.getFuel();
    if (currentFuel >= amount) {
      this.removeResources(amount, "fuel");
      return true;
    }
    return false;
  }

  /**
   * Consume materials (for building/upgrades)
   * @param {number} amount - Amount of materials to consume
   * @returns {boolean} True if consumption successful, false if insufficient materials
   */
  consumeMaterials(amount) {
    const currentMaterials = this.getMaterials();
    if (currentMaterials >= amount) {
      const materialsUsed = this.removeResources(amount, "materials");
      return materialsUsed === amount;
    }
    return false;
  }

  /**
   * Consume food (for population sustenance)
   * @param {number} amount - Amount of food to consume
   * @returns {number} Amount of food actually consumed
   */
  consumeFood(amount) {
    const currentFood = this.getFood();
    const actualConsumed = Math.min(amount, currentFood);
    if (actualConsumed > 0) {
      this.removeResources(actualConsumed, "food");
    }
    return actualConsumed;
  }

  /**
   * Add population
   * @param {number} amount - Amount of population to add
   * @returns {number} Amount actually added
   */
  addPopulation(amount) {
    return this.addResources(amount, "population");
  }

  /**
   * Remove population (due to starvation, disasters, etc.)
   * @param {number} amount - Amount of population to remove
   * @returns {number} Amount actually removed
   */
  removePopulation(amount) {
    return this.removeResources(amount, "population");
  }

  /**
   * Add food to storage
   * @param {number} amount - Amount of food to add
   * @returns {number} Amount actually added
   */
  addFood(amount) {
    return this.addResources(amount, "food");
  }

  /**
   * Calculate turns remaining based on current fuel and consumption rate
   * @param {number} consumptionPerTurn - Fuel consumed per turn
   * @returns {number} Turns remaining (rounded down)
   */
  getTurnsRemaining(consumptionPerTurn) {
    if (consumptionPerTurn <= 0) return Infinity;
    return Math.floor(this.getFuel() / consumptionPerTurn);
  }

  /**
   * Get total housing capacity from all habitat buildings
   * @returns {number} Total housing capacity
   */
  getHousingCapacity() {
    if (this.gameStateManager) {
      const habitats = this.gameStateManager.getBuildingsByType("habitat");
      return habitats.reduce((total, habitat) => {
        return total + habitat.getHousingCapacity();
      }, 0);
    }
    // Fallback: base capacity for starting population
    return 5;
  }

  /**
   * Check if population can grow (has available housing)
   * @returns {boolean} True if population can grow
   */
  canPopulationGrow() {
    const currentPopulation = this.getPopulation();
    const housingCapacity = this.getHousingCapacity();
    return currentPopulation < housingCapacity;
  }

  /**
   * Process population mechanics for turn (food consumption and growth/starvation)
   * @param {Object} populationConfig - Population configuration from GameData.js
   * @returns {Object} Population processing results
   */
  processPopulation(populationConfig) {
    const currentPopulation = this.getPopulation();
    const currentFood = this.getFood();

    // Calculate food consumption
    const foodNeeded =
      currentPopulation * populationConfig.foodConsumptionPerPerson;
    const foodConsumed = this.consumeFood(foodNeeded);

    let populationChange = 0;
    let changeReason = "stable";

    // Handle starvation
    if (foodConsumed < foodNeeded) {
      const foodShortage = foodNeeded - foodConsumed;
      const populationLoss = Math.ceil(
        foodShortage * populationConfig.starvationRate,
      );
      const actualLoss = this.removePopulation(populationLoss);
      populationChange = -actualLoss;
      changeReason = "starvation";

      console.log(
        `[Population] Starvation: ${actualLoss} population lost due to food shortage`,
      );
    }
    // Handle population growth
    else if (foodConsumed >= foodNeeded && this.canPopulationGrow()) {
      const surplusFood = currentFood - foodNeeded;
      if (surplusFood > 0 && Math.random() < populationConfig.growthChance) {
        const growthAmount = Math.min(populationConfig.maxGrowthPerTurn, 1);
        const actualGrowth = this.addPopulation(growthAmount);
        populationChange = actualGrowth;
        changeReason = "growth";

        console.log(`[Population] Growth: ${actualGrowth} population added`);
      }
    }

    const results = {
      populationBefore: currentPopulation,
      populationAfter: this.getPopulation(),
      populationChange,
      changeReason,
      foodConsumed,
      foodNeeded,
      housingCapacity: this.getHousingCapacity(),
      canGrow: this.canPopulationGrow(),
    };

    // Emit population change event
    if (populationChange !== 0) {
      EventBus.emit("population:changed", results);
    }

    return results;
  }

  /**
   * Get debug information
   * @returns {Object} Debug info
   */
  getDebugInfo() {
    return {
      ...this.getStorageStats(),
      storageBuildings: this.getStorageBuildings().map((building) =>
        building.getStorageInfo(),
      ),
    };
  }
}

export default PlayerStorage;
