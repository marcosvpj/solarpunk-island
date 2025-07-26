import { GameObject } from './GameObject.js';
import EventBus from '../EventBus.js';

/**
 * Resource class - Represents collectible resources on hexes
 * 
 * Handles resource collection logic and emits events for
 * collection effects and depletion.
 */
export class Resource extends GameObject {
    constructor(type, hex, amount = 100) {
        // All resources use the same sprite for now
        const spritePath = 'assets/resource.png';
        super(type, spritePath, hex);
        
        this.amount = amount;
        this.maxAmount = amount;
        this.collectionRate = 10; // Amount collected per action
        this.regenerationRate = 0; // Amount regenerated per second (0 = no regen)
        this.lastRegenerationTime = Date.now();
    }

    /**
     * Collect resources from this node
     * @param {number} requestedAmount - Amount to collect
     * @returns {number} Amount actually collected
     */
    collect(requestedAmount = this.collectionRate) {
        if (this.isDestroyed || this.amount <= 0) {
            return 0;
        }
        
        const actualAmount = Math.min(requestedAmount, this.amount);
        this.amount -= actualAmount;
        
        // Emit collection event for visual feedback
        EventBus.emit('resource:collected', {
            resource: this,
            amount: actualAmount,
            remaining: this.amount
        });
        
        console.log(`[Resource] Collected ${actualAmount} ${this.type}, ${this.amount} remaining`);
        
        // Auto-destroy if depleted
        if (this.amount <= 0) {
            setTimeout(() => this.destroy(), 100); // Small delay for visual effect
        }
        
        return actualAmount;
    }

    /**
     * Add resources to this node
     * @param {number} amount - Amount to add
     */
    addResources(amount) {
        if (this.isDestroyed) return;
        
        this.amount = Math.min(this.amount + amount, this.maxAmount);
        
        EventBus.emit('resource:added', {
            resource: this,
            amount: amount,
            total: this.amount
        });
    }

    /**
     * Handle resource regeneration over time
     */
    regenerate() {
        if (this.isDestroyed || this.regenerationRate <= 0 || this.amount >= this.maxAmount) {
            return;
        }
        
        const now = Date.now();
        const timeSinceLastRegen = (now - this.lastRegenerationTime) / 1000; // Convert to seconds
        
        if (timeSinceLastRegen >= 1.0) { // Regenerate every second
            const regenAmount = Math.floor(this.regenerationRate * timeSinceLastRegen);
            if (regenAmount > 0) {
                this.addResources(regenAmount);
                this.lastRegenerationTime = now;
            }
        }
    }

    /**
     * Update resource (called every frame)
     */
    update() {
        super.update();
        
        // Handle regeneration
        this.regenerate();
    }

    /**
     * Check if resource is depleted
     * @returns {boolean} True if no resources remain
     */
    isDepleted() {
        return this.amount <= 0;
    }

    /**
     * Get collection efficiency (0-1 based on remaining amount)
     * @returns {number} Efficiency multiplier
     */
    getEfficiency() {
        return this.amount / this.maxAmount;
    }

    /**
     * Get resource information
     * @returns {Object} Resource info
     */
    getResourceInfo() {
        return {
            ...this.getInfo(),
            amount: this.amount,
            maxAmount: this.maxAmount,
            collectionRate: this.collectionRate,
            regenerationRate: this.regenerationRate,
            efficiency: this.getEfficiency(),
            isDepleted: this.isDepleted()
        };
    }

    /**
     * Destroy the resource
     */
    destroy() {
        if (this.isDestroyed) return;
        
        // Emit resource-specific destruction event
        EventBus.emit('resource:destroyed', this);
        
        // Call parent destroy
        super.destroy();
        
        console.log(`[Resource] ${this.type} resource destroyed`);
    }
}