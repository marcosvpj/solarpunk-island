/**
 * WorldStateManager - Manages persistent world state for Long Tomorrow mode
 *
 * Handles the transformation of world state between sessions, including:
 * - Building to ruin conversions
 * - Terrain evolution (parks/farms to forests)
 * - Soil memory system
 * - Cultural sediment layers
 */

import EventBus from "../../engine/EventBus.js";

export class WorldStateManager {
  constructor() {
    this.worldHistory = []; // Array of session states
    this.currentWorldState = null;
    this.previousWorldState = null;

    // Transformation rules (from specification)
    this.transformationRules = {
      terrainEvolution: {
        park: { becomes: "forest", materialBonus: 1 },
        farm: { becomes: "fertile_forest", materialBonus: 2 },
      },
      buildingDecay: {
        basic: { recoveryRate: 0.5, decayRate: 0.0 }, // 50% materials, no decay
        advanced: { recoveryRate: 0.75, decayRate: 0.1 }, // 75% + rare materials, 10% decay
        highLevel: { becomesRuin: true, hasChoices: true }, // Level 3+ become interactive ruins
      },
      soilMemory: {
        enriched: { bonus: 0.25, maxBonus: 0.5, duration: 3 },
        depleted: { penalty: 0.5, recoveryTime: 2 },
        contaminated: { penalty: 0.25, spreads: true, spreadRate: 0.05 },
      },
    };

    console.log("[WorldStateManager] Initialized");
  }

  /**
   * Initialize world state for a new Long Tomorrow session
   * @param {Object} initialState - Optional initial world state
   */
  initializeWorldState(initialState = null) {
    if (initialState) {
      this.currentWorldState = this.cloneWorldState(initialState);
    } else {
      this.currentWorldState = this.createEmptyWorldState();
    }

    console.log("[WorldStateManager] World state initialized");
    EventBus.emit("worldState:initialized", this.currentWorldState);

    return this.currentWorldState;
  }

  /**
   * Create an empty world state for first-time sessions
   */
  createEmptyWorldState() {
    return {
      sessionId: this.generateSessionId(),
      sessionNumber: 1,
      startTime: Date.now(),

      // Terrain state
      terrain: new Map(), // hexId -> terrain data

      // Building state
      buildings: new Map(), // hexId -> building data
      ruins: new Map(), // hexId -> ruin data
      memorials: new Map(), // hexId -> memorial data

      // Soil memory
      soilMemory: new Map(), // hexId -> soil state

      // Cultural layers
      culturalSites: new Map(), // hexId -> cultural data

      // Infrastructure memory
      droneRoutes: [], // Established drone paths
      utilities: new Map(), // hexId -> utility remnants

      // Session statistics
      stats: {
        totalSessions: 1,
        buildingsBuilt: 0,
        buildingsRecycled: 0,
        buildingsRestored: 0,
        memorialsCreated: 0,
        forestsGrown: 0,
      },
    };
  }

  /**
   * Record the current session state for future evolution
   * @param {Object} gameState - Current game state to record
   * @param {Object} sessionData - Additional session data
   */
  recordSessionState(gameState, sessionData = {}) {
    const sessionState = {
      sessionId: this.generateSessionId(),
      sessionNumber: this.worldHistory.length + 1,
      endTime: Date.now(),
      gameState: this.extractRelevantGameState(gameState),
      sessionData,

      // Record transformation-relevant data
      populationHistory: this.recordPopulationHistory(gameState),
      buildingLifecycles: this.recordBuildingLifecycles(gameState),
      environmentalEvents: this.recordEnvironmentalEvents(gameState),
    };

    this.worldHistory.push(sessionState);
    this.previousWorldState = this.currentWorldState;

    console.log(
      "[WorldStateManager] Session state recorded:",
      sessionState.sessionId,
    );
    EventBus.emit("worldState:sessionRecorded", sessionState);

    return sessionState;
  }

  /**
   * Evolve the world state based on the previous session
   * @param {Object} previousSession - The completed session to evolve from
   * @returns {Object} New world state for next session
   */
  evolveWorldState(previousSession) {
    console.log(
      "[WorldStateManager] Evolving world state from session:",
      previousSession.sessionId,
    );

    const newWorldState = this.createEmptyWorldState();
    newWorldState.sessionNumber = previousSession.sessionNumber + 1;
    newWorldState.stats.totalSessions = previousSession.sessionNumber + 1;

    // Apply terrain evolution
    this.applyTerrainEvolution(newWorldState, previousSession);

    // Apply building transformations
    this.applyBuildingTransformations(newWorldState, previousSession);

    // Apply soil memory evolution
    this.applySoilMemoryEvolution(newWorldState, previousSession);

    // Apply cultural layer changes
    this.applyCulturalEvolution(newWorldState, previousSession);

    // Apply infrastructure memory
    this.applyInfrastructureEvolution(newWorldState, previousSession);

    this.currentWorldState = newWorldState;

    console.log("[WorldStateManager] World state evolution complete");
    EventBus.emit("worldState:evolved", newWorldState);

    return newWorldState;
  }

  /**
   * Apply terrain evolution rules (parks/farms → forests)
   */
  applyTerrainEvolution(newWorldState, previousSession) {
    const previousGameState = previousSession.gameState;

    // Find abandoned parks and farms
    if (previousGameState.terrain) {
      previousGameState.terrain.forEach((terrainData, hexId) => {
        const rule =
          this.transformationRules.terrainEvolution[terrainData.type];
        if (rule && this.wasAbandoned(terrainData, previousSession)) {
          newWorldState.terrain.set(hexId, {
            type: rule.becomes,
            materialBonus: rule.materialBonus,
            evolved: true,
            evolutionSource: terrainData.type,
            sessionEvolved: newWorldState.sessionNumber,
          });

          newWorldState.stats.forestsGrown++;
        }
      });
    }
  }

  /**
   * Apply building transformation rules (buildings → ruins/resources)
   */
  applyBuildingTransformations(newWorldState, previousSession) {
    const previousGameState = previousSession.gameState;

    if (previousGameState.buildings) {
      previousGameState.buildings.forEach((buildingData, hexId) => {
        if (buildingData.level >= 3) {
          // High-level buildings become interactive ruins
          this.createInteractiveRuin(newWorldState, hexId, buildingData);
        } else {
          // Lower-level buildings become resource piles
          this.createResourcePile(newWorldState, hexId, buildingData);
        }
      });
    }
  }

  /**
   * Create an interactive ruin with three choices
   */
  createInteractiveRuin(worldState, hexId, buildingData) {
    const ruin = {
      type: "interactive_ruin",
      originalBuilding: buildingData,
      choices: {
        recycle: {
          resources: Math.floor(buildingData.constructionCost * 1.5),
          rareComponents: this.calculateRareComponents(buildingData),
          turnsRequired: 2,
        },
        restore: {
          cost: Math.floor(buildingData.constructionCost * 0.75),
          levelBonus: 2,
          ancestralTrait: true,
          turnsRequired: 4,
        },
        memorialize: {
          cost: 1, // 1 material for memorial marker
          adjacencyBonus: 0.15, // 15% efficiency bonus
          permanent: true,
        },
      },
      sessionCreated: worldState.sessionNumber,
    };

    worldState.ruins.set(hexId, ruin);
    worldState.stats.buildingsBuilt++; // Count towards total building activity
  }

  /**
   * Create a resource pile from a lower-level building
   */
  createResourcePile(worldState, hexId, buildingData) {
    const recoveryRate =
      buildingData.level >= 2
        ? this.transformationRules.buildingDecay.advanced.recoveryRate
        : this.transformationRules.buildingDecay.basic.recoveryRate;

    const resourceAmount = Math.floor(
      buildingData.constructionCost * recoveryRate,
    );

    // Add to terrain as a resource pile
    worldState.terrain.set(hexId, {
      type: "resource_pile",
      resourceType: "materials",
      amount: resourceAmount,
      originalBuilding: buildingData.type,
      sessionCreated: worldState.sessionNumber,
      decayRate: this.transformationRules.buildingDecay.advanced.decayRate || 0,
    });
  }

  /**
   * Apply soil memory evolution
   */
  applySoilMemoryEvolution(newWorldState, previousSession) {
    // Implementation for soil enrichment/depletion evolution
    // This will track how previous farming/industrial use affects the land

    // For now, create foundation for soil memory tracking
    const soilChanges = this.calculateSoilChanges(previousSession);
    soilChanges.forEach((change, hexId) => {
      newWorldState.soilMemory.set(hexId, change);
    });
  }

  /**
   * Apply cultural evolution (beloved/cursed/sacred ground)
   */
  applyCulturalEvolution(newWorldState, previousSession) {
    const culturalEvents = this.analyzeCulturalEvents(previousSession);

    culturalEvents.forEach((event, hexId) => {
      newWorldState.culturalSites.set(hexId, {
        type: event.type, // 'beloved', 'cursed', 'sacred'
        intensity: event.intensity,
        bonus: event.bonus,
        sessionCreated: newWorldState.sessionNumber,
        sourceEvent: event.sourceEvent,
      });
    });
  }

  /**
   * Apply infrastructure memory evolution
   */
  applyInfrastructureEvolution(newWorldState, previousSession) {
    // Track drone routes, utility remnants, etc.
    // For now, foundation implementation
    newWorldState.droneRoutes = this.evolveDroneRoutes(previousSession);
    newWorldState.utilities = this.evolveUtilities(previousSession);
  }

  /**
   * Helper methods for world state management
   */

  wasAbandoned(terrainData, session) {
    // Determine if terrain was abandoned during the session
    // Implementation will depend on game tracking
    return true; // Placeholder
  }

  calculateRareComponents(buildingData) {
    // Calculate rare materials based on building type and level
    const baseRare = Math.floor(buildingData.level / 2);
    return Math.max(1, baseRare);
  }

  calculateSoilChanges(session) {
    // Analyze previous session for soil effects
    return new Map(); // Placeholder
  }

  analyzeCulturalEvents(session) {
    // Analyze session for cultural significance
    return new Map(); // Placeholder
  }

  evolveDroneRoutes(session) {
    // Track drone route establishment
    return []; // Placeholder
  }

  evolveUtilities(session) {
    // Track utility remnants
    return new Map(); // Placeholder
  }

  extractRelevantGameState(gameState) {
    // Extract only the data needed for world evolution
    return {
      buildings: this.cloneMap(gameState.buildings || new Map()),
      terrain: this.cloneMap(gameState.terrain || new Map()),
      population: gameState.population || 0,
      turn: gameState.turn || 0,
    };
  }

  recordPopulationHistory(gameState) {
    return {
      finalPopulation: gameState.population || 0,
      peakPopulation: gameState.peakPopulation || 0,
      happinessEvents: gameState.happinessEvents || [],
    };
  }

  recordBuildingLifecycles(gameState) {
    return {
      totalBuilt: gameState.buildingsBuilt || 0,
      totalDestroyed: gameState.buildingsDestroyed || 0,
      finalBuildingCount:
        (gameState.buildings && gameState.buildings.size) || 0,
    };
  }

  recordEnvironmentalEvents(gameState) {
    return {
      disasters: gameState.disasters || [],
      pollutionEvents: gameState.pollutionEvents || [],
    };
  }

  /**
   * Utility methods
   */

  generateSessionId() {
    return `world_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  cloneWorldState(worldState) {
    return JSON.parse(JSON.stringify(worldState));
  }

  cloneMap(map) {
    const newMap = new Map();
    map.forEach((value, key) => {
      newMap.set(key, JSON.parse(JSON.stringify(value)));
    });
    return newMap;
  }

  /**
   * Get current world state
   */
  getCurrentWorldState() {
    return this.currentWorldState;
  }

  /**
   * Get world history
   */
  getWorldHistory() {
    return [...this.worldHistory];
  }

  /**
   * Get world statistics
   */
  getWorldStats() {
    return this.currentWorldState ? this.currentWorldState.stats : null;
  }
}

export default WorldStateManager;
