import { Unit } from './Unit.js';
import EventBus from '../EventBus.js';

/**
 * Drone class - Automated resource collection and delivery units
 * 
 * Flying units that automatically collect radioactive waste from resource nodes
 * and deliver them to storage buildings or reactors. Can carry multiple units
 * of resources and operate autonomously.
 */
export class Drone extends Unit {
    constructor(hex, ownerFactory = null) {
        super('drone', hex);
        
        // Override parent movement settings for drones
        this.moveInterval = 800; // Time between hex moves (ms) - for discrete movement
        this.speed = 2; // Hexes per second (faster than ground units)
        
        // Enable smooth movement for drones (flying units should be smooth)
        this.smoothMovement = true;
        this.movementSpeed = 80; // Pixels per second for smooth flight
        
        // Drone-specific properties
        this.carryingCapacity = 5; // Base carrying capacity (upgradeable)
        this.currentLoad = 0; // Current resources being carried
        this.resourceType = null; // Type of resource being carried
        this.ownerFactory = ownerFactory; // Factory that created this drone
        
        // AI state management
        this.aiState = 'idle'; // 'idle', 'seeking', 'collecting', 'delivering', 'returning'
        this.targetResource = null; // Resource node being targeted
        this.targetBuilding = null; // Storage/reactor being targeted for delivery
        
        // AI timing
        this.taskDelay = 1500; // Delay between task completion and next task (ms)
        this.lastTaskTime = Date.now();
        
        // Upgrade properties (for future use)
        this.upgradeLevel = 1;
        this.efficiency = 1.0; // Collection efficiency multiplier
        
        console.log(`[Drone] Created drone with capacity ${this.carryingCapacity} at (${hex.q}, ${hex.r})`);
    }

    /**
     * Update drone AI and movement (called every frame)
     */
    update() {
        super.update();
        
        // Process AI state machine
        this.processAI();
        
        // Handle movement along path
        if (this.state === 'moving') {
            this.moveAlongPath();
        }
    }

    /**
     * Main AI state machine processing
     */
    processAI() {
        const now = Date.now();
        
        // Add delay between tasks to prevent rapid switching
        if (now - this.lastTaskTime < this.taskDelay) {
            return;
        }
        
        switch (this.aiState) {
            case 'idle':
                this.seekResource();
                break;
                
            case 'seeking':
                this.handleSeeking();
                break;
                
            case 'collecting':
                this.handleCollecting();
                break;
                
            case 'delivering':
                this.handleDelivering();
                break;
                
            case 'returning':
                this.handleReturning();
                break;
        }
    }

    /**
     * Look for the nearest available resource to collect
     */
    seekResource() {
        if (this.currentLoad >= this.carryingCapacity) {
            this.startDelivery();
            return;
        }
        
        const nearestResource = this.findNearestResource();
        if (nearestResource) {
            this.targetResource = nearestResource;
            this.setTarget(nearestResource.hex);
            this.aiState = 'seeking';
            this.lastTaskTime = Date.now();
            
            EventBus.emit('drone:taskStarted', {
                drone: this,
                task: 'seeking',
                target: nearestResource
            });
            
            console.log(`[Drone] Seeking resource at (${nearestResource.hex.q}, ${nearestResource.hex.r})`);
        } else {
            // No resources available, stay idle
            this.aiState = 'idle';
        }
    }

    /**
     * Handle movement to resource location
     */
    handleSeeking() {
        if (!this.targetResource || this.targetResource.isDestroyed || this.targetResource.amount <= 0) {
            // Target resource is gone, find a new one
            this.targetResource = null;
            this.aiState = 'idle';
            return;
        }
        
        if (this.isAtHex(this.targetResource.hex)) {
            // Arrived at resource, start collecting
            this.aiState = 'collecting';
            this.state = 'working';
            this.lastTaskTime = Date.now();
            
            console.log(`[Drone] Arrived at resource, starting collection`);
        }
    }

    /**
     * Handle resource collection
     */
    handleCollecting() {
        if (!this.targetResource || this.targetResource.isDestroyed || this.targetResource.amount <= 0) {
            // Resource is gone, look for delivery or new resource
            this.targetResource = null;
            if (this.currentLoad > 0) {
                this.startDelivery();
            } else {
                this.aiState = 'idle';
            }
            return;
        }
        
        // Collect resources
        const spaceAvailable = this.carryingCapacity - this.currentLoad;
        const collectionAmount = Math.min(spaceAvailable, this.targetResource.collectionRate, this.targetResource.amount);
        
        if (collectionAmount > 0) {
            console.log(`[Drone] Attempting to collect ${collectionAmount} from ${this.targetResource.type} resource (${this.targetResource.amount} available)`);
            const actualCollected = this.targetResource.collect(collectionAmount);
            this.currentLoad += actualCollected;
            this.resourceType = this.targetResource.type;
            
            EventBus.emit('drone:resourceCollected', {
                drone: this,
                amount: actualCollected,
                resourceType: this.resourceType,
                currentLoad: this.currentLoad,
                source: this.targetResource
            });
            
            console.log(`[Drone] Successfully collected ${actualCollected} ${this.resourceType}, current load: ${this.currentLoad}/${this.carryingCapacity}`);
        } else {
            console.log(`[Drone] No collection possible - space: ${spaceAvailable}, rate: ${this.targetResource.collectionRate}, available: ${this.targetResource.amount}`);
        }
        
        // Check if we should continue collecting or start delivery
        if (this.currentLoad >= this.carryingCapacity || this.targetResource.amount <= 0) {
            this.startDelivery();
        } else {
            // Continue collecting from same resource
            this.lastTaskTime = Date.now();
        }
    }

    /**
     * Start the delivery process
     */
    startDelivery() {
        if (this.currentLoad <= 0) {
            this.aiState = 'idle';
            return;
        }
        
        const deliveryTarget = this.findBestDeliveryTarget();
        if (deliveryTarget) {
            this.targetBuilding = deliveryTarget;
            this.setTarget(deliveryTarget.hex);
            this.aiState = 'delivering';
            this.lastTaskTime = Date.now();
            
            console.log(`[Drone] Starting delivery to ${deliveryTarget.type} at (${deliveryTarget.hex.q}, ${deliveryTarget.hex.r})`);
        } else {
            // No delivery target available, stay at current location
            console.warn(`[Drone] No delivery target found for ${this.currentLoad} ${this.resourceType}`);
            this.aiState = 'idle';
        }
    }

    /**
     * Handle movement to delivery target
     */
    handleDelivering() {
        if (!this.targetBuilding || this.targetBuilding.isDestroyed) {
            // Target building is gone, find a new one
            this.targetBuilding = null;
            this.startDelivery();
            return;
        }
        
        if (this.isAtHex(this.targetBuilding.hex)) {
            // Arrived at delivery target, deliver resources
            this.deliverResources();
        }
    }

    /**
     * Deliver carried resources to the target building
     */
    deliverResources() {
        if (!this.targetBuilding || this.currentLoad <= 0) {
            this.aiState = 'idle';
            return;
        }
        
        let deliveredAmount = 0;
        
        if (this.targetBuilding.type === 'storage') {
            // Deliver to storage building
            const storageBuilding = this.targetBuilding;
            if (storageBuilding.canStore && storageBuilding.canStore(this.currentLoad)) {
                deliveredAmount = storageBuilding.addResources(this.currentLoad);
            } else {
                // Use global storage system
                deliveredAmount = this.deliverToGlobalStorage();
            }
        } else if (this.targetBuilding.type === 'reactor') {
            // Deliver to reactor as fuel
            deliveredAmount = this.deliverToReactor();
        }
        
        if (deliveredAmount > 0) {
            this.currentLoad -= deliveredAmount;
            
            EventBus.emit('drone:resourceDelivered', {
                drone: this,
                amount: deliveredAmount,
                resourceType: this.resourceType,
                target: this.targetBuilding,
                remainingLoad: this.currentLoad
            });
            
            console.log(`[Drone] Delivered ${deliveredAmount} ${this.resourceType} to ${this.targetBuilding.type} at (${this.targetBuilding.hex.q}, ${this.targetBuilding.hex.r})`);
        } else {
            console.warn(`[Drone] Failed to deliver ${this.currentLoad} ${this.resourceType} to ${this.targetBuilding.type}`);
        }
        
        // Clear resource type if load is empty
        if (this.currentLoad <= 0) {
            this.resourceType = null;
        }
        
        this.targetBuilding = null;
        this.lastTaskTime = Date.now();
        
        // Decide next action
        if (this.currentLoad > 0) {
            // Still carrying resources, find another delivery target
            this.startDelivery();
        } else {
            // Empty, look for more resources
            this.aiState = 'idle';
        }
    }

    /**
     * Deliver resources to global storage system
     * @returns {number} Amount actually delivered
     */
    deliverToGlobalStorage() {
        console.log(`[Drone] deliverToGlobalStorage called`);
        console.log(`[Drone] window object:`, !!window);
        console.log(`[Drone] window.playerStorage:`, window.playerStorage);
        console.log(`[Drone] typeof window.playerStorage:`, typeof window.playerStorage);
        
        // Get global player storage from window (accessible from main.js)
        const playerStorage = window.playerStorage;
        
        console.log(`[Drone] Attempting to deliver ${this.currentLoad} ${this.resourceType} to global storage`);
        console.log(`[Drone] PlayerStorage available:`, !!playerStorage);
        
        if (playerStorage) {
            console.log(`[Drone] Calling playerStorage.addResources(${this.currentLoad}, "${this.resourceType}")`);
            const deliveredAmount = playerStorage.addResources(this.currentLoad, this.resourceType);
            console.log(`[Drone] Successfully delivered ${deliveredAmount}/${this.currentLoad} ${this.resourceType} to global storage`);
            return deliveredAmount;
        } else {
            // Fallback: simulate successful delivery
            console.warn('[Drone] PlayerStorage not available, simulating delivery');
            console.warn('[Drone] Available window properties:', Object.keys(window));
            return this.currentLoad;
        }
    }

    /**
     * Deliver resources to reactor as fuel
     * @returns {number} Amount actually delivered
     */
    deliverToReactor() {
        // For now, reactors automatically accept radioactive waste as fuel
        // Future enhancement: implement reactor fuel capacity and processing
        const deliveredAmount = this.currentLoad;
        
        // Emit event for reactor fuel delivery (for future fuel system integration)
        EventBus.emit('reactor:fuelDelivered', {
            reactor: this.targetBuilding,
            amount: deliveredAmount,
            resourceType: this.resourceType,
            drone: this
        });
        
        console.log(`[Drone] Delivered ${deliveredAmount} ${this.resourceType} as reactor fuel`);
        return deliveredAmount;
    }

    /**
     * Find the nearest available resource node
     * @returns {Resource|null} Nearest resource or null if none available
     */
    findNearestResource() {
        // Get all available resources from the global game state
        const resources = window.gameState?.resources || [];
        
        if (resources.length === 0) return null;
        
        // Filter resources that have available amounts and are not destroyed
        const availableResources = resources.filter(resource => 
            !resource.isDestroyed && 
            resource.amount > 0 && 
            resource.type === 'radioactive_waste' // Drones only collect radioactive waste
        );
        
        if (availableResources.length === 0) return null;
        
        // Find the nearest resource
        let nearestResource = null;
        let nearestDistance = Infinity;
        
        for (const resource of availableResources) {
            const distance = this.calculateDistance(this.hex, resource.hex);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestResource = resource;
            }
        }
        
        return nearestResource;
    }

    /**
     * Find the best building to deliver resources to
     * Priority: Storage buildings with space > Reactor
     * @returns {Building|null} Best delivery target or null if none available
     */
    findBestDeliveryTarget() {
        // Get all buildings from the global game state
        const buildings = window.gameState?.buildings || [];
        
        if (buildings.length === 0) return null;
        
        // First priority: Storage buildings with available space
        const storageBuildings = buildings.filter(building => 
            !building.isDestroyed && 
            building.type === 'storage'
        );
        
        // Find nearest storage building with space
        let bestStorage = null;
        let nearestStorageDistance = Infinity;
        
        for (const storage of storageBuildings) {
            // Check if storage has space (for individual storage mode) or use global storage
            const hasSpace = storage.canStore ? storage.canStore(this.currentLoad) : true;
            
            if (hasSpace) {
                const distance = this.calculateDistance(this.hex, storage.hex);
                if (distance < nearestStorageDistance) {
                    nearestStorageDistance = distance;
                    bestStorage = storage;
                }
            }
        }
        
        if (bestStorage) {
            return bestStorage;
        }
        
        // Second priority: Reactor buildings (as fuel)
        const reactorBuildings = buildings.filter(building => 
            !building.isDestroyed && 
            building.type === 'reactor'
        );
        
        // Find nearest reactor
        let nearestReactor = null;
        let nearestReactorDistance = Infinity;
        
        for (const reactor of reactorBuildings) {
            const distance = this.calculateDistance(this.hex, reactor.hex);
            if (distance < nearestReactorDistance) {
                nearestReactorDistance = distance;
                nearestReactor = reactor;
            }
        }
        
        return nearestReactor;
    }

    /**
     * Calculate distance between two hexes (for pathfinding)
     * @param {Hex} hexA - First hex
     * @param {Hex} hexB - Second hex
     * @returns {number} Distance between hexes
     */
    calculateDistance(hexA, hexB) {
        const dq = hexA.q - hexB.q;
        const dr = hexA.r - hexB.r;
        return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
    }

    /**
     * Handle returning to factory (future feature)
     */
    handleReturning() {
        if (this.ownerFactory && this.isAtHex(this.ownerFactory.hex)) {
            this.aiState = 'idle';
            this.lastTaskTime = Date.now();
        }
    }

    /**
     * Upgrade drone capacity (future feature)
     * @param {number} newCapacity - New carrying capacity
     */
    upgradeCapacity(newCapacity) {
        const oldCapacity = this.carryingCapacity;
        this.carryingCapacity = newCapacity;
        this.upgradeLevel++;
        
        EventBus.emit('drone:upgraded', {
            drone: this,
            oldCapacity,
            newCapacity,
            upgradeLevel: this.upgradeLevel
        });
        
        console.log(`[Drone] Upgraded capacity: ${oldCapacity} → ${newCapacity}`);
    }

    /**
     * Get current load percentage
     * @returns {number} Load percentage (0-1)
     */
    getLoadPercentage() {
        return this.carryingCapacity > 0 ? (this.currentLoad / this.carryingCapacity) : 0;
    }

    /**
     * Check if drone is carrying resources
     * @returns {boolean} True if carrying any resources
     */
    isCarrying() {
        return this.currentLoad > 0;
    }

    /**
     * Check if drone is at full capacity
     * @returns {boolean} True if at full capacity
     */
    isFullyLoaded() {
        return this.currentLoad >= this.carryingCapacity;
    }

    /**
     * Get drone information for debugging/UI
     * @returns {Object} Drone info
     */
    getDroneInfo() {
        return {
            ...this.getUnitInfo(),
            carryingCapacity: this.carryingCapacity,
            currentLoad: this.currentLoad,
            resourceType: this.resourceType,
            loadPercentage: this.getLoadPercentage(),
            aiState: this.aiState,
            targetResource: this.targetResource ? this.targetResource.id : null,
            targetBuilding: this.targetBuilding ? this.targetBuilding.id : null,
            ownerFactory: this.ownerFactory ? this.ownerFactory.id : null,
            upgradeLevel: this.upgradeLevel,
            efficiency: this.efficiency
        };
    }

    /**
     * Destroy the drone
     */
    destroy() {
        // Drop any carried resources at current location
        if (this.currentLoad > 0) {
            EventBus.emit('drone:resourcesDropped', {
                drone: this,
                amount: this.currentLoad,
                resourceType: this.resourceType,
                location: this.hex
            });
            
            console.log(`[Drone] Dropped ${this.currentLoad} ${this.resourceType} at (${this.hex.q}, ${this.hex.r})`);
        }
        
        // Clear targets
        this.targetResource = null;
        this.targetBuilding = null;
        this.ownerFactory = null;
        
        // Call parent destroy
        super.destroy();
        
        console.log(`[Drone] Drone destroyed`);
    }
}