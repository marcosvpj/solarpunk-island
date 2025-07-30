import { Building } from './Building.js';
import EventBus from '../engine/EventBus.js';
import { BUILDINGS } from '../configs/GameData.js';

/**
 * DroneFactory class - Produces drones for resource collection
 * 
 * Factory building that creates drone units for automated resource gathering.
 * Handles drone production and placement logic.
 */
export class DroneFactory extends Building {
    constructor(hex) {
        super('drone_factory', hex);
        
        // DroneFactory-specific properties
        this.droneProductionCost = BUILDINGS.drone_factory.droneProductionCost; // Materials needed per drone
        this.maxDronesPerFactory = BUILDINGS.drone_factory.maxDronesPerLevel; // Maximum drones this factory can support
        this.baseUpgradeCost = BUILDINGS.drone_factory.baseUpgradeCost; // Materials needed for upgrade
        this.dronesProduced = 0; // Track how many drones this factory has made
        
        // Set factory-specific max level and upgrade cost
        this.maxLevel = BUILDINGS.drone_factory.maxLevel;
        this.upgradeCost = this.baseUpgradeCost;
        
        console.log(`[DroneFactory] Created drone factory at (${hex.q}, ${hex.r})`);
    }
    
    /**
     * Get adjacent hexes around the factory for drone placement
     * @returns {Array} Array of adjacent hex objects
     */
    getAdjacentHexes() {
        const directions = [
            { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
            { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
        ];
        
        const gameState = window.gameState;
        if (!gameState || !gameState.hexes) {
            console.warn('[DroneFactory] GameState or hexes not available');
            return [];
        }
        
        return directions
            .map(dir => gameState.hexes.find(h => 
                h.q === this.hex.q + dir.q && h.r === this.hex.r + dir.r
            ))
            .filter(h => h !== undefined);
    }
    
    /**
     * Find the best hex for drone placement
     * @returns {Object|null} Best hex for drone placement or null if none available
     */
    findDronePlacementHex() {
        const GameObjectFactory = window.GameObjectFactory;
        if (!GameObjectFactory) {
            console.warn('[DroneFactory] GameObjectFactory not available');
            return null;
        }
        
        const nearbyHexes = this.getAdjacentHexes();
        
        // Try to find an empty hex for the drone
        for (const hex of nearbyHexes) {
            if (GameObjectFactory.canPlaceUnit(hex)) {
                return hex;
            }
        }
        
        // If no adjacent hex is available, use factory hex (drones can fly)
        if (GameObjectFactory.canPlaceUnit(this.hex)) {
            return this.hex;
        }
        
        return null;
    }
    
    /**
     * Build a drone near this factory
     * @returns {Object|null} Created drone or null if failed
     */
    buildDrone() {
        const playerStorage = window.playerStorage;
        const GameObjectFactory = window.GameObjectFactory;
        const gameState = window.gameState;
        
        if (!playerStorage || !GameObjectFactory || !gameState) {
            console.warn('[DroneFactory] Required systems not available for drone building');
            return null;
        }
        
        // Check if we have enough materials
        if (playerStorage.getMaterials() < this.droneProductionCost) {
            console.log(`[DroneFactory] Insufficient materials for drone (need ${this.droneProductionCost}, have ${playerStorage.getMaterials()})`);
            return null;
        }
        
        // Check if factory has reached drone limit
        if (this.dronesProduced >= this.maxDronesPerFactory * this.level) {
            console.log(`[DroneFactory] Factory at capacity (${this.dronesProduced}/${this.maxDronesPerFactory * this.level} drones)`);
            return null;
        }
        
        // Find placement hex
        const placementHex = this.findDronePlacementHex();
        if (!placementHex) {
            console.log('[DroneFactory] No available hex for drone placement');
            return null;
        }
        
        // Remove materials for drone production
        console.log(`[DroneFactory] Before removal - Materials: ${playerStorage.getMaterials()}, Total resources: ${playerStorage.currentResources}, Need: ${this.droneProductionCost}`);
        const materialsConsumed = playerStorage.consumeMaterials(this.droneProductionCost);
        console.log(`[DroneFactory] After removal attempt - Success: ${materialsConsumed}`);
        
        if (!materialsConsumed) {
            console.warn(`[DroneFactory] Failed to consume materials for drone production. Need: ${this.droneProductionCost}`);
            console.warn(`[DroneFactory] Current storage state - Materials: ${playerStorage.getMaterials()}, Total: ${playerStorage.currentResources}`);
            return null;
        }
        
        // Create the drone
        const drone = GameObjectFactory.createUnit('drone', placementHex, this);
        if (drone) {
            // Add to legacy gameState for compatibility
            gameState.units.push(drone);
            this.dronesProduced++;
            
            EventBus.emit('droneFactory:droneProduced', {
                factory: this,
                drone: drone,
                placementHex: placementHex,
                materialsUsed: this.droneProductionCost,
                totalDrones: this.dronesProduced
            });
            
            console.log(`[DroneFactory] Created drone at (${placementHex.q}, ${placementHex.r}) from factory at (${this.hex.q}, ${this.hex.r})`);
            return drone;
        } else {
            // Refund materials if drone creation failed
            playerStorage.addResources(this.droneProductionCost, 'materials');
            console.error(`[DroneFactory] Failed to create drone at (${placementHex.q}, ${placementHex.r})`);
            return null;
        }
    }
    
    /**
     * Get factory-specific tooltip information
     * @returns {string} Tooltip text specific to drone factory
     */
    getTooltipInfo() {
        const maxDrones = this.maxDronesPerFactory * this.level;
        let tooltipText = `Produces drones for resource collection`;
        tooltipText += `\nDrones: ${this.dronesProduced}/${maxDrones}`;
        tooltipText += `\nDrone Cost: ${this.droneProductionCost} materials`;
        
        if (this.canUpgrade()) {
            tooltipText += `\nUpgrade Cost: ${this.upgradeCost} materials`;
            tooltipText += `\nNext Level: +${this.maxDronesPerFactory} drone capacity`;
        }
        
        return tooltipText;
    }
    
    /**
     * Get factory-specific context menu items (actions only)
     * @returns {Array} Array of actionable menu items specific to drone factory
     */
    getContextMenuItems() {
        console.log(`[DroneFactory] getContextMenuItems called for factory at (${this.hex.q}, ${this.hex.r})`);
        const menuItems = [];
        
        // Always show Build Drone option, but mark as disabled if not possible
        const maxDrones = this.maxDronesPerFactory * this.level;
        const canBuildDrone = this.dronesProduced < maxDrones;
        const playerStorage = window.playerStorage;
        console.log(`[DroneFactory] playerStorage available: ${!!playerStorage}`);
        console.log(`[DroneFactory] maxDrones: ${maxDrones}, dronesProduced: ${this.dronesProduced}, canBuildDrone: ${canBuildDrone}`);
        
        const hasEnoughMaterials = playerStorage && playerStorage.getMaterials() >= this.droneProductionCost;
        const canActuallyBuild = canBuildDrone && hasEnoughMaterials;
        console.log(`[DroneFactory] hasEnoughMaterials: ${hasEnoughMaterials}, canActuallyBuild: ${canActuallyBuild}`);
        
        // Determine the appropriate label based on conditions
        let label = `Build Drone (${this.droneProductionCost} materials)`;
        if (!canBuildDrone) {
            label = `At Capacity (${this.dronesProduced}/${maxDrones})`;
        } else if (!hasEnoughMaterials) {
            const currentMaterials = playerStorage ? playerStorage.getMaterials() : 0;
            label = `Build Drone (Need ${this.droneProductionCost - currentMaterials} more materials)`;
        }
        
        menuItems.push({
            label: label,
            action: canActuallyBuild ? () => this.buildDrone() : () => {}, // No-op if disabled
            disabled: !canActuallyBuild
        });
        
        console.log(`[DroneFactory] Returning ${menuItems.length} menu items:`, menuItems);
        return menuItems;
    }
    
    /**
     * Upgrade the factory with factory-specific logic
     * @returns {boolean} True if upgrade was successful
     */
    upgrade() {
        const playerStorage = window.playerStorage;
        if (!playerStorage) {
            console.warn('[DroneFactory] PlayerStorage not available for upgrade');
            return false;
        }
        
        // Check if we have enough materials
        if (playerStorage.getMaterials() < this.upgradeCost) {
            console.log(`[DroneFactory] Insufficient materials for upgrade (need ${this.upgradeCost}, have ${playerStorage.getMaterials()})`);
            return false;
        }
        
        // Remove materials for upgrade
        const materialsUsed = playerStorage.removeResources(this.upgradeCost, 'materials');
        if (materialsUsed !== this.upgradeCost) {
            console.warn('[DroneFactory] Failed to remove materials for upgrade');
            return false;
        }
        
        // Perform upgrade
        const oldLevel = this.level;
        const success = super.upgrade();
        
        if (success) {
            // Factory-specific upgrade effects
            this.upgradeCost = Math.floor(this.baseUpgradeCost * Math.pow(1.8, this.level - 1));
            
            EventBus.emit('droneFactory:upgraded', {
                factory: this,
                oldLevel: oldLevel,
                newLevel: this.level,
                materialsUsed: materialsUsed,
                newDroneCapacity: this.maxDronesPerFactory * this.level
            });
            
            console.log(`[DroneFactory] Upgraded to level ${this.level} - Drone capacity: ${this.maxDronesPerFactory * this.level}`);
        }
        
        return success;
    }
    
    /**
     * Handle drone destruction (reduce count)
     * @param {Object} drone - The drone that was destroyed
     */
    onDroneDestroyed(drone) {
        if (this.dronesProduced > 0) {
            this.dronesProduced--;
            console.log(`[DroneFactory] Drone destroyed, remaining: ${this.dronesProduced}`);
            
            EventBus.emit('droneFactory:droneDestroyed', {
                factory: this,
                drone: drone,
                remainingDrones: this.dronesProduced
            });
        }
    }
    
    /**
     * Get factory information for UI/debugging
     * @returns {Object} Factory info
     */
    getFactoryInfo() {
        return {
            ...this.getBuildingInfo(),
            dronesProduced: this.dronesProduced,
            maxDrones: this.maxDronesPerFactory * this.level,
            droneProductionCost: this.droneProductionCost,
            maxDronesPerFactory: this.maxDronesPerFactory
        };
    }
    
    /**
     * Update factory (called every frame)
     */
    update() {
        super.update();
        
        // Factory-specific update logic can go here
        // Could include automatic drone production or maintenance
    }
    
    /**
     * Destroy the factory
     */
    destroy() {
        // Emit factory-specific destruction event
        EventBus.emit('droneFactory:destroyed', {
            factory: this,
            dronesProduced: this.dronesProduced
        });
        
        // Call parent destroy
        super.destroy();
        
        console.log(`[DroneFactory] Drone factory destroyed - Had produced ${this.dronesProduced} drones`);
    }
}