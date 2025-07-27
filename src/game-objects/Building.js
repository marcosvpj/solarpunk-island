import { GameObject } from './GameObject.js';
import EventBus from '../engine/EventBus.js';

/**
 * Building class - Represents placeable structures on hexes
 * 
 * Handles building-specific logic like upgrades and production.
 * Emits events for building state changes.
 */
export class Building extends GameObject {
    constructor(type, hex) {
        // Get sprite path based on building type
        const spritePath = Building.getSpritePathForType(type);
        super(type, spritePath, hex);
        
        this.level = 1;
        this.productionRate = 1;
        this.maxLevel = 5;
        this.upgradeCost = 100;
        this.lastProductionTime = Date.now();
    }

    /**
     * Get sprite path for building type
     * @param {string} type - Building type
     * @returns {string} Sprite path
     */
    static getSpritePathForType(type) {
        const spriteMap = {
            'reactor': 'assets/building-reactor.png',
            'drone_factory': 'assets/building-factory.png', 
            'refinery': 'assets/building-refinery.png',
            'storage': 'assets/building-storage.png',
            'greenhouse': 'assets/building-greenhouse.png',
            'habitat': 'assets/building-habitat.png'
        };
        
        return spriteMap[type] || 'assets/building-reactor.png';
    }

    /**
     * Upgrade the building to the next level
     * @returns {boolean} True if upgrade was successful
     */
    upgrade() {
        if (this.isDestroyed || this.level >= this.maxLevel) {
            return false;
        }
        
        this.level++;
        this.productionRate *= 1.5;
        this.upgradeCost = Math.floor(this.upgradeCost * 1.8);
        
        // Emit upgrade event for visual feedback
        EventBus.emit('building:upgraded', this);
        
        console.log(`[Building] ${this.type} upgraded to level ${this.level}`);
        return true;
    }

    /**
     * Check if building can be upgraded
     * @returns {boolean} True if upgradeable
     */
    canUpgrade() {
        return !this.isDestroyed && this.level < this.maxLevel;
    }

    /**
     * Produce resources (called periodically)
     * @returns {number} Amount of resources produced
     */
    produce() {
        if (this.isDestroyed) return 0;
        
        const now = Date.now();
        const timeSinceLastProduction = now - this.lastProductionTime;
        
        // Produce every 5 seconds (5000ms)
        if (timeSinceLastProduction >= 5000) {
            this.lastProductionTime = now;
            const produced = Math.floor(this.productionRate * this.level);
            
            if (produced > 0) {
                EventBus.emit('building:produced', {
                    building: this,
                    amount: produced
                });
            }
            
            return produced;
        }
        
        return 0;
    }

    /**
     * Update building (called every frame)
     */
    update() {
        super.update();
        
        // Handle production
        this.produce();
    }

    /**
     * Get building information
     * @returns {Object} Building info
     */
    getBuildingInfo() {
        return {
            ...this.getInfo(),
            level: this.level,
            productionRate: this.productionRate,
            maxLevel: this.maxLevel,
            upgradeCost: this.upgradeCost,
            canUpgrade: this.canUpgrade()
        };
    }

    /**
     * Destroy the building
     */
    destroy() {
        if (this.isDestroyed) return;
        
        // Emit building-specific destruction event
        EventBus.emit('building:destroyed', this);
        
        // Call parent destroy
        super.destroy();
        
        console.log(`[Building] ${this.type} destroyed`);
    }
}