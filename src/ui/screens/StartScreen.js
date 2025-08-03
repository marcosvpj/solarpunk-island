import BaseScreen from "./BaseScreen.js";
import { SCREENS, SCREEN_CONFIG } from "../../configs/screens.js";
import { gameColors, pixiColors } from "../../configs/colors.js";
import {
  getAvailableGameModes,
  GAME_MODE_DISPLAY_ORDER,
} from "../../gameModes/GameModeConfig.js";
import gameModeManager from "../../gameModes/GameModeManager.js";

/**
 * StartScreen - Main menu screen
 *
 * Displays the game title and main menu options.
 * Provides entry points for new games and continuing saved games.
 */
export class StartScreen extends BaseScreen {
  constructor(container, screenManager, app) {
    super(container, screenManager, app);

    this.hasExistingSave = false; // Will be updated when save system is implemented
    this.availableGameModes = getAvailableGameModes();
  }

  /**
   * Initialize the start screen
   * @param {Object} data - Initialization data
   */
  async init(data = {}) {
    await super.init(data);

    // Check for existing save (future implementation)
    this.checkForExistingSave();

    this.createUI();

    console.log("[StartScreen] Initialized start screen");
  }

  /**
   * Show the start screen
   */
  show() {
    super.show();

    // Add entrance animation (future enhancement)
    this.playEntranceAnimation();
  }

  /**
   * Create the start screen UI
   */
  createUI() {
    this.createMainMenuUI();
  }

  /**
   * Create the main menu UI
   */
  createMainMenuUI() {
    const center = this.getScreenCenter();

    // Game title
    const config = SCREEN_CONFIG[SCREENS.START];
    const title = this.createTitle(
      config.title,
      {
        x: center.x,
        y: center.y - this.getResponsiveSize(150),
      },
      {
        fontSize: this.getResponsiveFontSize(this.isMobile ? 24 : 36),
      },
    );
    this.uiContainer.addChild(title);

    // Subtitle/tagline
    const subtitle = this.createText(
      "Survive, Build, Thrive in the Floating Islands",
      {
        x: center.x,
        y: center.y - this.getResponsiveSize(100),
      },
      {
        fontSize: this.getResponsiveFontSize(this.isMobile ? 12 : 16),
        color: gameColors.buttonText,
        maxWidth: this.getResponsiveSize(500),
      },
    );
    this.uiContainer.addChild(subtitle);

    // Menu buttons container
    const buttonContainer = new PIXI.Container();
    buttonContainer.position.set(center.x, center.y);
    this.uiContainer.addChild(buttonContainer);

    // Get game mode configurations
    const storyMode = this.availableGameModes.find(
      (mode) => mode.mode === "story",
    );
    const longTomorrowMode = this.availableGameModes.find(
      (mode) => mode.mode === "long_tomorrow",
    );

    // Play Campaign button (Story Mode)
    const campaignButton = this.createButton(
      "Play Campaign",
      { x: -this.getResponsiveSize(100), y: -this.getResponsiveSize(60) },
      () => this.startGameWithMode("story"),
      {
        width: this.getResponsiveSize(200),
        height: this.getResponsiveSize(50),
        fontSize: this.getResponsiveFontSize(16),
        color: storyMode ? storyMode.color : pixiColors.background.interactive,
      },
    );
    buttonContainer.addChild(campaignButton);

    // Campaign description
    const campaignDesc = this.createText(
      "Discrete challenges with clear objectives",
      { x: -this.getResponsiveSize(100), y: -this.getResponsiveSize(25) },
      {
        fontSize: this.getResponsiveFontSize(10),
        color: gameColors.tooltipText,
        maxWidth: this.getResponsiveSize(200),
        anchor: 0.5,
      },
    );
    buttonContainer.addChild(campaignDesc);

    // Play The Long Tomorrow button
    const longTomorrowButton = this.createButton(
      "Play The Long Tomorrow",
      { x: -this.getResponsiveSize(100), y: this.getResponsiveSize(20) },
      () => this.startGameWithMode("long_tomorrow"),
      {
        width: this.getResponsiveSize(200),
        height: this.getResponsiveSize(50),
        fontSize: this.getResponsiveFontSize(16),
        color: longTomorrowMode
          ? longTomorrowMode.color
          : pixiColors.background.interactive,
      },
    );
    buttonContainer.addChild(longTomorrowButton);

    // Long Tomorrow description
    const longTomorrowDesc = this.createText(
      "Persistent world evolution across sessions",
      { x: -this.getResponsiveSize(100), y: this.getResponsiveSize(55) },
      {
        fontSize: this.getResponsiveFontSize(10),
        color: gameColors.tooltipText,
        maxWidth: this.getResponsiveSize(200),
        anchor: 0.5,
      },
    );
    buttonContainer.addChild(longTomorrowDesc);

    // Continue button (enabled/disabled based on save)
    const continueButton = this.createButton(
      "Continue",
      { x: -this.getResponsiveSize(100), y: this.getResponsiveSize(100) },
      () => this.continueGame(),
      {
        width: this.getResponsiveSize(200),
        height: this.getResponsiveSize(50),
        fontSize: this.getResponsiveFontSize(16),
        color: this.hasExistingSave
          ? pixiColors.background.interactive
          : pixiColors.background.secondary,
        hoverColor: this.hasExistingSave
          ? pixiColors.state.success
          : pixiColors.background.secondary,
        textColor: this.hasExistingSave
          ? gameColors.buttonText
          : gameColors.tooltipText,
      },
    );
    buttonContainer.addChild(continueButton);

    // Settings button (future implementation)
    const settingsButton = this.createButton(
      "Settings",
      { x: -this.getResponsiveSize(100), y: this.getResponsiveSize(180) },
      () => this.openSettings(),
      {
        width: this.getResponsiveSize(200),
        height: this.getResponsiveSize(50),
        fontSize: this.getResponsiveFontSize(16),
        color: pixiColors.background.secondary, // Disabled for now
        hoverColor: pixiColors.background.secondary,
        textColor: gameColors.tooltipText,
      },
    );
    buttonContainer.addChild(settingsButton);

    // Version info (bottom of screen)
    const versionText = this.createText(
      "v0.1.0 - Early Development",
      {
        x: center.x,
        y: this.app.screen.height - this.getResponsiveSize(30),
      },
      {
        fontSize: this.getResponsiveFontSize(10),
        color: gameColors.tooltipText,
        anchor: 0.5,
      },
    );
    this.uiContainer.addChild(versionText);

    // Add animated background elements (future enhancement)
    this.createBackgroundAnimation();
  }

  /**
   * Start game with selected mode
   */
  startGameWithMode(gameMode) {
    console.log("[StartScreen] Starting game with mode:", gameMode);

    // Set the game mode in the manager
    const sessionData = gameModeManager.startNewSession(gameMode, {
      startedFromMenu: true,
    });

    this.navigateToScreen(SCREENS.GAME, {
      data: {
        isNewGame: true,
        gameMode: gameMode,
        sessionData: sessionData,
      },
    });
  }

  /**
   * Create animated background elements
   */
  createBackgroundAnimation() {
    // Add floating particle effects or animated islands
    // This can be enhanced later with more sophisticated animations

    const numParticles = this.isMobile ? 15 : 25;
    this.particles = [];

    for (let i = 0; i < numParticles; i++) {
      const particle = new PIXI.Graphics();
      particle.fill({ color: gameColors.tooltipText, alpha: 0.1 });
      particle.circle(0, 0, Math.random() * 3 + 1);
      // particle.endFill();

      // Random position
      particle.x = Math.random() * this.app.screen.width;
      particle.y = Math.random() * this.app.screen.height;

      // Random velocity
      particle.vx = (Math.random() - 0.5) * 0.5;
      particle.vy = (Math.random() - 0.5) * 0.5;

      this.backgroundContainer.addChild(particle);
      this.particles.push(particle);
    }

    // Start particle animation
    this.animateParticles();
  }

  /**
   * Animate background particles
   */
  animateParticles() {
    if (!this.isVisible || !this.particles) return;

    this.particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Wrap around screen edges
      if (particle.x < 0) particle.x = this.app.screen.width;
      if (particle.x > this.app.screen.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.app.screen.height;
      if (particle.y > this.app.screen.height) particle.y = 0;
    });

    // Continue animation
    requestAnimationFrame(() => this.animateParticles());
  }

  /**
   * Play entrance animation
   */
  playEntranceAnimation() {
    // Fade in UI elements with staggered timing
    this.uiContainer.alpha = 0;

    const startTime = Date.now();
    const duration = 800;

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
   * Check for existing save game (future implementation)
   */
  checkForExistingSave() {
    // TODO: Implement save system
    // For now, simulate no existing save
    this.hasExistingSave = false;

    // Future implementation:
    // this.hasExistingSave = SaveSystem.hasSave();
  }

  /**
   * Continue existing game
   */
  continueGame() {
    if (!this.hasExistingSave) {
      console.log("[StartScreen] No existing save to continue");
      return;
    }

    console.log("[StartScreen] Continuing existing game");

    // Future: Load save game, show progression screen first
    // const saveData = SaveSystem.loadSave();
    // this.navigateToScreen(SCREENS.PROGRESSION, { data: saveData });

    // For now, go directly to game
    this.navigateToScreen(SCREENS.GAME, {
      data: { isNewGame: false },
    });
  }

  /**
   * Open settings screen (future implementation)
   */
  openSettings() {
    console.log("[StartScreen] Settings not implemented yet");

    // Future implementation:
    // this.navigateToScreen(SCREENS.SETTINGS);
  }

  /**
   * Handle screen resize
   */
  onResize() {
    super.onResize();

    // Recreate UI with new responsive scaling
    this.uiContainer.removeChildren();
    this.createUI();

    // Recreate particles for new screen size
    if (this.particles) {
      this.particles.forEach((particle) => {
        this.backgroundContainer.removeChild(particle);
      });
      this.particles = [];
      this.createBackgroundAnimation();
    }
  }

  /**
   * Clean up start screen
   */
  destroy() {
    // Stop particle animation
    this.particles = null;

    super.destroy();

    console.log("[StartScreen] Destroyed start screen");
  }
}

export default StartScreen;
