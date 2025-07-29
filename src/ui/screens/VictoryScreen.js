import BaseScreen from './BaseScreen.js';
import { pixiColors, gameColors, colors } from '../../configs/colors.js';
import { SCREENS } from '../../configs/screens.js';
import EventBus from '../../engine/EventBus.js';

/**
 * VictoryScreen - Celebration screen for level completion
 * 
 * Shows congratulations, level stats, and options to continue
 * to the next level or return to progression overview.
 */
export default class VictoryScreen extends BaseScreen {
    constructor(container, screenManager, app) {
        super(container, screenManager, app);
        this.celebrationContainer = null;
        this.statsContainer = null;
        this.buttonsContainer = null;
        this.victoryData = null;
    }

    /**
     * Create victory screen content with level completion data
     * @param {Object} data - Victory data from ProgressionManager
     */
    async init(data = {}) {
        await super.init(data);
        
        this.victoryData = data;
        console.log('[VictoryScreen] Creating victory screen with data:', data);
        
        // Create main celebration content
        this.createCelebrationHeader();
        this.createLevelStats();
        this.createActionButtons();
        
        // Add victory particles/effects
        this.createVictoryEffects();
        
        console.log('[VictoryScreen] Victory screen created');
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
     * Create the main celebration header
     */
    createCelebrationHeader() {
        this.celebrationContainer = new PIXI.Container();
        this.celebrationContainer.position.set(this.app.screen.width / 2, 150);
        this.uiContainer.addChild(this.celebrationContainer);

        // Main victory title
        const victoryTitle = new PIXI.Text({
            text: '🎉 LEVEL COMPLETED! 🎉',
            style: {
                fontFamily: 'Arial',
                fontSize: this.getResponsiveFontSize(32),
                fill: colors.state.success,
                fontWeight: 'bold',
                align: 'center'
            }
        });
        victoryTitle.anchor.set(0.5, 0);
        this.celebrationContainer.addChild(victoryTitle);

        // Level name and description
        const levelName = this.victoryData?.level?.name || 'Unknown Level';
        const levelTitle = new PIXI.Text({
            text: levelName,
            style: {
                fontFamily: 'Arial',
                fontSize: this.getResponsiveFontSize(24),
                fill: gameColors.tooltipText,
                fontWeight: 'bold',
                align: 'center'
            }
        });
        levelTitle.anchor.set(0.5, 0);
        levelTitle.position.set(0, 50);
        this.celebrationContainer.addChild(levelTitle);

        // Congratulations message
        const congratsText = new PIXI.Text({
            text: 'Your civilization has successfully grown and prospered!',
            style: {
                fontFamily: 'Arial',
                fontSize: this.getResponsiveFontSize(16),
                fill: gameColors.buttonText,
                align: 'center',
                wordWrap: true,
                wordWrapWidth: this.app.screen.width - 100
            }
        });
        congratsText.anchor.set(0.5, 0);
        congratsText.position.set(0, 90);
        this.celebrationContainer.addChild(congratsText);
    }

    /**
     * Create level completion statistics
     */
    createLevelStats() {
        this.statsContainer = new PIXI.Container();
        this.statsContainer.position.set(this.app.screen.width / 2, 300);
        this.uiContainer.addChild(this.statsContainer);

        // Stats background
        const statsBg = new PIXI.Graphics();
        const statsWidth = 320;
        const statsHeight = 160;
        statsBg.roundRect(-statsWidth/2, 0, statsWidth, statsHeight, 12);
        statsBg.fill({color: pixiColors.background.elevated, alpha: 0.8});
        this.statsContainer.addChild(statsBg);

        // Stats title
        const statsTitle = new PIXI.Text({
            text: 'Completion Statistics',
            style: {
                fontFamily: 'Arial',
                fontSize: this.getResponsiveFontSize(18),
                fill: gameColors.tooltipText,
                fontWeight: 'bold',
                align: 'center'
            }
        });
        statsTitle.anchor.set(0.5, 0);
        statsTitle.position.set(0, 15);
        this.statsContainer.addChild(statsTitle);

        // Individual stats
        const completionTime = this.victoryData?.completionTime || 0;
        const completionTurns = this.victoryData?.completionTurn || 0;
        const timeMinutes = Math.floor(completionTime / 60000);
        const timeSeconds = Math.floor((completionTime % 60000) / 1000);

        const stats = [
            `Time: ${timeMinutes}m ${timeSeconds}s`,
            `Turns: ${completionTurns}`,
            `Attempt: ${this.victoryData?.stats?.attempts || 1}`
        ];

        stats.forEach((stat, index) => {
            const statText = new PIXI.Text({
                text: stat,
                style: {
                    fontFamily: 'Arial',
                    fontSize: this.getResponsiveFontSize(14),
                    fill: gameColors.buttonText,
                    align: 'center'
                }
            });
            statText.anchor.set(0.5, 0);
            statText.position.set(0, 50 + index * 25);
            this.statsContainer.addChild(statText);
        });
    }

    /**
     * Create action buttons for next steps
     */
    createActionButtons() {
        this.buttonsContainer = new PIXI.Container();
        this.buttonsContainer.position.set(this.app.screen.width / 2, this.app.screen.height - 120);
        this.uiContainer.addChild(this.buttonsContainer);

        const buttonWidth = 180;
        const buttonSpacing = 200;

        // Continue to next level button (if available)
        if (this.victoryData?.nextLevel) {
            const nextLevelBtn = this.createButton(
                'Continue to Next Level',
                { x: -buttonSpacing/2, y: 0 },
                () => this.handleNextLevel(),
                {
                    width: buttonWidth,
                    height: 50,
                    color: colors.state.success,
                    textColor: gameColors.buttonText
                }
            );
            this.buttonsContainer.addChild(nextLevelBtn);
        }

        // Return to progression screen button
        const progressionBtn = this.createButton(
            'View Progress',
            { x: this.victoryData?.nextLevel ? buttonSpacing/2 : 0, y: 0 },
            () => this.handleViewProgress(),
            {
                width: buttonWidth,
                height: 50,
                color: pixiColors.accent.primary,
                textColor: gameColors.buttonText
            }
        );
        this.buttonsContainer.addChild(progressionBtn);

        // Campaign complete message if this was the final level
        if (this.victoryData?.isCampaignComplete) {
            const campaignCompleteText = new PIXI.Text({
                text: '🏆 CAMPAIGN COMPLETED! 🏆\nYou have mastered all levels!',
                style: {
                    fontFamily: 'Arial',
                    fontSize: this.getResponsiveFontSize(18),
                    fill: colors.state.success,
                    fontWeight: 'bold',
                    align: 'center'
                }
            });
            campaignCompleteText.anchor.set(0.5, 0);
            campaignCompleteText.position.set(0, -80);
            this.buttonsContainer.addChild(campaignCompleteText);
        }
    }

    /**
     * Create victory particle effects
     */
    createVictoryEffects() {
        // Simple particle effects for celebration
        const particleContainer = new PIXI.Container();
        this.uiContainer.addChild(particleContainer);

        // Create floating particles
        for (let i = 0; i < 20; i++) {
            const particle = new PIXI.Graphics();
            particle.circle(0, 0, Math.random() * 3 + 2);
            particle.fill({color: colors.state.success, alpha: 0.6});
            
            particle.position.set(
                Math.random() * this.app.screen.width,
                Math.random() * this.app.screen.height
            );
            
            // Simple floating animation
            particle.vy = -(Math.random() * 2 + 1);
            particle.vx = (Math.random() - 0.5) * 2;
            
            particleContainer.addChild(particle);
        }

        // Animate particles
        const animateParticles = () => {
            particleContainer.children.forEach(particle => {
                particle.position.y += particle.vy;
                particle.position.x += particle.vx;
                particle.alpha *= 0.99;
                
                // Reset particle when it goes off screen
                if (particle.position.y < -10 || particle.alpha < 0.1) {
                    particle.position.y = this.app.screen.height + 10;
                    particle.position.x = Math.random() * this.app.screen.width;
                    particle.alpha = 0.6;
                }
            });
            
            if (this.uiContainer.parent) {
                requestAnimationFrame(animateParticles);
            }
        };
        
        animateParticles();
    }

    /**
     * Handle continue to next level
     */
    handleNextLevel() {
        console.log('[VictoryScreen] Continuing to next level:', this.victoryData?.nextLevel?.id);
        
        // Emit event to start next level
        if (this.victoryData?.nextLevel) {
            EventBus.emit('game:nextLevel');
        }
        
        // Return to game screen
        window.screenManager?.showScreen(SCREENS.GAME);
    }

    /**
     * Handle view progression screen
     */
    handleViewProgress() {
        console.log('[VictoryScreen] Viewing progression screen');
        window.screenManager?.showScreen(SCREENS.PROGRESSION);
    }

    /**
     * Handle screen resize
     */
    onResize() {
        super.onResize();
        
        if (this.celebrationContainer) {
            this.celebrationContainer.position.set(this.app.screen.width / 2, 150);
        }
        
        if (this.statsContainer) {
            this.statsContainer.position.set(this.app.screen.width / 2, 300);
        }
        
        if (this.buttonsContainer) {
            this.buttonsContainer.position.set(this.app.screen.width / 2, this.app.screen.height - 120);
        }
    }

    /**
     * Cleanup when screen is destroyed
     */
    destroy() {
        this.victoryData = null;
        super.destroy();
    }
}