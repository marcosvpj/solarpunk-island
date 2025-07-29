import EventBus from '../engine/EventBus.js';
import { Reactor } from './Reactor.js';
import { Refinery } from './Refinery.js';
import { DroneFactory } from './DroneFactory.js';
import { StorageBuilding } from './StorageBuilding.js';
import { Habitat } from './Habitat.js';
import { Greenhouse } from './Greenhouse.js';

/**
 * BuildingManager - Centralized building construction and demolition system
 * 
 * Handles building placement, validation, creation, and destruction.
 * Coordinates with GameObjectFactory and manages building lifecycle.
 */
export class BuildingManager {
    constructor(gameState) {
        this.gameState = gameState;
        
        // Building type to class mapping
        this.buildingClasses = {
            'reactor': Reactor,
            'refinery': Refinery,
            'drone_factory': DroneFactory,
            'storage': StorageBuilding,
            'habitat': Habitat,
            'greenhouse': Greenhouse
        };
        
        console.log('[BuildingManager] Initialized building management system');
    }
    
    /**
     * Check if a building can be placed on the given hex
     * @param {Object} hex - Target hex
     * @param {string} buildingType - Type of building to place
     * @returns {Object} Validation result with success boolean and message
     */
    canPlaceBuilding(hex, buildingType) {
        if (!hex) {
            return { success: false, message: 'Invalid hex' };
        }
        
        if (hex.building) {
            return { success: false, message: 'Hex already has a building' };
        }
        
        if (!this.buildingClasses[buildingType]) {
            return { success: false, message: `Unknown building type: ${buildingType}` };
        }
        
        // Additional placement validation could go here
        // For example: terrain type restrictions, proximity rules, etc.
        
        return { success: true, message: 'Placement valid' };
    }
    
    /**
     * Build a building on the specified hex
     * @param {Object} hex - Target hex
     * @param {string} buildingType - Type of building to build
     * @returns {Object|null} Created building or null if failed
     */
    buildOnHex(hex, buildingType) {
        // Validate placement
        const validation = this.canPlaceBuilding(hex, buildingType);
        if (!validation.success) {
            console.log(`[BuildingManager] Cannot place ${buildingType}: ${validation.message}`);
            return null;
        }
        
        try {
            // Get the appropriate building class
            const BuildingClass = this.buildingClasses[buildingType];
            
            // Create the building instance
            const building = new BuildingClass(hex);
            
            if (!building) {
                console.error(`[BuildingManager] Failed to create ${buildingType} building`);
                return null;
            }
            
            // Link building to hex
            hex.building = building;
            building.hex = hex;
            
            // Add to game state
            if (this.gameState && this.gameState.buildings) {
                this.gameState.buildings.push(building);
            }
            
            // Emit building creation event
            EventBus.emit('building:created', {
                building: building,
                hex: hex,
                buildingType: buildingType
            });
            
            // Emit factory-specific event for progression system
            EventBus.emit('factory:buildingCreated', {
                building: building,
                hex: hex,
                buildingType: buildingType
            });
            
            console.log(`[BuildingManager] Created ${buildingType} building at (${hex.q}, ${hex.r})`);
            return building;
            
        } catch (error) {
            console.error(`[BuildingManager] Error creating ${buildingType} building:`, error);
            return null;
        }
    }
    
    /**
     * Check if a building can be demolished
     * @param {Object} hex - Hex containing the building
     * @returns {Object} Validation result with success boolean and message
     */
    canDemolishBuilding(hex) {
        if (!hex) {
            return { success: false, message: 'Invalid hex' };
        }
        
        if (!hex.building) {
            return { success: false, message: 'No building to demolish' };
        }
        
        if (hex.building.isDestroyed) {
            return { success: false, message: 'Building already destroyed' };
        }
        
        // Additional demolition validation could go here
        // For example: prevent demolishing critical buildings, confirmation requirements, etc.
        
        return { success: true, message: 'Demolition valid' };
    }
    
    /**
     * Demolish a building on the specified hex
     * @param {Object} hex - Hex containing the building to demolish
     * @returns {boolean} True if demolition was successful
     */
    demolishBuilding(hex) {
        // Validate demolition
        const validation = this.canDemolishBuilding(hex);
        if (!validation.success) {
            console.log(`[BuildingManager] Cannot demolish building: ${validation.message}`);
            return false;
        }
        
        const building = hex.building;
        const buildingType = building.type;
        const buildingLevel = building.level;
        
        try {
            // Remove from game state
            if (this.gameState && this.gameState.buildings) {
                const index = this.gameState.buildings.indexOf(building);
                if (index !== -1) {
                    this.gameState.buildings.splice(index, 1);
                }
            }
            
            // Clear hex reference
            hex.building = null;
            
            // Destroy the building (calls building's destroy method)
            building.destroy();
            
            // Emit demolition event
            EventBus.emit('building:demolished', {
                building: building,
                hex: hex,
                buildingType: buildingType,
                buildingLevel: buildingLevel
            });
            
            console.log(`[BuildingManager] Demolished ${buildingType} building at (${hex.q}, ${hex.r})`);
            return true;
            
        } catch (error) {
            console.error(`[BuildingManager] Error demolishing ${buildingType} building:`, error);
            return false;
        }
    }
    
    /**
     * Get information about all buildings of a specific type
     * @param {string} buildingType - Type of building to query
     * @returns {Array} Array of buildings of the specified type
     */
    getBuildingsByType(buildingType) {
        if (!this.gameState || !this.gameState.buildings) {
            return [];
        }
        
        return this.gameState.buildings.filter(building => 
            building.type === buildingType && !building.isDestroyed
        );
    }
    
    /**
     * Get total count of buildings by type
     * @param {string} buildingType - Type of building to count
     * @returns {number} Count of buildings of the specified type
     */
    getBuildingCount(buildingType) {
        return this.getBuildingsByType(buildingType).length;
    }
    
    /**
     * Check if a building type is available/unlocked
     * @param {string} buildingType - Type of building to check
     * @returns {boolean} True if building type is available
     */
    isBuildingTypeAvailable(buildingType) {
        // For now, all building types are available
        // Future implementation could check research, progression, etc.
        return this.buildingClasses.hasOwnProperty(buildingType);
    }
    
    /**
     * Get all available building types
     * @returns {Array} Array of available building type strings
     */
    getAvailableBuildingTypes() {
        return Object.keys(this.buildingClasses);
    }
    
    /**
     * Register a new building type
     * @param {string} buildingType - Type identifier
     * @param {Class} BuildingClass - Building class constructor
     */
    registerBuildingType(buildingType, BuildingClass) {
        this.buildingClasses[buildingType] = BuildingClass;
        console.log(`[BuildingManager] Registered building type: ${buildingType}`);
    }
    
    /**
     * Get building construction cost (if buildings have costs in the future)
     * @param {string} buildingType - Type of building
     * @returns {Object} Cost information
     */
    getBuildingCost(buildingType) {
        // Future implementation for building costs
        // For now, buildings are free to place
        return {
            materials: 0,
            fuel: 0,
            waste: 0
        };
    }
    
    /**
     * Get statistics about all buildings
     * @returns {Object} Building statistics
     */
    getBuildingStatistics() {
        if (!this.gameState || !this.gameState.buildings) {
            return {
                totalBuildings: 0,
                buildingsByType: {}
            };
        }
        
        const activeBuildings = this.gameState.buildings.filter(b => !b.isDestroyed);
        const buildingsByType = {};
        
        // Count buildings by type
        activeBuildings.forEach(building => {
            buildingsByType[building.type] = (buildingsByType[building.type] || 0) + 1;
        });
        
        return {
            totalBuildings: activeBuildings.length,
            buildingsByType: buildingsByType,
            buildingDetails: activeBuildings.map(building => ({
                type: building.type,
                level: building.level,
                position: { q: building.hex.q, r: building.hex.r }
            }))
        };
    }
    
    /**
     * Clean up all buildings (for game reset, etc.)
     */
    destroyAllBuildings() {
        if (!this.gameState || !this.gameState.buildings) {
            return;
        }
        
        const buildingsToDestroy = [...this.gameState.buildings];
        
        buildingsToDestroy.forEach(building => {
            if (building.hex) {
                this.demolishBuilding(building.hex);
            }
        });
        
        console.log(`[BuildingManager] Destroyed all ${buildingsToDestroy.length} buildings`);
    }
}

export default BuildingManager;