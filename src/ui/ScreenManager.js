import EventBus from '../engine/EventBus.js';
import { SCREENS, SCREEN_TRANSITIONS, SCREEN_CONFIG, DEFAULT_TRANSITION_DURATION } from '../configs/screens.js';

/**
 * ScreenManager - Core screen management system
 * 
 * Manages transitions between different game screens (Start, Game, Progression, etc.)
 * Provides a clean, modular way to add new screens and handle navigation.
 */
export class ScreenManager {
    constructor(appStage, pixiApp) {
        this.appStage = appStage;
        this.app = pixiApp;
        this.screens = new Map(); // Registered screen classes
        this.screenInstances = new Map(); // Active screen instances
        this.currentScreen = null;
        this.transitioning = false;
        
        // Create screen container
        this.screenContainer = new PIXI.Container();
        this.appStage.addChild(this.screenContainer);
        
        // Transition overlay for smooth screen changes
        this.transitionOverlay = new PIXI.Graphics();
        this.transitionOverlay.visible = false;
        this.appStage.addChild(this.transitionOverlay);
        
        console.log('[ScreenManager] Initialized screen management system');
    }
    
    /**
     * Register a new screen class
     * @param {string} screenName - Screen identifier from SCREENS config
     * @param {class} ScreenClass - Screen class constructor
     */
    registerScreen(screenName, ScreenClass) {
        this.screens.set(screenName, ScreenClass);
        console.log(`[ScreenManager] Registered screen: ${screenName}`);
    }
    
    /**
     * Show a specific screen with optional transition
     * @param {string} screenName - Screen to show
     * @param {Object} options - Optional transition and data options
     */
    async showScreen(screenName, options = {}) {
        if (this.transitioning) {
            console.warn(`[ScreenManager] Already transitioning, ignoring request for ${screenName}`);
            return;
        }
        
        if (!this.screens.has(screenName)) {
            console.error(`[ScreenManager] Screen not registered: ${screenName}`);
            return;
        }
        
        const config = SCREEN_CONFIG[screenName] || {};
        const transitionType = options.transition || config.transition || SCREEN_TRANSITIONS.FADE;
        const duration = options.duration || config.transitionDuration || DEFAULT_TRANSITION_DURATION;
        
        console.log(`[ScreenManager] Showing screen: ${screenName} with transition: ${transitionType}`);
        
        this.transitioning = true;
        
        // Start transition out effect
        if (this.currentScreen && transitionType !== SCREEN_TRANSITIONS.INSTANT) {
            await this.playTransitionOut(transitionType, duration / 2);
        }
        
        // Hide current screen
        if (this.currentScreen) {
            await this.hideCurrentScreen();
        }
        
        // Create and show new screen
        await this.createAndShowScreen(screenName, options.data);
        
        // Ensure screen containers are always on top
        this.ensureScreenContainersOnTop();
        
        // Play transition in effect
        if (transitionType !== SCREEN_TRANSITIONS.INSTANT) {
            await this.playTransitionIn(transitionType, duration / 2);
        }
        
        this.currentScreen = screenName;
        this.transitioning = false;
        
        // Emit screen change event
        EventBus.emit('screen:changed', { 
            screen: screenName, 
            previousScreen: this.currentScreen 
        });
        
        console.log(`[ScreenManager] Successfully shown screen: ${screenName}`);
    }
    
    /**
     * Hide current screen and clean up
     */
    async hideCurrentScreen() {
        if (!this.currentScreen) return;
        
        const screenInstance = this.screenInstances.get(this.currentScreen);
        if (screenInstance) {
            screenInstance.hide();
            screenInstance.destroy();
            this.screenInstances.delete(this.currentScreen);
        }
        
        this.currentScreen = null;
    }
    
    /**
     * Create and initialize a screen instance
     * @param {string} screenName - Screen to create
     * @param {Object} data - Optional data to pass to screen
     */
    async createAndShowScreen(screenName, data = {}) {
        const ScreenClass = this.screens.get(screenName);
        const screenInstance = new ScreenClass(this.screenContainer, this, this.app);
        
        // Store instance for cleanup
        this.screenInstances.set(screenName, screenInstance);
        
        // Initialize and show screen
        if (screenInstance.init) {
            await screenInstance.init(data);
        }
        
        screenInstance.show();
        
        return screenInstance;
    }
    
    /**
     * Play transition out effect (screen going away)
     * @param {string} transitionType - Type of transition
     * @param {number} duration - Duration in milliseconds
     */
    async playTransitionOut(transitionType, duration) {
        return new Promise((resolve) => {
            switch (transitionType) {
                case SCREEN_TRANSITIONS.FADE:
                    this.fadeOut(duration, resolve);
                    break;
                default:
                    resolve();
            }
        });
    }
    
    /**
     * Play transition in effect (new screen appearing)
     * @param {string} transitionType - Type of transition
     * @param {number} duration - Duration in milliseconds
     */
    async playTransitionIn(transitionType, duration) {
        return new Promise((resolve) => {
            switch (transitionType) {
                case SCREEN_TRANSITIONS.FADE:
                    this.fadeIn(duration, resolve);
                    break;
                default:
                    resolve();
            }
        });
    }
    
    /**
     * Fade out transition effect
     * @param {number} duration - Duration in milliseconds
     * @param {Function} callback - Callback when complete
     */
    fadeOut(duration, callback) {
        this.transitionOverlay.clear();
        this.transitionOverlay.rect(0, 0, this.app.screen.width, this.app.screen.height);
        this.transitionOverlay.fill({color: 0x000000, alpha: 0});
        this.transitionOverlay.visible = true;
        
        // Animate alpha from 0 to 1
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.transitionOverlay.alpha = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                callback();
            }
        };
        
        animate();
    }
    
    /**
     * Fade in transition effect
     * @param {number} duration - Duration in milliseconds
     * @param {Function} callback - Callback when complete
     */
    fadeIn(duration, callback) {
        // Animate alpha from 1 to 0
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.transitionOverlay.alpha = 1 - progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.transitionOverlay.visible = false;
                callback();
            }
        };
        
        animate();
    }
    
    /**
     * Get current screen name
     * @returns {string|null} Current screen name
     */
    getCurrentScreen() {
        return this.currentScreen;
    }
    
    /**
     * Get screen instance by name
     * @param {string} screenName - Screen name
     * @returns {Object|null} Screen instance
     */
    getScreenInstance(screenName) {
        return this.screenInstances.get(screenName) || null;
    }
    
    /**
     * Check if currently transitioning
     * @returns {boolean} True if transitioning
     */
    isTransitioning() {
        return this.transitioning;
    }
    
    /**
     * Handle window resize - notify all screen instances
     */
    onResize() {
        // Update transition overlay size
        this.transitionOverlay.clear();
        this.transitionOverlay.rect(0, 0, this.app.screen.width, this.app.screen.height);
        this.transitionOverlay.fill({color: 0x000000, alpha: 1});
        
        // Notify current screen instance
        const currentInstance = this.screenInstances.get(this.currentScreen);
        if (currentInstance && currentInstance.onResize) {
            currentInstance.onResize();
        }
    }
    
    /**
     * Ensure screen containers are always on top of other elements
     */
    ensureScreenContainersOnTop() {
        // Move screen container to top
        if (this.screenContainer && this.screenContainer.parent) {
            this.appStage.removeChild(this.screenContainer);
            this.appStage.addChild(this.screenContainer);
        }
        
        // Move transition overlay to top  
        if (this.transitionOverlay && this.transitionOverlay.parent) {
            this.appStage.removeChild(this.transitionOverlay);
            this.appStage.addChild(this.transitionOverlay);
        }
    }

    /**
     * Clean up screen manager
     */
    destroy() {
        // Clean up all screen instances
        for (const [screenName, instance] of this.screenInstances) {
            instance.destroy();
        }
        
        this.screenInstances.clear();
        this.screens.clear();
        
        // Clean up PIXI objects
        if (this.screenContainer) {
            this.appStage.removeChild(this.screenContainer);
            this.screenContainer.destroy();
        }
        
        if (this.transitionOverlay) {
            this.appStage.removeChild(this.transitionOverlay);
            this.transitionOverlay.destroy();
        }
        
        console.log('[ScreenManager] Destroyed screen management system');
    }
}

export default ScreenManager;