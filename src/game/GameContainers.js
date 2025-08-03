/**
 * GameContainers - PIXI Container Management
 *
 * Manages the creation and hierarchy of PIXI containers for the game.
 * Provides a clean separation between world objects, grid, and UI elements.
 */

/**
 * Game containers - created and managed by this module
 */
let worldContainer = null;
let gridContainer = null;
let objectContainer = null;
let uiContainer = null;
let initialized = false;

/**
 * Initialize game containers and set up hierarchy
 * @param {PIXI.Application} app - The PIXI application instance
 * @returns {Object} Container references
 */
export function initializeGameContainers(app) {
  if (initialized) {
    console.warn(
      "[GameContainers] Already initialized, returning existing containers",
    );
    return getContainers();
  }

  console.log("[GameContainers] Initializing container hierarchy...");

  // Create containers for different layers
  worldContainer = new PIXI.Container();
  gridContainer = new PIXI.Container();
  objectContainer = new PIXI.Container();
  uiContainer = new PIXI.Container();

  // Set up hierarchy:
  // app.stage
  // ├── worldContainer (handles grid positioning/centering)
  // │   ├── gridContainer (hex terrain sprites)
  // │   └── objectContainer (buildings, resources, units)
  // └── uiContainer (game UI elements - separate from screen system)
  app.stage.addChild(worldContainer);
  worldContainer.addChild(gridContainer);
  worldContainer.addChild(objectContainer);
  app.stage.addChild(uiContainer);

  // Make containers globally accessible for compatibility with existing code
  window.gameContainers = {
    worldContainer,
    gridContainer,
    objectContainer,
    uiContainer,
  };

  initialized = true;

  console.log("[GameContainers] Container hierarchy created successfully");
  console.log("[GameContainers] Hierarchy:", {
    "app.stage": {
      worldContainer: {
        gridContainer: "hex terrain sprites",
        objectContainer: "buildings, resources, units",
      },
      uiContainer: "game UI elements",
    },
  });

  return getContainers();
}

/**
 * Get references to all containers
 * @returns {Object} Container references
 */
export function getContainers() {
  return {
    worldContainer,
    gridContainer,
    objectContainer,
    uiContainer,
  };
}

/**
 * Get specific container by name
 * @param {string} containerName - Name of the container to get
 * @returns {PIXI.Container|null} The requested container
 */
export function getContainer(containerName) {
  const containers = getContainers();
  return containers[containerName] || null;
}

/**
 * Check if containers are initialized
 * @returns {boolean} True if containers are initialized
 */
export function isInitialized() {
  return initialized;
}

/**
 * Reset/cleanup containers (for testing or reinitialization)
 */
export function cleanup() {
  if (worldContainer && worldContainer.parent) {
    worldContainer.parent.removeChild(worldContainer);
    worldContainer.destroy({ children: true });
  }

  if (uiContainer && uiContainer.parent) {
    uiContainer.parent.removeChild(uiContainer);
    uiContainer.destroy({ children: true });
  }

  worldContainer = null;
  gridContainer = null;
  objectContainer = null;
  uiContainer = null;
  initialized = false;

  // Clear global references
  if (window.gameContainers) {
    delete window.gameContainers;
  }

  console.log("[GameContainers] Containers cleaned up");
}

/**
 * Update container hierarchy after app resize
 * @param {PIXI.Application} app - The PIXI application instance
 */
export function onResize(app) {
  // Container hierarchy doesn't need specific resize handling
  // Individual UI elements will handle their own positioning
  console.log("[GameContainers] Resize event processed");
}

export default {
  initializeGameContainers,
  getContainers,
  getContainer,
  isInitialized,
  cleanup,
  onResize,
};
