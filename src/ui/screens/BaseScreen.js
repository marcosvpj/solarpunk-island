import { gameColors, pixiColors } from '../../configs/colors.js';

/**
 * BaseScreen - Abstract base class for all game screens
 * 
 * Provides common functionality and utilities that all screens can use.
 * Enforces a consistent interface and lifecycle for screen management.
 */
export class BaseScreen {
    constructor(container, screenManager, app) {
        this.container = container;
        this.screenManager = screenManager;
        this.app = app;
        
        // Screen UI container
        this.screenContainer = new PIXI.Container();
        this.container.addChild(this.screenContainer);
        
        // Background container (separate for layering)
        this.backgroundContainer = new PIXI.Container();
        this.screenContainer.addChild(this.backgroundContainer);
        
        // UI elements container
        this.uiContainer = new PIXI.Container();
        this.screenContainer.addChild(this.uiContainer);
        
        // Screen state
        this.isVisible = false;
        this.isInitialized = false;
        
        // Mobile/responsive settings
        this.isMobile = this.detectMobile();
        this.responsiveScale = this.getResponsiveScale();
        
        console.log(`[BaseScreen] Created screen with responsive scale: ${this.responsiveScale}`);
    }
    
    /**
     * Initialize screen (override in subclasses)
     * Called once before first show
     * @param {Object} data - Optional initialization data
     */
    async init(data = {}) {
        if (this.isInitialized) return;
        
        this.createBackground();
        this.isInitialized = true;
        
        console.log(`[BaseScreen] Initialized screen`);
    }
    
    /**
     * Show screen (override in subclasses for custom behavior)
     * Called each time screen becomes active
     */
    show() {
        this.screenContainer.visible = true;
        this.isVisible = true;
        
        console.log(`[BaseScreen] Showing screen`);
    }
    
    /**
     * Hide screen (override in subclasses for custom behavior)
     * Called when screen becomes inactive
     */
    hide() {
        this.screenContainer.visible = false;
        this.isVisible = false;
        
        console.log(`[BaseScreen] Hiding screen`);
    }
    
    /**
     * Clean up screen resources (override in subclasses)
     * Called when screen is permanently removed
     */
    destroy() {
        if (this.screenContainer) {
            this.container.removeChild(this.screenContainer);
            this.screenContainer.destroy({ children: true });
            this.screenContainer = null;
        }
        
        console.log(`[BaseScreen] Destroyed screen`);
    }
    
    /**
     * Handle window resize (override in subclasses)
     */
    onResize() {
        // Update responsive scale
        this.responsiveScale = this.getResponsiveScale();
        
        // Recreate background to fit new size
        this.createBackground();
        
        console.log(`[BaseScreen] Resized screen, new scale: ${this.responsiveScale}`);
    }
    
    /**
     * Create screen background (can be overridden)
     */
    createBackground() {
        // Clear existing background
        this.backgroundContainer.removeChildren();
        
        // Create gradient background
        const background = new PIXI.Graphics();
        background.beginFill(pixiColors.background.primary);
        background.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        background.endFill();
        
        // Add subtle gradient overlay
        const gradient = new PIXI.Graphics();
        gradient.beginFill(pixiColors.background.secondary, 0.3);
        gradient.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        gradient.endFill();
        
        this.backgroundContainer.addChild(background);
        this.backgroundContainer.addChild(gradient);
    }
    
    /**
     * Create a standardized button
     * @param {string} text - Button text
     * @param {Object} position - {x, y} position
     * @param {Function} action - Click handler
     * @param {Object} options - Additional options
     * @returns {PIXI.Container} Button container
     */
    createButton(text, position, action, options = {}) {
        const buttonWidth = options.width || this.getResponsiveSize(200);
        const buttonHeight = options.height || this.getResponsiveSize(50);
        const fontSize = options.fontSize || this.getResponsiveFontSize(16);
        const color = options.color || pixiColors.background.interactive;
        const hoverColor = options.hoverColor || pixiColors.state.success;
        const textColor = options.textColor || gameColors.buttonText;
        
        const buttonContainer = new PIXI.Container();
        
        // Button background
        const buttonBg = new PIXI.Graphics();
        buttonBg.beginFill(color);
        buttonBg.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 8);
        buttonBg.endFill();
        buttonBg.interactive = true;
        buttonBg.buttonMode = true;
        
        // Button text
        const buttonText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: fontSize,
            fill: textColor,
            align: 'center',
            fontWeight: 'bold'
        });
        buttonText.anchor.set(0.5);
        buttonText.position.set(buttonWidth / 2, buttonHeight / 2);
        
        // Add hover effects
        buttonBg.on('pointerenter', () => {
            buttonBg.clear();
            buttonBg.beginFill(hoverColor);
            buttonBg.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 8);
            buttonBg.endFill();
        });
        
        buttonBg.on('pointerleave', () => {
            buttonBg.clear();
            buttonBg.beginFill(color);
            buttonBg.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 8);
            buttonBg.endFill();
        });
        
        // Click handler
        buttonBg.on('pointerdown', () => {
            if (action) action();
        });
        
        buttonContainer.addChild(buttonBg);
        buttonContainer.addChild(buttonText);
        buttonContainer.position.set(position.x, position.y);
        
        return buttonContainer;
    }
    
    /**
     * Create a title text element
     * @param {string} text - Title text
     * @param {Object} position - {x, y} position
     * @param {Object} options - Additional options
     * @returns {PIXI.Text} Title text element
     */
    createTitle(text, position, options = {}) {
        const fontSize = options.fontSize || this.getResponsiveFontSize(32);
        const color = options.color || gameColors.tooltipText;
        
        const title = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: fontSize,
            fill: color,
            align: 'center',
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 4,
            dropShadowDistance: 2
        });
        
        title.anchor.set(0.5);
        title.position.set(position.x, position.y);
        
        return title;
    }
    
    /**
     * Create descriptive text
     * @param {string} text - Text content
     * @param {Object} position - {x, y} position
     * @param {Object} options - Additional options
     * @returns {PIXI.Text} Text element
     */
    createText(text, position, options = {}) {
        const fontSize = options.fontSize || this.getResponsiveFontSize(14);
        const color = options.color || gameColors.buttonText;
        const maxWidth = options.maxWidth || this.getResponsiveSize(400);
        
        const textElement = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: fontSize,
            fill: color,
            align: options.align || 'center',
            wordWrap: true,
            wordWrapWidth: maxWidth
        });
        
        if (options.anchor !== undefined) {
            textElement.anchor.set(options.anchor);
        } else {
            textElement.anchor.set(0.5);
        }
        
        textElement.position.set(position.x, position.y);
        
        return textElement;
    }
    
    /**
     * Detect mobile device
     * @returns {boolean} True if mobile
     */
    detectMobile() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * Get responsive scale factor
     * @returns {number} Scale factor
     */
    getResponsiveScale() {
        const screenWidth = window.innerWidth;
        if (screenWidth <= 480) return 0.7; // Small phones
        if (screenWidth <= 768) return 0.8; // Tablets and larger phones
        return 1.0; // Desktop
    }
    
    /**
     * Get responsive font size
     * @param {number} baseFontSize - Base font size
     * @returns {number} Responsive font size
     */
    getResponsiveFontSize(baseFontSize) {
        return Math.floor(baseFontSize * this.responsiveScale);
    }
    
    /**
     * Get responsive size
     * @param {number} baseSize - Base size
     * @returns {number} Responsive size
     */
    getResponsiveSize(baseSize) {
        return Math.floor(baseSize * this.responsiveScale);
    }
    
    /**
     * Get screen center position
     * @returns {Object} {x, y} center position
     */
    getScreenCenter() {
        return {
            x: this.app.screen.width / 2,
            y: this.app.screen.height / 2
        };
    }
    
    /**
     * Navigate to another screen
     * @param {string} screenName - Target screen
     * @param {Object} options - Navigation options
     */
    navigateToScreen(screenName, options = {}) {
        this.screenManager.showScreen(screenName, options);
    }
}

export default BaseScreen;