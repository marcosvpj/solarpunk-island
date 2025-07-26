// Import color palette
import { pixiColors, gameColors } from './colors.js';
import { UIManager } from './UIManager.js';

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
    pointerPosition: {x: 0, y: 0} // Track pointer position globally
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

// Generic GameObject class
class GameObject {
    constructor(type, spritePath, hex) {
        this.type = type;
        this.hex = hex;
        this.sprite = PIXI.Sprite.from(spritePath);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(1); // Initialize with scale 1
        this.sprite.position.set(hex.x, hex.y);
        objectContainer.addChild(this.sprite);
    }

    update() {
        // Update logic for the object
    }

    destroy() {
        objectContainer.removeChild(this.sprite);
        this.sprite.destroy();
    }
}

// Building class
class Building extends GameObject {
    constructor(type, spritePath, hex) {
        super(type, spritePath, hex);
        this.level = 1;
        this.productionRate = 1;
    }

    upgrade() {
        this.level++;
        this.productionRate *= 1.5;
        // Add visual upgrade effect
    }
}

// Resource class
class Resource extends GameObject {
    constructor(type, spritePath, hex, amount) {
        super(type, spritePath, hex);
        this.amount = amount;
        this.maxAmount = amount;
    }

    collect(amount) {
        this.amount -= amount;
        if (this.amount <= 0) {
            this.destroy();
            return amount + this.amount;
        }
        return amount;
    }
}

// Unit class (like drones)
class Unit extends GameObject {
    constructor(type, spritePath, hex) {
        super(type, spritePath, hex);
        this.speed = 1;
        this.path = [];
        this.targetHex = null;
    }

    moveTo(targetHex) {
        this.targetHex = targetHex;
        // Pathfinding logic would go here
    }

    update() {
        // Movement logic
    }
}

// Initialize UI Manager
const uiManager = new UIManager(uiContainer, app);

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
            hex.sprite.on('pointerdown', hex.clickHandler);

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
            action: () => buildOnHex(hex, 'reactor', 'assets/building-reactor.png')
        });

        menuOptions.push({
            label: 'Build Drone Factory',
            action: () => buildOnHex(hex, 'drone_factory', 'assets/building-factory.png')
        });

        menuOptions.push({
            label: 'Build Refinery',
            action: () => buildOnHex(hex, 'refinery', 'assets/building-refinery.png')
        });

        menuOptions.push({
            label: 'Build Storage',
            action: () => buildOnHex(hex, 'storage', 'assets/building-storage.png')
        });
    } else {
        if (hex.building.type === 'reactor') {
            menuOptions.push({
                label: 'Upgrade Reactor',
                action: () => hex.building.upgrade()
            });
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
function buildOnHex(hex, type, sprite) {
    if (hex.building) return;

    const building = new Building(type, sprite, hex);
    hex.building = building;
    gameState.buildings.push(building);
}

// Demolish building
function demolishBuilding(hex) {
    if (!hex.building) return;

    hex.building.destroy();
    gameState.buildings = gameState.buildings.filter(b => b !== hex.building);
    hex.building = null;
}

// Collect resource
function collectResource(hex) {
    if (!hex.resource) return;

    // Collect logic here
    hex.resource.collect(10);
}

// Add resource to hex
function addResourceToHex(hex, type, amount) {
    if (hex.resource) return;

    const resource = new Resource(type, 'assets/resource.png', hex, amount);
    hex.resource = resource;
    gameState.resources.push(resource);
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

// Initialize game
function initGame() {
    // Create hex grid with 5 rings
    const hexes = createHexGrid(5);

    // Center the grid
    centerGrid();

    // Add some resources for demonstration
    addResourceToHex(hexes[12], 'radioactive_waste', 100);
    addResourceToHex(hexes[18], 'radioactive_waste', 75);
    addResourceToHex(hexes[24], 'radioactive_waste', 50);

    // Add a building for demonstration
    buildOnHex(hexes[0], 'reactor', 'assets/building-reactor.png');

    // Setup event listeners
    setupEventListeners();

    // Start game loop
    app.ticker.add(gameLoop);
    applyZoom();
}

// Main game loop
function gameLoop(delta) {
    if (gameState.isPaused) return;

    // Update based on game speed
    const scaledDelta = delta * gameState.speed;

    // Update turn timer
    if (!gameState.isPaused) {
        gameState.timeRemaining -= scaledDelta / 60; // delta is in frames, 60 frames = 1 second
        gameState.turnProgress = 1 - (gameState.timeRemaining / gameState.timePerTurn);
        
        if (gameState.timeRemaining <= 0) {
            // Advance to next turn
            gameState.currentTurn++;
            gameState.timeRemaining = gameState.timePerTurn;
            gameState.turnProgress = 0;
            
            // Process turn-based events here
        }
        
        updateTurnInfo();
    }

    // Update game objects
    gameState.buildings.forEach(building => building.update());
    gameState.units.forEach(unit => unit.update());

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