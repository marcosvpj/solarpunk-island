import { Building } from './Building.js';
import EventBus from '../engine/EventBus.js';

/**
 * Park class - Nature spaces for colony population
 * 
 * Provides comfort points and affects population capacity.
 * Essential evolving colony housing.
 */
export class Park extends Building {
    constructor(hex) {
        super('park', hex);
        
        this.comfortLevel = 1; // Quality of life provided per level
        this.baseUpgradeCost = 75; // Materials needed for upgrade
        
        this.maxLevel = 4;
        this.upgradeCost = this.baseUpgradeCost;
        
        console.log(`[Park] Created park at (${hex.q}, ${hex.r})`);
    }
        
    /**
     * Calculate comfort level provided by this park
     * @returns {number} Comfort level provided
     */
    getComfortLevel() {
        return this.comfortLevel * this.level;
    }
    
    /**
     * Get park-specific tooltip information
     * @returns {string} Tooltip text specific to park
     */
    getTooltipInfo() {
        const comfort = this.getComfortLevel();
        let tooltipText = `Comfort Level: ${comfort}`;
        
        if (this.canUpgrade()) {
            tooltipText += `\nUpgrade Cost: ${this.upgradeCost} materials`;
        }
        
        return tooltipText;
    }
    
    /**
     * Get park-specific context menu items (actions only)
     * @returns {Array} Array of actionable menu items specific to park
     */
    getContextMenuItems() {
        // Parks currently have no building-specific actions
        // Future: Could add population management, comfort settings, etc.
        // All actions (upgrade, demolish) are handled by common building actions
        return [];
    }
    
    /**
     * Upgrade the park with park-specific logic
     * @returns {boolean} True if upgrade was successful
     */
    upgrade() {
        const playerStorage = window.playerStorage;
        if (!playerStorage) {
            console.warn('[Park] PlayerStorage not available for upgrade');
            return false;
        }
        
        // Check if we have enough materials
        if (playerStorage.getMaterials() < this.upgradeCost) {
            console.log(`[Park] Insufficient materials for upgrade (need ${this.upgradeCost}, have ${playerStorage.getMaterials()})`);
            return false;
        }
        
        // Remove materials for upgrade
        const materialsConsumed = playerStorage.consumeMaterials(this.upgradeCost);
        if (!materialsConsumed) {
            console.warn('[Park] Failed to consume materials for upgrade');
            return false;
        }
        
        // Perform upgrade
        const oldLevel = this.level;
        const success = super.upgrade();
        
        if (success) {
            // Park-specific upgrade effects
            this.upgradeCost = Math.floor(this.baseUpgradeCost * Math.pow(1.8, this.level - 1));
            
            EventBus.emit('park:upgraded', {
                park: this,
                oldLevel: oldLevel,
                newLevel: this.level,
                materialsUsed: this.baseUpgradeCost,
                newComfortLevel: this.getComfortLevel()
            });
            
            console.log(`[Park] Upgraded to level ${this.level} - Comfort: ${this.getComfortLevel()}`);
        }
        
        return success;
    }
    
    /**
     * Get park information for UI/debugging
     * @returns {Object} Park info
     */
    getHabitatInfo() {
        return {
            ...this.getBuildingInfo(),
            comfortLevel: this.getComfortLevel(),
        };
    }
    
    /**
     * Update park (called every frame)
     */
    update() {
        super.update();
        
        // Park-specific update logic can go here
        // For now, park is passive functionality
    }
    
    /**
     * Destroy the park
     */
    destroy() {
        // Emit park-specific destruction event
        EventBus.emit('park:destroyed', {
            park: this,
            comfortLost: this.getComfortLevel()
        });
        
        // Call parent destroy
        super.destroy();
        
        console.log(`[Park] Park destroyed`);
    }


    static canBuildOn(hex) {
        if (hex.resource){
            return hex.resource.type == 'forest';
        }
        return false
    }
}