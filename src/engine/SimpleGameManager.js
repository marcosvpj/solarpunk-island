/**
 * SimpleGameManager.js - Unified game state and initialization
 * Replaces scattered state management and complex initialization
 */

import { GAME_BALANCE, getBuildingData } from "../configs/GameData.js";
import { SimpleBuildingSystem } from "./SimpleBuildingSystem.js";
import PlayerStorage from "./PlayerStorage.js";
import { UIManager } from "../ui/UIManager.js";
import EventBus from "./EventBus.js";
import GameObjectFactory from "./GameObjectFactory.js";

export class SimpleGameManager {
  constructor(app) {
    this.app = app;
    this.containers = null;
    this.initialized = false;

    // Unified game state - single source of truth
    this.state = {
      // Game flow
      isPaused: false,
      isGameOver: false,
      speed: 1,

      // Turn system
      currentTurn: 1,
      timeRemaining: GAME_BALANCE.turn.duration,
      turnProgress: 0,

      // Grid state
      hexes: new Map(), // id -> hex
      selectedHex: null,
      hoverHex: null,
      zoomLevel: 3,

      // Legacy arrays for compatibility
      buildings: [], // Will be synced from SimpleBuildingSystem
      resources: [],
      units: [],
    };

    // Core systems
    this.playerStorage = null;
    this.buildingSystem = null;
    this.uiManager = null;

    console.log("[SimpleGameManager] Initialized");
  }

  /**
   * Initialize the game - single entry point
   */
  async init(containers) {
    if (this.initialized) return;

    console.log("[SimpleGameManager] Starting initialization...");

    this.containers = containers;

    // Initialize core systems in order
    this.playerStorage = new PlayerStorage();
    this.buildingSystem = new SimpleBuildingSystem(
      this.state,
      this.playerStorage,
    );
    this.uiManager = new UIManager(containers.uiContainer, this.app);

    // Create hex grid
    this.createHexGrid(GAME_BALANCE.grid.radius);

    // Add initial building
    const centerHex = this.getHex(0, 0);
    if (centerHex) {
      this.buildingSystem.build(centerHex, "reactor");
    }

    // Setup game loop
    this.app.ticker.add(this.gameLoop.bind(this));

    // Setup event handlers
    this.setupEventHandlers();

    this.initialized = true;
    console.log("[SimpleGameManager] Initialization complete");

    EventBus.emit("game:initialized", this.state);
  }

  /**
   * Create hex grid - simplified
   */
  createHexGrid(radius) {
    const hexes = [];

    for (let q = -radius; q <= radius; q++) {
      const r1 = Math.max(-radius, -q - radius);
      const r2 = Math.min(radius, -q + radius);

      for (let r = r1; r <= r2; r++) {
        const hex = this.createHex(q, r);
        hexes.push(hex);
      }
    }

    console.log(`[SimpleGameManager] Created ${hexes.length} hexes`);
    return hexes;
  }

  /**
   * Create a single hex
   */
  createHex(q, r) {
    const hex = {
      q,
      r,
      id: `${q}_${r}`,
      x: ((q * 3) / 2) * GAME_BALANCE.grid.hexSize,
      y: (r + q / 2) * Math.sqrt(3) * GAME_BALANCE.grid.hexSize,
      terrain: this.getRandomTerrain(),
      building: null,
      resource: null,
      unit: null,
      isSelected: false,
      isHovered: false,

      // Simple event handlers
      onClick: () => this.handleHexClick(hex),
      onHover: () => this.handleHexHover(hex),
      onHoverEnd: () => this.handleHexHoverEnd(hex),
    };

    this.state.hexes.set(hex.id, hex);

    // Add some initial resources randomly
    if (q !== 0 || r !== 0) {
      if (Math.random() < 0.1) {
        hex.resource = {
          type: "radioactive_waste",
          amount: 500,
          collect: (amount) => {
            const taken = Math.min(amount, hex.resource.amount);
            hex.resource.amount -= taken;
            if (hex.resource.amount <= 0) {
              hex.resource = null;
            }
            return taken;
          },
        };
      }
    }

    return hex;
  }

  /**
   * Get random terrain type
   */
  getRandomTerrain() {
    const terrains = ["grass", "ground", "sky"];
    const weights = [0.4, 0.4, 0.2];
    const random = Math.random();

    let sum = 0;
    for (let i = 0; i < terrains.length; i++) {
      sum += weights[i];
      if (random <= sum) return terrains[i];
    }

    return "grass";
  }

  /**
   * Get hex by coordinates
   */
  getHex(q, r) {
    return this.state.hexes.get(`${q}_${r}`);
  }

  /**
   * Handle hex interactions - simplified
   */
  handleHexClick(hex) {
    // Clear previous selection
    if (this.state.selectedHex) {
      this.state.selectedHex.isSelected = false;
    }

    // Set new selection
    this.state.selectedHex = hex;
    hex.isSelected = true;

    // Show context menu
    const menuOptions = this.buildingSystem.getHexContextMenu(hex);
    const screenPos = {
      x: this.app.screen.width / 2,
      y: this.app.screen.height / 2,
    };

    this.uiManager.createContextMenu(menuOptions, screenPos);

    console.log(`[Hex] Clicked hex (${hex.q}, ${hex.r})`);
  }

  handleHexHover(hex) {
    if (this.state.hoverHex) {
      this.state.hoverHex.isHovered = false;
    }

    this.state.hoverHex = hex;
    hex.isHovered = true;

    // Show tooltip
    let tooltipText = `Hex (${hex.q}, ${hex.r})\nTerrain: ${hex.terrain}`;

    if (hex.building) {
      tooltipText += `\n${hex.building.getTooltip()}`;
    }

    if (hex.resource) {
      tooltipText += `\nResource: ${hex.resource.type} (${hex.resource.amount})`;
    }

    const screenPos = { x: hex.x, y: hex.y };
    this.uiManager.createTooltip(tooltipText, screenPos);
  }

  handleHexHoverEnd(hex) {
    hex.isHovered = false;
    this.state.hoverHex = null;
    this.uiManager.clearTooltip();
  }

  /**
   * Main game loop - simplified
   */
  gameLoop(ticker) {
    if (this.state.isPaused || this.state.isGameOver) return;

    const delta = ticker.deltaTime * this.state.speed;

    // Update turn timer
    this.state.timeRemaining -= delta / 60;
    this.state.turnProgress =
      1 - this.state.timeRemaining / GAME_BALANCE.turn.duration;

    if (this.state.timeRemaining <= 0) {
      this.processTurnEnd();
    }

    // Update systems
    this.buildingSystem.update();

    // Sync legacy arrays
    this.state.buildings = Array.from(this.buildingSystem.buildings.values());
  }

  /**
   * Process turn end - simplified
   */
  processTurnEnd() {
    console.log(`[Turn] Turn ${this.state.currentTurn} ended`);

    // Calculate fuel consumption
    const buildingCount = this.state.buildings.length;
    const fuelConsumption =
      GAME_BALANCE.turn.baseFuelConsumption +
      buildingCount * GAME_BALANCE.turn.fuelPerBuilding;

    // Try to consume fuel
    if (!this.playerStorage.consumeFuel(fuelConsumption)) {
      this.triggerGameOver("fuel_depletion");
      return;
    }

    // Advance turn
    this.state.currentTurn++;
    this.state.timeRemaining = GAME_BALANCE.turn.duration;
    this.state.turnProgress = 0;

    // Check for low fuel warning
    const turnsRemaining = Math.floor(
      this.playerStorage.getFuel() / fuelConsumption,
    );
    if (turnsRemaining <= GAME_BALANCE.progression.fuelWarningTurns) {
      console.warn(`[Warning] Only ${turnsRemaining} turns of fuel remaining!`);
    }

    EventBus.emit("game:turnEnded", {
      turn: this.state.currentTurn,
      fuelConsumed: fuelConsumption,
      turnsRemaining,
    });
  }

  /**
   * Trigger game over
   */
  triggerGameOver(reason) {
    this.state.isGameOver = true;
    console.log(`[Game Over] Reason: ${reason}`);

    EventBus.emit("game:gameOver", {
      reason,
      turn: this.state.currentTurn,
      finalFuel: this.playerStorage.getFuel(),
    });
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Pause/resume
    EventBus.on("game:pause", () => {
      this.state.isPaused = true;
    });

    EventBus.on("game:resume", () => {
      this.state.isPaused = false;
    });

    // Speed changes
    EventBus.on("game:speedChange", (speed) => {
      this.state.speed = speed;
    });
  }

  /**
   * Get current game state (read-only)
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get player storage
   */
  getPlayerStorage() {
    return this.playerStorage;
  }
}

export default SimpleGameManager;
