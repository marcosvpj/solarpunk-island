import { Building } from './Building.js';
import EventBus from '../engine/EventBus.js';

/**
 * Reactor class - Core power generation building
 * 
 * Provides power to sustain the floating island and consumes fuel.
 * Essential building for colony survival with fuel consumption mechanics.
 */
export class Reactor extends Building {
    constructor(hex) {
        super('reactor', hex);
        
        // Reactor-specific properties
        this.fuelConsumptionRate = 0.5; // Fuel consumed per turn per level
        this.powerOutput = 1; // Power provided per level
        this.baseUpgradeCost = 50; // Materials needed for upgrade
        
        // Set reactor-specific max level and upgrade cost
        this.maxLevel = 3;
        this.upgradeCost = this.baseUpgradeCost;
        
        console.log(`[Reactor] Created reactor at (${hex.q}, ${hex.r})`);
    }
    
    /**
     * Calculate fuel consumption for this reactor per turn
     * @returns {number} Fuel consumed per turn
     */
    getFuelConsumption() {
        return this.fuelConsumptionRate * this.level;
    }
    
    /**
     * Calculate power output for this reactor
     * @returns {number} Power produced
     */
    getPowerOutput() {
        return this.powerOutput * this.level;
    }
    
    /**
     * Get reactor-specific tooltip information
     * @param {Object} gameState - Current game state for fuel consumption calculation
     * @returns {string} Tooltip text specific to reactor
     */
    getTooltipInfo(gameState) {
        const fuelConsumption = gameState ? gameState.fuelConsumptionPerBuilding : this.fuelConsumptionRate;
        let tooltipText = `Fuel Cost: +${fuelConsumption}/turn`;
        
        if (this.canUpgrade()) {
            tooltipText += `\nUpgrade Cost: ${this.upgradeCost} materials`;
            tooltipText += `\nNext Level: Power +${this.powerOutput}, Fuel +${this.fuelConsumptionRate}`;
        }
        
        tooltipText += `\nPower Output: ${this.getPowerOutput()}`;
        
        return tooltipText;
    }
    
    /**
     * Get reactor-specific context menu items (actions only)
     * @returns {Array} Array of actionable menu items specific to reactor
     */
    getContextMenuItems() {
        // Reactors currently have no building-specific actions
        // All actions (upgrade, demolish) are handled by common building actions
        // Status information belongs in tooltips, not menus
        return [];
    }
    
    /**
     * Upgrade the reactor with reactor-specific logic
     * @returns {boolean} True if upgrade was successful
     */
    upgrade() {
        const playerStorage = window.playerStorage;
        if (!playerStorage) {
            console.warn('[Reactor] PlayerStorage not available for upgrade');
            return false;
        }
        
        // Check if we have enough materials
        if (playerStorage.getMaterials() < this.upgradeCost) {
            console.log(`[Reactor] Insufficient materials for upgrade (need ${this.upgradeCost}, have ${playerStorage.getMaterials()})`);
            return false;
        }
        
        // Remove materials for upgrade
        const materialsUsed = playerStorage.removeResources(this.upgradeCost, 'materials');
        if (materialsUsed !== this.upgradeCost) {
            console.warn('[Reactor] Failed to remove materials for upgrade');
            return false;
        }
        
        // Perform upgrade
        const oldLevel = this.level;
        const success = super.upgrade();
        
        if (success) {
            // Reactor-specific upgrade effects
            this.upgradeCost = Math.floor(this.baseUpgradeCost * Math.pow(2, this.level - 1));
            
            EventBus.emit('reactor:upgraded', {
                reactor: this,
                oldLevel: oldLevel,
                newLevel: this.level,
                materialsUsed: materialsUsed,
                newPowerOutput: this.getPowerOutput(),
                newFuelConsumption: this.getFuelConsumption()
            });
            
            console.log(`[Reactor] Upgraded to level ${this.level} - Power: ${this.getPowerOutput()}, Fuel consumption: ${this.getFuelConsumption()}`);
        }
        
        return success;
    }
    
    /**
     * Get reactor information for UI/debugging
     * @returns {Object} Reactor info
     */
    getReactorInfo() {
        return {
            ...this.getBuildingInfo(),
            fuelConsumption: this.getFuelConsumption(),
            powerOutput: this.getPowerOutput(),
            fuelConsumptionRate: this.fuelConsumptionRate
        };
    }
    
    /**
     * Update reactor (called every frame)
     */
    update() {
        super.update();
        
        // Reactor-specific update logic can go here
        // For now, fuel consumption is handled at the game level
    }
    
    /**
     * Destroy the reactor
     */
    destroy() {
        // Emit reactor-specific destruction event
        EventBus.emit('reactor:destroyed', {
            reactor: this,
            powerLost: this.getPowerOutput(),
            fuelSavings: this.getFuelConsumption()
        });
        
        // Call parent destroy
        super.destroy();
        
        console.log(`[Reactor] Reactor destroyed - Power lost: ${this.getPowerOutput()}`);
    }
}