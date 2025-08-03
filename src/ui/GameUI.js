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
 * Resource Display Component - Handles individual resource display elements
 * Follows Single Responsibility Principle
 */
class ResourceDisplayComponent {
  constructor(config) {
    this.config = config;
    this.textElement = null;
    this.container = null;
    this.warningSystem = null;
  }

  create(container, position) {
    this.textElement = new PIXI.Text({
      text: this.config.defaultText || "",
      style: {
        fontFamily: "Arial",
        fontSize: this.config.fontSize || getResponsiveFontSize(16),
        fill: this.config.defaultColor || gameColors.tooltipText,
      },
    });
    this.textElement.position.set(position.x, position.y);
    container.addChild(this.textElement);
    return this;
  }

  update(value, warningLevel = "normal") {
    if (!this.textElement) return;

    this.textElement.text = this.formatText(value);
    this.textElement.style.fill = this.getColorForWarningLevel(warningLevel);
  }

  formatText(value) {
    if (this.config.formatter) {
      return this.config.formatter(value);
    }
    return `${this.config.label}: ${value}`;
  }

  getColorForWarningLevel(level) {
    const colorMap = {
      normal: this.config.defaultColor || gameColors.buttonText,
      warning: gameColors.tooltipText,
      critical: pixiColors.state.warning,
      success: pixiColors.state.success,
      error: pixiColors.state.error,
    };
    return colorMap[level] || colorMap.normal;
  }

  destroy() {
    if (this.textElement && this.textElement.parent) {
      this.textElement.parent.removeChild(this.textElement);
      this.textElement.destroy();
    }
    this.textElement = null;
  }
}

/**
 * Warning System - Handles urgency-based color coding and alerts
 * Follows Single Responsibility Principle
 */
class WarningSystem {
  static evaluateResourceWarning(resourceType, value, context = {}) {
    switch (resourceType) {
      case "fuel":
        return this.evaluateFuelWarning(value, context);
      case "food":
        return this.evaluateFoodWarning(value, context);
      case "population":
        return this.evaluatePopulationWarning(value, context);
      case "storage":
        return this.evaluateStorageWarning(value, context);
      case "production":
        return this.evaluateProductionWarning(value, context);
      default:
        return "normal";
    }
  }

  static evaluateFuelWarning(turnsRemaining, context) {
    if (turnsRemaining === Infinity) return "normal";
    if (turnsRemaining <= 3) return "critical";
    if (turnsRemaining <= 6) return "warning";
    return "normal";
  }

  static evaluateFoodWarning(food, context) {
    const { consumption = 0 } = context;
    if (food < consumption) return "critical";
    const turnsRemaining =
      consumption > 0 ? Math.floor(food / consumption) : Infinity;
    if (turnsRemaining <= 3) return "warning";
    return "normal";
  }

  static evaluatePopulationWarning(population, context) {
    const { capacity = 0 } = context;
    if (population >= capacity) return "critical";
    if (population >= capacity * 0.8) return "warning";
    return "normal";
  }

  static evaluateStorageWarning(used, context) {
    const { limit = 0 } = context;
    if (used >= limit) return "critical";
    if (used >= limit * 0.9) return "warning";
    return "normal";
  }

  static evaluateProductionWarning(production, context) {
    const { consumption = 0 } = context;
    if (production > consumption) return "success";
    if (production === consumption) return "warning";
    if (production > 0) return "warning";
    return "normal";
  }
}

/**
 * Resource Group Manager - Manages logical resource groupings and layout
 * Follows Single Responsibility Principle
 */
class ResourceGroupManager {
  constructor() {
    this.groups = new Map();
    this.components = new Map();
  }

  createGroup(groupId, config) {
    const group = {
      id: groupId,
      title: config.title,
      container: new PIXI.Container(),
      resources: [],
      position: config.position || { x: 0, y: 0 },
      spacing: config.spacing || getResponsiveFontSize(20),
      titleStyle: config.titleStyle || {
        fontFamily: "Arial",
        fontSize: getResponsiveFontSize(18),
        fill: gameColors.tooltipText,
        fontWeight: "bold",
      },
    };

    // Create group title if provided
    if (group.title) {
      const titleText = new PIXI.Text({
        text: group.title,
        style: group.titleStyle,
      });
      titleText.position.set(0, 0);
      group.container.addChild(titleText);
      group.titleHeight = getResponsiveFontSize(25);
    } else {
      group.titleHeight = 0;
    }

    group.container.position.set(group.position.x, group.position.y);
    this.groups.set(groupId, group);
    return group;
  }

  addResourceToGroup(groupId, resourceConfig) {
    const group = this.groups.get(groupId);
    if (!group) {
      console.error(`Group ${groupId} not found`);
      return null;
    }

    const component = new ResourceDisplayComponent(resourceConfig);
    const yOffset = group.titleHeight + group.resources.length * group.spacing;

    component.create(group.container, { x: 0, y: yOffset });

    group.resources.push({
      id: resourceConfig.id,
      component: component,
      config: resourceConfig,
    });

    this.components.set(resourceConfig.id, component);
    return component;
  }

  getComponent(resourceId) {
    return this.components.get(resourceId);
  }

  addGroupToContainer(groupId, parentContainer) {
    const group = this.groups.get(groupId);
    if (group && parentContainer) {
      parentContainer.addChild(group.container);
    }
  }

  createVisualSeparator(parentContainer, position) {
    const separator = new PIXI.Graphics();
    separator.rect(0, 0, 120, 1);
    separator.fill(pixiColors.background.interactive);
    separator.position.set(position.x, position.y);
    parentContainer.addChild(separator);
    return separator;
  }

  destroy() {
    this.components.forEach((component) => component.destroy());
    this.groups.forEach((group) => {
      if (group.container && group.container.parent) {
        group.container.parent.removeChild(group.container);
        group.container.destroy({ children: true });
      }
    });
    this.groups.clear();
    this.components.clear();
  }
}

/**
 * Progressive Disclosure Manager - Handles view state toggles
 * Follows Single Responsibility Principle
 */
class ProgressiveDisclosureManager {
  constructor() {
    this.viewState = "detailed"; // 'basic' or 'detailed'
    this.toggleButton = null;
  }

  createToggleButton(container, position) {
    this.toggleButton = new PIXI.Text({
      text: "📊 Detailed",
      style: {
        fontFamily: "Arial",
        fontSize: getResponsiveFontSize(14),
        fill: gameColors.buttonText,
      },
    });
    this.toggleButton.position.set(position.x, position.y);
    this.toggleButton.interactive = true;
    this.toggleButton.buttonMode = true;
    this.toggleButton.cursor = "pointer";

    this.toggleButton.on("click", () => this.toggleView());
    container.addChild(this.toggleButton);
  }

  toggleView() {
    this.viewState = this.viewState === "basic" ? "detailed" : "basic";
    this.updateToggleButton();
    EventBus.emit("ui:viewStateChanged", { viewState: this.viewState });
  }

  updateToggleButton() {
    if (this.toggleButton) {
      this.toggleButton.text =
        this.viewState === "basic" ? "📈 Basic" : "📊 Detailed";
    }
  }

  isDetailed() {
    return this.viewState === "detailed";
  }

  destroy() {
    if (this.toggleButton && this.toggleButton.parent) {
      this.toggleButton.parent.removeChild(this.toggleButton);
      this.toggleButton.destroy();
    }
    this.toggleButton = null;
  }
}

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

    // New component managers
    this.resourceGroupManager = new ResourceGroupManager();
    this.progressiveDisclosure = new ProgressiveDisclosureManager();

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
    console.log(
      "[GameUI] window.gameModeManager exists:",
      !!window.gameModeManager,
    );

    // Check if game mode manager is available and mode is already set
    if (window.gameModeManager) {
      const currentMode = window.gameModeManager.getCurrentGameMode();
      console.log("[GameUI] Current game mode during init:", currentMode);
      console.log(
        "[GameUI] Current objectives container exists:",
        !!this.objectivesContainer,
      );

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

    // Resource displays - using new component system
    this.createResourceDisplaySystem();

    console.log("[GameUI] Turn info UI created");
  }

  /**
   * Create the new modular resource display system
   * Follows Single Responsibility and Open/Closed principles
   */
  createResourceDisplaySystem() {
    let yOffset = getResponsiveFontSize(65);

    // Create progressive disclosure toggle
    this.progressiveDisclosure.createToggleButton(this.turnInfo, {
      x: 0,
      y: yOffset,
    });
    yOffset += getResponsiveFontSize(25);

    // Create resource groups with visual separation
    yOffset = this.createCoreResourcesGroup(yOffset);
    yOffset = this.createPopulationFoodGroup(yOffset);
    yOffset = this.createProductionStatusGroup(yOffset);

    // Set up event listener for view state changes
    EventBus.on("ui:viewStateChanged", (data) =>
      this.handleViewStateChange(data),
    );

    console.log("[GameUI] Modular resource display system created");
  }

  /**
   * Create Core Resources group (Fuel, Materials, Waste, Storage)
   */
  createCoreResourcesGroup(yOffset) {
    const group = this.resourceGroupManager.createGroup("coreResources", {
      title: "Resources",
      position: { x: 0, y: yOffset },
      spacing: getResponsiveFontSize(20),
    });

    this.resourceGroupManager.addGroupToContainer(
      "coreResources",
      this.turnInfo,
    );

    // Add resources to group
    this.resourceGroupManager.addResourceToGroup("coreResources", {
      id: "fuel",
      label: "Fuel",
      defaultText: "Fuel: 15",
      defaultColor: gameColors.tooltipText,
    });

    this.resourceGroupManager.addResourceToGroup("coreResources", {
      id: "materials",
      label: "Materials",
      defaultText: "Materials: 5",
      defaultColor: gameColors.tooltipText,
    });

    this.resourceGroupManager.addResourceToGroup("coreResources", {
      id: "waste",
      label: "Waste",
      defaultText: "Waste: 0",
      defaultColor: gameColors.tooltipText,
    });

    this.resourceGroupManager.addResourceToGroup("coreResources", {
      id: "storage",
      label: "Storage",
      defaultText: "Storage: 0/100",
      defaultColor: gameColors.tooltipText,
      formatter: (data) => `Storage: ${data.used}/${data.limit}`,
    });

    // Visual separator
    const separatorY = yOffset + getResponsiveFontSize(120);
    this.resourceGroupManager.createVisualSeparator(this.turnInfo, {
      x: 0,
      y: separatorY,
    });

    return separatorY + getResponsiveFontSize(15);
  }

  /**
   * Create Population & Food group
   */
  createPopulationFoodGroup(yOffset) {
    const group = this.resourceGroupManager.createGroup("populationFood", {
      title: "Population & Food",
      position: { x: 0, y: yOffset },
      spacing: getResponsiveFontSize(20),
    });

    this.resourceGroupManager.addGroupToContainer(
      "populationFood",
      this.turnInfo,
    );

    this.resourceGroupManager.addResourceToGroup("populationFood", {
      id: "population",
      label: "Population",
      defaultText: "Population: 5/5",
      defaultColor: gameColors.buttonText,
      formatter: (data) => `Population: ${data.current}/${data.capacity}`,
    });

    this.resourceGroupManager.addResourceToGroup("populationFood", {
      id: "food",
      label: "Food",
      defaultText: "Food: 15",
      defaultColor: gameColors.buttonText,
    });

    this.resourceGroupManager.addResourceToGroup("populationFood", {
      id: "foodBalance",
      label: "Food Balance",
      defaultText: "Food: 0/turn",
      defaultColor: gameColors.tooltipText,
      formatter: (data) =>
        data.balance > 0
          ? `Food: +${data.balance}/turn`
          : `Food: ${data.balance}/turn`,
    });

    // Visual separator
    const separatorY = yOffset + getResponsiveFontSize(95);
    this.resourceGroupManager.createVisualSeparator(this.turnInfo, {
      x: 0,
      y: separatorY,
    });

    return separatorY + getResponsiveFontSize(15);
  }

  /**
   * Create Production Status group
   */
  createProductionStatusGroup(yOffset) {
    const group = this.resourceGroupManager.createGroup("productionStatus", {
      title: "Production Status",
      position: { x: 0, y: yOffset },
      spacing: getResponsiveFontSize(20),
    });

    this.resourceGroupManager.addGroupToContainer(
      "productionStatus",
      this.turnInfo,
    );

    this.resourceGroupManager.addResourceToGroup("productionStatus", {
      id: "turnsRemaining",
      label: "Turns Remaining",
      defaultText: "Turns: ∞",
      defaultColor: gameColors.buttonText,
      formatter: (data) =>
        data === Infinity
          ? "Turns: ∞"
          : data <= 3
            ? `Turns: ${data} ⚠️`
            : `Turns: ${data}`,
    });

    this.resourceGroupManager.addResourceToGroup("productionStatus", {
      id: "fuelConsumption",
      label: "Fuel Consumption",
      defaultText: "Consumption: 3.0/turn",
      defaultColor: gameColors.tooltipText,
      formatter: (data) => `Consumption: ${data.toFixed(1)}/turn`,
    });

    this.resourceGroupManager.addResourceToGroup("productionStatus", {
      id: "fuelProduction",
      label: "Fuel Production",
      defaultText: "Production: 0/turn",
      defaultColor: gameColors.buttonText,
      formatter: (data) => `Production: ${data}/turn`,
    });

    return yOffset + getResponsiveFontSize(95);
  }

  /**
   * Handle view state changes (basic/detailed)
   */
  handleViewStateChange(data) {
    // This can be extended to show/hide certain resource groups or details
    // For now, we keep all groups visible but could hide detailed production info in basic view
    console.log(`[GameUI] View state changed to: ${data.viewState}`);
  }

  /**
   * Create objectives UI at bottom of screen (Story mode only)
   */
  createObjectivesUI() {
    console.log("[GameUI] Creating objectives UI...");
    console.log("[GameUI] uiContainer exists:", !!this.uiContainer);
    console.log(
      "[GameUI] App screen dimensions:",
      this.app.screen.width,
      "x",
      this.app.screen.height,
    );

    this.objectivesContainer = new PIXI.Container();
    const posX = this.app.screen.width / 2;
    const posY = this.app.screen.height - 120;

    console.log("[GameUI] Setting objectives position to:", posX, posY);
    this.objectivesContainer.position.set(posX, posY);

    // Make sure the container is visible and above other elements
    this.objectivesContainer.visible = true;
    this.objectivesContainer.alpha = 1.0;
    this.objectivesContainer.zIndex = 1000;

    if (this.uiContainer) {
      this.uiContainer.addChild(this.objectivesContainer);
      console.log("[GameUI] Added objectives container to uiContainer");
      console.log(
        "[GameUI] uiContainer children count:",
        this.uiContainer.children.length,
      );
      console.log(
        "[GameUI] uiContainer position:",
        this.uiContainer.position.x,
        this.uiContainer.position.y,
      );
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
    console.log(
      "[GameUI] Objectives container children count:",
      this.objectivesContainer.children.length,
    );
    console.log(
      "[GameUI] Objectives container position:",
      this.objectivesContainer.position.x,
      this.objectivesContainer.position.y,
    );
    console.log(
      "[GameUI] Objectives container visible:",
      this.objectivesContainer.visible,
    );
    console.log(
      "[GameUI] Objectives container alpha:",
      this.objectivesContainer.alpha,
    );
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

    // Back to menu button
    const backToMenuBtn = document.getElementById("back-to-menu-btn");
    if (backToMenuBtn) {
      backToMenuBtn.addEventListener("click", () => this.backToStartMenu());
    }

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
      console.log(
        "[GameUI] gameMode:changed event received in EventBus listener",
      );
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
    console.log(
      "[GameUI] objectives container exists:",
      !!this.objectivesContainer,
    );

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
   * Update storage information display using the new component system
   * Follows Single Responsibility Principle and Clean Code practices
   */
  updateStorageInfo() {
    if (!this.initialized || !this.playerStorage) return;

    // Gather all resource data
    const resourceData = this.gatherResourceData();

    // Update each resource component with appropriate warning levels
    this.updateCoreResources(resourceData);
    this.updatePopulationAndFood(resourceData);
    this.updateProductionStatus(resourceData);
  }

  /**
   * Gather all resource data from game state
   * Follows Single Responsibility Principle
   */
  gatherResourceData() {
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
    const foodConsumptionRate = population * 1; // 1 food per person per turn
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

    return {
      fuel,
      materials,
      waste,
      population,
      food,
      housingCapacity,
      fuelConsumption,
      turnsRemaining,
      totalResources,
      storageLimit,
      fuelProduction,
      foodConsumptionRate,
      foodProduction,
      foodBalance,
    };
  }

  /**
   * Update core resources (Fuel, Materials, Waste, Storage)
   */
  updateCoreResources(data) {
    // Update fuel
    const fuelComponent = this.resourceGroupManager.getComponent("fuel");
    if (fuelComponent) {
      fuelComponent.update(data.fuel);
    }

    // Update materials
    const materialsComponent =
      this.resourceGroupManager.getComponent("materials");
    if (materialsComponent) {
      materialsComponent.update(data.materials);
    }

    // Update waste
    const wasteComponent = this.resourceGroupManager.getComponent("waste");
    if (wasteComponent) {
      wasteComponent.update(data.waste);
    }

    // Update storage with warning level
    const storageComponent = this.resourceGroupManager.getComponent("storage");
    if (storageComponent) {
      const storageWarning = WarningSystem.evaluateStorageWarning(
        data.totalResources,
        { limit: data.storageLimit },
      );
      storageComponent.update(
        { used: data.totalResources, limit: data.storageLimit },
        storageWarning,
      );
    }
  }

  /**
   * Update population and food resources
   */
  updatePopulationAndFood(data) {
    // Update population with warning level
    const populationComponent =
      this.resourceGroupManager.getComponent("population");
    if (populationComponent) {
      const populationWarning = WarningSystem.evaluatePopulationWarning(
        data.population,
        { capacity: data.housingCapacity },
      );
      populationComponent.update(
        { current: data.population, capacity: data.housingCapacity },
        populationWarning,
      );
    }

    // Update food with warning level
    const foodComponent = this.resourceGroupManager.getComponent("food");
    if (foodComponent) {
      const foodWarning = WarningSystem.evaluateFoodWarning(data.food, {
        consumption: data.foodConsumptionRate,
      });
      foodComponent.update(data.food, foodWarning);
    }

    // Update food balance with warning level
    const foodBalanceComponent =
      this.resourceGroupManager.getComponent("foodBalance");
    if (foodBalanceComponent) {
      let balanceWarning = "normal";
      if (data.foodBalance > 0) balanceWarning = "success";
      else if (data.foodBalance === 0) balanceWarning = "warning";
      else balanceWarning = "critical";

      foodBalanceComponent.update(
        { balance: data.foodBalance },
        balanceWarning,
      );
    }
  }

  /**
   * Update production status resources
   */
  updateProductionStatus(data) {
    // Update turns remaining with warning level
    const turnsComponent =
      this.resourceGroupManager.getComponent("turnsRemaining");
    if (turnsComponent) {
      const turnsWarning = WarningSystem.evaluateFuelWarning(
        data.turnsRemaining,
        {},
      );
      turnsComponent.update(data.turnsRemaining, turnsWarning);
    }

    // Update fuel consumption
    const consumptionComponent =
      this.resourceGroupManager.getComponent("fuelConsumption");
    if (consumptionComponent) {
      consumptionComponent.update(data.fuelConsumption);
    }

    // Update fuel production with warning level
    const productionComponent =
      this.resourceGroupManager.getComponent("fuelProduction");
    if (productionComponent) {
      const productionWarning = WarningSystem.evaluateProductionWarning(
        data.fuelProduction,
        { consumption: data.fuelConsumption },
      );
      productionComponent.update(data.fuelProduction, productionWarning);
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
   * Go back to start menu
   */
  backToStartMenu() {
    console.log("[GameUI] Back to start menu requested");

    // Use the screen manager to show start screen
    if (window.screenManager) {
      window.screenManager.showScreen("start");
    } else {
      console.error("[GameUI] Screen manager not available");
    }
  }

  /**
   * Show game controls (when playing)
   */
  showGameControls() {
    const gameControls = document.getElementById("game-controls");
    if (gameControls) {
      gameControls.style.display = "flex";
      console.log("[GameUI] Game controls shown");
    }
  }

  /**
   * Hide game controls (when not playing)
   */
  hideGameControls() {
    const gameControls = document.getElementById("game-controls");
    if (gameControls) {
      gameControls.style.display = "none";
      console.log("[GameUI] Game controls hidden");
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

    // Clean up new component managers
    if (this.resourceGroupManager) {
      this.resourceGroupManager.destroy();
    }

    if (this.progressiveDisclosure) {
      this.progressiveDisclosure.destroy();
    }

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
    this.resourceGroupManager = null;
    this.progressiveDisclosure = null;
    this.initialized = false;

    console.log("[GameUI] UI destroyed");
  }
}

export default GameUI;
