/**
 * SimpleBuildingSystem.js - Unified building management
 * Data-driven building system with integrated tooltips and context menus
 */

import {
  BUILDINGS,
  getBuildingData,
  calculateBuildingCost,
  canAffordBuilding,
} from "../configs/GameData.js";
import EventBus from "./EventBus.js";
import GameObjectFactory from "./GameObjectFactory.js";
import {
  addSimplifiedMethods,
  ensureBuildingProperties,
} from "./BuildingCompatibility.js";

export class SimpleBuildingSystem {
  constructor(gameState, playerStorage) {
    this.gameState = gameState;
    this.playerStorage = playerStorage;
    this.buildings = new Map(); // hexId -> building

    console.log("[SimpleBuildingSystem] Initialized");
  }

  /**
   * Build a building on a hex - uses existing GameObjectFactory
   */
  build(hex, type) {
    const buildingData = getBuildingData(type);
    if (!buildingData) {
      console.error("[Build] Unknown building type:", type);
      return null;
    }

    if (hex.building) {
      console.error("[Build] Hex already has a building");
      return null;
    }

    const cost = calculateBuildingCost(type, 1);
    if (!canAffordBuilding(type, 1, this.playerStorage)) {
      console.error("[Build] Cannot afford building");
      return null;
    }

    // Use existing factory system
    const building = GameObjectFactory.createBuilding(type, hex);
    if (!building) {
      console.error("[Build] Failed to create building via factory");
      return null;
    }

    // Consume materials after successful creation
    this.playerStorage.removeResources(cost.materials, "materials");

    // Ensure building has all required properties
    ensureBuildingProperties(building);

    // Add simplified methods to existing building
    addSimplifiedMethods(building, this);

    // Track in our system
    this.buildings.set(`${type}_${hex.q}_${hex.r}`, building);

    // Add to legacy gameState array for compatibility (drones, etc.)
    if (
      this.gameState.buildings &&
      !this.gameState.buildings.includes(building)
    ) {
      this.gameState.buildings.push(building);
    }

    console.log(`[Build] Built ${type} at (${hex.q}, ${hex.r})`);
    EventBus.emit("building:built", { building, hex });

    return building;
  }

  /**
   * Demolish a building - integrates with existing system
   */
  demolish(hex) {
    if (!hex.building) return false;

    const building = hex.building;
    const buildingId = `${building.type}_${hex.q}_${hex.r}`;

    // Use existing building destruction if available
    if (building.destroy) {
      building.destroy();
    }

    // Remove from our tracking
    this.buildings.delete(buildingId);

    // Remove from legacy gameState array
    const index = this.gameState.buildings.indexOf(building);
    if (index > -1) this.gameState.buildings.splice(index, 1);

    // Unlink from hex
    hex.building = null;

    console.log(
      `[Demolish] Demolished ${building.type} at (${hex.q}, ${hex.r})`,
    );
    EventBus.emit("building:demolished", { building, hex });

    return true;
  }

  /**
   * Check if building can upgrade - uses existing building methods if available
   */
  canUpgrade(building) {
    // Use existing building method if available
    if (building.canUpgrade && typeof building.canUpgrade === "function") {
      return building.canUpgrade();
    }

    // Fallback to data-driven approach
    const buildingData = getBuildingData(building.type);
    if (!buildingData) return false;

    if (building.level >= buildingData.maxLevel) return false;

    const cost = calculateBuildingCost(building.type, building.level + 1);
    return canAffordBuilding(
      building.type,
      building.level + 1,
      this.playerStorage,
    );
  }

  /**
   * Upgrade a building - uses existing building methods if available
   */
  upgrade(building) {
    if (!this.canUpgrade(building)) return false;

    // Use existing building upgrade method if available
    if (building.upgrade && typeof building.upgrade === "function") {
      return building.upgrade();
    }

    // Fallback to manual upgrade
    const cost = calculateBuildingCost(building.type, building.level + 1);
    this.playerStorage.removeResources(cost.materials, "materials");

    building.level++;

    console.log(
      `[Upgrade] Upgraded ${building.type} to level ${building.level}`,
    );
    EventBus.emit("building:upgraded", { building });

    return true;
  }

  /**
   * Get tooltip text for building - uses existing methods if available
   */
  getTooltip(building) {
    // Use existing building tooltip method if available
    if (
      building.getTooltipInfo &&
      typeof building.getTooltipInfo === "function"
    ) {
      const existing = building.getTooltipInfo();
      if (existing) return existing;
    }

    // Fallback to data-driven tooltip
    const buildingData = getBuildingData(building.type);
    if (!buildingData) return `${building.type} (Level ${building.level})`;

    let tooltip = `${buildingData.name} (Level ${building.level})`;
    tooltip += `\nFuel: -${buildingData.fuelConsumption}/turn`;

    if (this.canUpgrade(building)) {
      const cost = calculateBuildingCost(building.type, building.level + 1);
      tooltip += `\nUpgrade: ${cost.materials} materials`;
    } else {
      tooltip += `\nMax level reached`;
    }

    return tooltip;
  }

  /**
   * Get context menu for building - uses existing methods if available
   */
  getContextMenu(building) {
    console.log(
      `[SimpleBuildingSystem] Getting context menu for ${building.type}`,
    );
    console.log(
      `[SimpleBuildingSystem] Building has getContextMenuItems method: ${building.getContextMenuItems && typeof building.getContextMenuItems === "function"}`,
    );

    // Ensure global playerStorage is available for building methods
    if (!window.playerStorage && this.playerStorage) {
      window.playerStorage = this.playerStorage;
      console.log(`[SimpleBuildingSystem] Set window.playerStorage`);
    }

    // Use existing building context menu method if available
    if (
      building.getContextMenuItems &&
      typeof building.getContextMenuItems === "function"
    ) {
      console.log(
        `[SimpleBuildingSystem] Calling ${building.type}.getContextMenuItems()`,
      );
      const existing = building.getContextMenuItems();
      console.log(
        `[SimpleBuildingSystem] ${building.type} getContextMenuItems returned:`,
        existing,
      );
      if (existing && existing.length > 0) {
        // Add demolish option to existing menu
        existing.push({
          label: "Demolish",
          action: () => this.demolish(building.hex),
        });
        console.log(
          `[SimpleBuildingSystem] Enhanced ${building.type} menu with demolish option, total items: ${existing.length}`,
        );
        return existing;
      } else {
        console.log(
          `[SimpleBuildingSystem] ${building.type} getContextMenuItems returned empty or null, falling back to standard menu`,
        );
      }
    } else {
      console.log(
        `[SimpleBuildingSystem] ${building.type} does not have getContextMenuItems method, using fallback`,
      );
    }

    // Fallback to standard menu
    const menu = [];

    if (this.canUpgrade(building)) {
      const cost = calculateBuildingCost(building.type, building.level + 1);
      menu.push({
        label: `Upgrade (${cost.materials} materials)`,
        action: () => this.upgrade(building),
        disabled: !canAffordBuilding(
          building.type,
          building.level + 1,
          this.playerStorage,
        ),
      });
    }

    menu.push({
      label: "Demolish",
      action: () => this.demolish(building.hex),
    });

    return menu;
  }

  /**
   * Get context menu for hex (unified system)
   */
  getHexContextMenu(hex) {
    if (hex.building) {
      return hex.building.getContextMenu();
    }

    if (hex.resource) {
      return [
        {
          label: `Collect ${hex.resource.type}`,
          action: () => this.collectResource(hex),
          disabled: !this.playerStorage.canStore(10),
        },
      ];
    }

    // Empty hex - show build menu
    return Object.keys(BUILDINGS).map((type) => {
      const building = getBuildingData(type);
      const cost = calculateBuildingCost(type, 1);
      const canAfford = canAffordBuilding(type, 1, this.playerStorage);

      return {
        label: `Build ${building.name} (${cost.materials} materials)`,
        action: () => this.build(hex, type),
        disabled: !canAfford,
      };
    });
  }

  /**
   * Collect resource (helper method)
   */
  collectResource(hex) {
    if (!hex.resource) return;

    const amount = Math.min(10, hex.resource.amount);
    const collected = hex.resource.collect(amount);

    if (collected > 0) {
      this.playerStorage.addResources(collected, hex.resource.type);
      console.log(`[Collect] Collected ${collected} ${hex.resource.type}`);
    }
  }

  /**
   * Sync with existing buildings in gameState (for compatibility)
   */
  syncWithLegacyBuildings() {
    this.gameState.buildings.forEach((building) => {
      const buildingId = `${building.type}_${building.hex.q}_${building.hex.r}`;

      if (!this.buildings.has(buildingId)) {
        // Add existing building to our system
        ensureBuildingProperties(building);
        addSimplifiedMethods(building, this);
        this.buildings.set(buildingId, building);
      }
    });
  }

  /**
   * Update all buildings (called from game loop)
   */
  update() {
    // Sync with any buildings created outside our system
    this.syncWithLegacyBuildings();

    // Update all buildings
    this.buildings.forEach((building) => {
      if (building.update) {
        building.update();
      }
    });
  }
}
