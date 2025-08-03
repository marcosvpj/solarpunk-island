import { Building } from "./Building.js";
import EventBus from "../engine/EventBus.js";
import { BUILDINGS } from "../configs/GameData.js";

/**
 * StorageBuilding class - Specialized building for resource storage
 *
 * Extends Building with storage-specific functionality including capacity
 * calculation, resource management, and future individual storage support.
 */
export class StorageBuilding extends Building {
  constructor(hex) {
    super("storage", hex);

    // Get storage configuration from GameData.js
    const storageConfig = BUILDINGS.storage;
    if (!storageConfig) {
      console.error(
        "[StorageBuilding] Could not find storage configuration in GameData.js",
      );
      return;
    }

    // Apply configuration
    this.baseCapacityPerLevel = storageConfig.baseCapacityPerLevel;
    this.exponentialMultiplier = storageConfig.exponentialMultiplier;

    // Runtime state (not configurable)
    this.currentCapacity = 0; // Currently stored resources
    this.useIndividualStorage = true; // Enable individual storage mode for capacity visuals

    console.log(
      `[StorageBuilding] Created storage building with capacity ${this.getMaxCapacity()}`,
    );

    // Set initial visual state
    setTimeout(() => this.updateStorageVisuals(), 100); // Small delay to ensure sprite is ready
  }

  /**
   * Calculate maximum storage capacity for this building
   * Uses exponential scaling: baseCapacity * (multiplier ^ (level - 1))
   * @returns {number} Maximum storage capacity
   */
  getMaxCapacity() {
    return Math.floor(
      this.baseCapacityPerLevel *
        Math.pow(this.exponentialMultiplier, this.level - 1),
    );
  }

  /**
   * Get current available storage space
   * @returns {number} Available storage space
   */
  getAvailableCapacity() {
    if (this.useIndividualStorage) {
      return this.getMaxCapacity() - this.currentCapacity;
    }
    // For global storage mode, always return max capacity
    // (global storage manager handles the actual limiting)
    return this.getMaxCapacity();
  }

  /**
   * Check if this storage building can store the specified amount
   * @param {number} amount - Amount to store
   * @returns {boolean} True if can store the amount
   */
  canStore(amount) {
    if (this.useIndividualStorage) {
      return this.currentCapacity + amount <= this.getMaxCapacity();
    }
    // For global storage mode, always return true
    // (global storage manager handles the actual limiting)
    return true;
  }

  /**
   * Add resources to this storage building
   * @param {number} amount - Amount to add
   * @returns {number} Amount actually stored
   */
  addResources(amount) {
    if (!this.useIndividualStorage) {
      // Global storage mode - delegate to global PlayerStorage
      console.log(
        `[StorageBuilding] Global storage mode - delegating ${amount} to PlayerStorage`,
      );
      const playerStorage = window.playerStorage;
      if (playerStorage) {
        const storedAmount = playerStorage.addResources(
          amount,
          "radioactive_waste",
        );
        console.log(
          `[StorageBuilding] PlayerStorage stored ${storedAmount}/${amount}`,
        );
        return storedAmount;
      } else {
        console.warn("[StorageBuilding] PlayerStorage not available");
        return 0;
      }
    }

    // Individual storage mode
    const availableSpace = this.getAvailableCapacity();
    const actualAmount = Math.min(amount, availableSpace);

    if (actualAmount > 0) {
      const oldCapacity = this.currentCapacity;
      this.currentCapacity += actualAmount;
      this.updateStorageVisuals();

      console.log(
        `[StorageBuilding] Added ${actualAmount} resources (${oldCapacity} → ${this.currentCapacity}/${this.getMaxCapacity()})`,
      );

      // Emit event for storage change
      EventBus.emit("storage:resourcesAdded", {
        building: this,
        amount: actualAmount,
        newTotal: this.currentCapacity,
        capacity: this.getMaxCapacity(),
        fillPercentage: this.currentCapacity / this.getMaxCapacity(),
      });
    }

    return actualAmount;
  }

  /**
   * Remove resources from this storage building (future individual storage)
   * @param {number} amount - Amount to remove
   * @returns {number} Amount actually removed
   */
  removeResources(amount) {
    if (!this.useIndividualStorage) {
      // Global storage mode - just return the amount
      return amount;
    }

    // Individual storage mode (future enhancement)
    const actualAmount = Math.min(amount, this.currentCapacity);

    if (actualAmount > 0) {
      this.currentCapacity -= actualAmount;
      this.updateStorageVisuals();

      // Emit event for storage change
      EventBus.emit("storage:resourcesRemoved", {
        building: this,
        amount: actualAmount,
        newTotal: this.currentCapacity,
        capacity: this.getMaxCapacity(),
      });
    }

    return actualAmount;
  }

  /**
   * Update visual representation based on storage fill level
   */
  updateStorageVisuals() {
    if (!this.useIndividualStorage) {
      console.log(
        `[StorageBuilding] Individual storage disabled, skipping visual update`,
      );
      return;
    }

    const fillPercentage = this.currentCapacity / this.getMaxCapacity();
    console.log(
      `[StorageBuilding] Fill percentage: ${Math.round(fillPercentage * 100)}% (${this.currentCapacity}/${this.getMaxCapacity()})`,
    );

    // Determine which sprite to use based on fill level
    let newSpritePath;
    if (fillPercentage < 0.5) {
      newSpritePath = "assets/building-storage.png"; // Empty/low capacity
    } else if (fillPercentage < 0.8) {
      newSpritePath = "assets/building-storage-half.png"; // Half capacity
    } else {
      newSpritePath = "assets/building-storage-full.png"; // High/full capacity
    }

    console.log(
      `[StorageBuilding] Selected sprite: ${newSpritePath} for ${Math.round(fillPercentage * 100)}% fill`,
    );

    // Only update sprite if it's different from current
    if (this.spritePath !== newSpritePath) {
      console.log(
        `[StorageBuilding] Changing sprite from ${this.spritePath} to ${newSpritePath}`,
      );
      // Use GameObject's changeSprite method - this will emit gameObject:spriteChanged event
      this.changeSprite(newSpritePath);
      console.log(
        `[StorageBuilding] Sprite change requested via GameObject architecture`,
      );
    } else {
      console.log(
        `[StorageBuilding] Sprite already matches ${newSpritePath}, no update needed`,
      );
    }

    // Emit event for debugging and UI updates
    EventBus.emit("storage:visualUpdate", {
      building: this,
      fillPercentage,
      fillLevel: this.getFillLevelName(fillPercentage),
      spritePath: newSpritePath,
    });
  }

  /**
   * Get descriptive name for fill level
   * @param {number} fillPercentage - Fill percentage (0-1)
   * @returns {string} Fill level name
   */
  getFillLevelName(fillPercentage) {
    if (fillPercentage < 0.25) return "empty";
    if (fillPercentage < 0.5) return "quarter";
    if (fillPercentage < 0.75) return "half";
    if (fillPercentage < 1.0) return "full";
    return "overflowing";
  }

  /**
   * Enable individual storage mode (future enhancement)
   * @param {number} initialResources - Initial resources to store
   */
  enableIndividualStorage(initialResources = 0) {
    this.useIndividualStorage = true;
    this.currentCapacity = Math.min(initialResources, this.getMaxCapacity());
    this.updateStorageVisuals();

    EventBus.emit("storage:individualModeEnabled", {
      building: this,
      initialCapacity: this.currentCapacity,
    });

    console.log(
      `[StorageBuilding] Enabled individual storage mode with ${this.currentCapacity}/${this.getMaxCapacity()}`,
    );
  }

  /**
   * Upgrade the storage building and recalculate capacity
   * @returns {boolean} True if upgrade was successful
   */
  upgrade() {
    const previousCapacity = this.getMaxCapacity();
    const success = super.upgrade();

    if (success) {
      const newCapacity = this.getMaxCapacity();
      const capacityIncrease = newCapacity - previousCapacity;

      // Emit storage-specific upgrade event
      EventBus.emit("storage:upgraded", {
        building: this,
        previousCapacity,
        newCapacity,
        capacityIncrease,
        level: this.level,
      });

      console.log(
        `[StorageBuilding] Upgraded to level ${this.level}, capacity: ${previousCapacity} → ${newCapacity} (+${capacityIncrease})`,
      );
    }

    return success;
  }

  /**
   * Get storage-specific tooltip information
   * @returns {string} Tooltip text specific to storage building
   */
  getTooltipInfo() {
    const maxCapacity = this.getMaxCapacity();
    let tooltipText = `Capacity: +${maxCapacity} (Level ${this.level})`;

    if (this.useIndividualStorage) {
      const fillPercentage = Math.round(
        (this.currentCapacity / maxCapacity) * 100,
      );
      tooltipText += `\nStored: ${this.currentCapacity}/${maxCapacity} (${fillPercentage}%)`;
    } else {
      tooltipText += `\nContributes to global storage limit`;
    }

    if (this.canUpgrade()) {
      const nextLevelCapacity = Math.floor(
        this.baseCapacityPerLevel *
          Math.pow(this.exponentialMultiplier, this.level),
      );
      tooltipText += `\nNext Level: +${nextLevelCapacity} capacity`;
      tooltipText += `\nUpgrade Cost: ${this.upgradeCost} materials`;
    }

    return tooltipText;
  }

  /**
   * Get storage-specific context menu items (actions only)
   * @returns {Array} Array of actionable menu items specific to storage building
   */
  getContextMenuItems() {
    const menuItems = [];

    if (this.useIndividualStorage) {
      // Add test actions for capacity visualization
      menuItems.push({
        label: "Add Test Resources (+25)",
        action: () => this.addResources(25),
      });

      menuItems.push({
        label: "Fill to Half",
        action: () => {
          const targetAmount = Math.floor(this.getMaxCapacity() * 0.6);
          const toAdd = Math.max(0, targetAmount - this.currentCapacity);
          this.addResources(toAdd);
        },
      });

      menuItems.push({
        label: "Fill to Full",
        action: () => {
          const targetAmount = Math.floor(this.getMaxCapacity() * 0.9);
          const toAdd = Math.max(0, targetAmount - this.currentCapacity);
          this.addResources(toAdd);
        },
      });

      if (this.currentCapacity > 0) {
        menuItems.push({
          label: "Empty Storage",
          action: () => {
            this.currentCapacity = 0;
            this.updateStorageVisuals();
          },
        });
      }
    }

    return menuItems;
  }

  /**
   * Get storage building information
   * @returns {Object} Storage building info
   */
  getStorageInfo() {
    return {
      ...this.getBuildingInfo(),
      currentCapacity: this.currentCapacity,
      maxCapacity: this.getMaxCapacity(),
      availableCapacity: this.getAvailableCapacity(),
      fillPercentage: this.useIndividualStorage
        ? this.currentCapacity / this.getMaxCapacity()
        : 0,
      fillLevel: this.useIndividualStorage
        ? this.getFillLevelName(this.currentCapacity / this.getMaxCapacity())
        : "global",
      useIndividualStorage: this.useIndividualStorage,
      exponentialMultiplier: this.exponentialMultiplier,
    };
  }

  /**
   * Destroy the storage building
   */
  destroy() {
    // Emit storage-specific destruction event
    EventBus.emit("storage:destroyed", {
      building: this,
      lostCapacity: this.getMaxCapacity(),
      lostResources: this.currentCapacity,
    });

    console.log(
      `[StorageBuilding] Destroyed storage building (lost capacity: ${this.getMaxCapacity()}, lost resources: ${this.currentCapacity})`,
    );

    // Call parent destroy
    super.destroy();
  }
}
