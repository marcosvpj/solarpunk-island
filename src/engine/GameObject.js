
import EventBus from './EventBus.js';

/**
 * Generic GameObject class - Base class for all game objects
 * 
 * Focuses purely on game logic and data, with no rendering concerns.
 * Emits events for lifecycle changes that the SceneManager handles.
 */
export class GameObject {
    static idCounter = 0;

    constructor(type, spritePath, hex) {
        this.id = `${type}_${GameObject.idCounter++}`;
        this.type = type;
        this.hex = hex;
        this.spritePath = spritePath;
        this.isDestroyed = false;
        this.createdAt = Date.now();
        
        // Emit creation event for SceneManager to handle
        EventBus.emit('gameObject:created', this);
    }

    /**
     * Update logic for the object (called every frame)
     */
    update() {
        // Override in child classes for specific update logic
    }

    /**
     * Move object to a new hex position
     * @param {Hex} newHex - The new hex to move to
     */
    moveTo(newHex) {
        if (this.isDestroyed) return;
        
        const oldHex = this.hex;
        this.hex = newHex;
        
        // Emit movement event for SceneManager to handle
        EventBus.emit('gameObject:moved', {
            object: this,
            oldHex,
            newHex
        });
    }

    /**
     * Change the sprite texture
     * @param {string} newSpritePath - Path to the new sprite
     */
    changeSprite(newSpritePath) {
        if (this.isDestroyed) return;
        
        this.spritePath = newSpritePath;
        
        // Emit sprite change event for SceneManager to handle
        EventBus.emit('gameObject:spriteChanged', {
            gameObject: this,
            newSpritePath
        });
    }

    /**
     * Destroy the game object
     */
    destroy() {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        
        // Emit destruction event for SceneManager to handle
        EventBus.emit('gameObject:destroyed', this);
    }

    /**
     * Get position data for this object
     * @returns {Object} Position data
     */
    getPosition() {
        return {
            x: this.hex.x,
            y: this.hex.y,
            q: this.hex.q,
            r: this.hex.r
        };
    }

    /**
     * Check if this object is at a specific hex
     * @param {Hex} hex - The hex to check
     * @returns {boolean} True if at the specified hex
     */
    isAtHex(hex) {
        return this.hex === hex;
    }

    /**
     * Get object info for debugging
     * @returns {Object} Object information
     */
    getInfo() {
        return {
            id: this.id,
            type: this.type,
            position: this.getPosition(),
            spritePath: this.spritePath,
            isDestroyed: this.isDestroyed,
            createdAt: this.createdAt
        };
    }
}