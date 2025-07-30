// Import PIXI.js from local npm package
import * as PIXI from 'pixi.js';

// Import color palette
import { pixiColors, gameColors, colors } from './configs/colors.js';
import { UIManager } from './ui/UIManager.js';
import EventBus from './engine/EventBus.js';
import SceneManager from './engine/SceneManager.js';
import GameObjectFactory from './engine/GameObjectFactory.js';
import GameStateManager from './engine/GameStateManager.js';
import PlayerStorage from './engine/PlayerStorage.js';
import Hex from './Hex.js';
import { ZoomManager } from './ui/ZoomManager.js';
import { HEX_SIZE, HEX_HEIGHT, HEX_OFFSET_X, HEX_OFFSET_Y, HEX_SCALE_LEVELS, ASSETS } from './configs/config.js';

// Screen system imports
import ScreenManager from './ui/ScreenManager.js';
import StartScreen from './ui/screens/StartScreen.js';
import ProgressionScreen from './ui/screens/ProgressionScreen.js';
import GameScreen from './ui/screens/GameScreen.js';
import VictoryScreen from './ui/screens/VictoryScreen.js';
import DefeatScreen from './ui/screens/DefeatScreen.js';
import { SCREENS } from './configs/screens.js';

// Progression system imports
import ProgressionManager from './engine/ProgressionManager.js';

// New modular UI and container systems
import { isMobileDevice, getResponsiveScale, getResponsiveFontSize } from './ui/ResponsiveUtils.js';
import { initializeGameContainers as createGameContainers, getContainers } from './game/GameContainers.js';
import GameUI from './ui/GameUI.js';

// New building management systems
import { BuildingManager } from './buildings/engine/BuildingManager.js';
import { BuildingContextMenu } from './buildings/engine/BuildingContextMenu.js';
import { BuildingTooltip } from './buildings/engine/BuildingTooltip.js';

// Make PIXI globally available for other modules that expect it
window.PIXI = PIXI;

// Game state
let gameState = {
    speed: 1,
    isPaused: false,
    zoomLevel: 3, // Default to 2x scale
    selectedHex: null,
    hoverHex: null,
    gameObjects: [],
    resources: [],
    buildings: [],
    units: [],
    hexes: [],
    currentTurn: 1,
    timePerTurn: 30, // seconds per turn
    timeRemaining: 30,
    turnProgress: 0,
    pointerPosition: { x: 0, y: 0 }, // Track pointer position globally

    // Fuel system
    isGameOver: false,
    gameOverReason: null,
    fuelConsumptionBase: 3, // Base fuel consumption per turn
    fuelConsumptionPerBuilding: 0.5, // Additional fuel per building
    
    // Progression system
    currentLevelId: 1,
    isLevelActive: false,
    levelStartTime: null,
    campaignStartTime: null,
    
    // Mobile/responsive settings
    isMobile: isMobileDevice(),
    responsiveScale: getResponsiveScale(),
};

// Initialize PixiJS - PIXI 8.x requires async initialization
let app;

async function initializePixi() {
    console.log('[PIXI] Starting PIXI 8.x initialization...');
    
    try {
        app = new PIXI.Application();
        console.log('[PIXI] Application created');
        
        await app.init({
            backgroundColor: pixiColors.background.primary,
            resizeTo: document.getElementById('game-canvas'),
            antialias: false,
            resolution: window.devicePixelRatio || 1
        });
        console.log('[PIXI] Application initialized');
        
        document.getElementById('game-canvas').appendChild(app.canvas);
        console.log('[PIXI] Canvas added to DOM');
        
        // Load assets in PIXI 8.x
        try {
            console.log('[PIXI] Loading assets...');
            await PIXI.Assets.load(ASSETS);
            console.log('[PIXI] Assets loaded successfully');
        } catch (error) {
            console.warn('[PIXI] Some assets failed to load, continuing anyway:', error);
        }
        
        // Remove test rectangle now that PIXI is working
        console.log('[PIXI] PIXI 8.x initialization successful');
        
        // Start the application after PIXI is initialized
        setTimeout(() => {
            console.log('[PIXI] Starting application...');
            initializeApplication();
        }, 100);
        
    } catch (error) {
        console.error('[PIXI] Error during initialization:', error);
    }
}

// Initialize screen manager first
let screenManager;
let gameInitialized = false;

// Game containers and UI (managed by new modular systems)
let worldContainer;
let gridContainer;
let objectContainer;
let uiContainer;
let gameUI;

// Game managers (will be initialized when game starts)
let uiManager;
let sceneManager;
let gameStateManager;
let playerStorage;
let zoomManager;
let progressionManager;

// Building management systems
let buildingManager;
let buildingContextMenu;
let buildingTooltip;
// Make gameState globally accessible for drones and other systems
window.gameState = gameState;
console.log('[Init] Are they the same object?', playerStorage === window.playerStorage);

// Add event listeners to sync with legacy gameState arrays
EventBus.on('building:destroyed', (building) => {
    gameState.buildings = gameState.buildings.filter(b => b !== building);
});

EventBus.on('resource:destroyed', (resource) => {
    gameState.resources = gameState.resources.filter(r => r !== resource);
});

EventBus.on('unit:destroyed', (unit) => {
    gameState.units = gameState.units.filter(u => u !== unit);
});

// Add event listeners to update storage UI
EventBus.on('playerStorage:resourcesAdded', (data) => {
    // console.log('[UI] Storage resources added:', data);
    updateStorageInfo();
});
EventBus.on('playerStorage:resourcesRemoved', (data) => {
    // console.log('[UI] Storage resources removed:', data);
    updateStorageInfo();
});
EventBus.on('playerStorage:limitChanged', updateStorageInfo);
EventBus.on('storage:upgraded', updateStorageInfo);
EventBus.on('storage:destroyed', updateStorageInfo);

// Add progression event listeners
EventBus.on('progression:levelStarted', (data) => {
    gameState.isLevelActive = true;
    gameState.currentLevelId = data.levelId;
    gameState.levelStartTime = Date.now();
    console.log(`[GameState] Level ${data.levelId} started: ${data.level.name}`);
});

EventBus.on('progression:levelCompleted', (data) => {
    gameState.isLevelActive = false;
    console.log(`[GameState] Level ${data.levelId} completed!`);
    
    // Show victory screen
    setTimeout(() => {
        window.screenManager?.showScreen(SCREENS.VICTORY, data);
    }, 1500); // Slightly longer delay to enjoy the moment
});

EventBus.on('progression:levelFailed', (data) => {
    gameState.isLevelActive = false;
    console.log(`[GameState] Level ${data.levelId} failed`);
    
    // Show defeat screen
    setTimeout(() => {
        window.screenManager?.showScreen(SCREENS.DEFEAT, data);
    }, 1000); // Brief delay to see what happened
});

// Add UI event listeners
EventBus.on('ui:centerGrid', () => {
    centerGrid(); // Re-center grid when zoom changes
});

// Add listeners for immediate condition checking when buildings change
EventBus.on('refinery:productionModeChanged', () => {
    console.log('[Main] Refinery production mode changed, checking conditions...');
    checkProgressionConditions();
});

EventBus.on('factory:buildingCreated', () => {
    console.log('[Main] Building created, checking conditions...');
    checkProgressionConditions();
});

function createHex(q, r, i) {
    const hex = new Hex(q, r);
    hex.i = i
    // hexes.push(hex);
    gameState.hexes.push(hex);

    hex.assignRandomTerrain()

    hex.sprite.anchor.set(0.5);
    hex.sprite.scale.set(1); // Initialize with scale 1
    hex.sprite.position.set(hex.x, hex.y);

    // Add interactivity
    hex.sprite.interactive = true;
    hex.sprite.buttonMode = true;

    // Event handlers - store references for cleanup
    hex.hoverHandler = () => handleHexHover(hex);
    hex.hoverEndHandler = () => handleHexHoverEnd(hex);
    hex.clickHandler = (e) => handleHexClick(hex, e);

    hex.sprite.on('pointerover', hex.hoverHandler);
    hex.sprite.on('pointerout', hex.hoverEndHandler);
    hex.sprite.on('pointerdown', hex.clickHandler);

    gridContainer.addChild(hex.sprite);

    if (q == 0 && r == 0) {
        console.log('[Init] Adding initial building...');
        buildOnHex(hex, 'reactor');
    }
    return hex
}
// Create hex grid
function createHexGrid(radius) {
    radius = 5
    const hexes = [];
    let i = 0;

    let radioactiveCount = radius * 2
    let forestCount = radius * 1.5

    for (let q = -radius; q <= radius; q++) {
        let r1 = Math.max(-radius, -q - radius);
        let r2 = Math.min(radius, -q + radius);

        let radioactiveCluster = radius / 3;
        let forestCluster = radius / 4;

        for (let r = r1; r <= r2; r++) {
            let row = r + (q - (q&1)) / 2
            const hex = createHex(q,row,i++)
        
            if (q != 0 && r != 0 && hex.terrain == 'ground' && radioactiveCount > 0 && radioactiveCluster > 0) {
                if (Math.random() <= radius/radioactiveCount) {
                    addResourceToHex(hex, 'radioactive_waste', 500);
                    radioactiveCount--
                    radioactiveCluster--
                }
            }
            if (q != 0 && r != 0 && hex.terrain == 'grass' && forestCount > 0 && forestCluster > 0) {
                if (Math.random() <= radius/forestCount) {
                    addResourceToHex(hex, 'forest', 200);
                    forestCount--
                    forestCluster--
                }
            }

            hexes.push(hex);
        }
    }

    return hexes;
}

// Clean up hex grid - remove event listeners and sprites
function cleanupHexGrid() {
    gameState.hexes.forEach(hex => {
        if (hex.sprite) {
            // Remove event listeners
            hex.sprite.off('pointerover', hex.hoverHandler);
            hex.sprite.off('pointerout', hex.hoverEndHandler);
            hex.sprite.off('pointerdown', hex.clickHandler);

            // Remove from container and destroy sprite
            gridContainer.removeChild(hex.sprite);
            hex.sprite.destroy();
        }
    });

    // Clear hex array
    gameState.hexes.length = 0;

    // Clear hover and selection state
    gameState.hoverHex = null;
    gameState.selectedHex = null;
}

// Center the grid on the screen
function centerGrid() {
    if (gameState.hexes.length === 0) return;

    // Calculate grid bounds in world coordinates (before scaling)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    gameState.hexes.forEach(hex => {
        minX = Math.min(minX, hex.x);
        minY = Math.min(minY, hex.y);
        maxX = Math.max(maxX, hex.x);
        maxY = Math.max(maxY, hex.y);
    });

    // Calculate grid center in world coordinates  
    const gridCenterX = (minX + maxX) / 2;
    const gridCenterY = (minY + maxY) / 2;

    // Get current zoom scale
    const currentScale = HEX_SCALE_LEVELS[gameState.zoomLevel];

    // Calculate screen center, accounting for UI elements
    const screenCenterX = app.screen.width / 2;
    const screenCenterY = app.screen.height / 2;

    // Account for the scaling when positioning
    // The scaled grid center needs to be positioned at screen center
    const scaledGridCenterX = gridCenterX * currentScale;
    const scaledGridCenterY = gridCenterY * currentScale;

    // Position world container to center the scaled grid
    worldContainer.position.set(
        screenCenterX - scaledGridCenterX,
        screenCenterY - scaledGridCenterY
    );

    console.log(`[CenterGrid] Scale: ${currentScale}, Grid center: (${gridCenterX}, ${gridCenterY}), World position: (${worldContainer.position.x}, ${worldContainer.position.y})`);
}

// Animation state for smooth hex centering
let isAnimatingToHex = false;
let animationStartTime = 0;
let animationDuration = 300; // milliseconds
let animationStartPos = { x: 0, y: 0 };
let animationTargetPos = { x: 0, y: 0 };
let animationCallback = null;

// Easing function for smooth animation (ease-out cubic)
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

// Center a specific hex on the screen with smooth animation
function centerHexOnScreen(hex, callback = null) {
    if (!hex) return;
    
    // Get current zoom scale
    const currentScale = HEX_SCALE_LEVELS[gameState.zoomLevel];
    
    // Calculate screen center
    const screenCenterX = app.screen.width / 2;
    const screenCenterY = app.screen.height / 2 - 160;
    
    // Calculate where the world container should be positioned to center this hex
    const scaledHexX = hex.x * currentScale;
    const scaledHexY = hex.y * currentScale;
    
    const targetX = screenCenterX - scaledHexX;
    const targetY = screenCenterY - scaledHexY;
    
    // Store animation parameters
    animationStartPos.x = worldContainer.position.x;
    animationStartPos.y = worldContainer.position.y;
    animationTargetPos.x = targetX;
    animationTargetPos.y = targetY;
    animationStartTime = Date.now();
    animationCallback = callback;
    
    // Check if we need to animate or if we're already at the target
    const distance = Math.sqrt(
        Math.pow(targetX - worldContainer.position.x, 2) + 
        Math.pow(targetY - worldContainer.position.y, 2)
    );
    
    if (distance < 5) {
        // Already close enough, no animation needed
        worldContainer.position.set(targetX, targetY);
        if (callback) callback();
        console.log(`[CenterHex] Hex (${hex.q}, ${hex.r}) already centered, no animation needed`);
        return;
    }
    
    // Start animation
    isAnimatingToHex = true;
    console.log(`[CenterHex] Starting smooth animation to center hex (${hex.q}, ${hex.r})`);
}

// Update animation in the game loop
function updateHexCenterAnimation() {
    if (!isAnimatingToHex) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - animationStartTime;
    const progress = Math.min(elapsed / animationDuration, 1);
    
    // Apply easing
    const easedProgress = easeOutCubic(progress);
    
    // Interpolate position
    const currentX = animationStartPos.x + (animationTargetPos.x - animationStartPos.x) * easedProgress;
    const currentY = animationStartPos.y + (animationTargetPos.y - animationStartPos.y) * easedProgress;
    
    worldContainer.position.set(currentX, currentY);
    
    // Check if animation is complete
    if (progress >= 1) {
        isAnimatingToHex = false;
        worldContainer.position.set(animationTargetPos.x, animationTargetPos.y);
        
        if (animationCallback) {
            animationCallback();
            animationCallback = null;
        }
        
        console.log(`[CenterHex] Animation complete at world position (${worldContainer.position.x}, ${worldContainer.position.y})`);
    }
}

// Update hex visual appearance based on state priority
function updateHexVisuals(hex) {
    if (hex.isSelected) {
        hex.sprite.tint = gameColors.hexSelected; // Orange for selected
    } else if (hex.isHovered) {
        hex.sprite.tint = gameColors.hexHover; // Green for hovered
    } else {
        hex.sprite.tint = gameColors.hexNormal; // White for normal
    }
}

// Handle hex hover
function handleHexHover(hex) {
    if (gameState.isPaused) return;

    // Clear previous hover state
    if (gameState.hoverHex && gameState.hoverHex !== hex) {
        gameState.hoverHex.isHovered = false;
        updateHexVisuals(gameState.hoverHex);
    }

    gameState.hoverHex = hex;
    hex.isHovered = true;
    updateHexVisuals(hex);

    // Convert hex position to screen coordinates
    // hex.x and hex.y are already in grid coordinates, so we convert directly to screen
    const gridPos = new PIXI.Point(hex.x, hex.y);
    const worldPos = gridContainer.toGlobal(gridPos);
    const screenPos = app.stage.toLocal(worldPos);

    // Show tooltip using BuildingTooltip system
    const tooltipText = buildingTooltip.createHexTooltip(hex, gameState);

    uiManager.createTooltip(tooltipText, screenPos);
}

// Handle hex hover end
function handleHexHoverEnd(hex) {
    hex.isHovered = false;
    updateHexVisuals(hex);
    uiManager.clearTooltip();
    gameState.hoverHex = null;
}

// Handle hex click
function handleHexClick(hex, event) {
    // Don't process hex clicks if we were panning
    if (isPanning) {
        return;
    }
    
    // Stop event propagation to prevent global click handler from immediately closing the menu
    if (event && event.stopPropagation) {
        event.stopPropagation();
    }
    
    // Clear previous selection
    if (gameState.selectedHex) {
        gameState.selectedHex.isSelected = false;
        updateHexVisuals(gameState.selectedHex);
    }

    // Set new selection
    gameState.selectedHex = hex;
    hex.isSelected = true;
    updateHexVisuals(hex);

    // Center the clicked hex on screen with smooth animation, then show menu
    centerHexOnScreen(hex, () => {
        // This callback runs after animation completes
        
        // Since hex is now centered, menu can be positioned at screen center
        const screenPos = {
            x: app.screen.width / 2,
            y: app.screen.height / 2
        };

        // Create context menu based on hex content
        const menuOptions = [];
        
        createHexContextMenu(hex, menuOptions, screenPos);
    });
}

// Simplified context menu creation using BuildingContextMenu
function createHexContextMenu(hex, menuOptions, screenPos) {
    // Use the new simplified BuildingContextMenu system
    const contextMenuOptions = buildingContextMenu.createHexContextMenu(hex, gameState);
    
    // Merge with any existing menu options (for compatibility)
    menuOptions.push(...contextMenuOptions);
    
    uiManager.createContextMenu(menuOptions, screenPos);
}

// Build on hex - now uses BuildingManager
function buildOnHex(hex, type) {
    const building = buildingManager.buildOnHex(hex, type);
    if (!building) {
        console.error(`[Build] Failed to create ${type} building at (${hex.q}, ${hex.r})`);
    }
}

// Build drone near factory
function buildDroneNearFactory(factory) {
    // Find the first available hex near the factory
    const factoryHex = factory.hex;
    const nearbyHexes = getAdjacentHexes(factoryHex);

    // Try to find an empty hex for the drone
    for (const hex of nearbyHexes) {
        if (GameObjectFactory.canPlaceUnit(hex)) {
            const drone = GameObjectFactory.createUnit('drone', hex, factory);
            if (drone) {
                // Add to legacy gameState for compatibility with existing update loops
                gameState.units.push(drone);
                console.log(`[Build] Created drone at (${hex.q}, ${hex.r}) from factory at (${factoryHex.q}, ${factoryHex.r})`);
                return;
            }
        }
    }

    // If no adjacent hex is available, place on factory hex (drones can fly)
    const drone = GameObjectFactory.createUnit('drone', factoryHex, factory);
    if (drone) {
        gameState.units.push(drone);
        console.log(`[Build] Created drone at factory location (${factoryHex.q}, ${factoryHex.r})`);
    } else {
        console.error(`[Build] Failed to create drone near factory at (${factoryHex.q}, ${factoryHex.r})`);
    }
}

// Get adjacent hexes (6 neighbors in hexagonal grid)
function getAdjacentHexes(hex) {
    const directions = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];

    return directions
        .map(dir => gameState.hexes.find(h => h.q === hex.q + dir.q && h.r === hex.r + dir.r))
        .filter(h => h !== undefined);
}

// Demolish building - now uses BuildingManager
function demolishBuilding(hex) {
    const success = buildingManager.demolishBuilding(hex);
    if (!success) {
        console.error(`[Demolish] Failed to demolish building at (${hex.q}, ${hex.r})`);
    }
}

// Collect resource
function collectResource(hex) {
    if (!hex.resource) return;

    const collectionAmount = 10;

    // Check if we have storage space
    if (!playerStorage.canStore(collectionAmount)) {
        // Show storage full message
        console.log('[Collect] Storage full! Build more storage buildings.');

        // Create temporary UI feedback
        uiManager.createTooltip(
            'Storage Full!\nBuild storage buildings to increase capacity.',
            { x: hex.x, y: hex.y - 50 }
        );

        // Clear tooltip after delay
        setTimeout(() => uiManager.clearTooltip(), 2000);
        return;
    }

    // Collect from resource node
    const actualCollected = hex.resource.collect(collectionAmount);

    if (actualCollected > 0) {
        // Add to player storage
        console.log(`[Collect] About to add ${actualCollected} ${hex.resource.type} to storage`);
        const storedAmount = playerStorage.addResources(actualCollected, hex.resource.type);

        console.log(`[Collect] Collected ${storedAmount} ${hex.resource.type} from (${hex.q}, ${hex.r})`);

        // Show collection feedback
        if (storedAmount < actualCollected) {
            console.warn(`[Collect] Only stored ${storedAmount}/${actualCollected} due to storage limits`);
        }
    }
}

// Add resource to hex
function addResourceToHex(hex, type, amount) {
    if (hex.resource) return;

    const resource = GameObjectFactory.createResource(type, hex, amount);
    if (resource) {
        // Add to legacy gameState for compatibility with existing update loops
        gameState.resources.push(resource);
    }
}

// Setup event listeners (non-UI events - UI events are handled by GameUI)
function setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => {
        app.renderer.resize(document.getElementById('game-canvas').clientWidth,
            document.getElementById('game-canvas').clientHeight);
        centerGrid();
        
        // Notify GameUI of resize
        if (gameUI) {
            gameUI.onResize();
        }
    });

    // Track pointer position
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;
    app.stage.on('pointermove', (event) => {
        gameState.pointerPosition = event.global;
    });

    // Pan/drag functionality for mobile
    setupPanControls();
    
    // Global click handler for closing menus
    setupGlobalClickHandler();
}

// Pan control variables
let isPanning = false;
let panStartPosition = { x: 0, y: 0 };
let panStartWorldPosition = { x: 0, y: 0 };
let panThreshold = 10; // Minimum distance to start panning

// Setup pan/drag controls for mobile
function setupPanControls() {
    // Use worldContainer for panning to avoid conflicts with UI
    worldContainer.eventMode = 'static';
    worldContainer.hitArea = new PIXI.Rectangle(-10000, -10000, 20000, 20000); // Large hit area
    
    worldContainer.on('pointerdown', (event) => {
        // Only start panning if not clicking on a hex or UI element
        if (event.target === worldContainer) {
            isPanning = false; // Will become true once threshold is exceeded
            panStartPosition.x = event.global.x;
            panStartPosition.y = event.global.y;
            panStartWorldPosition.x = worldContainer.position.x;
            panStartWorldPosition.y = worldContainer.position.y;
            
            // Prevent default touch behavior
            event.preventDefault();
        }
    });
    
    worldContainer.on('pointermove', (event) => {
        if (panStartPosition.x !== 0 || panStartPosition.y !== 0) {
            const deltaX = event.global.x - panStartPosition.x;
            const deltaY = event.global.y - panStartPosition.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Start panning if we've moved beyond threshold
            if (!isPanning && distance > panThreshold) {
                isPanning = true;
                // Clear any existing tooltips when starting to pan
                uiManager.clearTooltip();
                uiManager.clearContextMenu();
            }
            
            if (isPanning) {
                worldContainer.position.x = panStartWorldPosition.x + deltaX;
                worldContainer.position.y = panStartWorldPosition.y + deltaY;
                
                // Prevent default touch behavior
                event.preventDefault();
            }
        }
    });
    
    worldContainer.on('pointerup', () => {
        isPanning = false;
        panStartPosition.x = 0;
        panStartPosition.y = 0;
    });
    
    worldContainer.on('pointerupoutside', () => {
        isPanning = false;
        panStartPosition.x = 0;
        panStartPosition.y = 0;
    });
}

// Global click handler to close menus when clicking outside
function setupGlobalClickHandler() {
    app.stage.on('pointerdown', (event) => {
        // If we have a context menu and clicked outside it, close it
        if (uiManager.contextMenu && !isClickInsideContextMenu(event.global)) {
            uiManager.clearContextMenu();
        }
    });
}

// Check if click is inside context menu
function isClickInsideContextMenu(globalPosition) {
    if (!uiManager.contextMenu) return false;
    
    const menuBounds = uiManager.contextMenu.getBounds();
    return globalPosition.x >= menuBounds.x && 
           globalPosition.x <= menuBounds.x + menuBounds.width &&
           globalPosition.y >= menuBounds.y && 
           globalPosition.y <= menuBounds.y + menuBounds.height;
}

// Update turn information UI
function updateTurnInfo() {
    if (gameUI) {
        gameUI.updateTurnInfo();
    }
}

// Process turn end events (fuel consumption, etc.)
function processTurnEnd() {
    if (gameState.isGameOver) return;

    // Process refinery production
    processRefineryProduction();

    // Calculate fuel consumption
    const buildingCount = gameState.buildings.length;
    const fuelConsumption = gameState.fuelConsumptionBase + (buildingCount * gameState.fuelConsumptionPerBuilding);

    console.log(`[Turn ${gameState.currentTurn}] Consuming ${fuelConsumption} fuel (${gameState.fuelConsumptionBase} base + ${buildingCount} buildings × ${gameState.fuelConsumptionPerBuilding})`);

    // Attempt to consume fuel
    const fuelConsumed = playerStorage.consumeFuel(fuelConsumption);

    if (!fuelConsumed) {
        // Game over - no fuel remaining
        triggerGameOver('fuel_depletion');
        return;
    }
    
    // Check progression conditions at turn end (before fuel warnings)
    if (progressionManager && gameState.isLevelActive) {
        checkProgressionConditions();
    }

    // Show turn summary
    const turnsRemaining = playerStorage.getTurnsRemaining(fuelConsumption);
    console.log(`[Turn ${gameState.currentTurn}] Fuel consumed: ${fuelConsumption}, Fuel remaining: ${playerStorage.getFuel()}, Turns remaining: ${turnsRemaining}`);

    // Recalculate turns remaining after production
    const updatedTurnsRemaining = playerStorage.getTurnsRemaining(fuelConsumption);

    // Warn player if low on fuel
    if (updatedTurnsRemaining <= 3 && updatedTurnsRemaining > 0) {
        console.warn(`[WARNING] Only ${updatedTurnsRemaining} turns of fuel remaining! Build refineries to convert waste to fuel.`);
    }

    // Emit turn end event for other systems
    EventBus.emit('game:turnEnded', {
        turn: gameState.currentTurn,
        fuelConsumed: fuelConsumption,
        fuelRemaining: playerStorage.getFuel(),
        turnsRemaining: updatedTurnsRemaining
    });
}

// Check progression conditions for current level
function checkProgressionConditions() {
    if (!progressionManager) {
        console.log('[Progression] ProgressionManager not initialized');
        return;
    }
    
    if (!gameState.isLevelActive) {
        console.log('[Progression] No active level to check');
        return;
    }
    
    console.log(`[Progression] Checking conditions for Level ${gameState.currentLevelId} on turn ${gameState.currentTurn}`);
    
    try {
        const results = progressionManager.checkConditions();
        
        // Log detailed condition check results
        console.log(`[Progression] Condition check results:`, {
            victory: results.victory,
            defeat: results.defeat,
            winProgress: results.winProgress,
            winConditions: results.winConditions?.length || 0,
            loseConditions: results.loseConditions?.length || 0
        });
        
        if (results.victory) {
            console.log('[Progression] 🎉 VICTORY ACHIEVED!');
        }
        
        if (results.defeat) {
            console.log('[Progression] 💀 DEFEAT TRIGGERED!');
        }
        
        // The ProgressionManager will handle victory/defeat events internally
        // and emit the appropriate events for screen transitions
        
    } catch (error) {
        console.error('[Progression] Error checking conditions:', error);
    }
}

// Process all refinery production at end of turn
function processRefineryProduction() {
    const refineries = gameState.buildings.filter(building => building.type === 'refinery');

    if (refineries.length === 0) {
        console.log('[Production] No refineries to process');
        return;
    }

    let totalProduction = {
        fuel: 0,
        materials: 0,
        wasteUsed: 0,
        activeRefineries: 0,
        inactiveRefineries: 0
    };

    console.log(`[Production] Processing ${refineries.length} refineries...`);

    refineries.forEach(refinery => {
        const result = refinery.processProduction();

        if (result.produced) {
            totalProduction[result.resourceType] += result.resourcesProduced;
            totalProduction.wasteUsed += result.wasteUsed;
            totalProduction.activeRefineries++;

            console.log(`[Production] Refinery at (${refinery.hex.q}, ${refinery.hex.r}) produced ${result.resourcesProduced} ${result.resourceType}`);
        } else {
            totalProduction.inactiveRefineries++;

            if (result.reason === 'insufficient_waste') {
                console.log(`[Production] Refinery at (${refinery.hex.q}, ${refinery.hex.r}) idle - need ${result.needed} waste, have ${result.available}`);
            } else if (result.reason === 'inactive') {
                console.log(`[Production] Refinery at (${refinery.hex.q}, ${refinery.hex.r}) inactive - no production mode set`);
            }
        }
    });

    // Show production summary
    if (totalProduction.activeRefineries > 0) {
        console.log(`[Production Summary] ${totalProduction.activeRefineries} active refineries produced:`);
        if (totalProduction.fuel > 0) {
            console.log(`[Production Summary] - ${totalProduction.fuel} fuel`);
        }
        if (totalProduction.materials > 0) {
            console.log(`[Production Summary] - ${totalProduction.materials} materials`);
        }
        console.log(`[Production Summary] - Used ${totalProduction.wasteUsed} radioactive waste`);
    }

    if (totalProduction.inactiveRefineries > 0) {
        console.log(`[Production Summary] ${totalProduction.inactiveRefineries} refineries inactive`);
    }

    // Emit production summary event
    EventBus.emit('game:productionCompleted', {
        turn: gameState.currentTurn,
        totalProduction: totalProduction,
        refineryCount: refineries.length
    });
}

// Trigger game over
function triggerGameOver(reason) {
    gameState.isGameOver = true;
    gameState.gameOverReason = reason;
    gameState.isPaused = true;

    console.log(`[GAME OVER] Reason: ${reason}`);

    // Show game over message
    const reasonText = reason === 'fuel_depletion' ?
        'Your island has fallen! You ran out of fuel to keep it flying.' :
        'Game Over!';

    // Create simple game over display (temporary - will be improved later)
    uiManager.createTooltip(
        `GAME OVER\n\n${reasonText}\n\nTurn: ${gameState.currentTurn}\n\nPress F5 to restart`,
        { x: app.screen.width / 2, y: app.screen.height / 2 }
    );

    // Emit game over event
    EventBus.emit('game:gameOver', {
        reason: reason,
        turn: gameState.currentTurn,
        finalFuel: playerStorage.getFuel(),
        finalMaterials: playerStorage.getMaterials(),
        buildingCount: gameState.buildings.length
    });
}

// Update storage info UI
function updateStorageInfo() {
    if (gameUI) {
        gameUI.updateStorageInfo();
    }
}

// Old initGame function removed - now handled by screen system

// Main game loop
function gameLoop(ticker) {
    const delta = ticker.deltaTime
    if (gameState.isPaused || gameState.isGameOver) return;

    // Update based on game speed
    const scaledDelta = delta * gameState.speed;

    // Update turn timer
    if (!gameState.isPaused) {
        gameState.timeRemaining -= scaledDelta / 60; // delta is in frames, 60 frames = 1 second
        gameState.turnProgress = 1 - (gameState.timeRemaining / gameState.timePerTurn);

        if (gameState.timeRemaining <= 0) {
            // Advance to next turn
            processTurnEnd();
            gameState.currentTurn++;
            gameState.timeRemaining = gameState.timePerTurn;
            gameState.turnProgress = 0;
            
            // Check progression conditions after turn advance
            checkProgressionConditions();
        }

        updateTurnInfo();
        updateStorageInfo();
    }

    // Update hex centering animation
    updateHexCenterAnimation();

    // Update game objects
    gameState.buildings.forEach(building => building.update());
    gameState.units.forEach(unit => unit.update(scaledDelta / 60)); // Convert PIXI delta to seconds

    // Removed polling-based hover detection - now handled by event listeners only
}

// Find hex at screen position - OPTIMIZED VERSION (not currently used)
// This function is kept for potential future use, but is no longer needed
// since we switched to event-driven hover detection
function findHexAtPosition(screenX, screenY) {
    // Convert screen coordinates to grid coordinates
    const worldPos = worldContainer.toLocal(new PIXI.Point(screenX, screenY));
    const gridPos = gridContainer.toLocal(new PIXI.Point(worldPos.x, worldPos.y));

    // Convert pixel coordinates to axial coordinates using hexagonal math
    // This is much more efficient than checking every hex
    const size = HEX_SIZE;
    const q = (2 / 3 * gridPos.x) / size;
    const r = (-1 / 3 * gridPos.x + Math.sqrt(3) / 3 * gridPos.y) / size;

    // Round to nearest integer axial coordinates
    const axialQ = Math.round(q);
    const axialR = Math.round(r);

    // Find hex with matching axial coordinates
    return gameState.hexes.find(hex => hex.q === axialQ && hex.r === axialR) || null;
}

// Initialize game containers (called when GameScreen initializes)
function initializeGameContainers() {
    if (gameInitialized) return;
    
    // Use new modular container system
    const containers = createGameContainers(app);
    
    // Get container references for compatibility
    worldContainer = containers.worldContainer;
    gridContainer = containers.gridContainer;
    objectContainer = containers.objectContainer;
    uiContainer = containers.uiContainer;
    
    console.log('[Init] Game containers created using modular system');
}

// Initialize game UI elements using new modular system
function initializeGameUI() {
    // Create and initialize the new GameUI system
    gameUI = new GameUI(app);
    gameUI.init(gameState, playerStorage, zoomManager);
    
    console.log('[Init] Game UI created using modular GameUI system');
}

// Initialize game (called from GameScreen)
function initGame() {
    if (gameInitialized) return;
    
    console.log('[Init] Starting game initialization...');
    
    // Initialize containers first
    initializeGameContainers();
    
    // Initialize managers
    uiManager = new UIManager(uiContainer, app);
    sceneManager = new SceneManager(objectContainer);
    gameStateManager = new GameStateManager();
    playerStorage = new PlayerStorage(gameStateManager);
    zoomManager = new ZoomManager(gridContainer, objectContainer);
    
    // Initialize UI system after managers are ready
    initializeGameUI();
    
    // Initialize progression manager
    progressionManager = new ProgressionManager(gameState, playerStorage);
    
    // Initialize building management systems
    buildingManager = new BuildingManager(gameState);
    buildingContextMenu = new BuildingContextMenu(buildingManager);
    buildingTooltip = new BuildingTooltip();
    
    // Make managers globally accessible
    window.GameObjectFactory = GameObjectFactory; // Make GameObjectFactory globally available for DroneFactory
    window.playerStorage = playerStorage;
    window.progressionManager = progressionManager;
    window.buildingManager = buildingManager;
    window.buildingContextMenu = buildingContextMenu;
    window.buildingTooltip = buildingTooltip;
    
    // Expose legacy functions for compatibility with BuildingContextMenu fallbacks
    window.buildDroneNearFactory = buildDroneNearFactory;
    window.collectResource = collectResource;
    window.updateHexVisuals = updateHexVisuals;
    
    const hexes = createHexGrid(2);
    console.log(`[Init] Created ${hexes.length} hexes`);
    
    // Center the grid
    centerGrid();
    console.log('[Init] Grid centered');

    // // Add some resources for demonstration
    // console.log('[Init] Adding initial resources...');
    // addResourceToHex(hexes[12], 'radioactive_waste', 500);
    // addResourceToHex(hexes[18], 'radioactive_waste', 500);
    // addResourceToHex(hexes[24], 'radioactive_waste', 500);

    // // Add a building for demonstration
    // console.log('[Init] Adding initial building...');
    // buildOnHex(hexes[45], 'reactor');

    // Setup event listeners
    setupEventListeners();
    console.log('[Init] Event listeners set up');

    // Start the game loop
    app.ticker.add(gameLoop);
    console.log('[Init] Game loop started');

    // Apply initial zoom
    zoomManager.applyZoom();

    // Game objects factory is ready (all static methods, no initialization needed)
    console.log('[Init] Game objects factory ready');

    // Initialize UI displays
    updateStorageInfo();
    
    // Start Level 1 automatically
    if (progressionManager) {
        setTimeout(() => {
            console.log('[Init] Starting Level 1...');
            progressionManager.startLevel(1);
        }, 100); // Small delay to ensure all systems are ready
    }

    gameInitialized = true;
    console.log('[Init] Game initialization complete!');
}

// Initialize screen system and start the application
function initializeApplication() {
    console.log('[App] Initializing application...');
    
    // Create screen manager
    screenManager = new ScreenManager(app.stage, app);
    
    // Register all screens
    screenManager.registerScreen(SCREENS.START, StartScreen);
    screenManager.registerScreen(SCREENS.PROGRESSION, ProgressionScreen);
    screenManager.registerScreen(SCREENS.GAME, GameScreen);
    screenManager.registerScreen(SCREENS.VICTORY, VictoryScreen);
    screenManager.registerScreen(SCREENS.DEFEAT, DefeatScreen);
    
    // Make screen manager and initGame globally accessible
    window.screenManager = screenManager;
    window.initGame = initGame;
    
    // Handle window resize for screen manager
    window.addEventListener('resize', () => {
        app.renderer.resize(
            document.getElementById('game-canvas').clientWidth,
            document.getElementById('game-canvas').clientHeight
        );
        screenManager.onResize();
    });
    
    // Start with the start screen
    screenManager.showScreen(SCREENS.START);
    
    console.log('[App] Application initialized, showing start screen');
}

// Start the application with PIXI 8.x async initialization
// Make sure DOM is loaded first
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePixi);
} else {
    initializePixi();
}