import EventBus from './EventBus.js';

/**
 * PlayerStorage - Manages global resource storage and limits
 * 
 * Handles storage capacity calculation based on storage buildings,
 * resource validation, and collection limiting. Designed to work
 * with both global storage (current) and individual building storage (future).
 */
export class PlayerStorage {
    constructor(gameStateManager) {
        this.gameStateManager = gameStateManager;
        
        // Current storage state
        this.baseStorageLimit = 100; // Base storage capacity without buildings
        
        // Storage system mode
        this.useIndividualStorage = false; // Feature flag for future enhancement
        
        // Resource types - Core game economy
        this.resourceTypes = {
            'radioactive_waste': 0,  // Raw material collected by drones
            'fuel': 15,              // Keeps island flying (start with 15 for ~3 turns survival)
            'materials': 50           // Used for building construction
        };
        
        // Calculate total resources from initial values
        this.currentResources = Object.values(this.resourceTypes).reduce((sum, amount) => sum + amount, 0);
        
        // Subscribe to relevant events
        this.setupEventListeners();
        
        console.log('[PlayerStorage] Initialized with base capacity:', this.baseStorageLimit);
    }

    /**
     * Set up event listeners for storage-related events
     */
    setupEventListeners() {
        // Listen for storage building changes
        EventBus.on('storage:upgraded', this.handleStorageUpgraded.bind(this));
        EventBus.on('storage:destroyed', this.handleStorageDestroyed.bind(this));
        EventBus.on('factory:buildingCreated', this.handleBuildingCreated.bind(this));
        EventBus.on('factory:buildingRemoved', this.handleBuildingRemoved.bind(this));
        
        // Listen for resource events
        EventBus.on('resource:collected', this.handleResourceCollected.bind(this));
    }

    /**
     * Calculate current storage limit based on storage buildings
     * @returns {number} Total storage limit
     */
    getCurrentLimit() {
        if (this.useIndividualStorage) {
            return this.getIndividualStorageTotal();
        }
        
        // Global storage mode - sum up all storage building capacities
        const storageBuildings = this.getStorageBuildings();
        const buildingCapacity = storageBuildings.reduce((total, building) => {
            return total + building.getMaxCapacity();
        }, 0);
        
        return this.baseStorageLimit + buildingCapacity;
    }

    /**
     * Get current available storage space
     * @returns {number} Available storage space
     */
    getAvailableSpace() {
        return this.getCurrentLimit() - this.currentResources;
    }

    /**
     * Check if we can store the specified amount
     * @param {number} amount - Amount to store
     * @returns {boolean} True if can store the amount
     */
    canStore(amount) {
        return this.currentResources + amount <= this.getCurrentLimit();
    }

    /**
     * Add resources to storage
     * @param {number} amount - Amount to add
     * @param {string} resourceType - Type of resource (default: 'radioactive_waste')
     * @returns {number} Amount actually stored
     */
    addResources(amount, resourceType = 'radioactive_waste') {
        console.log(`[PlayerStorage] addResources called with ${amount} ${resourceType}`);
        console.log(`[PlayerStorage] Current state - resources: ${this.currentResources}, limit: ${this.getCurrentLimit()}`);
        
        const availableSpace = this.getAvailableSpace();
        const actualAmount = Math.min(amount, availableSpace);
        
        console.log(`[PlayerStorage] Available space: ${availableSpace}, will add: ${actualAmount}`);
        
        if (actualAmount > 0) {
            this.currentResources += actualAmount;
            
            // Track by resource type for future use
            if (this.resourceTypes.hasOwnProperty(resourceType)) {
                this.resourceTypes[resourceType] += actualAmount;
            }
            
            console.log(`[PlayerStorage] Updated - resources: ${this.currentResources}, resourceTypes:`, this.resourceTypes);
            
            // Emit storage change event
            EventBus.emit('playerStorage:resourcesAdded', {
                amount: actualAmount,
                resourceType,
                newTotal: this.currentResources,
                currentLimit: this.getCurrentLimit(),
                availableSpace: this.getAvailableSpace()
            });
            
            console.log(`[PlayerStorage] Added ${actualAmount} ${resourceType}, total: ${this.currentResources}/${this.getCurrentLimit()}`);
            console.log(`[PlayerStorage] Event emitted: playerStorage:resourcesAdded`);
        } else {
            console.log(`[PlayerStorage] No resources added - actualAmount: ${actualAmount}`);
        }
        
        return actualAmount;
    }

    /**
     * Remove resources from storage
     * @param {number} amount - Amount to remove
     * @param {string} resourceType - Type of resource (default: 'radioactive_waste')
     * @returns {number} Amount actually removed
     */
    removeResources(amount, resourceType = 'radioactive_waste') {
        const currentTypeAmount = this.resourceTypes[resourceType] || 0;
        const actualAmount = Math.min(amount, currentTypeAmount, this.currentResources);
        
        if (actualAmount > 0) {
            this.currentResources -= actualAmount;
            
            if (this.resourceTypes.hasOwnProperty(resourceType)) {
                this.resourceTypes[resourceType] -= actualAmount;
            }
            
            // Emit storage change event
            EventBus.emit('playerStorage:resourcesRemoved', {
                amount: actualAmount,
                resourceType,
                newTotal: this.currentResources,
                currentLimit: this.getCurrentLimit()
            });
            
            console.log(`[PlayerStorage] Removed ${actualAmount} ${resourceType}, total: ${this.currentResources}/${this.getCurrentLimit()}`);
        }
        
        return actualAmount;
    }

    /**
     * Get all storage buildings
     * @returns {StorageBuilding[]} Array of storage buildings
     */
    getStorageBuildings() {
        return this.gameStateManager.getBuildingsByType('storage');
    }

    /**
     * Get storage statistics
     * @returns {Object} Storage statistics
     */
    getStorageStats() {
        const storageBuildings = this.getStorageBuildings();
        
        return {
            currentResources: this.currentResources,
            currentLimit: this.getCurrentLimit(),
            availableSpace: this.getAvailableSpace(),
            fillPercentage: this.getCurrentLimit() > 0 ? (this.currentResources / this.getCurrentLimit()) : 0,
            baseLimit: this.baseStorageLimit,
            buildingCount: storageBuildings.length,
            buildingCapacity: this.getCurrentLimit() - this.baseStorageLimit,
            resourceTypes: { ...this.resourceTypes },
            useIndividualStorage: this.useIndividualStorage
        };
    }

    /**
     * Calculate total storage for individual building mode (future)
     * @returns {number} Total individual storage capacity
     */
    getIndividualStorageTotal() {
        const storageBuildings = this.getStorageBuildings();
        return this.baseStorageLimit + storageBuildings.reduce((total, building) => {
            return total + building.getAvailableCapacity();
        }, 0);
    }

    /**
     * Enable individual storage mode (future enhancement)
     */
    enableIndividualStorage() {
        if (this.useIndividualStorage) return;
        
        this.useIndividualStorage = true;
        
        // Distribute current resources among storage buildings
        const storageBuildings = this.getStorageBuildings();
        let remainingResources = this.currentResources;
        
        storageBuildings.forEach(building => {
            building.enableIndividualStorage();
            const amountToStore = Math.min(remainingResources, building.getMaxCapacity());
            if (amountToStore > 0) {
                building.addResources(amountToStore);
                remainingResources -= amountToStore;
            }
        });
        
        EventBus.emit('playerStorage:individualModeEnabled', {
            distributedResources: this.currentResources - remainingResources,
            remainingResources
        });
        
        console.log('[PlayerStorage] Enabled individual storage mode');
    }

    /**
     * Handle storage building upgrade
     * @param {Object} data - Upgrade event data
     */
    handleStorageUpgraded(data) {
        const { building, capacityIncrease } = data;
        
        EventBus.emit('playerStorage:limitChanged', {
            change: capacityIncrease,
            newLimit: this.getCurrentLimit(),
            building: building
        });
        
        console.log(`[PlayerStorage] Storage limit increased by ${capacityIncrease} to ${this.getCurrentLimit()}`);
    }

    /**
     * Handle storage building destruction
     * @param {Object} data - Destruction event data
     */
    handleStorageDestroyed(data) {
        const { building, lostCapacity } = data;
        
        // Check if we need to remove excess resources
        const newLimit = this.getCurrentLimit();
        if (this.currentResources > newLimit) {
            const excessResources = this.currentResources - newLimit;
            this.currentResources = newLimit;
            
            EventBus.emit('playerStorage:excessResourcesLost', {
                lostAmount: excessResources,
                newTotal: this.currentResources,
                newLimit
            });
            
            console.log(`[PlayerStorage] Lost ${excessResources} resources due to storage destruction`);
        }
        
        EventBus.emit('playerStorage:limitChanged', {
            change: -lostCapacity,
            newLimit: newLimit,
            building: building
        });
        
        console.log(`[PlayerStorage] Storage limit decreased by ${lostCapacity} to ${newLimit}`);
    }

    /**
     * Handle building creation
     * @param {Object} data - Building creation event data
     */
    handleBuildingCreated(data) {
        const { building } = data;
        if (building.type === 'storage') {
            EventBus.emit('playerStorage:limitChanged', {
                change: building.getMaxCapacity(),
                newLimit: this.getCurrentLimit(),
                building: building
            });
            
            console.log(`[PlayerStorage] Storage limit increased to ${this.getCurrentLimit()}`);
        }
    }

    /**
     * Handle building removal
     * @param {Object} data - Building removal event data
     */
    handleBuildingRemoved(data) {
        const { building } = data;
        if (building.type === 'storage') {
            // This will be handled by handleStorageDestroyed
        }
    }

    /**
     * Handle resource collection (for validation)
     * @param {Object} data - Resource collection event data
     */
    handleResourceCollected(data) {
        // This could be used for automatic resource addition in the future
        // For now, resources are added manually through addResources()
    }

    /**
     * Reset storage to initial state
     */
    reset() {
        this.resourceTypes = {
            'radioactive_waste': 0,
            'fuel': 15,              // Reset to starting fuel
            'materials': 5           // Reset to starting materials
        };
        
        // Recalculate total from reset values
        this.currentResources = Object.values(this.resourceTypes).reduce((sum, amount) => sum + amount, 0);
        
        EventBus.emit('playerStorage:reset', {
            newLimit: this.getCurrentLimit()
        });
        
        console.log('[PlayerStorage] Reset to initial state');
    }

    /**
     * Get specific resource amount
     * @param {string} resourceType - Type of resource
     * @returns {number} Amount of specific resource
     */
    getResourceAmount(resourceType) {
        return this.resourceTypes[resourceType] || 0;
    }

    /**
     * Get fuel amount
     * @returns {number} Current fuel
     */
    getFuel() {
        return this.getResourceAmount('fuel');
    }

    /**
     * Get materials amount  
     * @returns {number} Current materials
     */
    getMaterials() {
        return this.getResourceAmount('materials');
    }

    /**
     * Get radioactive waste amount
     * @returns {number} Current radioactive waste
     */
    getWaste() {
        return this.getResourceAmount('radioactive_waste');
    }

    /**
     * Consume fuel (for turn processing)
     * @param {number} amount - Amount of fuel to consume
     * @returns {boolean} True if consumption successful, false if insufficient fuel
     */
    consumeFuel(amount) {
        const currentFuel = this.getFuel();
        if (currentFuel >= amount) {
            this.removeResources(amount, 'fuel');
            return true;
        }
        return false;
    }

    /**
     * Consume materials (for building/upgrades)
     * @param {number} amount - Amount of materials to consume
     * @returns {boolean} True if consumption successful, false if insufficient materials
     */
    consumeMaterials(amount) {
        const currentMaterials = this.getMaterials();
        if (currentMaterials >= amount) {
            const materialsUsed = this.removeResources(amount, 'materials');
            return materialsUsed === amount;
        }
        return false;
    }

    /**
     * Calculate turns remaining based on current fuel and consumption rate
     * @param {number} consumptionPerTurn - Fuel consumed per turn
     * @returns {number} Turns remaining (rounded down)
     */
    getTurnsRemaining(consumptionPerTurn) {
        if (consumptionPerTurn <= 0) return Infinity;
        return Math.floor(this.getFuel() / consumptionPerTurn);
    }

    /**
     * Get debug information
     * @returns {Object} Debug info
     */
    getDebugInfo() {
        return {
            ...this.getStorageStats(),
            storageBuildings: this.getStorageBuildings().map(building => building.getStorageInfo())
        };
    }
}

export default PlayerStorage;