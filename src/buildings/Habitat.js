import { Building } from './Building.js';
import EventBus from '../engine/EventBus.js';

/**
 * Habitat class - Housing for colony population
 * 
 * Provides living space for colonists and affects population capacity.
 * Essential building for colony growth and population management.
 */
export class Habitat extends Building {
    constructor(hex) {
        super('habitat', hex);
        
        // Habitat-specific properties
        this.housingCapacity = 5; // People housed per level
        this.comfortLevel = 1; // Quality of life provided per level
        this.baseUpgradeCost = 75; // Materials needed for upgrade
        
        // Set habitat-specific max level and upgrade cost
        this.maxLevel = 4;
        this.upgradeCost = this.baseUpgradeCost;
        
        console.log(`[Habitat] Created habitat at (${hex.q}, ${hex.r})`);
    }
    
    /**
     * Calculate housing capacity for this habitat
     * @returns {number} Number of people this habitat can house
     */
    getHousingCapacity() {
        return this.housingCapacity * this.level;
    }
    
    /**
     * Calculate comfort level provided by this habitat
     * @returns {number} Comfort level provided
     */
    getComfortLevel() {
        return this.comfortLevel * this.level;
    }
    
    /**
     * Get habitat-specific tooltip information
     * @returns {string} Tooltip text specific to habitat
     */
    getTooltipInfo() {
        const capacity = this.getHousingCapacity();
        const comfort = this.getComfortLevel();
        let tooltipText = `Housing: ${capacity} people`;
        tooltipText += `\nComfort Level: ${comfort}`;
        
        if (this.canUpgrade()) {
            const nextCapacity = this.housingCapacity * (this.level + 1);
            tooltipText += `\nNext Level: ${nextCapacity} people capacity`;
            tooltipText += `\nUpgrade Cost: ${this.upgradeCost} materials`;
        }
        
        return tooltipText;
    }
    
    /**
     * Get habitat-specific context menu items (actions only)
     * @returns {Array} Array of actionable menu items specific to habitat
     */
    getContextMenuItems() {
        // Habitats currently have no building-specific actions
        // Future: Could add population management, comfort settings, etc.
        // All actions (upgrade, demolish) are handled by common building actions
        return [];
    }
    
    /**
     * Upgrade the habitat with habitat-specific logic
     * @returns {boolean} True if upgrade was successful
     */
    upgrade() {
        const playerStorage = window.playerStorage;
        if (!playerStorage) {
            console.warn('[Habitat] PlayerStorage not available for upgrade');
            return false;
        }
        
        // Check if we have enough materials
        if (playerStorage.getMaterials() < this.upgradeCost) {
            console.log(`[Habitat] Insufficient materials for upgrade (need ${this.upgradeCost}, have ${playerStorage.getMaterials()})`);
            return false;
        }
        
        // Remove materials for upgrade
        const materialsConsumed = playerStorage.consumeMaterials(this.upgradeCost);
        if (!materialsConsumed) {
            console.warn('[Habitat] Failed to consume materials for upgrade');
            return false;
        }
        
        // Perform upgrade
        const oldLevel = this.level;
        const success = super.upgrade();
        
        if (success) {
            // Habitat-specific upgrade effects
            this.upgradeCost = Math.floor(this.baseUpgradeCost * Math.pow(1.8, this.level - 1));
            
            EventBus.emit('habitat:upgraded', {
                habitat: this,
                oldLevel: oldLevel,
                newLevel: this.level,
                materialsUsed: this.baseUpgradeCost,
                newHousingCapacity: this.getHousingCapacity(),
                newComfortLevel: this.getComfortLevel()
            });
            
            console.log(`[Habitat] Upgraded to level ${this.level} - Housing: ${this.getHousingCapacity()}, Comfort: ${this.getComfortLevel()}`);
        }
        
        return success;
    }
    
    /**
     * Get habitat information for UI/debugging
     * @returns {Object} Habitat info
     */
    getHabitatInfo() {
        return {
            ...this.getBuildingInfo(),
            housingCapacity: this.getHousingCapacity(),
            comfortLevel: this.getComfortLevel(),
            housingCapacityPerLevel: this.housingCapacity
        };
    }
    
    /**
     * Update habitat (called every frame)
     */
    update() {
        super.update();
        
        // Habitat-specific update logic can go here
        // For now, housing is passive functionality
    }
    
    /**
     * Destroy the habitat
     */
    destroy() {
        // Emit habitat-specific destruction event
        EventBus.emit('habitat:destroyed', {
            habitat: this,
            housingLost: this.getHousingCapacity(),
            comfortLost: this.getComfortLevel()
        });
        
        // Call parent destroy
        super.destroy();
        
        console.log(`[Habitat] Habitat destroyed - Housing lost: ${this.getHousingCapacity()}`);
    }
}