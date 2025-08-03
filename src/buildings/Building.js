import { GameObject } from "../engine/GameObject.js";
import EventBus from "../engine/EventBus.js";

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

    // Construction state properties
    this.isUnderConstruction = false;
    this.constructionTimeRemaining = 0; // in seconds
    this.constructionProgress = 0; // 0-1
    this.totalConstructionTime = 0; // in seconds
    this.constructionProgressBar = null; // PIXI graphics for progress bar
  }

  /**
   * Get sprite path for building type
   * @param {string} type - Building type
   * @returns {string} Sprite path
   */
  static getSpritePathForType(type) {
    const spriteMap = {
      reactor: "assets/building-reactor.png",
      drone_factory: "assets/building-factory.png",
      refinery: "assets/building-refinery.png",
      storage: "assets/building-storage.png",
      greenhouse: "assets/building-greenhouse.png",
      habitat: "assets/building-habitat.png",
      park: "assets/building-park.png",
    };

    return spriteMap[type] || "assets/building-reactor.png";
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
    EventBus.emit("building:upgraded", this);

    console.log(`[Building] ${this.type} upgraded to level ${this.level}`);
    return true;
  }

  /**
   * Check if building can be upgraded
   * @returns {boolean} True if upgradeable
   */
  canUpgrade() {
    return (
      !this.isDestroyed &&
      !this.isUnderConstruction &&
      this.level < this.maxLevel
    );
  }

  static canBuildOn(hex) {
    return !hex.resource;
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
        EventBus.emit("building:produced", {
          building: this,
          amount: produced,
        });
      }

      return produced;
    }

    return 0;
  }

  /**
   * Start construction of this building
   * @param {number} buildTime - Construction time in seconds
   */
  startConstruction(buildTime) {
    console.log(`[Building] startConstruction called for ${this.type} with buildTime ${buildTime}s`);
    
    this.isUnderConstruction = true;
    this.constructionTimeRemaining = buildTime;
    this.totalConstructionTime = buildTime;
    this.constructionProgress = 0;

    // Make building semi-transparent during construction
    const sprite = this.getSprite();
    if (sprite) {
      sprite.alpha = 0.6;
      sprite.tint = 0xcccccc; // Slightly gray tint
      console.log(`[Building] Building sprite made semi-transparent`);
    } else {
      console.warn(`[Building] No sprite available to make semi-transparent`);
    }

    // Create progress bar
    console.log(`[Building] About to call createProgressBar()`);
    this.createProgressBar();
    console.log(`[Building] createProgressBar() call completed`);

    console.log(
      `[Building] Started construction of ${this.type} (${buildTime}s)`,
    );
    EventBus.emit("building:constructionStarted", this);
  }

  /**
   * Update construction progress
   * @param {number} deltaTime - Time elapsed in seconds
   */
  updateConstruction(deltaTime) {
    if (!this.isUnderConstruction) return;

    // Create progress bar on first update if it doesn't exist yet
    if (!this.constructionProgressBar) {
      console.log(`[Building] Checking sprite availability during updateConstruction for ${this.type}`);
      const sprite = this.getSprite();
      console.log(`[Building] sprite from scene manager:`, !!sprite);
      console.log(`[Building] sprite parent:`, !!sprite?.parent);
      
      if (sprite && sprite.parent) {
        console.log(`[Building] Creating progress bar during updateConstruction for ${this.type}`);
        this.createProgressBar();
      } else {
        console.log(`[Building] Sprite not ready yet for ${this.type}, skipping progress bar creation`);
      }
    }

    this.constructionTimeRemaining -= deltaTime;
    this.constructionProgress = Math.max(
      0,
      1 - this.constructionTimeRemaining / this.totalConstructionTime,
    );

    // Update progress bar (only if it exists)
    if (this.constructionProgressBar) {
      this.updateProgressBar();
    } else {
      console.log(`[Building] Skipping progress bar update for ${this.type} - no progress bar available`);
    }

    if (this.constructionTimeRemaining <= 0) {
      this.completeConstruction();
    }
  }

  /**
   * Complete construction
   */
  completeConstruction() {
    this.isUnderConstruction = false;
    this.constructionTimeRemaining = 0;
    this.constructionProgress = 1;

    // Restore building appearance
    const sprite = this.getSprite();
    if (sprite) {
      sprite.alpha = 1.0;
      sprite.tint = 0xffffff; // White tint (normal)
    }

    // Remove progress bar if it exists
    if (this.constructionProgressBar) {
      this.constructionProgressBar.parent?.removeChild(
        this.constructionProgressBar,
      );
      this.constructionProgressBar = null;
      this.progressCircle = null;
    }

    console.log(`[Building] Completed construction of ${this.type}`);
    EventBus.emit("building:constructionCompleted", this);
  }

  /**
   * Cancel construction (if needed)
   */
  cancelConstruction() {
    if (!this.isUnderConstruction) return false;

    this.isUnderConstruction = false;
    this.constructionTimeRemaining = 0;
    this.constructionProgress = 0;

    // Restore building appearance
    const sprite = this.getSprite();
    if (sprite) {
      sprite.alpha = 1.0;
      sprite.tint = 0xffffff; // White tint (normal)
    }

    // Remove progress bar if it exists
    if (this.constructionProgressBar) {
      this.constructionProgressBar.parent?.removeChild(
        this.constructionProgressBar,
      );
      this.constructionProgressBar = null;
      this.progressCircle = null;
    }

    console.log(`[Building] Cancelled construction of ${this.type}`);
    EventBus.emit("building:constructionCancelled", this);
    return true;
  }

  /**
   * Get the sprite for this building from the scene manager
   */
  getSprite() {
    // Try to get sprite from global scene manager
    if (window.sceneManager && window.sceneManager.getSprite) {
      return window.sceneManager.getSprite(this);
    }
    return null;
  }

  /**
   * Create circular progress bar for construction
   */
  createProgressBar() {
    console.log(`[Building] createProgressBar called for ${this.type}`);
    console.log(`[Building] PIXI available:`, !!window.PIXI);
    
    const sprite = this.getSprite();
    console.log(`[Building] sprite from scene manager:`, !!sprite);
    console.log(`[Building] sprite parent:`, !!sprite?.parent);
    
    if (!window.PIXI || !sprite) {
      console.warn(`[Building] Cannot create progress bar - missing PIXI or sprite`);
      return;
    }

    // Remove existing progress bar
    if (this.constructionProgressBar) {
      this.constructionProgressBar.parent?.removeChild(
        this.constructionProgressBar,
      );
    }

    try {
      // Create progress bar container
      this.constructionProgressBar = new window.PIXI.Container();

      // Calculate proper size - half the size of a hex (hex size is typically 32px, so radius ~16px)
      const progressRadius = 12; // Half of hex radius for perfect fit

      // Background circle (dark gray with transparency)
      const backgroundCircle = new window.PIXI.Graphics();
      backgroundCircle.circle(0, 0, progressRadius);
      backgroundCircle.fill({ color: 0x000000, alpha: 0.5 }); // Semi-transparent black background
      backgroundCircle.circle(0, 0, progressRadius);
      backgroundCircle.stroke({ width: 1, color: 0x666666, alpha: 0.8 });

      // Progress circle (bright green) - this will be updated each frame
      const progressCircle = new window.PIXI.Graphics();

      this.constructionProgressBar.addChild(backgroundCircle);
      this.constructionProgressBar.addChild(progressCircle);

      // Position exactly at the center of the building (no offset)
      this.constructionProgressBar.position.set(0, 0);

      // Add to building sprite as child so it moves with the building and is perfectly centered
      sprite.addChild(this.constructionProgressBar);

      // Store reference to progress circle for updates
      this.progressCircle = progressCircle;

      // Make sure it's visible
      this.constructionProgressBar.visible = true;
      this.constructionProgressBar.alpha = 1.0;

      // Initial progress bar draw (full circle at start)
      this.updateProgressBar();

      console.log(`[Building] Progress bar created successfully for ${this.type}`);
      console.log(`[Building] Progress bar children:`, this.constructionProgressBar.children.length);
      console.log(`[Building] Progress bar position:`, this.constructionProgressBar.position);
      console.log(`[Building] Progress bar visible:`, this.constructionProgressBar.visible);
      
    } catch (error) {
      console.error(`[Building] Error creating progress bar:`, error);
    }
  }

  /**
   * Update progress bar appearance - countdown clock style
   */
  updateProgressBar() {
    if (!this.constructionProgressBar || !this.progressCircle) {
      console.warn(`[Building] updateProgressBar called but no progress bar objects available`);
      return;
    }

    // Clear and redraw progress circle
    this.progressCircle.clear();

    // Calculate remaining progress (1 = full circle, 0 = empty)
    const remainingProgress = 1 - this.constructionProgress;

    console.log(`[Building] Updating progress bar - progress: ${this.constructionProgress}, remaining: ${remainingProgress}`);

    if (remainingProgress > 0) {
      try {
        // Use same radius as in createProgressBar
        const progressRadius = 11; // Slightly smaller than background for visual separation
        
        // Draw countdown arc (starts full, reduces as construction progresses)
        const startAngle = -Math.PI / 2; // Start at top (12 o'clock)
        const endAngle = startAngle + 2 * Math.PI * remainingProgress;

        // Fill the remaining portion with bright green
        this.progressCircle.moveTo(0, 0);
        this.progressCircle.arc(0, 0, progressRadius, startAngle, endAngle);
        this.progressCircle.lineTo(0, 0);
        this.progressCircle.fill({ color: 0x00ff00, alpha: 0.8 }); // Bright green with slight transparency

        // Add a border to make it more visible
        this.progressCircle.arc(0, 0, progressRadius, startAngle, endAngle);
        this.progressCircle.stroke({ width: 1, color: 0x00cc00, alpha: 1.0 });
        
        console.log(`[Building] Progress circle drawn with angles ${startAngle} to ${endAngle}, remaining: ${(remainingProgress * 100).toFixed(1)}%`);
      } catch (error) {
        console.error(`[Building] Error drawing progress circle:`, error);
      }
    } else {
      console.log(`[Building] Progress complete, not drawing circle`);
    }
  }

  /**
   * Update building (called every frame)
   */
  update() {
    super.update();

    // Don't produce resources while under construction
    if (!this.isUnderConstruction) {
      this.produce();
    }
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
      canUpgrade: this.canUpgrade(),
    };
  }

  /**
   * Destroy the building
   */
  destroy() {
    if (this.isDestroyed) return;

    // Emit building-specific destruction event
    EventBus.emit("building:destroyed", this);

    // Call parent destroy
    super.destroy();

    console.log(`[Building] ${this.type} destroyed`);
  }
}
