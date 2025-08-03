import EventBus from "./EventBus.js";

/**
 * GameStateManager - Centralized state management for all game objects
 *
 * Tracks all game objects by type and provides queries for game logic.
 * Subscribes to factory and object events to maintain consistent state.
 */

export class GameStateManager {
  constructor() {
    // Object storage by type
    this.buildings = new Map(); // id -> Building
    this.resources = new Map(); // id -> Resource
    this.units = new Map(); // id -> Unit

    // Hex-based lookups for quick access
    this.hexBuildings = new Map(); // hexId -> Building
    this.hexResources = new Map(); // hexId -> Resource
    this.hexUnits = new Map(); // hexId -> Unit

    // Statistics
    this.stats = {
      totalBuildings: 0,
      totalResources: 0,
      totalUnits: 0,
      buildingsByType: new Map(),
      resourcesByType: new Map(),
      unitsByType: new Map(),
    };

    // Subscribe to relevant events
    this.setupEventListeners();

    console.log("[GameStateManager] Initialized");
  }

  /**
   * Set up event listeners for object lifecycle
   */
  setupEventListeners() {
    // Factory events
    EventBus.on(
      "factory:buildingCreated",
      this.handleBuildingCreated.bind(this),
    );
    EventBus.on(
      "factory:resourceCreated",
      this.handleResourceCreated.bind(this),
    );
    EventBus.on("factory:unitCreated", this.handleUnitCreated.bind(this));

    EventBus.on(
      "factory:buildingRemoved",
      this.handleBuildingRemoved.bind(this),
    );
    EventBus.on(
      "factory:resourceRemoved",
      this.handleResourceRemoved.bind(this),
    );
    EventBus.on("factory:unitRemoved", this.handleUnitRemoved.bind(this));

    // Object destruction events (in case objects are destroyed directly)
    EventBus.on("building:destroyed", this.handleBuildingDestroyed.bind(this));
    EventBus.on("resource:destroyed", this.handleResourceDestroyed.bind(this));
    EventBus.on("unit:destroyed", this.handleUnitDestroyed.bind(this));

    // Movement events
    EventBus.on("gameObject:moved", this.handleObjectMoved.bind(this));
  }

  /**
   * Handle building creation
   * @param {Object} data - Event data with building, hex, type
   */
  handleBuildingCreated(data) {
    const { building, hex } = data;

    this.buildings.set(building.id, building);
    this.hexBuildings.set(this.getHexId(hex), building);

    this.updateBuildingStats(building.type, 1);
    this.stats.totalBuildings++;

    console.log(
      `[GameStateManager] Registered building ${building.id} (${building.type})`,
    );
  }

  /**
   * Handle resource creation
   * @param {Object} data - Event data with resource, hex, type, amount
   */
  handleResourceCreated(data) {
    const { resource, hex } = data;

    this.resources.set(resource.id, resource);
    this.hexResources.set(this.getHexId(hex), resource);

    this.updateResourceStats(resource.type, 1);
    this.stats.totalResources++;

    console.log(
      `[GameStateManager] Registered resource ${resource.id} (${resource.type})`,
    );
  }

  /**
   * Handle unit creation
   * @param {Object} data - Event data with unit, hex, type
   */
  handleUnitCreated(data) {
    const { unit, hex } = data;

    this.units.set(unit.id, unit);
    this.hexUnits.set(this.getHexId(hex), unit);

    this.updateUnitStats(unit.type, 1);
    this.stats.totalUnits++;

    console.log(`[GameStateManager] Registered unit ${unit.id} (${unit.type})`);
  }

  /**
   * Handle building removal
   * @param {Object} data - Event data with building, hex
   */
  handleBuildingRemoved(data) {
    const { building, hex } = data;
    this.unregisterBuilding(building, hex);
  }

  /**
   * Handle resource removal
   * @param {Object} data - Event data with resource, hex
   */
  handleResourceRemoved(data) {
    const { resource, hex } = data;
    this.unregisterResource(resource, hex);
  }

  /**
   * Handle unit removal
   * @param {Object} data - Event data with unit, hex
   */
  handleUnitRemoved(data) {
    const { unit, hex } = data;
    this.unregisterUnit(unit, hex);
  }

  /**
   * Handle building destruction (direct destroy call)
   * @param {Building} building - The destroyed building
   */
  handleBuildingDestroyed(building) {
    this.unregisterBuilding(building, building.hex);
  }

  /**
   * Handle resource destruction (direct destroy call)
   * @param {Resource} resource - The destroyed resource
   */
  handleResourceDestroyed(resource) {
    this.unregisterResource(resource, resource.hex);
  }

  /**
   * Handle unit destruction (direct destroy call)
   * @param {Unit} unit - The destroyed unit
   */
  handleUnitDestroyed(unit) {
    this.unregisterUnit(unit, unit.hex);
  }

  /**
   * Handle object movement
   * @param {Object} data - Movement data with object, oldHex, newHex
   */
  handleObjectMoved(data) {
    const { object, oldHex, newHex } = data;

    if (object.type && this.buildings.has(object.id)) {
      this.hexBuildings.delete(this.getHexId(oldHex));
      this.hexBuildings.set(this.getHexId(newHex), object);
    } else if (object.type && this.units.has(object.id)) {
      this.hexUnits.delete(this.getHexId(oldHex));
      this.hexUnits.set(this.getHexId(newHex), object);
    }

    console.log(
      `[GameStateManager] Updated position for ${object.type} ${object.id}`,
    );
  }

  /**
   * Unregister a building from state
   */
  unregisterBuilding(building, hex) {
    this.buildings.delete(building.id);
    this.hexBuildings.delete(this.getHexId(hex));

    this.updateBuildingStats(building.type, -1);
    this.stats.totalBuildings--;

    console.log(
      `[GameStateManager] Unregistered building ${building.id} (${building.type})`,
    );
  }

  /**
   * Unregister a resource from state
   */
  unregisterResource(resource, hex) {
    this.resources.delete(resource.id);
    this.hexResources.delete(this.getHexId(hex));

    this.updateResourceStats(resource.type, -1);
    this.stats.totalResources--;

    console.log(
      `[GameStateManager] Unregistered resource ${resource.id} (${resource.type})`,
    );
  }

  /**
   * Unregister a unit from state
   */
  unregisterUnit(unit, hex) {
    this.units.delete(unit.id);
    this.hexUnits.delete(this.getHexId(hex));

    this.updateUnitStats(unit.type, -1);
    this.stats.totalUnits--;

    console.log(
      `[GameStateManager] Unregistered unit ${unit.id} (${unit.type})`,
    );
  }

  /**
   * Get unique hex identifier
   * @param {Hex} hex - The hex object
   * @returns {string} Unique hex ID
   */
  getHexId(hex) {
    return `${hex.q}_${hex.r}`;
  }

  /**
   * Update building statistics
   */
  updateBuildingStats(type, delta) {
    const current = this.stats.buildingsByType.get(type) || 0;
    this.stats.buildingsByType.set(type, Math.max(0, current + delta));
  }

  /**
   * Update resource statistics
   */
  updateResourceStats(type, delta) {
    const current = this.stats.resourcesByType.get(type) || 0;
    this.stats.resourcesByType.set(type, Math.max(0, current + delta));
  }

  /**
   * Update unit statistics
   */
  updateUnitStats(type, delta) {
    const current = this.stats.unitsByType.get(type) || 0;
    this.stats.unitsByType.set(type, Math.max(0, current + delta));
  }

  // === QUERY METHODS ===

  /**
   * Get all buildings
   * @returns {Building[]} Array of all buildings
   */
  getAllBuildings() {
    return Array.from(this.buildings.values());
  }

  /**
   * Get all resources
   * @returns {Resource[]} Array of all resources
   */
  getAllResources() {
    return Array.from(this.resources.values());
  }

  /**
   * Get all units
   * @returns {Unit[]} Array of all units
   */
  getAllUnits() {
    return Array.from(this.units.values());
  }

  /**
   * Get buildings by type
   * @param {string} type - Building type
   * @returns {Building[]} Array of buildings of the specified type
   */
  getBuildingsByType(type) {
    return this.getAllBuildings().filter((building) => building.type === type);
  }

  /**
   * Get resources by type
   * @param {string} type - Resource type
   * @returns {Resource[]} Array of resources of the specified type
   */
  getResourcesByType(type) {
    return this.getAllResources().filter((resource) => resource.type === type);
  }

  /**
   * Get units by type
   * @param {string} type - Unit type
   * @returns {Unit[]} Array of units of the specified type
   */
  getUnitsByType(type) {
    return this.getAllUnits().filter((unit) => unit.type === type);
  }

  /**
   * Get object at hex
   * @param {Hex} hex - The hex to check
   * @returns {Object} Object with building, resource, unit properties
   */
  getObjectsAtHex(hex) {
    const hexId = this.getHexId(hex);
    return {
      building: this.hexBuildings.get(hexId) || null,
      resource: this.hexResources.get(hexId) || null,
      unit: this.hexUnits.get(hexId) || null,
    };
  }

  /**
   * Get game statistics
   * @returns {Object} Current game statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      buildingsByType: Object.fromEntries(this.stats.buildingsByType),
      resourcesByType: Object.fromEntries(this.stats.resourcesByType),
      unitsByType: Object.fromEntries(this.stats.unitsByType),
    };
  }

  /**
   * Find all buildings of a certain level
   * @param {number} level - Building level to search for
   * @returns {Building[]} Array of buildings at the specified level
   */
  getBuildingsByLevel(level) {
    return this.getAllBuildings().filter(
      (building) => building.level === level,
    );
  }

  /**
   * Find all resources with amount above threshold
   * @param {number} threshold - Minimum resource amount
   * @returns {Resource[]} Array of resources above threshold
   */
  getResourcesAboveThreshold(threshold) {
    return this.getAllResources().filter(
      (resource) => resource.amount >= threshold,
    );
  }

  /**
   * Find all idle units
   * @returns {Unit[]} Array of idle units
   */
  getIdleUnits() {
    return this.getAllUnits().filter((unit) => unit.state === "idle");
  }

  /**
   * Clean up state manager
   */
  destroy() {
    // Clear all collections
    this.buildings.clear();
    this.resources.clear();
    this.units.clear();
    this.hexBuildings.clear();
    this.hexResources.clear();
    this.hexUnits.clear();

    // Reset stats
    this.stats = {
      totalBuildings: 0,
      totalResources: 0,
      totalUnits: 0,
      buildingsByType: new Map(),
      resourcesByType: new Map(),
      unitsByType: new Map(),
    };

    console.log("[GameStateManager] Destroyed");
  }
}

export default GameStateManager;
