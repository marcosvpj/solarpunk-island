import BaseScreen from "./BaseScreen.js";
import { SCREENS } from "../../configs/screens.js";
import { ERAS, getCurrentEra, getEraProgress } from "../../configs/screens.js";
import { gameColors, pixiColors } from "../../configs/colors.js";

/**
 * ProgressionScreen - Era and statistics display
 *
 * Shows the player's progression through different eras and colony statistics.
 * Displayed when continuing a saved game or viewing progress.
 */
export class ProgressionScreen extends BaseScreen {
  constructor(container, screenManager, app) {
    super(container, screenManager, app);

    this.gameData = null;
    this.currentEra = null;
    this.eraProgress = 0;
  }

  /**
   * Initialize the progression screen
   * @param {Object} data - Game data with statistics
   */
  async init(data = {}) {
    await super.init(data);

    // Store game data for display
    this.gameData = data;
    this.currentEra = getCurrentEra(data.currentTurn || 1);
    this.eraProgress = getEraProgress(data.currentTurn || 1);

    this.createUI();

    console.log("[ProgressionScreen] Initialized progression screen");
  }

  /**
   * Show the progression screen
   */
  show() {
    super.show();

    // Add entrance animation
    this.playEntranceAnimation();
  }

  /**
   * Create the progression screen UI
   */
  createUI() {
    const center = this.getScreenCenter();

    // Title
    const title = this.createTitle(
      "Colony Progress",
      {
        x: center.x,
        y: this.getResponsiveSize(80),
      },
      {
        fontSize: this.getResponsiveFontSize(this.isMobile ? 24 : 32),
      },
    );
    this.uiContainer.addChild(title);

    // Era display section
    this.createEraDisplay(center);

    // Statistics section
    this.createStatisticsDisplay(center);

    // Action buttons
    this.createActionButtons(center);

    console.log("[ProgressionScreen] Created progression UI");
  }

  /**
   * Create era progression display
   * @param {Object} center - Screen center position
   */
  createEraDisplay(center) {
    const eraContainer = new PIXI.Container();
    eraContainer.position.set(center.x, center.y - this.getResponsiveSize(100));
    this.uiContainer.addChild(eraContainer);

    // Era title
    const eraTitle = this.createText(
      `Current Era: ${this.currentEra.name}`,
      { x: 0, y: 0 },
      {
        fontSize: this.getResponsiveFontSize(this.isMobile ? 16 : 20),
        color: this.currentEra.color,
        anchor: 0.5,
      },
    );
    eraContainer.addChild(eraTitle);

    // Era description
    const eraDescription = this.createText(
      this.currentEra.description,
      { x: 0, y: this.getResponsiveSize(30) },
      {
        fontSize: this.getResponsiveFontSize(12),
        color: gameColors.buttonText,
        maxWidth: this.getResponsiveSize(400),
        anchor: 0.5,
      },
    );
    eraContainer.addChild(eraDescription);

    // Era progress bar
    this.createEraProgressBar(eraContainer);
  }

  /**
   * Create era progress bar
   * @param {PIXI.Container} container - Container to add progress bar to
   */
  createEraProgressBar(container) {
    const progressContainer = new PIXI.Container();
    progressContainer.position.set(0, this.getResponsiveSize(70));
    container.addChild(progressContainer);

    const barWidth = this.getResponsiveSize(300);
    const barHeight = this.getResponsiveSize(20);

    // Progress bar background
    const progressBg = new PIXI.Graphics();
    progressBg.roundRect(-barWidth / 2, 0, barWidth, barHeight, 10);
    progressBg.fill({ color: pixiColors.background.secondary, alpha: 0.5 });
    // progressBg.endFill();
    progressContainer.addChild(progressBg);

    // Progress bar fill
    const progressFill = new PIXI.Graphics();
    progressFill.roundRect(
      -barWidth / 2,
      0,
      barWidth * this.eraProgress,
      barHeight,
      10,
    );
    progressFill.fill({ color: this.currentEra.color, alpha: 0.8 });
    // progressFill.endFill();
    progressContainer.addChild(progressFill);

    // Progress percentage text
    const progressText = this.createText(
      `${Math.floor(this.eraProgress * 100)}% to next era`,
      { x: 0, y: barHeight + this.getResponsiveSize(25) },
      {
        fontSize: this.getResponsiveFontSize(10),
        color: gameColors.tooltipText,
        anchor: 0.5,
      },
    );
    progressContainer.addChild(progressText);

    // Era milestones
    this.createEraMilestones(progressContainer, barWidth);
  }

  /**
   * Create era milestone markers
   * @param {PIXI.Container} container - Container to add milestones to
   * @param {number} barWidth - Width of progress bar
   */
  createEraMilestones(container, barWidth) {
    const eras = Object.values(ERAS);
    const currentTurn = this.gameData.currentTurn || 1;

    eras.forEach((era, index) => {
      if (index === 0) return; // Skip first era (always unlocked)

      // Calculate position based on unlock turn
      const maxTurn = eras[eras.length - 1].unlockTurn;
      const position = (era.unlockTurn / maxTurn) * barWidth - barWidth / 2;

      // Milestone marker
      const marker = new PIXI.Graphics();
      const isUnlocked = currentTurn >= era.unlockTurn;
      const color = isUnlocked ? era.color : pixiColors.background.secondary;

      marker.fill(color);
      marker.drawCircle(position, 10, 6);
      // marker.endFill();

      // Era name below marker
      const markerText = this.createText(
        era.name,
        { x: position, y: 25 },
        {
          fontSize: this.getResponsiveFontSize(8),
          color: isUnlocked ? era.color : gameColors.tooltipText,
          anchor: 0.5,
        },
      );

      container.addChild(marker);
      container.addChild(markerText);
    });
  }

  /**
   * Create statistics display
   * @param {Object} center - Screen center position
   */
  createStatisticsDisplay(center) {
    const statsContainer = new PIXI.Container();
    statsContainer.position.set(
      center.x,
      center.y + this.getResponsiveSize(50),
    );
    this.uiContainer.addChild(statsContainer);

    // Statistics title
    const statsTitle = this.createText(
      "Colony Statistics",
      { x: 0, y: 0 },
      {
        fontSize: this.getResponsiveFontSize(16),
        color: gameColors.tooltipText,
        anchor: 0.5,
      },
    );
    statsContainer.addChild(statsTitle);

    // Create statistics grid
    this.createStatisticsGrid(statsContainer);
  }

  /**
   * Create statistics grid display
   * @param {PIXI.Container} container - Container for statistics
   */
  createStatisticsGrid(container) {
    const stats = this.getGameStatistics();
    const gridContainer = new PIXI.Container();
    gridContainer.position.set(0, this.getResponsiveSize(30));
    container.addChild(gridContainer);

    const columns = this.isMobile ? 2 : 3;
    const columnWidth = this.getResponsiveSize(150);
    const rowHeight = this.getResponsiveSize(40);

    stats.forEach((stat, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);

      const x = (col - (columns - 1) / 2) * columnWidth;
      const y = row * rowHeight;

      // Stat label
      const label = this.createText(
        stat.label,
        { x: x, y: y },
        {
          fontSize: this.getResponsiveFontSize(10),
          color: gameColors.buttonText,
          anchor: 0.5,
        },
      );

      // Stat value
      const value = this.createText(
        stat.value.toString(),
        { x: x, y: y + this.getResponsiveSize(15) },
        {
          fontSize: this.getResponsiveFontSize(14),
          color: gameColors.tooltipText,
          anchor: 0.5,
        },
      );

      gridContainer.addChild(label);
      gridContainer.addChild(value);
    });
  }

  /**
   * Get game statistics for display
   * @returns {Array} Array of stat objects
   */
  getGameStatistics() {
    const data = this.gameData;

    return [
      { label: "Turns Survived", value: data.currentTurn || 1 },
      { label: "Buildings Built", value: data.buildingsBuilt || 0 },
      { label: "Resources Collected", value: data.resourcesCollected || 0 },
      { label: "Fuel Remaining", value: data.fuel || 15 },
      { label: "Materials Stored", value: data.materials || 5 },
      { label: "Waste Processed", value: data.wasteProcessed || 0 },
      { label: "Drones Created", value: data.dronesCreated || 0 },
      { label: "Colony Population", value: data.population || 1 },
      {
        label: "Days Survived",
        value: Math.floor((data.currentTurn || 1) / 4),
      }, // 4 turns per day
    ];
  }

  /**
   * Create action buttons
   * @param {Object} center - Screen center position
   */
  createActionButtons(center) {
    const buttonContainer = new PIXI.Container();
    buttonContainer.position.set(
      center.x,
      this.app.screen.height - this.getResponsiveSize(120),
    );
    this.uiContainer.addChild(buttonContainer);

    // Continue Game button
    const continueButton = this.createButton(
      "Continue Colony",
      { x: -this.getResponsiveSize(110), y: 0 },
      () => this.continueGame(),
      {
        width: this.getResponsiveSize(200),
        height: this.getResponsiveSize(50),
        fontSize: this.getResponsiveFontSize(14),
        color: pixiColors.state.success,
      },
    );
    buttonContainer.addChild(continueButton);

    // New Game button
    const newGameButton = this.createButton(
      "Start Over",
      { x: this.getResponsiveSize(110), y: 0 },
      () => this.startNewGame(),
      {
        width: this.getResponsiveSize(200),
        height: this.getResponsiveSize(50),
        fontSize: this.getResponsiveFontSize(14),
        color: pixiColors.background.interactive,
      },
    );
    buttonContainer.addChild(newGameButton);

    // Back to Menu button
    const backButton = this.createButton(
      "Back to Menu",
      { x: 0, y: this.getResponsiveSize(70) },
      () => this.backToMenu(),
      {
        width: this.getResponsiveSize(200),
        height: this.getResponsiveSize(40),
        fontSize: this.getResponsiveFontSize(12),
        color: pixiColors.background.secondary,
      },
    );
    buttonContainer.addChild(backButton);
  }

  /**
   * Play entrance animation
   */
  playEntranceAnimation() {
    // Staggered fade-in animation
    this.uiContainer.alpha = 0;

    const startTime = Date.now();
    const duration = 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      this.uiContainer.alpha = easedProgress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Continue the current game
   */
  continueGame() {
    console.log("[ProgressionScreen] Continuing game");

    this.navigateToScreen(SCREENS.GAME, {
      data: {
        isNewGame: false,
        gameData: this.gameData,
      },
    });
  }

  /**
   * Start a new game
   */
  startNewGame() {
    console.log("[ProgressionScreen] Starting new game");

    this.navigateToScreen(SCREENS.GAME, {
      data: { isNewGame: true },
    });
  }

  /**
   * Return to main menu
   */
  backToMenu() {
    console.log("[ProgressionScreen] Returning to main menu");

    this.navigateToScreen(SCREENS.START);
  }

  /**
   * Handle screen resize
   */
  onResize() {
    super.onResize();

    // Recreate UI with new responsive scaling
    this.uiContainer.removeChildren();
    this.createUI();
  }

  /**
   * Clean up progression screen
   */
  destroy() {
    super.destroy();

    console.log("[ProgressionScreen] Destroyed progression screen");
  }
}

export default ProgressionScreen;
