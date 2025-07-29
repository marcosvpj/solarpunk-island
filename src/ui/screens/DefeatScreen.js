import BaseScreen from './BaseScreen.js';
import { pixiColors, gameColors, colors } from '../../configs/colors.js';
import { SCREENS } from '../../configs/screens.js';
import EventBus from '../../engine/EventBus.js';

/**
 * DefeatScreen - Screen shown when player fails a level
 * 
 * Shows failure reason, statistics, and options to retry
 * the level or return to progression overview.
 */
export default class DefeatScreen extends BaseScreen {
    constructor(container, screenManager, app) {
        super(container, screenManager, app);
        this.failureContainer = null;
        this.reasonContainer = null;
        this.buttonsContainer = null;
        this.defeatData = null;
    }

    /**
     * Create defeat screen content with failure data
     * @param {Object} data - Defeat data from ProgressionManager
     */
    async init(data = {}) {
        await super.init(data);
        
        this.defeatData = data;
        console.log('[DefeatScreen] Creating defeat screen with data:', data);
        
        // Create main failure content
        this.createFailureHeader();
        this.createFailureReasons();
        this.createActionButtons();
        
        console.log('[DefeatScreen] Defeat screen created');
    }

    /**
     * Create semi-transparent background overlay
     */
    createBackground() {
        // Clear existing background
        this.backgroundContainer.removeChildren();
        
        // Create semi-transparent dark overlay
        const overlay = new PIXI.Graphics();
        overlay.rect(0, 0, this.app.screen.width, this.app.screen.height);
        overlay.fill({color: 0x000000, alpha: 0.7});
        
        this.backgroundContainer.addChild(overlay);
    }

    /**
     * Create the main failure header
     */
    createFailureHeader() {
        this.failureContainer = new PIXI.Container();
        this.failureContainer.position.set(this.app.screen.width / 2, 120);
        this.uiContainer.addChild(this.failureContainer);

        // Main defeat title
        const defeatTitle = new PIXI.Text({
            text: '💀 CIVILIZATION FALLEN 💀',
            style: {
                fontFamily: 'Arial',
                fontSize: this.getResponsiveFontSize(28),
                fill: colors.state.error,
                fontWeight: 'bold',
                align: 'center'
            }
        });
        defeatTitle.anchor.set(0.5, 0);
        this.failureContainer.addChild(defeatTitle);

        // Level name
        const levelName = this.defeatData?.level?.name || 'Unknown Level';
        const levelTitle = new PIXI.Text({
            text: `Level: ${levelName}`,
            style: {
                fontFamily: 'Arial',
                fontSize: this.getResponsiveFontSize(20),
                fill: gameColors.tooltipText,
                fontWeight: 'bold',
                align: 'center'
            }
        });
        levelTitle.anchor.set(0.5, 0);
        levelTitle.position.set(0, 45);
        this.failureContainer.addChild(levelTitle);

        // Failure message
        const failureMessage = new PIXI.Text({
            text: 'Your colony was unable to meet the survival requirements.',
            style: {
                fontFamily: 'Arial',
                fontSize: this.getResponsiveFontSize(16),
                fill: gameColors.buttonText,
                align: 'center',
                wordWrap: true,
                wordWrapWidth: this.app.screen.width - 100
            }
        });
        failureMessage.anchor.set(0.5, 0);
        failureMessage.position.set(0, 80);
        this.failureContainer.addChild(failureMessage);
    }

    /**
     * Create failure reasons display
     */
    createFailureReasons() {
        this.reasonContainer = new PIXI.Container();
        this.reasonContainer.position.set(this.app.screen.width / 2, 280);
        this.uiContainer.addChild(this.reasonContainer);

        // Reasons background
        const reasonsBg = new PIXI.Graphics();
        const reasonsWidth = 400;
        const reasonsHeight = 200;
        reasonsBg.roundRect(-reasonsWidth/2, 0, reasonsWidth, reasonsHeight, 12);
        reasonsBg.fill({color: pixiColors.background.elevated, alpha: 0.8});
        this.reasonContainer.addChild(reasonsBg);

        // Reasons title
        const reasonsTitle = new PIXI.Text({
            text: 'Failure Analysis',
            style: {
                fontFamily: 'Arial',
                fontSize: this.getResponsiveFontSize(18),
                fill: colors.state.error,
                fontWeight: 'bold',
                align: 'center'
            }
        });
        reasonsTitle.anchor.set(0.5, 0);
        reasonsTitle.position.set(0, 15);
        this.reasonContainer.addChild(reasonsTitle);

        // Display failure reasons
        const triggeredConditions = this.defeatData?.triggeredConditions || [];
        if (triggeredConditions.length > 0) {
            triggeredConditions.forEach((conditionData, index) => {
                const condition = conditionData.condition;
                const reasonText = this.getFailureReasonText(condition);
                
                const reasonItem = new PIXI.Text({
                    text: `• ${reasonText}`,
                    style: {
                        fontFamily: 'Arial',
                        fontSize: this.getResponsiveFontSize(14),
                        fill: gameColors.buttonText,
                        align: 'left',
                        wordWrap: true,
                        wordWrapWidth: reasonsWidth - 40
                    }
                });
                reasonItem.anchor.set(0.5, 0);
                reasonItem.position.set(0, 50 + index * 30);
                this.reasonContainer.addChild(reasonItem);
            });
        } else {
            // Fallback if no specific reasons
            const genericReason = new PIXI.Text({
                text: '• Failed to meet level objectives in time',
                style: {
                    fontFamily: 'Arial',
                    fontSize: this.getResponsiveFontSize(14),
                    fill: gameColors.buttonText,
                    align: 'center'
                }
            });
            genericReason.anchor.set(0.5, 0);
            genericReason.position.set(0, 50);
            this.reasonContainer.addChild(genericReason);
        }

        // Stats
        const failTime = this.defeatData?.failTime || 0;
        const failTurn = this.defeatData?.failTurn || 0;
        const timeMinutes = Math.floor(failTime / 60000);
        const timeSeconds = Math.floor((failTime % 60000) / 1000);

        const statsText = new PIXI.Text({
            text: `Failed on turn ${failTurn} after ${timeMinutes}m ${timeSeconds}s`,
            style: {
                fontFamily: 'Arial',
                fontSize: this.getResponsiveFontSize(12),
                fill: pixiColors.text.muted,
                align: 'center'
            }
        });
        statsText.anchor.set(0.5, 0);
        statsText.position.set(0, 160);
        this.reasonContainer.addChild(statsText);
    }

    /**
     * Get human-readable failure reason text
     * @param {BaseCondition} condition - The failed condition
     * @returns {string} Human-readable reason
     */
    getFailureReasonText(condition) {
        const type = condition.getType();
        
        switch (type) {
            case 'fueldepletion':
                return 'Fuel reserves depleted - civilization power systems failed';
            case 'turnlimit':
                return 'Time limit exceeded - objectives not completed in time';
            case 'storageexceeded':
                return 'Resource storage limits exceeded - colony overwhelmed';
            case 'resourcedepletion':
                return 'Critical resources depleted - colony could not sustain itself';
            default:
                return condition.getDescription() || 'Unknown failure condition';
        }
    }

    /**
     * Create action buttons for next steps
     */
    createActionButtons() {
        this.buttonsContainer = new PIXI.Container();
        this.buttonsContainer.position.set(this.app.screen.width / 2, this.app.screen.height - 120);
        this.uiContainer.addChild(this.buttonsContainer);

        const buttonWidth = 160;
        const buttonSpacing = 180;

        // Retry level button
        if (this.defeatData?.canRetry !== false) {
            const retryBtn = this.createButton(
                'Retry Level',
                { x: -buttonSpacing/2, y: 0 },
                () => this.handleRetryLevel(),
                {
                    width: buttonWidth,
                    height: 50,
                    color: colors.state.warning,
                    textColor: gameColors.buttonText
                }
            );
            this.buttonsContainer.addChild(retryBtn);
        }

        // Return to progression screen button
        const progressionBtn = this.createButton(
            'View Progress',
            { x: this.defeatData?.canRetry !== false ? buttonSpacing/2 : 0, y: 0 },
            () => this.handleViewProgress(),
            {
                width: buttonWidth,
                height: 50,
                color: pixiColors.accent.primary,
                textColor: gameColors.buttonText
            }
        );
        this.buttonsContainer.addChild(progressionBtn);

        // Tips for improvement
        const tipsText = new PIXI.Text({
            text: 'Tip: Ensure you have both refineries operational and manage fuel carefully!',
            style: {
                fontFamily: 'Arial',
                fontSize: this.getResponsiveFontSize(12),
                fill: pixiColors.text.muted,
                align: 'center',
                wordWrap: true,
                wordWrapWidth: this.app.screen.width - 100
            }
        });
        tipsText.anchor.set(0.5, 0);
        tipsText.position.set(0, -80);
        this.buttonsContainer.addChild(tipsText);
    }

    /**
     * Handle retry level
     */
    handleRetryLevel() {
        console.log('[DefeatScreen] Retrying level:', this.defeatData?.levelId);
        
        // Emit event to restart current level
        EventBus.emit('game:restartLevel');
        
        // Return to game screen
        window.screenManager?.showScreen(SCREENS.GAME);
    }

    /**
     * Handle view progression screen
     */
    handleViewProgress() {
        console.log('[DefeatScreen] Viewing progression screen');
        window.screenManager?.showScreen(SCREENS.PROGRESSION);
    }

    /**
     * Handle screen resize
     */
    onResize() {
        super.onResize();
        
        if (this.failureContainer) {
            this.failureContainer.position.set(this.app.screen.width / 2, 120);
        }
        
        if (this.reasonContainer) {
            this.reasonContainer.position.set(this.app.screen.width / 2, 280);
        }
        
        if (this.buttonsContainer) {
            this.buttonsContainer.position.set(this.app.screen.width / 2, this.app.screen.height - 120);
        }
    }

    /**
     * Cleanup when screen is destroyed
     */
    destroy() {
        this.defeatData = null;
        super.destroy();
    }
}