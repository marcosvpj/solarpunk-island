/**
 * GameUI - Main Game User Interface Manager
 *
 * Manages all in-game UI elements including turn information, resource displays,
 * objectives, and game controls. Handles UI updates and responsive design.
 */

import { pixiColors, gameColors, colors } from "../configs/colors.js";
import { getResponsiveFontSize } from "./ResponsiveUtils.js";
import { getContainer } from "../game/GameContainers.js";
import EventBus from "../engine/EventBus.js";

/**
 * GameUI Class - Manages all in-game UI elements
 */
export class GameUI {
  constructor(app) {
    this.app = app;
    this.uiContainer = null;

    // UI element references
    this.turnInfo = null;
    this.turnText = null;
    this.timerText = null;
    this.progressBar = null;
    this.fuelText = null;
    this.materialsText = null;
    this.wasteText = null;
    this.populationText = null;
    this.foodText = null;
    this.foodBalanceText = null;
    this.turnsRemainingText = null;
    this.storageLimitText = null;
    this.fuelConsumptionText = null;
    this.fuelProductionText = null;

    // Objectives UI
    this.objectivesContainer = null;
    this.objectivesTitle = null;
    this.objectiveTexts = [];

    // State
    this.initialized = false;
    this.gameState = null;
    this.playerStorage = null;
    this.zoomManager = null;
  }

  /**
   * Initialize the GameUI system
   * @param {Object} gameState - Game state object
   * @param {Object} playerStorage - Player storage manager
   * @param {Object} zoomManager - Zoom manager
   */
  init(gameState, playerStorage, zoomManager) {
    if (this.initialized) {
      console.warn("[GameUI] Already initialized");
      return;
    }

    this.gameState = gameState;
    this.playerStorage = playerStorage;
    this.zoomManager = zoomManager;
    this.uiContainer = getContainer("uiContainer");

    if (!this.uiContainer) {
      console.error(
        "[GameUI] UI container not found! Make sure GameContainers is initialized first.",
      );
      return;
    }

    console.log("[GameUI] Initializing game UI...");

    this.createTurnInfoUI();
    // Defer objectives creation until game mode is known
    this.setupEventListeners();
    this.setupEventBusListeners();

    this.initialized = true;

    // Check if game mode is already set and create objectives if needed
    this.checkAndCreateObjectives();

    console.log("[GameUI] Game UI initialization complete");
  }

  /**
   * Check current game mode and create objectives if needed
   */
  checkAndCreateObjectives() {
    console.log("[GameUI] checkAndCreateObjectives called");
    console.log("[GameUI] window.gameModeManager exists:", !!window.gameModeManager);
    
    // Check if game mode manager is available and mode is already set
    if (window.gameModeManager) {
      const currentMode = window.gameModeManager.getCurrentGameMode();
      console.log("[GameUI] Current game mode during init:", currentMode);
      console.log("[GameUI] Current objectives container exists:", !!this.objectivesContainer);

      if (currentMode === "story") {
        if (!this.objectivesContainer) {
          console.log("[GameUI] Creating objectives UI for Story mode");
          this.createObjectivesUI();
        } else {
          console.log("[GameUI] Objectives container already exists");
        }
      } else {
        console.log("[GameUI] Not Story mode, current mode is:", currentMode);
      }
    } else {
      console.log(
        "[GameUI] GameModeManager not available yet, objectives will be created via event",
      );
    }
  }

  /**
   * Create turn information UI elements
   */
  createTurnInfoUI() {
    // Main turn info container
    this.turnInfo = new PIXI.Container();
    this.turnInfo.position.set(20, 20);
    this.uiContainer.addChild(this.turnInfo);

    // Turn number
    this.turnText = new PIXI.Text({
      text: `Turn: ${this.gameState.currentTurn}`,
      style: {
        fontFamily: "Arial",
        fontSize: getResponsiveFontSize(20),
        fill: gameColors.tooltipText,
        fontWeight: "bold",
      },
    });
    this.turnInfo.addChild(this.turnText);

    // Turn timer
    this.timerText = new PIXI.Text({
      text: `Next in: ${this.gameState.timeRemaining}s`,
      style: {
        fontFamily: "Arial",
        fontSize: getResponsiveFontSize(16),
        fill: gameColors.buttonText,
      },
    });
    this.timerText.position.set(0, getResponsiveFontSize(25));
    this.turnInfo.addChild(this.timerText);

    // Turn progress bar
    this.progressBar = new PIXI.Graphics();
    this.progressBar.position.set(0, getResponsiveFontSize(50));
    this.turnInfo.addChild(this.progressBar);

    // Resource displays
    this.createResourceDisplays();

    console.log("[GameUI] Turn info UI created");
  }

  /**
   * Create resource display elements
   */
  createResourceDisplays() {
    const responsiveFontSize = getResponsiveFontSize(16);
    let yOffset = getResponsiveFontSize(65);

    // Fuel display
    this.fuelText = new PIXI.Text({
      text: "Fuel: 15",
      style: {
        fontFamily: "Arial",
        fontSize: responsiveFontSize,
        fill: gameColors.tooltipText,
      },
    });
    this.fuelText.position.set(0, yOffset);
    this.turnInfo.addChild(this.fuelText);
    yOffset += getResponsiveFontSize(20);

    // Materials display
    this.materialsText = new PIXI.Text({
      text: "Materials: 5",
      style: {
        fontFamily: "Arial",
        fontSize: responsiveFontSize,
        fill: gameColors.tooltipText,
      },
    });
    this.materialsText.position.set(0, yOffset);
    this.turnInfo.addChild(this.materialsText);
    yOffset += getResponsiveFontSize(20);

    // Waste display
    this.wasteText = new PIXI.Text({
      text: "Waste: 0",
      style: {
        fontFamily: "Arial",
        fontSize: responsiveFontSize,
        fill: gameColors.tooltipText,
      },
    });
    this.wasteText.position.set(0, yOffset);
    this.turnInfo.addChild(this.wasteText);
    yOffset += getResponsiveFontSize(20);

    // Population display
    this.populationText = new PIXI.Text({
      text: "Population: 5/5",
      style: {
        fontFamily: "Arial",
        fontSize: responsiveFontSize,
        fill: gameColors.tooltipText,
      },
    });
    this.populationText.position.set(0, yOffset);
    this.turnInfo.addChild(this.populationText);
    yOffset += getResponsiveFontSize(20);

    // Food display
    this.foodText = new PIXI.Text({
      text: "Food: 15",
      style: {
        fontFamily: "Arial",
        fontSize: responsiveFontSize,
        fill: gameColors.tooltipText,
      },
    });
    this.foodText.position.set(0, yOffset);
    this.turnInfo.addChild(this.foodText);
    yOffset += getResponsiveFontSize(20);

    // Food balance display
    this.foodBalanceText = new PIXI.Text({
      text: "Food: 0/turn",
      style: {
        fontFamily: "Arial",
        fontSize: responsiveFontSize,
        fill: gameColors.tooltipText,
      },
    });
    this.foodBalanceText.position.set(0, yOffset);
    this.turnInfo.addChild(this.foodBalanceText);
    yOffset += getResponsiveFontSize(20);

    // Turns remaining display
    this.turnsRemainingText = new PIXI.Text({
      text: "Turns: ∞",
      style: {
        fontFamily: "Arial",
        fontSize: responsiveFontSize,
        fill: gameColors.buttonText,
      },
    });
    this.turnsRemainingText.position.set(0, yOffset);
    this.turnInfo.addChild(this.turnsRemainingText);
    yOffset += getResponsiveFontSize(20);

    // Storage limit display
    this.storageLimitText = new PIXI.Text({
      text: "Storage: 0/100",
      style: {
        fontFamily: "Arial",
        fontSize: responsiveFontSize,
        fill: gameColors.tooltipText,
      },
    });
    this.storageLimitText.position.set(0, yOffset);
    this.turnInfo.addChild(this.storageLimitText);
    yOffset += getResponsiveFontSize(20);

    // Fuel consumption display
    this.fuelConsumptionText = new PIXI.Text({
      text: "Consumption: 3.0/turn",
      style: {
        fontFamily: "Arial",
        fontSize: responsiveFontSize,
        fill: gameColors.tooltipText,
      },
    });
    this.fuelConsumptionText.position.set(0, yOffset);
    this.turnInfo.addChild(this.fuelConsumptionText);
    yOffset += getResponsiveFontSize(20);

    // Fuel production display
    this.fuelProductionText = new PIXI.Text({
      text: "Production: 0/turn",
      style: {
        fontFamily: "Arial",
        fontSize: responsiveFontSize,
        fill: gameColors.tooltipText,
      },
    });
    this.fuelProductionText.position.set(0, yOffset);
    this.turnInfo.addChild(this.fuelProductionText);

    console.log("[GameUI] Resource displays created");
  }

  /**
   * Create objectives UI at bottom of screen (Story mode only)
   */
  createObjectivesUI() {
    console.log("[GameUI] Creating objectives UI...");
    console.log("[GameUI] uiContainer exists:", !!this.uiContainer);
    console.log("[GameUI] App screen dimensions:", this.app.screen.width, "x", this.app.screen.height);
    
    this.objectivesContainer = new PIXI.Container();
    const posX = this.app.screen.width / 2;
    const posY = this.app.screen.height - 120;
    
    console.log("[GameUI] Setting objectives position to:", posX, posY);
    this.objectivesContainer.position.set(posX, posY);
    
    // Make sure the container is visible and above other elements
    this.objectivesContainer.visible = true;
    this.objectivesContainer.alpha = 1.0;
    this.objectivesContainer.zIndex = 1000;
    
    // Add a temporary debug background to make it visible
    const debugBg = new PIXI.Graphics();
    debugBg.rect(-150, -60, 300, 120);
    debugBg.fill(0xff0000); // Bright red background for debugging
    debugBg.alpha = 0.3;
    this.objectivesContainer.addChild(debugBg);
    console.log("[GameUI] Added debug background to objectives container");
    
    if (this.uiContainer) {
      this.uiContainer.addChild(this.objectivesContainer);
      console.log("[GameUI] Added objectives container to uiContainer");
      console.log("[GameUI] uiContainer children count:", this.uiContainer.children.length);
      console.log("[GameUI] uiContainer position:", this.uiContainer.position.x, this.uiContainer.position.y);
      console.log("[GameUI] uiContainer visible:", this.uiContainer.visible);
    } else {
      console.error("[GameUI] Cannot add objectives - uiContainer is null!");
      return;
    }

    // Objectives title
    this.objectivesTitle = new PIXI.Text({
      text: "Level 1: First Spark",
      style: {
        fontFamily: "Arial",
        fontSize: getResponsiveFontSize(18),
        fill: gameColors.tooltipText,
        fontWeight: "bold",
      },
    });
    this.objectivesTitle.anchor.set(0.5, 0);
    this.objectivesTitle.position.set(0, 0);
    this.objectivesContainer.addChild(this.objectivesTitle);

    // Initialize objective texts
    this.objectiveTexts = [];
    const objectiveDescriptions = [
      "🔲 Build 1 fuel-producing refinery",
      "🔲 Build 1 materials-producing refinery",
      "🔲 Keep both refineries set to correct modes for 3 consecutive turns (0/3)",
    ];

    objectiveDescriptions.forEach((text, index) => {
      const objectiveText = new PIXI.Text({
        text: text,
        style: {
          fontFamily: "Arial",
          fontSize: getResponsiveFontSize(14),
          fill: gameColors.buttonText,
        },
      });
      objectiveText.anchor.set(0.5, 0);
      objectiveText.position.set(0, getResponsiveFontSize(25 + index * 18));
      this.objectivesContainer.addChild(objectiveText);
      this.objectiveTexts.push(objectiveText);
    });

    console.log(
      "[GameUI] Objectives UI created with",
      this.objectiveTexts.length,
      "objectives",
    );
    console.log("[GameUI] Objectives container children count:", this.objectivesContainer.children.length);
    console.log("[GameUI] Objectives container position:", this.objectivesContainer.position.x, this.objectivesContainer.position.y);
    console.log("[GameUI] Objectives container visible:", this.objectivesContainer.visible);
    console.log("[GameUI] Objectives container alpha:", this.objectivesContainer.alpha);
  }

  /**
   * Set up event listeners for UI controls
   */
  setupEventListeners() {
    // Game speed controls
    const speedButtons = [
      { id: "speed-1", speed: 1 },
      { id: "speed-2", speed: 2 },
      { id: "speed-4", speed: 4 },
    ];

    speedButtons.forEach(({ id, speed }) => {
      const button = document.getElementById(id);
      if (button) {
        button.addEventListener("click", () => this.setGameSpeed(speed));
      }
    });

    // Pause button
    const pauseBtn = document.getElementById("pause-btn");
    if (pauseBtn) {
      pauseBtn.addEventListener("click", () => this.togglePause());
    }

    // Zoom controls
    const zoomInBtn = document.getElementById("zoom-in");
    const zoomOutBtn = document.getElementById("zoom-out");

    if (zoomInBtn && this.zoomManager) {
      zoomInBtn.addEventListener("click", () => {
        this.zoomManager.zoomIn();
        this.emitCenterGridEvent();
      });
    }

    if (zoomOutBtn && this.zoomManager) {
      zoomOutBtn.addEventListener("click", () => {
        this.zoomManager.zoomOut();
        this.emitCenterGridEvent();
      });
    }

    // Window resize handling
    window.addEventListener("resize", () => this.onResize());

    console.log("[GameUI] Event listeners set up");
  }

  /**
   * Set up EventBus listeners for UI updates
   */
  setupEventBusListeners() {
    // Listen for storage updates
    EventBus.on("playerStorage:resourcesAdded", () => this.updateStorageInfo());
    EventBus.on("playerStorage:resourcesRemoved", () =>
      this.updateStorageInfo(),
    );
    EventBus.on("playerStorage:limitChanged", () => this.updateStorageInfo());
    EventBus.on("storage:upgraded", () => this.updateStorageInfo());
    EventBus.on("storage:destroyed", () => this.updateStorageInfo());

    // Listen for progression updates
    EventBus.on("progression:conditionsChecked", (data) =>
      this.updateObjectivesUI(data),
    );

    // Listen for population and food updates
    EventBus.on("population:changed", () => this.updateStorageInfo());
    EventBus.on("greenhouse:foodProduced", () => this.updateStorageInfo());

    // Listen for game mode changes to create/destroy objectives UI
    EventBus.on("gameMode:changed", (data) => {
      console.log("[GameUI] gameMode:changed event received in EventBus listener");
      this.handleGameModeChanged(data);
    });

    console.log("[GameUI] EventBus listeners set up");
  }

  /**
   * Handle game mode changes
   * @param {Object} data - Game mode change event data
   */
  handleGameModeChanged(data) {
    console.log("[GameUI] Game mode changed event received:", data);
    console.log("[GameUI] Current mode:", data.currentMode);
    console.log("[GameUI] Previous mode:", data.previousMode);
    console.log(
      "[GameUI] Current objectives container exists:",
      !!this.objectivesContainer,
    );

    // Create or destroy objectives UI based on new mode
    if (data.currentMode === "story") {
      if (!this.objectivesContainer) {
        console.log("[GameUI] Creating objectives UI for Story mode via event");
        this.createObjectivesUI();
      } else {
        console.log("[GameUI] Objectives UI already exists for Story mode");
      }
    } else {
      // Remove objectives UI for non-story modes
      if (this.objectivesContainer) {
        console.log(
          "[GameUI] Destroying objectives UI for non-Story mode:",
          data.currentMode,
        );
        this.destroyObjectivesUI();
      } else {
        console.log(
          "[GameUI] No objectives UI to destroy for mode:",
          data.currentMode,
        );
      }
    }
  }

  /**
   * Destroy objectives UI
   */
  destroyObjectivesUI() {
    console.log("[GameUI] destroyObjectivesUI called");
    console.log("[GameUI] objectives container exists:", !!this.objectivesContainer);
    
    if (this.objectivesContainer && this.objectivesContainer.parent) {
      console.log("[GameUI] Removing and destroying objectives container");
      this.objectivesContainer.parent.removeChild(this.objectivesContainer);
      this.objectivesContainer.destroy({ children: true });
      this.objectivesContainer = null;
      this.objectivesTitle = null;
      this.objectiveTexts = [];
      console.log("[GameUI] Objectives UI destroyed");
    } else {
      console.log("[GameUI] No objectives container to destroy or no parent");
    }
  }

  /**
   * Update turn information display
   */
  updateTurnInfo() {
    if (!this.initialized) return;

    this.turnText.text = `Turn: ${this.gameState.currentTurn}`;
    this.timerText.text = `Next in: ${Math.ceil(this.gameState.timeRemaining)}s`;

    // Update progress bar
    this.progressBar.clear();
    this.progressBar.rect(0, 0, 150 * (1 - this.gameState.turnProgress), 8);
    this.progressBar.fill(gameColors.progressBar);
  }

  /**
   * Update storage information display
   */
  updateStorageInfo() {
    if (!this.initialized || !this.playerStorage) return;

    // Get current resource values
    const fuel = this.playerStorage.getFuel();
    const materials = this.playerStorage.getMaterials();
    const waste = this.playerStorage.getWaste();
    const population = this.playerStorage.getPopulation();
    const food = this.playerStorage.getFood();
    const housingCapacity = this.playerStorage.getHousingCapacity();

    // Calculate fuel consumption and turns remaining
    const buildingCount = this.gameState.buildings.length;
    const fuelConsumption =
      this.gameState.fuelConsumptionBase +
      buildingCount * this.gameState.fuelConsumptionPerBuilding;
    const turnsRemaining =
      this.playerStorage.getTurnsRemaining(fuelConsumption);

    // Calculate storage info
    const totalResources = fuel + materials + waste;
    const storageLimit = this.playerStorage.getCurrentLimit();

    // Calculate fuel production from refineries
    const refineries = this.gameState.buildings.filter(
      (building) => building.type === "refinery",
    );
    const activeFuelRefineries = refineries.filter(
      (refinery) => refinery.productionMode === "fuel" && refinery.canProduce(),
    );
    const fuelProduction = activeFuelRefineries.length * 3;

    // Calculate food consumption and production
    const foodConsumptionRate = population * 1; // 1 food per person per turn (from GameData.js)
    const greenhouses = this.gameState.buildings.filter(
      (building) => building.type === "greenhouse",
    );
    const activeGreenhouses = greenhouses.filter((greenhouse) =>
      greenhouse.canProduce(),
    );
    const foodProduction = activeGreenhouses.reduce((total, greenhouse) => {
      return total + greenhouse.getFoodProduction();
    }, 0);
    const foodBalance = foodProduction - foodConsumptionRate;

    // Update text displays
    this.fuelText.text = `Fuel: ${fuel}`;
    this.materialsText.text = `Materials: ${materials}`;
    this.wasteText.text = `Waste: ${waste}`;

    // Update population display with color coding
    this.populationText.text = `Population: ${population}/${housingCapacity}`;
    if (population >= housingCapacity) {
      this.populationText.style.fill = pixiColors.state.warning; // Red when at capacity
    } else if (population >= housingCapacity * 0.8) {
      this.populationText.style.fill = gameColors.tooltipText; // Yellow when close to capacity
    } else {
      this.populationText.style.fill = gameColors.buttonText; // Normal
    }

    // Update food display with color coding
    this.foodText.text = `Food: ${food}`;
    const turnsOfFoodRemaining =
      foodConsumptionRate > 0
        ? Math.floor(food / foodConsumptionRate)
        : Infinity;
    if (food < foodConsumptionRate) {
      this.foodText.style.fill = pixiColors.state.warning; // Red when insufficient for current turn
    } else if (turnsOfFoodRemaining <= 3) {
      this.foodText.style.fill = gameColors.tooltipText; // Yellow when running low
    } else {
      this.foodText.style.fill = gameColors.buttonText; // Normal
    }

    // Update food balance display with color coding
    if (foodBalance > 0) {
      this.foodBalanceText.text = `Food: +${foodBalance}/turn`;
      this.foodBalanceText.style.fill = 0x00ff00; // Green when producing surplus
    } else if (foodBalance === 0) {
      this.foodBalanceText.text = `Food: ${foodBalance}/turn`;
      this.foodBalanceText.style.fill = gameColors.tooltipText; // Yellow when balanced
    } else {
      this.foodBalanceText.text = `Food: ${foodBalance}/turn`;
      this.foodBalanceText.style.fill = pixiColors.state.warning; // Red when consuming more than producing
    }

    // Update storage limit with color coding
    this.storageLimitText.text = `Storage: ${totalResources}/${storageLimit}`;
    if (totalResources >= storageLimit) {
      this.storageLimitText.style.fill = pixiColors.state.warning; // Orange when full
    } else if (totalResources >= storageLimit * 0.9) {
      this.storageLimitText.style.fill = gameColors.tooltipText; // Yellow when nearly full
    } else {
      this.storageLimitText.style.fill = gameColors.buttonText; // Normal
    }

    // Update fuel consumption
    this.fuelConsumptionText.text = `Consumption: ${fuelConsumption.toFixed(1)}/turn`;

    // Update fuel production with color coding
    this.fuelProductionText.text = `Production: ${fuelProduction}/turn`;
    if (fuelProduction > fuelConsumption) {
      this.fuelProductionText.style.fill = 0x00ff00; // Green when producing more than consuming
    } else if (fuelProduction === fuelConsumption) {
      this.fuelProductionText.style.fill = gameColors.tooltipText; // Yellow when balanced
    } else if (fuelProduction > 0) {
      this.fuelProductionText.style.fill = pixiColors.state.warning; // Orange when producing but not enough
    } else {
      this.fuelProductionText.style.fill = gameColors.buttonText; // Normal when no production
    }

    // Update turns remaining with color coding
    if (turnsRemaining === Infinity) {
      this.turnsRemainingText.text = "Turns: ∞";
      this.turnsRemainingText.style.fill = gameColors.buttonText;
    } else if (turnsRemaining <= 3) {
      this.turnsRemainingText.text = `Turns: ${turnsRemaining} ⚠️`;
      this.turnsRemainingText.style.fill = pixiColors.state.warning;
    } else if (turnsRemaining <= 6) {
      this.turnsRemainingText.text = `Turns: ${turnsRemaining}`;
      this.turnsRemainingText.style.fill = gameColors.tooltipText;
    } else {
      this.turnsRemainingText.text = `Turns: ${turnsRemaining}`;
      this.turnsRemainingText.style.fill = gameColors.buttonText;
    }
  }

  /**
   * Update objectives UI based on progression data
   * @param {Object} progressionData - Progression condition data
   */
  updateObjectivesUI(progressionData) {
    if (
      !this.initialized ||
      !this.objectiveTexts ||
      !progressionData ||
      !progressionData.results
    ) {
      return;
    }

    // Safety check: ensure objectives UI exists and has required elements
    if (!this.objectivesContainer || this.objectiveTexts.length < 3) {
      console.warn(
        "[GameUI] Objectives UI not properly initialized, skipping update",
      );
      return;
    }

    const results = progressionData.results;

    // Update each objective based on condition status
    if (results.winConditions && results.winConditions.length >= 3) {
      // Objective 1: Build 1 fuel-producing refinery
      const fuelRefineryCondition = results.winConditions[0];
      if (fuelRefineryCondition && fuelRefineryCondition.result) {
        this.objectiveTexts[0].text = "✅ Build 1 fuel-producing refinery";
        this.objectiveTexts[0].style.fill = colors.state.success;
      } else {
        this.objectiveTexts[0].text = "🔲 Build 1 fuel-producing refinery";
        this.objectiveTexts[0].style.fill = gameColors.buttonText;
      }

      // Objective 2: Build 1 materials-producing refinery
      const materialRefineryCondition = results.winConditions[1];
      if (materialRefineryCondition && materialRefineryCondition.result) {
        this.objectiveTexts[1].text = "✅ Build 1 materials-producing refinery";
        this.objectiveTexts[1].style.fill = colors.state.success;
      } else {
        this.objectiveTexts[1].text = "🔲 Build 1 materials-producing refinery";
        this.objectiveTexts[1].style.fill = gameColors.buttonText;
      }

      // Objective 3: Keep both refineries operational for 3 consecutive turns
      const consecutiveCondition = results.winConditions[2];
      if (consecutiveCondition && consecutiveCondition.status) {
        const checkData = consecutiveCondition.status.lastCheck?.data;
        const currentCount = checkData?.consecutiveCount || 0;
        const requiredCount = checkData?.requiredCount || 3;

        if (consecutiveCondition.result) {
          this.objectiveTexts[2].text =
            "✅ Keep both refineries set to correct modes for 3 consecutive turns (3/3)";
          this.objectiveTexts[2].style.fill = colors.state.success;
        } else {
          this.objectiveTexts[2].text = `🔲 Keep both refineries set to correct modes for 3 consecutive turns (${currentCount}/${requiredCount})`;
          this.objectiveTexts[2].style.fill = gameColors.buttonText;
        }
      }
    }
  }

  /**
   * Handle game speed changes
   * @param {number} speed - New game speed
   */
  setGameSpeed(speed) {
    this.gameState.speed = speed;

    // Update UI button states
    document.querySelectorAll("#game-controls button").forEach((btn) => {
      btn.classList.remove("active");
    });
    const activeBtn = document.getElementById(`speed-${speed}`);
    if (activeBtn) {
      activeBtn.classList.add("active");
    }
  }

  /**
   * Toggle game pause state
   */
  togglePause() {
    this.gameState.isPaused = !this.gameState.isPaused;
    const btn = document.getElementById("pause-btn");

    if (btn) {
      if (this.gameState.isPaused) {
        btn.textContent = "▶️ Resume";
      } else {
        btn.textContent = "⏸️ Pause";
      }
    }
  }

  /**
   * Handle window resize
   */
  onResize() {
    if (!this.initialized) return;

    // Update objectives container position
    if (this.objectivesContainer) {
      this.objectivesContainer.position.set(
        this.app.screen.width / 2,
        this.app.screen.height - 120,
      );
    }

    console.log("[GameUI] UI resized");
  }

  /**
   * Emit center grid event (for compatibility with existing zoom system)
   */
  emitCenterGridEvent() {
    EventBus.emit("ui:centerGrid");
  }

  /**
   * Clean up UI elements
   */
  destroy() {
    if (!this.initialized) return;

    // Remove from container
    if (this.turnInfo && this.turnInfo.parent) {
      this.turnInfo.parent.removeChild(this.turnInfo);
      this.turnInfo.destroy({ children: true });
    }

    if (this.objectivesContainer && this.objectivesContainer.parent) {
      this.objectivesContainer.parent.removeChild(this.objectivesContainer);
      this.objectivesContainer.destroy({ children: true });
    }

    // Clear references
    this.turnInfo = null;
    this.objectivesContainer = null;
    this.objectiveTexts = [];
    this.initialized = false;

    console.log("[GameUI] UI destroyed");
  }
}

export default GameUI;
