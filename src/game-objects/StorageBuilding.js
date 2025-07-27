import { Building } from './Building.js';
import EventBus from '../engine/EventBus.js';

/**
 * StorageBuilding class - Specialized building for resource storage
 * 
 * Extends Building with storage-specific functionality including capacity
 * calculation, resource management, and future individual storage support.
 */
export class StorageBuilding extends Building {
    constructor(hex) {
        super('storage', hex);
        
        // Storage-specific properties
        this.currentCapacity = 0; // Currently stored resources (for future individual storage)
        this.baseCapacityPerLevel = 50; // Base storage per level
        this.exponentialMultiplier = 1.5; // Exponential growth factor
        this.useIndividualStorage = false; // Feature flag for future enhancement
        
        console.log(`[StorageBuilding] Created storage building with capacity ${this.getMaxCapacity()}`);
    }

    /**
     * Calculate maximum storage capacity for this building
     * Uses exponential scaling: baseCapacity * (multiplier ^ (level - 1))
     * @returns {number} Maximum storage capacity
     */
    getMaxCapacity() {
        return Math.floor(this.baseCapacityPerLevel * Math.pow(this.exponentialMultiplier, this.level - 1));
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
     * Add resources to this storage building (future individual storage)
     * @param {number} amount - Amount to add
     * @returns {number} Amount actually stored
     */
    addResources(amount) {
        if (!this.useIndividualStorage) {
            // Global storage mode - delegate to global PlayerStorage
            console.log(`[StorageBuilding] Global storage mode - delegating ${amount} to PlayerStorage`);
            const playerStorage = window.playerStorage;
            if (playerStorage) {
                const storedAmount = playerStorage.addResources(amount, 'radioactive_waste');
                console.log(`[StorageBuilding] PlayerStorage stored ${storedAmount}/${amount}`);
                return storedAmount;
            } else {
                console.warn('[StorageBuilding] PlayerStorage not available');
                return 0;
            }
        }

        // Individual storage mode (future enhancement)
        const availableSpace = this.getAvailableCapacity();
        const actualAmount = Math.min(amount, availableSpace);
        
        if (actualAmount > 0) {
            this.currentCapacity += actualAmount;
            this.updateStorageVisuals();
            
            // Emit event for storage change
            EventBus.emit('storage:resourcesAdded', {
                building: this,
                amount: actualAmount,
                newTotal: this.currentCapacity,
                capacity: this.getMaxCapacity()
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
            EventBus.emit('storage:resourcesRemoved', {
                building: this,
                amount: actualAmount,
                newTotal: this.currentCapacity,
                capacity: this.getMaxCapacity()
            });
        }
        
        return actualAmount;
    }

    /**
     * Update visual representation based on storage fill level (future enhancement)
     */
    updateStorageVisuals() {
        if (!this.useIndividualStorage) return;
        
        const fillPercentage = this.currentCapacity / this.getMaxCapacity();
        
        // TODO: Implement sprite changes based on fill level
        // Future implementation will change sprites based on fillPercentage:
        // - 0-25%: storage-empty.png
        // - 25-50%: storage-quarter.png  
        // - 50-75%: storage-half.png
        // - 75-100%: storage-full.png
        // - 100%+: storage-overflowing.png
        
        // For now, just emit an event for debugging
        EventBus.emit('storage:visualUpdate', {
            building: this,
            fillPercentage,
            fillLevel: this.getFillLevelName(fillPercentage)
        });
    }

    /**
     * Get descriptive name for fill level
     * @param {number} fillPercentage - Fill percentage (0-1)
     * @returns {string} Fill level name
     */
    getFillLevelName(fillPercentage) {
        if (fillPercentage < 0.25) return 'empty';
        if (fillPercentage < 0.5) return 'quarter';
        if (fillPercentage < 0.75) return 'half';
        if (fillPercentage < 1.0) return 'full';
        return 'overflowing';
    }

    /**
     * Enable individual storage mode (future enhancement)
     * @param {number} initialResources - Initial resources to store
     */
    enableIndividualStorage(initialResources = 0) {
        this.useIndividualStorage = true;
        this.currentCapacity = Math.min(initialResources, this.getMaxCapacity());
        this.updateStorageVisuals();
        
        EventBus.emit('storage:individualModeEnabled', {
            building: this,
            initialCapacity: this.currentCapacity
        });
        
        console.log(`[StorageBuilding] Enabled individual storage mode with ${this.currentCapacity}/${this.getMaxCapacity()}`);
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
            EventBus.emit('storage:upgraded', {
                building: this,
                previousCapacity,
                newCapacity,
                capacityIncrease,
                level: this.level
            });
            
            console.log(`[StorageBuilding] Upgraded to level ${this.level}, capacity: ${previousCapacity} → ${newCapacity} (+${capacityIncrease})`);
        }
        
        return success;
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
            fillPercentage: this.useIndividualStorage ? (this.currentCapacity / this.getMaxCapacity()) : 0,
            fillLevel: this.useIndividualStorage ? this.getFillLevelName(this.currentCapacity / this.getMaxCapacity()) : 'global',
            useIndividualStorage: this.useIndividualStorage,
            exponentialMultiplier: this.exponentialMultiplier
        };
    }

    /**
     * Destroy the storage building
     */
    destroy() {
        // Emit storage-specific destruction event
        EventBus.emit('storage:destroyed', {
            building: this,
            lostCapacity: this.getMaxCapacity(),
            lostResources: this.currentCapacity
        });
        
        console.log(`[StorageBuilding] Destroyed storage building (lost capacity: ${this.getMaxCapacity()}, lost resources: ${this.currentCapacity})`);
        
        // Call parent destroy
        super.destroy();
    }
}