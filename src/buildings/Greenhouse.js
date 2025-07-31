import { Building } from "./Building.js";
import EventBus from "../engine/EventBus.js";
import { BUILDINGS } from "../configs/GameData.js";

/**
 * Greenhouse class - Food production facility
 *
 * Produces food resources to sustain the colony population.
 * Essential building for colony survival and growth.
 */
export class Greenhouse extends Building {
  constructor(hex) {
    super("greenhouse", hex);

    // Get greenhouse configuration from GameData.js
    const greenhouseConfig = BUILDINGS.greenhouse;
    if (!greenhouseConfig) {
      console.error(
        "[Greenhouse] Could not find greenhouse configuration in GameData.js",
      );
      return;
    }

    // Apply configuration
    this.foodProductionRate = greenhouseConfig.foodProductionRate;
    this.waterConsumption = greenhouseConfig.waterConsumption;
    this.baseUpgradeCost = greenhouseConfig.baseUpgradeCost;
    this.maxLevel = greenhouseConfig.maxLevel;
    this.upgradeCost = this.baseUpgradeCost;

    console.log(`[Greenhouse] Created greenhouse at (${hex.q}, ${hex.r})`);
  }

  /**
   * Calculate food production for this greenhouse per turn
   * @returns {number} Food produced per turn
   */
  getFoodProduction() {
    return this.foodProductionRate * this.level;
  }

  /**
   * Calculate water consumption for this greenhouse per turn
   * @returns {number} Water consumed per turn
   */
  getWaterConsumption() {
    return this.waterConsumption * this.level;
  }

  /**
   * Check if greenhouse can produce (has enough water)
   * @returns {boolean} True if can produce food
   */
  canProduce() {
    // For now, assume water is always available
    // Future: Check actual water resources
    return true;
  }

  /**
   * Get greenhouse-specific tooltip information
   * @returns {string} Tooltip text specific to greenhouse
   */
  getTooltipInfo() {
    const foodProduction = this.getFoodProduction();
    const waterConsumption = this.getWaterConsumption();
    let tooltipText = `Food Production: +${foodProduction}/turn`;
    tooltipText += `\nWater Usage: ${waterConsumption}/turn`;

    if (this.canUpgrade()) {
      const nextFoodProduction = this.foodProductionRate * (this.level + 1);
      tooltipText += `\nNext Level: +${nextFoodProduction} food/turn`;
      tooltipText += `\nUpgrade Cost: ${this.upgradeCost} materials`;
    }

    const productionStatus = this.canProduce()
      ? "✓ Producing"
      : "⚠ Need water";
    tooltipText += `\nStatus: ${productionStatus}`;

    return tooltipText;
  }

  /**
   * Get greenhouse-specific context menu items (actions only)
   * @returns {Array} Array of actionable menu items specific to greenhouse
   */
  getContextMenuItems() {
    const menuItems = [];

    // Future: Could add production mode switching, efficiency settings, etc.
    // For now, greenhouses just produce automatically

    // Show current production status
    if (!this.canProduce()) {
      menuItems.push({
        label: "⚠ Need Water to Produce",
        action: () => {}, // Informational only
      });
    }

    return menuItems;
  }

  /**
   * Process food production (called at end of turn)
   * @returns {Object} Production result
   */
  processProduction() {
    if (!this.canProduce()) {
      return { produced: false, reason: "no_water" };
    }

    const playerStorage = window.playerStorage;
    if (!playerStorage) {
      return { produced: false, reason: "no_storage" };
    }

    const foodProduced = this.getFoodProduction();

    // Add food to storage using dedicated food method
    const actualAmount = playerStorage.addFood(foodProduced);

    if (actualAmount > 0) {
      EventBus.emit("greenhouse:foodProduced", {
        greenhouse: this,
        foodProduced: actualAmount,
        expectedProduction: foodProduced,
      });

      console.log(
        `[Greenhouse] Produced ${actualAmount} food at (${this.hex.q}, ${this.hex.r})`,
      );
      return { produced: true, amount: actualAmount };
    }

    return { produced: false, reason: "storage_full" };
  }

  /**
   * Upgrade the greenhouse with greenhouse-specific logic
   * @returns {boolean} True if upgrade was successful
   */
  upgrade() {
    const playerStorage = window.playerStorage;
    if (!playerStorage) {
      console.warn("[Greenhouse] PlayerStorage not available for upgrade");
      return false;
    }

    // Check if we have enough materials
    if (playerStorage.getMaterials() < this.upgradeCost) {
      console.log(
        `[Greenhouse] Insufficient materials for upgrade (need ${this.upgradeCost}, have ${playerStorage.getMaterials()})`,
      );
      return false;
    }

    // Remove materials for upgrade
    const materialsConsumed = playerStorage.consumeMaterials(this.upgradeCost);
    if (!materialsConsumed) {
      console.warn("[Greenhouse] Failed to consume materials for upgrade");
      return false;
    }

    // Perform upgrade
    const oldLevel = this.level;
    const success = super.upgrade();

    if (success) {
      // Greenhouse-specific upgrade effects
      this.upgradeCost = Math.floor(
        this.baseUpgradeCost * Math.pow(1.6, this.level - 1),
      );

      EventBus.emit("greenhouse:upgraded", {
        greenhouse: this,
        oldLevel: oldLevel,
        newLevel: this.level,
        materialsUsed: this.baseUpgradeCost,
        newFoodProduction: this.getFoodProduction(),
        newWaterConsumption: this.getWaterConsumption(),
      });

      console.log(
        `[Greenhouse] Upgraded to level ${this.level} - Food: ${this.getFoodProduction()}/turn, Water: ${this.getWaterConsumption()}/turn`,
      );
    }

    return success;
  }

  /**
   * Get greenhouse information for UI/debugging
   * @returns {Object} Greenhouse info
   */
  getGreenhouseInfo() {
    return {
      ...this.getBuildingInfo(),
      foodProduction: this.getFoodProduction(),
      waterConsumption: this.getWaterConsumption(),
      canProduce: this.canProduce(),
      foodProductionRate: this.foodProductionRate,
    };
  }

  /**
   * Update greenhouse (called every frame)
   */
  update() {
    super.update();

    // Greenhouse-specific update logic can go here
    // Food production is handled at the game level during turn processing
  }

  /**
   * Destroy the greenhouse
   */
  destroy() {
    // Emit greenhouse-specific destruction event
    EventBus.emit("greenhouse:destroyed", {
      greenhouse: this,
      foodProductionLost: this.getFoodProduction(),
    });

    // Call parent destroy
    super.destroy();

    console.log(
      `[Greenhouse] Greenhouse destroyed - Food production lost: ${this.getFoodProduction()}/turn`,
    );
  }
}
