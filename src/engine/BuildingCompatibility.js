/**
 * BuildingCompatibility.js - Ensures existing building classes work with SimpleBuildingSystem
 *
 * This adds the simplified methods to existing building instances
 * for seamless integration with the new data-driven approach.
 */

import {
  getBuildingData,
  calculateBuildingCost,
  canAffordBuilding,
} from "../configs/GameData.js";

export function addSimplifiedMethods(building, buildingSystem) {
  // Add getTooltip method if not present
  if (!building.getTooltip) {
    building.getTooltip = () => buildingSystem.getTooltip(building);
  }

  // Add getContextMenu method if not present
  if (!building.getContextMenu) {
    building.getContextMenu = () => buildingSystem.getContextMenu(building);
  }

  // Enhance existing canUpgrade method with data-driven fallback
  const originalCanUpgrade = building.canUpgrade;
  building.canUpgrade = () => {
    if (originalCanUpgrade && typeof originalCanUpgrade === "function") {
      return originalCanUpgrade.call(building);
    }
    return buildingSystem.canUpgrade(building);
  };

  // Enhance existing upgrade method with data-driven fallback
  const originalUpgrade = building.upgrade;
  building.upgrade = () => {
    if (originalUpgrade && typeof originalUpgrade === "function") {
      return originalUpgrade.call(building);
    }
    return buildingSystem.upgrade(building);
  };

  return building;
}

/**
 * Get building data with fallbacks for existing buildings
 */
export function getBuildingDataWithFallback(building) {
  const dataDefinition = getBuildingData(building.type);

  if (dataDefinition) {
    return dataDefinition;
  }

  // Fallback to building's own properties
  return {
    name: building.name || building.type,
    cost: { materials: building.cost || building.constructionCost || 25 },
    fuelConsumption: building.fuelConsumption || 0.5,
    maxLevel: building.maxLevel || 5,
    upgradeMultiplier: building.upgradeMultiplier || 1.5,
    description: building.description || `${building.type} building`,
  };
}

/**
 * Ensure building has required properties for data-driven system
 */
export function ensureBuildingProperties(building) {
  // Make sure building has basic properties
  if (!building.level) building.level = 1;
  if (!building.type) building.type = "unknown";
  if (!building.id)
    building.id = `${building.type}_${building.hex.q}_${building.hex.r}`;

  // Get building data
  const buildingData = getBuildingDataWithFallback(building);

  // Add missing properties from data
  if (!building.name) building.name = buildingData.name;
  if (!building.fuelConsumption)
    building.fuelConsumption = buildingData.fuelConsumption;
  if (!building.maxLevel) building.maxLevel = buildingData.maxLevel;
  if (!building.description) building.description = buildingData.description;

  return building;
}

export default {
  addSimplifiedMethods,
  getBuildingDataWithFallback,
  ensureBuildingProperties,
};
