import BaseScreen from './BaseScreen.js';
import { SCREENS } from '../../configs/screens.js';
import EventBus from '../../engine/EventBus.js';

/**
 * GameScreen - Main game screen wrapper
 * 
 * Wraps the existing game UI and logic, providing a clean interface
 * for the screen management system while maintaining all game functionality.
 */
export class GameScreen extends BaseScreen {
    constructor(container, screenManager, app) {
        super(container, screenManager, app);
        
        this.gameInitialized = false;
        this.isNewGame = true;
        this.gameData = null;
        
        // Game pause overlay (future enhancement)
        this.pauseOverlay = null;
        this.isPaused = false;
    }
    
    /**
     * Initialize the game screen
     * @param {Object} data - Game initialization data
     */
    async init(data = {}) {
        // Don't call super.init() as we don't want the standard background
        // The game has its own background and containers
        
        this.isNewGame = data.isNewGame !== false; // Default to new game
        this.gameData = data.gameData || {};
        
        console.log(`[GameScreen] Initializing game screen (new game: ${this.isNewGame})`);
        
        // Initialize game if this is the first time
        if (!this.gameInitialized) {
            await this.initializeGame();
            this.gameInitialized = true;
        }
        
        // Setup game event listeners
        this.setupEventListeners();
        
        this.isInitialized = true;
        
        console.log('[GameScreen] Game screen initialized');
    }
    
    /**
     * Show the game screen
     */
    show() {
        // Show the screen container (but we won't use standard background)
        this.screenContainer.visible = true;
        this.isVisible = true;
        
        // Make sure game containers are visible
        this.showGameUI();
        
        // Resume game if it was paused due to screen switching
        this.resumeGame();
        
        console.log('[GameScreen] Game screen shown');
    }
    
    /**
     * Hide the game screen
     */
    hide() {
        // Pause game when switching screens
        this.pauseGame();
        
        super.hide();
        
        console.log('[GameScreen] Game screen hidden');
    }
    
    /**
     * Initialize the game (delegate to main.js game initialization)
     */
    async initializeGame() {
        // Call the main game initialization function from main.js
        if (window.initGame) {
            window.initGame();
        }
        
        // Get references to game containers from main.js
        if (window.gameContainers) {
            this.gameContainers = window.gameContainers;
        }
        
        // Set up pause menu functionality
        this.createPauseOverlay();
        
        console.log('[GameScreen] Game initialization delegated to main.js');
    }
    
    /**
     * Create pause overlay (future enhancement)
     */
    createPauseOverlay() {
        // Create pause overlay that can be shown/hidden
        this.pauseOverlay = new PIXI.Container();
        this.pauseOverlay.visible = false;
        
        // Semi-transparent background
        const pauseBg = new PIXI.Graphics();
        pauseBg.beginFill(0x000000, 0.7);
        pauseBg.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        pauseBg.endFill();
        pauseBg.interactive = true; // Prevent clicks from going through
        
        // Pause menu container
        const pauseMenu = new PIXI.Container();
        pauseMenu.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
        
        // Pause title
        const pauseTitle = this.createTitle('Game Paused', { x: 0, y: -100 });
        pauseMenu.addChild(pauseTitle);
        
        // Resume button
        const resumeButton = this.createButton(
            'Resume',
            { x: -100, y: -20 },
            () => this.resumeGame(),
            { width: 200, height: 50 }
        );
        pauseMenu.addChild(resumeButton);
        
        // Settings button (future)
        const settingsButton = this.createButton(
            'Settings',
            { x: -100, y: 40 },
            () => this.openGameSettings(),
            { width: 200, height: 50 }
        );
        pauseMenu.addChild(settingsButton);
        
        // Main menu button
        const mainMenuButton = this.createButton(
            'Main Menu',
            { x: -100, y: 100 },
            () => this.returnToMainMenu(),
            { width: 200, height: 50 }
        );
        pauseMenu.addChild(mainMenuButton);
        
        this.pauseOverlay.addChild(pauseBg);
        this.pauseOverlay.addChild(pauseMenu);
        this.uiContainer.addChild(this.pauseOverlay);
    }
    
    /**
     * Setup event listeners for game events
     */
    setupEventListeners() {
        // Listen for game over events
        EventBus.on('game:over', (data) => this.handleGameOver(data));
        
        // Listen for pause requests
        EventBus.on('game:pause', () => this.showPauseMenu());
        EventBus.on('game:resume', () => this.hidePauseMenu());
        
        // Listen for escape key to pause (future enhancement)
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isVisible) {
                this.togglePause();
            }
        });
        
        console.log('[GameScreen] Event listeners setup');
    }
    
    /**
     * Show game UI elements
     */
    showGameUI() {
        // Ensure game containers are visible
        // This assumes the game containers are managed in main.js
        if (window.gameContainers) {
            const { worldContainer, uiContainer } = window.gameContainers;
            if (worldContainer) worldContainer.visible = true;
            if (uiContainer) uiContainer.visible = true;
        }
    }
    
    /**
     * Pause the game
     */
    pauseGame() {
        if (window.gameState) {
            window.gameState.isPaused = true;
        }
        
        EventBus.emit('game:paused');
        this.isPaused = true;
        
        console.log('[GameScreen] Game paused');
    }
    
    /**
     * Resume the game
     */
    resumeGame() {
        if (window.gameState) {
            window.gameState.isPaused = false;
        }
        
        this.hidePauseMenu();
        EventBus.emit('game:resumed');
        this.isPaused = false;
        
        console.log('[GameScreen] Game resumed');
    }
    
    /**
     * Toggle pause state
     */
    togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.showPauseMenu();
        }
    }
    
    /**
     * Show pause menu overlay
     */
    showPauseMenu() {
        this.pauseGame();
        
        if (this.pauseOverlay) {
            this.pauseOverlay.visible = true;
        }
        
        console.log('[GameScreen] Pause menu shown');
    }
    
    /**
     * Hide pause menu overlay
     */
    hidePauseMenu() {
        if (this.pauseOverlay) {
            this.pauseOverlay.visible = false;
        }
        
        console.log('[GameScreen] Pause menu hidden');
    }
    
    /**
     * Handle game over event
     * @param {Object} data - Game over data
     */
    handleGameOver(data) {
        console.log('[GameScreen] Game over:', data);
        
        // Future: Show game over screen, statistics, restart options
        // For now, just log the event
        
        // Could navigate to a game over screen:
        // this.navigateToScreen(SCREENS.GAME_OVER, { data });
    }
    
    /**
     * Open game settings (future implementation)
     */
    openGameSettings() {
        console.log('[GameScreen] Game settings not implemented yet');
        
        // Future: Open settings overlay or navigate to settings screen
        // this.navigateToScreen(SCREENS.SETTINGS, { returnScreen: SCREENS.GAME });
    }
    
    /**
     * Return to main menu
     */
    returnToMainMenu() {
        console.log('[GameScreen] Returning to main menu');
        
        // Future: Prompt to save game
        // const shouldSave = confirm('Save your progress?');
        // if (shouldSave) SaveSystem.saveGame(gameState);
        
        this.navigateToScreen(SCREENS.START);
    }
    
    /**
     * Handle screen resize
     */
    onResize() {
        // Update responsive settings
        this.responsiveScale = this.getResponsiveScale();
        
        // Recreate pause overlay for new screen size
        if (this.pauseOverlay) {
            this.uiContainer.removeChild(this.pauseOverlay);
            this.createPauseOverlay();
        }
        
        // The main game UI resize is handled in main.js
        console.log('[GameScreen] Screen resized');
    }
    
    /**
     * Create background (override to not create standard background)
     */
    createBackground() {
        // Don't create background - game has its own background system
    }
    
    /**
     * Get current game state data for saving (future implementation)
     * @returns {Object} Current game state
     */
    getGameStateData() {
        // Future: Extract current game state for saving
        if (window.gameState && window.playerStorage) {
            return {
                currentTurn: window.gameState.currentTurn,
                fuel: window.playerStorage.getFuel(),
                materials: window.playerStorage.getMaterials(),
                waste: window.playerStorage.getWaste(),
                buildings: window.gameState.buildings.length,
                // Add more state data as needed
            };
        }
        
        return {};
    }
    
    /**
     * Clean up game screen
     */
    destroy() {
        // Clean up event listeners
        EventBus.off('game:over');
        EventBus.off('game:pause');
        EventBus.off('game:resume');
        
        // The main game cleanup is handled in main.js
        // We just clean up our screen-specific elements
        
        super.destroy();
        
        console.log('[GameScreen] Game screen destroyed');
    }
}

export default GameScreen;