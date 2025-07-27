// Import color palette
import { pixiColors, gameColors } from './colors.js';
import { UIManager } from './UIManager.js';
import EventBus from './EventBus.js';
import SceneManager from './SceneManager.js';
import GameObjectFactory from './GameObjectFactory.js';
import GameStateManager from './GameStateManager.js';
import PlayerStorage from './PlayerStorage.js';

// Game constants and configuration
const HEX_SIZE = 32; // Base hex size (matches sprite width)
const HEX_HEIGHT = 28; // Height of the hex sprite
const HEX_OFFSET_X = HEX_SIZE * 0.75;
const HEX_OFFSET_Y = HEX_HEIGHT;
const HEX_SCALE_LEVELS = [1, 1.5, 2, 2.5, 3];

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
    pointerPosition: {x: 0, y: 0}, // Track pointer position globally
    
    // Fuel system
    isGameOver: false,
    gameOverReason: null,
    fuelConsumptionBase: 3, // Base fuel consumption per turn
    fuelConsumptionPerBuilding: 0.5, // Additional fuel per building
};

// Initialize PixiJS
const app = new PIXI.Application({
    backgroundColor: pixiColors.background.primary,
    resizeTo: document.getElementById('game-canvas'),
    antialias: false,
    resolution: window.devicePixelRatio || 1
});
document.getElementById('game-canvas').appendChild(app.view);

// Create containers for different layers
const worldContainer = new PIXI.Container();
const gridContainer = new PIXI.Container();
const objectContainer = new PIXI.Container();
const uiContainer = new PIXI.Container();

app.stage.addChild(worldContainer);
worldContainer.addChild(gridContainer);
worldContainer.addChild(objectContainer);
app.stage.addChild(uiContainer);

// Turn info UI elements
const turnInfo = new PIXI.Container();
turnInfo.position.set(20, 20);
uiContainer.addChild(turnInfo);

const turnText = new PIXI.Text(`Turn: ${gameState.currentTurn}`, {
    fontFamily: 'Arial',
    fontSize: 20,
    fill: gameColors.tooltipText,
    fontWeight: 'bold'
});
turnInfo.addChild(turnText);

const timerText = new PIXI.Text(`Next in: ${gameState.timeRemaining}s`, {
    fontFamily: 'Arial',
    fontSize: 16,
    fill: gameColors.buttonText
});
timerText.position.set(0, 25);
turnInfo.addChild(timerText);

const progressBar = new PIXI.Graphics();
progressBar.position.set(0, 50);
turnInfo.addChild(progressBar);

// Resource info UI
const fuelText = new PIXI.Text('Fuel: 15', {
    fontFamily: 'Arial',
    fontSize: 16,
    fill: gameColors.tooltipText
});
fuelText.position.set(0, 65);
turnInfo.addChild(fuelText);

const materialsText = new PIXI.Text('Materials: 5', {
    fontFamily: 'Arial',
    fontSize: 16,
    fill: gameColors.tooltipText
});
materialsText.position.set(0, 85);
turnInfo.addChild(materialsText);

const wasteText = new PIXI.Text('Waste: 0', {
    fontFamily: 'Arial',
    fontSize: 16,
    fill: gameColors.tooltipText
});
wasteText.position.set(0, 105);
turnInfo.addChild(wasteText);

const turnsRemainingText = new PIXI.Text('Turns: ∞', {
    fontFamily: 'Arial',
    fontSize: 16,
    fill: gameColors.buttonText
});
turnsRemainingText.position.set(0, 125);
turnInfo.addChild(turnsRemainingText);

// Hex grid data structure
class Hex {
    constructor(q, r) {
        this.q = q; // Column
        this.r = r; // Row
        this.s = -q - r; // Cube coordinate
        this.container = new PIXI.Container();
        this.sprite = null;
        this.building = null;
        this.resource = null;
        this.unit = null;
        this.isHovered = false;
        this.isSelected = false;
        this.eventData = null;

        // Calculate position relative to grid center
        this.x = HEX_OFFSET_X * q;
        this.y = HEX_HEIGHT * r + (q % 2 === 0 ? 0 : HEX_HEIGHT / 2);
    }

    getPixelPosition() {
        return { x: this.x, y: this.y };
    }
}



// Initialize managers
const uiManager = new UIManager(uiContainer, app);
const sceneManager = new SceneManager(objectContainer);
const gameStateManager = new GameStateManager();
const playerStorage = new PlayerStorage(gameStateManager);

// Make gameState and playerStorage globally accessible for drones and other systems
window.gameState = gameState;
window.playerStorage = playerStorage;

// Debug: verify the references are the same
console.log('[Init] Local playerStorage:', playerStorage);
console.log('[Init] Window playerStorage:', window.playerStorage);
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

// Create hex grid
function createHexGrid(radius) {
    const hexes = [];

    for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius);
        const r2 = Math.min(radius, -q + radius);

        for (let r = r1; r <= r2; r++) {
            const hex = new Hex(q, r);
            hexes.push(hex);
            gameState.hexes.push(hex);

            // Create hex sprite
            hex.sprite = PIXI.Sprite.from('assets/hex-grass.png');
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
            hex.sprite.on('click', hex.clickHandler);
            console.log('create hex grid');
            gridContainer.addChild(hex.sprite);
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

    // Calculate grid bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    gameState.hexes.forEach(hex => {
        minX = Math.min(minX, hex.x);
        minY = Math.min(minY, hex.y);
        maxX = Math.max(maxX, hex.x);
        maxY = Math.max(maxY, hex.y);
    });

    // Calculate grid center
    const gridCenterX = (minX + maxX) / 2;
    const gridCenterY = (minY + maxY) / 2;

    // Calculate screen center
    const screenCenterX = app.screen.width / 2;
    const screenCenterY = app.screen.height / 2;

    // Position world container to center the grid
    worldContainer.position.set(
        screenCenterX - gridCenterX,
        screenCenterY - gridCenterY
    );
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

    // Show tooltip
    let tooltipText = `Hex: (${hex.q}, ${hex.r})`;

    if (hex.building) {
        tooltipText += `\nBuilding: ${hex.building.type} Lvl ${hex.building.level}`;
        
        // Add refinery-specific information
        if (hex.building.type === 'refinery') {
            const refinery = hex.building;
            tooltipText += `\n${refinery.getProductionModeDisplay()}`;
            if (refinery.productionMode !== 'none') {
                const canProduce = refinery.canProduce() ? '✓' : '⚠';
                tooltipText += ` ${canProduce}`;
            }
        }
    }

    if (hex.resource) {
        tooltipText += `\nResource: ${hex.resource.type} (${hex.resource.amount}/${hex.resource.maxAmount})`;
    }

    if (hex.unit) {
        tooltipText += `\nUnit: ${hex.unit.type}`;
    }

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
    // Clear previous selection
    if (gameState.selectedHex) {
        gameState.selectedHex.isSelected = false;
        updateHexVisuals(gameState.selectedHex);
    }

    // Set new selection
    gameState.selectedHex = hex;
    hex.isSelected = true;
    updateHexVisuals(hex);

    // Get screen position for menu
    const gridPos = new PIXI.Point(hex.x, hex.y);
    const worldPos = gridContainer.toGlobal(gridPos);
    const screenPos = app.stage.toLocal(worldPos);

    // Create context menu based on hex content
    const menuOptions = [];

    if (!hex.building) {
        menuOptions.push({
            label: 'Build Reactor',
            action: () => buildOnHex(hex, 'reactor')
        });

        menuOptions.push({
            label: 'Build Drone Factory',
            action: () => buildOnHex(hex, 'drone_factory')
        });

        menuOptions.push({
            label: 'Build Refinery',
            action: () => buildOnHex(hex, 'refinery')
        });

        menuOptions.push({
            label: 'Build Storage',
            action: () => buildOnHex(hex, 'storage')
        });
    } else {
        if (hex.building.type === 'reactor') {
            menuOptions.push({
                label: 'Upgrade Reactor',
                action: () => hex.building.upgrade()
            });
        }
        if (hex.building.type === 'drone_factory') {
            menuOptions.push({
                label: 'Build Drone',
                action: () => buildDroneNearFactory(hex.building)
            });
        }
        
        if (hex.building.type === 'refinery') {
            const refinery = hex.building;
            
            // Show current production mode
            const currentMode = refinery.getProductionModeDisplay();
            menuOptions.push({
                label: `Status: ${currentMode}`,
                action: () => {} // Informational only
            });
            
            // Production mode options
            if (refinery.productionMode !== 'fuel') {
                menuOptions.push({
                    label: 'Set to Fuel Production (4 waste → 3 fuel)',
                    action: () => refinery.setProductionMode('fuel')
                });
            }
            
            if (refinery.productionMode !== 'materials') {
                menuOptions.push({
                    label: 'Set to Materials Production (4 waste → 2 materials)',
                    action: () => refinery.setProductionMode('materials')
                });
            }
            
            if (refinery.productionMode !== 'none') {
                menuOptions.push({
                    label: 'Stop Production',
                    action: () => refinery.setProductionMode('none')
                });
            }
            
            // Show production readiness
            if (refinery.productionMode !== 'none') {
                const canProduce = refinery.canProduce();
                const statusText = canProduce ? '✓ Ready to produce' : '⚠ Need 4 waste';
                menuOptions.push({
                    label: statusText,
                    action: () => {} // Informational only
                });
            }
        }

        menuOptions.push({
            label: 'Demolish Building',
            action: () => demolishBuilding(hex)
        });
    }

    if (hex.resource) {
        menuOptions.push({
            label: 'Collect Resource',
            action: () => collectResource(hex)
        });
    }

    menuOptions.push({
        label: 'Cancel',
        action: () => {
            gameState.selectedHex.isSelected = false;
            updateHexVisuals(gameState.selectedHex);
            gameState.selectedHex = null;
        }
    });

    uiManager.createContextMenu(menuOptions, screenPos);
}

// Build on hex
function buildOnHex(hex, type) {
    if (hex.building) return;

    const building = GameObjectFactory.createBuilding(type, hex);
    if (building) {
        // Add to legacy gameState for compatibility with existing update loops
        gameState.buildings.push(building);
        console.log(`[Build] Created ${type} building at (${hex.q}, ${hex.r})`);
    } else {
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
        {q: 1, r: 0}, {q: 1, r: -1}, {q: 0, r: -1},
        {q: -1, r: 0}, {q: -1, r: 1}, {q: 0, r: 1}
    ];
    
    return directions
        .map(dir => gameState.hexes.find(h => h.q === hex.q + dir.q && h.r === hex.r + dir.r))
        .filter(h => h !== undefined);
}

// Demolish building
function demolishBuilding(hex) {
    if (!hex.building) return;

    const building = hex.building;
    GameObjectFactory.removeBuilding(hex);
    
    // Remove from legacy gameState for compatibility
    gameState.buildings = gameState.buildings.filter(b => b !== building);
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

// Handle zoom in
function zoomIn() {
    if (gameState.zoomLevel < HEX_SCALE_LEVELS.length - 1) {
        gameState.zoomLevel++;
        applyZoom();
    }
}

// Handle zoom out
function zoomOut() {
    if (gameState.zoomLevel > 0) {
        gameState.zoomLevel--;
        applyZoom();
    }
}

// Apply zoom level to all hexes
function applyZoom() {
    const scale = HEX_SCALE_LEVELS[gameState.zoomLevel];

    // Scale the containers instead of individual sprites
    gridContainer.scale.set(scale);
    objectContainer.scale.set(scale); // objects are 80% of hex size
}

// Handle game speed changes
function setGameSpeed(speed) {
    gameState.speed = speed;

    // Update UI
    document.querySelectorAll('#game-controls button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`speed-${speed}`).classList.add('active');
}

// Toggle pause
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    const btn = document.getElementById('pause-btn');

    if (gameState.isPaused) {
        btn.textContent = '▶️ Resume';
    } else {
        btn.textContent = '⏸️ Pause';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Game speed controls
    document.getElementById('speed-1').addEventListener('click', () => setGameSpeed(1));
    document.getElementById('speed-2').addEventListener('click', () => setGameSpeed(2));
    document.getElementById('speed-4').addEventListener('click', () => setGameSpeed(4));

    // Pause button
    document.getElementById('pause-btn').addEventListener('click', togglePause);

    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', zoomIn);
    document.getElementById('zoom-out').addEventListener('click', zoomOut);

    // Handle window resize
    window.addEventListener('resize', () => {
        app.renderer.resize(document.getElementById('game-canvas').clientWidth,
            document.getElementById('game-canvas').clientHeight);
        centerGrid();
    });
    
    // Track pointer position
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;
    app.stage.on('pointermove', (event) => {
        gameState.pointerPosition = event.global;
    });
}

// Update turn information UI
function updateTurnInfo() {
    turnText.text = `Turn: ${gameState.currentTurn}`;
    timerText.text = `Next in: ${Math.ceil(gameState.timeRemaining)}s`;
    
    // Update progress bar
    progressBar.clear();
    progressBar.beginFill(gameColors.progressBar);
    progressBar.drawRect(0, 0, 150 * (1 - gameState.turnProgress), 8);
    progressBar.endFill();
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
    const stats = playerStorage.getStorageStats();
    
    // console.log('[UI] updateStorageInfo called with stats:', stats);
    // console.log('[UI] PlayerStorage object:', playerStorage);
    
    // Update individual resource displays
    const fuel = playerStorage.getFuel();
    const materials = playerStorage.getMaterials();
    const waste = playerStorage.getWaste();
    
    // Calculate fuel consumption and turns remaining
    const buildingCount = gameState.buildings.length;
    const fuelConsumption = gameState.fuelConsumptionBase + (buildingCount * gameState.fuelConsumptionPerBuilding);
    const turnsRemaining = playerStorage.getTurnsRemaining(fuelConsumption);
    
    // Update text displays
    fuelText.text = `Fuel: ${fuel}`;
    materialsText.text = `Materials: ${materials}`;
    wasteText.text = `Waste: ${waste}`;
    
    // Update turns remaining with color coding
    if (turnsRemaining === Infinity) {
        turnsRemainingText.text = 'Turns: ∞';
        turnsRemainingText.style.fill = gameColors.buttonText;
    } else if (turnsRemaining <= 3) {
        turnsRemainingText.text = `Turns: ${turnsRemaining} ⚠️`;
        turnsRemainingText.style.fill = pixiColors.state.warning; // Orange warning
    } else if (turnsRemaining <= 6) {
        turnsRemainingText.text = `Turns: ${turnsRemaining}`;
        turnsRemainingText.style.fill = gameColors.tooltipText; // Yellow caution
    } else {
        turnsRemainingText.text = `Turns: ${turnsRemaining}`;
        turnsRemainingText.style.fill = gameColors.buttonText; // Normal
    }
    
    console.log('[UI] Resources updated - Fuel:', fuel, 'Materials:', materials, 'Waste:', waste, 'Turns:', turnsRemaining);
}

// Initialize game
function initGame() {
    console.log('[Init] Starting game initialization...');
    
    // Create hex grid with 5 rings
    const hexes = createHexGrid(5);
    console.log(`[Init] Created ${hexes.length} hexes`);

    // Center the grid
    centerGrid();
    console.log('[Init] Grid centered');

    // Add some resources for demonstration
    console.log('[Init] Adding initial resources...');
    addResourceToHex(hexes[12], 'radioactive_waste', 500);
    addResourceToHex(hexes[18], 'radioactive_waste', 500);
    addResourceToHex(hexes[24], 'radioactive_waste', 500);

    // Add a building for demonstration
    console.log('[Init] Adding initial building...');
    buildOnHex(hexes[0], 'reactor');

    // Setup event listeners
    setupEventListeners();
    console.log('[Init] Event listeners set up');

    // Start game loop
    app.ticker.add(gameLoop);
    applyZoom();
    
    // Initialize UI displays
    updateStorageInfo();
    
    // Note: Removed test resource addition - fuel system now active
    
    console.log('[Init] Game initialization complete!');
    console.log(`[Init] Buildings: ${gameState.buildings.length}, Resources: ${gameState.resources.length}`);
}

// Main game loop
function gameLoop(delta) {
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
        }
        
        updateTurnInfo();
        updateStorageInfo();
    }

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
    const q = (2/3 * gridPos.x) / size;
    const r = (-1/3 * gridPos.x + Math.sqrt(3)/3 * gridPos.y) / size;
    
    // Round to nearest integer axial coordinates
    const axialQ = Math.round(q);
    const axialR = Math.round(r);
    
    // Find hex with matching axial coordinates
    return gameState.hexes.find(hex => hex.q === axialQ && hex.r === axialR) || null;
}

// Start the game
initGame();