import { pixiColors, gameColors } from '../configs/colors.js';

// UI Manager for floating menus and tooltips
export class UIManager {
    constructor(uiContainer, app) {
        this.tooltip = null;
        this.contextMenu = null;
        this.uiContainer = uiContainer;
        this.app = app;
    }

    createTooltip(text, position) {
        this.clearTooltip();

        this.tooltip = new PIXI.Graphics();
        this.tooltip.beginFill(gameColors.tooltipBackground, 0.95);
        this.tooltip.lineStyle(2, gameColors.tooltipBorder);
        this.tooltip.drawRoundedRect(0, 0, 200, 60, 8);
        this.tooltip.endFill();
        this.tooltip.position.set(position.x, position.y - 70);

        const tooltipText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: gameColors.tooltipText,
            wordWrap: true,
            wordWrapWidth: 180
        });
        tooltipText.position.set(10, 10);
        this.tooltip.addChild(tooltipText);

        this.uiContainer.addChild(this.tooltip);
    }

    createContextMenu(options, position) {
        this.clearContextMenu();

        this.contextMenu = new PIXI.Graphics();
        this.contextMenu.beginFill(gameColors.menuBackground, 0.95);
        this.contextMenu.lineStyle(2, gameColors.tooltipBorder);
        const height = options.length * 40 + 20;
        this.contextMenu.drawRoundedRect(0, 0, 220, height, 8);
        this.contextMenu.endFill();
        this.contextMenu.position.set(
            Math.min(position.x, this.app.screen.width - 240),
            Math.min(position.y, this.app.screen.height - height - 20)
        );

        // Add options
        options.forEach((option, i) => {
            const optionBg = new PIXI.Graphics();
            optionBg.beginFill(pixiColors.background.interactive);
            optionBg.drawRoundedRect(10, 10 + i * 40, 200, 30, 4);
            optionBg.endFill();
            optionBg.interactive = true;
            optionBg.buttonMode = true;

            optionBg.on('pointerdown', () => {
                option.action();
                this.clearContextMenu();
            });

            optionBg.on('pointerenter', () => {
                optionBg.clear();
                optionBg.beginFill(pixiColors.state.success);
                optionBg.drawRoundedRect(10, 10 + i * 40, 200, 30, 4);
                optionBg.endFill();
            });
            optionBg.on('pointerleave', () => {
                optionBg.clear();
                optionBg.beginFill(pixiColors.background.interactive);
                optionBg.drawRoundedRect(10, 10 + i * 40, 200, 30, 4);
                optionBg.endFill();
            });
            

            const optionText = new PIXI.Text(option.label, {
                fontFamily: 'Arial',
                fontSize: 16,
                fill: gameColors.buttonText
            });
            optionText.position.set(20, 17 + i * 40);
            optionText.on('pointerdown', () => {
                option.action();
                this.clearContextMenu();
            });
            optionBg.addChild(optionText);
            this.contextMenu.addChild(optionBg);
        });

        this.uiContainer.addChild(this.contextMenu);
    }

    clearTooltip() {
        if (this.tooltip) {
            this.uiContainer.removeChild(this.tooltip);
            this.tooltip.destroy();
            this.tooltip = null;
        }
    }

    clearContextMenu() {
        if (this.contextMenu) {
            this.uiContainer.removeChild(this.contextMenu);
            this.contextMenu.destroy();
            this.contextMenu = null;
        }
    }
}