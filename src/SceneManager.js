import EventBus from './EventBus.js';

/**
 * SceneManager - Handles all PixiJS sprite operations for game objects
 * 
 * Separates rendering concerns from game logic by managing sprites
 * based on game object events. Game objects focus on logic,
 * SceneManager handles all visual representation.
 */

export class SceneManager {
    constructor(objectContainer) {
        this.objectContainer = objectContainer;
        this.sprites = new Map(); // gameObject.id -> PIXI.Sprite
        this.spriteToGameObject = new Map(); // sprite -> gameObject
        
        // Subscribe to game object lifecycle events
        this.setupEventListeners();
        
        console.log('[SceneManager] Initialized');
    }

    /**
     * Set up event listeners for game object lifecycle
     */
    setupEventListeners() {
        EventBus.on('gameObject:created', this.handleObjectCreated.bind(this));
        EventBus.on('gameObject:destroyed', this.handleObjectDestroyed.bind(this));
        EventBus.on('gameObject:moved', this.handleObjectMoved.bind(this));
        EventBus.on('gameObject:spriteChanged', this.handleSpriteChanged.bind(this));
        
        // Unit movement events
        EventBus.on('unit:smoothMoved', this.handleUnitSmoothMoved.bind(this));
        
        // Building-specific events
        EventBus.on('building:upgraded', this.handleBuildingUpgraded.bind(this));
        
        // Resource-specific events
        EventBus.on('resource:collected', this.handleResourceCollected.bind(this));
    }

    /**
     * Handle game object creation - create and position sprite
     * @param {GameObject} gameObject - The created game object
     */
    handleObjectCreated(gameObject) {
        if (this.sprites.has(gameObject.id)) {
            console.warn(`[SceneManager] Sprite already exists for object ${gameObject.id}`);
            return;
        }

        // Create sprite from game object's sprite path
        const sprite = PIXI.Sprite.from(gameObject.spritePath);
        sprite.anchor.set(0.5);
        sprite.scale.set(1);
        sprite.position.set(gameObject.hex.x, gameObject.hex.y);
        
        // Store bidirectional mapping
        this.sprites.set(gameObject.id, sprite);
        this.spriteToGameObject.set(sprite, gameObject);
        
        // Add to container
        this.objectContainer.addChild(sprite);
        
        console.log(`[SceneManager] Created sprite for ${gameObject.type} at (${gameObject.hex.x}, ${gameObject.hex.y})`);
    }

    /**
     * Handle game object destruction - remove and destroy sprite
     * @param {GameObject} gameObject - The destroyed game object
     */
    handleObjectDestroyed(gameObject) {
        const sprite = this.sprites.get(gameObject.id);
        if (!sprite) {
            console.warn(`[SceneManager] No sprite found for destroyed object ${gameObject.id}`);
            return;
        }

        // Remove from container and destroy
        this.objectContainer.removeChild(sprite);
        sprite.destroy();
        
        // Clean up mappings
        this.sprites.delete(gameObject.id);
        this.spriteToGameObject.delete(sprite);
        
        console.log(`[SceneManager] Destroyed sprite for ${gameObject.type}`);
    }

    /**
     * Handle game object movement - update sprite position
     * @param {Object} data - Movement data with object, oldHex, newHex
     */
    handleObjectMoved(data) {
        const { object: gameObject, newHex } = data;
        const sprite = this.sprites.get(gameObject.id);
        
        if (!sprite) {
            console.warn(`[SceneManager] No sprite found for moved object ${gameObject.id}`);
            return;
        }

        // Update sprite position
        sprite.position.set(newHex.x, newHex.y);
        
        console.log(`[SceneManager] Moved ${gameObject.type} to (${newHex.x}, ${newHex.y})`);
    }

    /**
     * Handle smooth unit movement - update sprite position with pixel precision
     * @param {Object} data - Movement data with unit and position
     */
    handleUnitSmoothMoved(data) {
        const { unit, position } = data;
        const sprite = this.sprites.get(unit.id);
        
        if (!sprite) {
            console.warn(`[SceneManager] No sprite found for smoothly moving unit ${unit.id}`);
            return;
        }

        // Update sprite position to exact pixel coordinates
        sprite.position.set(position.x, position.y);
        
        // Optional: Add slight visual feedback for flying units
        if (unit.type === 'drone') {
            // Add a subtle floating effect (small vertical oscillation)
            const time = Date.now() * 0.003; // Slow oscillation
            const idOffset = unit.id.length * 0.5; // Simple offset based on id length
            const floatOffset = Math.sin(time + idOffset) * 2; // 2 pixel float range
            sprite.position.y += floatOffset;
        }
    }

    /**
     * Handle sprite texture change
     * @param {Object} data - Data with gameObject and newSpritePath
     */
    handleSpriteChanged(data) {
        const { gameObject, newSpritePath } = data;
        const sprite = this.sprites.get(gameObject.id);
        
        if (!sprite) {
            console.warn(`[SceneManager] No sprite found for object ${gameObject.id}`);
            return;
        }

        // Update sprite texture
        sprite.texture = PIXI.Texture.from(newSpritePath);
        
        console.log(`[SceneManager] Changed sprite for ${gameObject.type} to ${newSpritePath}`);
    }

    /**
     * Handle building upgrade - visual feedback
     * @param {Building} building - The upgraded building
     */
    handleBuildingUpgraded(building) {
        const sprite = this.sprites.get(building.id);
        if (!sprite) return;

        // Add visual upgrade effect - brief scaling animation
        const originalScale = sprite.scale.x;
        sprite.scale.set(originalScale * 1.2);
        
        // Animate back to original scale
        setTimeout(() => {
            if (sprite && !sprite.destroyed) {
                sprite.scale.set(originalScale);
            }
        }, 200);
        
        console.log(`[SceneManager] Upgrade effect for ${building.type} level ${building.level}`);
    }

    /**
     * Handle resource collection - visual feedback
     * @param {Resource} resource - The collected resource
     */
    handleResourceCollected(resource) {
        const sprite = this.sprites.get(resource.id);
        if (!sprite) return;

        // Visual feedback for collection - brief flash
        const originalTint = sprite.tint;
        sprite.tint = 0xffff00; // Flash yellow
        
        setTimeout(() => {
            if (sprite && !sprite.destroyed) {
                sprite.tint = originalTint;
            }
        }, 100);
        
        console.log(`[SceneManager] Collection effect for ${resource.type}`);
    }

    /**
     * Get sprite for a game object
     * @param {GameObject} gameObject - The game object
     * @returns {PIXI.Sprite|null} The sprite or null if not found
     */
    getSprite(gameObject) {
        return this.sprites.get(gameObject.id) || null;
    }

    /**
     * Get game object for a sprite
     * @param {PIXI.Sprite} sprite - The sprite
     * @returns {GameObject|null} The game object or null if not found
     */
    getGameObject(sprite) {
        return this.spriteToGameObject.get(sprite) || null;
    }

    /**
     * Update sprite tint for a game object
     * @param {GameObject} gameObject - The game object
     * @param {number} tint - The tint color (hex number)
     */
    setSpriteTint(gameObject, tint) {
        const sprite = this.sprites.get(gameObject.id);
        if (sprite) {
            sprite.tint = tint;
        }
    }

    /**
     * Get all sprites (for debugging)
     * @returns {Map} Map of gameObject.id -> sprite
     */
    getAllSprites() {
        return new Map(this.sprites);
    }

    /**
     * Clean up all sprites and event listeners
     */
    destroy() {
        // Remove all sprites
        for (const sprite of this.sprites.values()) {
            this.objectContainer.removeChild(sprite);
            sprite.destroy();
        }
        
        // Clear mappings
        this.sprites.clear();
        this.spriteToGameObject.clear();
        
        // Note: EventBus listeners are static, so they persist
        // This is intentional for this implementation
        
        console.log('[SceneManager] Destroyed');
    }
}

export default SceneManager;