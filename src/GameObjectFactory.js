import { Building } from './game-objects/Building.js';
import { StorageBuilding } from './game-objects/StorageBuilding.js';
import { Refinery } from './game-objects/Refinery.js';
import { Resource } from './game-objects/Resource.js';
import { Unit } from './game-objects/Unit.js';
import { Drone } from './game-objects/Drone.js';
import EventBus from './EventBus.js';

/**
 * GameObjectFactory - Centralized creation of game objects
 * 
 * Provides a clean API for creating game objects with proper
 * event emission and validation. Replaces direct constructor calls.
 */

export class GameObjectFactory {
    /**
     * Create a building on a hex
     * @param {string} type - Building type (reactor, drone_factory, etc.)
     * @param {Hex} hex - Hex to place the building on
     * @returns {Building|null} The created building or null if failed
     */
    static createBuilding(type, hex) {
        // Validate inputs
        if (!type || !hex) {
            console.error('[GameObjectFactory] Invalid building creation parameters');
            return null;
        }

        // Check if hex is already occupied
        if (hex.building) {
            console.warn(`[GameObjectFactory] Hex (${hex.q}, ${hex.r}) already has a building`);
            return null;
        }

        try {
            // Create specialized building types
            let building;
            if (type === 'storage') {
                building = new StorageBuilding(hex);
            } else if (type === 'refinery') {
                building = new Refinery(hex);
            } else {
                building = new Building(type, hex);
            }
            
            // Set hex reference
            hex.building = building;
            
            // Emit factory event for tracking
            EventBus.emit('factory:buildingCreated', {
                building,
                hex,
                type
            });
            // sprite.on('click', gameObject.hex.clickHandler);
            // console.log(building);
            console.log(`[GameObjectFactory] Created ${type} building at (${hex.q}, ${hex.r})`);
            return building;
            
        } catch (error) {
            console.error(`[GameObjectFactory] Failed to create building: ${error.message}`);
            return null;
        }
    }

    /**
     * Create a resource node on a hex
     * @param {string} type - Resource type (minerals, energy, etc.)
     * @param {Hex} hex - Hex to place the resource on
     * @param {number} amount - Initial resource amount (default: 100)
     * @returns {Resource|null} The created resource or null if failed
     */
    static createResource(type, hex, amount = 100) {
        // Validate inputs
        if (!type || !hex) {
            console.error('[GameObjectFactory] Invalid resource creation parameters');
            return null;
        }

        // Check if hex is already occupied
        if (hex.resource) {
            console.warn(`[GameObjectFactory] Hex (${hex.q}, ${hex.r}) already has a resource`);
            return null;
        }

        // Validate amount
        if (amount <= 0) {
            console.warn('[GameObjectFactory] Resource amount must be positive');
            return null;
        }

        try {
            const resource = new Resource(type, hex, amount);
            
            // Set hex reference
            hex.resource = resource;
            
            // Emit factory event for tracking
            EventBus.emit('factory:resourceCreated', {
                resource,
                hex,
                type,
                amount
            });
            
            console.log(`[GameObjectFactory] Created ${type} resource (${amount}) at (${hex.q}, ${hex.r})`);
            return resource;
            
        } catch (error) {
            console.error(`[GameObjectFactory] Failed to create resource: ${error.message}`);
            return null;
        }
    }

    /**
     * Create a unit on a hex
     * @param {string} type - Unit type (drone, scout, worker)
     * @param {Hex} hex - Hex to place the unit on
     * @param {Building} ownerBuilding - Building that created this unit (optional)
     * @returns {Unit|null} The created unit or null if failed
     */
    static createUnit(type, hex, ownerBuilding = null) {
        // Validate inputs
        if (!type || !hex) {
            console.error('[GameObjectFactory] Invalid unit creation parameters');
            return null;
        }

        // Check if hex already has a unit (flying units can stack)
        if (hex.unit && type !== 'drone') {
            console.warn(`[GameObjectFactory] Hex (${hex.q}, ${hex.r}) already has a unit`);
            // Continue anyway for drones (flying units can stack)
        }

        try {
            // Create specialized unit types
            let unit;
            if (type === 'drone') {
                unit = new Drone(hex, ownerBuilding);
            } else {
                unit = new Unit(type, hex);
            }
            
            // Set hex reference
            hex.unit = unit;
            
            // Emit factory event for tracking
            EventBus.emit('factory:unitCreated', {
                unit,
                hex,
                type
            });
            
            console.log(`[GameObjectFactory] Created ${type} unit at (${hex.q}, ${hex.r})`);
            return unit;
            
        } catch (error) {
            console.error(`[GameObjectFactory] Failed to create unit: ${error.message}`);
            return null;
        }
    }

    /**
     * Remove a building from a hex
     * @param {Hex} hex - Hex containing the building
     * @returns {boolean} True if building was removed
     */
    static removeBuilding(hex) {
        if (!hex || !hex.building) {
            console.warn('[GameObjectFactory] No building to remove');
            return false;
        }

        const building = hex.building;
        
        // Emit removal event before destruction
        EventBus.emit('factory:buildingRemoved', {
            building,
            hex
        });
        
        // Destroy the building (triggers events in SceneManager)
        building.destroy();
        
        // Clear hex reference
        hex.building = null;
        
        console.log(`[GameObjectFactory] Removed ${building.type} building from (${hex.q}, ${hex.r})`);
        return true;
    }

    /**
     * Remove a resource from a hex
     * @param {Hex} hex - Hex containing the resource
     * @returns {boolean} True if resource was removed
     */
    static removeResource(hex) {
        if (!hex || !hex.resource) {
            console.warn('[GameObjectFactory] No resource to remove');
            return false;
        }

        const resource = hex.resource;
        
        // Emit removal event before destruction
        EventBus.emit('factory:resourceRemoved', {
            resource,
            hex
        });
        
        // Destroy the resource (triggers events in SceneManager)
        resource.destroy();
        
        // Clear hex reference
        hex.resource = null;
        
        console.log(`[GameObjectFactory] Removed ${resource.type} resource from (${hex.q}, ${hex.r})`);
        return true;
    }

    /**
     * Remove a unit from a hex
     * @param {Hex} hex - Hex containing the unit
     * @returns {boolean} True if unit was removed
     */
    static removeUnit(hex) {
        if (!hex || !hex.unit) {
            console.warn('[GameObjectFactory] No unit to remove');
            return false;
        }

        const unit = hex.unit;
        
        // Emit removal event before destruction
        EventBus.emit('factory:unitRemoved', {
            unit,
            hex
        });
        
        // Destroy the unit (triggers events in SceneManager)
        unit.destroy();
        
        // Clear hex reference
        hex.unit = null;
        
        console.log(`[GameObjectFactory] Removed ${unit.type} unit from (${hex.q}, ${hex.r})`);
        return true;
    }

    /**
     * Get available building types
     * @returns {string[]} Array of building type names
     */
    static getBuildingTypes() {
        return ['reactor', 'drone_factory', 'refinery', 'storage', 'greenhouse', 'habitat'];
    }

    /**
     * Get available resource types
     * @returns {string[]} Array of resource type names
     */
    static getResourceTypes() {
        return ['minerals', 'energy', 'water', 'food'];
    }

    /**
     * Get available unit types
     * @returns {string[]} Array of unit type names
     */
    static getUnitTypes() {
        return ['drone', 'scout', 'worker'];
    }

    /**
     * Check if a hex can have a building placed on it
     * @param {Hex} hex - Hex to check
     * @returns {boolean} True if building can be placed
     */
    static canPlaceBuilding(hex) {
        return hex && !hex.building && !hex.resource && !hex.unit;
    }

    /**
     * Check if a hex can have a resource placed on it
     * @param {Hex} hex - Hex to check
     * @returns {boolean} True if resource can be placed
     */
    static canPlaceResource(hex) {
        return hex && !hex.building && !hex.resource;
    }

    /**
     * Check if a hex can have a unit placed on it
     * @param {Hex} hex - Hex to check
     * @returns {boolean} True if unit can be placed
     */
    static canPlaceUnit(hex) {
        return hex && !hex.building; // Units can overlap with resources
    }

    /**
     * Get statistics about created objects
     * @returns {Object} Creation statistics
     */
    static getStatistics() {
        // This could be enhanced to track actual statistics
        return {
            buildingsCreated: 0, // Would need to track these
            resourcesCreated: 0,
            unitsCreated: 0,
            factoryVersion: '1.0'
        };
    }
}

export default GameObjectFactory;