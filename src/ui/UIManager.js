import { pixiColors, gameColors } from '../configs/colors.js';

// UI Manager for floating menus and tooltips
export class UIManager {
    constructor(uiContainer, app) {
        this.tooltip = null;
        this.contextMenu = null;
        this.uiContainer = uiContainer;
        this.app = app;
        
        // Mobile/responsive settings
        this.isMobile = this.detectMobile();
        this.responsiveScale = this.getResponsiveScale();
    }
    
    detectMobile() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    getResponsiveScale() {
        const screenWidth = window.innerWidth;
        if (screenWidth <= 480) return 0.7; // Small phones
        if (screenWidth <= 768) return 0.8; // Tablets and larger phones
        return 1.0; // Desktop
    }
    
    getResponsiveFontSize(baseFontSize) {
        return Math.floor(baseFontSize * this.responsiveScale);
    }
    
    getResponsiveSize(baseSize) {
        return Math.floor(baseSize * this.responsiveScale);
    }

    createTooltip(text, position) {
        this.clearTooltip();

        // Responsive sizing
        const tooltipWidth = this.getResponsiveSize(this.isMobile ? 160 : 200);
        const tooltipHeight = this.getResponsiveSize(60);
        const fontSize = this.getResponsiveFontSize(this.isMobile ? 12 : 16);
        const padding = this.getResponsiveSize(10);
        
        this.tooltip = new PIXI.Graphics();
        this.tooltip.beginFill(gameColors.tooltipBackground, 0.95);
        this.tooltip.lineStyle(2, gameColors.tooltipBorder);
        this.tooltip.drawRoundedRect(0, 0, tooltipWidth, tooltipHeight, 8);
        this.tooltip.endFill();
        
        // Position tooltip to stay within screen bounds
        let tooltipX = position.x;
        let tooltipY = position.y - tooltipHeight - 10;
        
        // Ensure tooltip stays within screen boundaries
        if (tooltipX + tooltipWidth > this.app.screen.width) {
            tooltipX = this.app.screen.width - tooltipWidth - 10;
        }
        if (tooltipX < 10) {
            tooltipX = 10;
        }
        if (tooltipY < 10) {
            tooltipY = position.y + 10; // Show below if no space above
        }
        
        this.tooltip.position.set(tooltipX, tooltipY);

        const tooltipText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: fontSize,
            fill: gameColors.tooltipText,
            wordWrap: true,
            wordWrapWidth: tooltipWidth - (padding * 2)
        });
        tooltipText.position.set(padding, padding);
        this.tooltip.addChild(tooltipText);

        this.uiContainer.addChild(this.tooltip);
    }

    createContextMenu(options, position) {
        this.clearContextMenu();

        // Responsive sizing
        const menuWidth = this.getResponsiveSize(this.isMobile ? 180 : 220);
        const itemHeight = this.getResponsiveSize(this.isMobile ? 30 : 40);
        const fontSize = this.getResponsiveFontSize(this.isMobile ? 12 : 16);
        const padding = this.getResponsiveSize(10);
        const menuHeight = options.length * itemHeight + padding * 2;
        
        this.contextMenu = new PIXI.Graphics();
        this.contextMenu.beginFill(gameColors.menuBackground, 0.95);
        this.contextMenu.lineStyle(2, gameColors.tooltipBorder);
        this.contextMenu.drawRoundedRect(0, 0, menuWidth, menuHeight, 8);
        this.contextMenu.endFill();
        
        // Simple positioning since hex is guaranteed to be centered
        // Position menu slightly offset from center to avoid covering the hex
        const menuX = position.x - menuWidth / 2;
        const menuY = position.y - menuHeight / 2;
        console.log(`[Ui] Draw menu at (${menuX}, ${menuY})`);
        
        this.contextMenu.position.set(menuX, menuY);

        // Add options
        options.forEach((option, i) => {
            const optionWidth = menuWidth - padding * 2;
            const optionBg = new PIXI.Graphics();
            optionBg.beginFill(pixiColors.background.interactive);
            optionBg.drawRoundedRect(padding, padding + i * itemHeight, optionWidth, itemHeight - 2, 4);
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
                optionBg.drawRoundedRect(padding, padding + i * itemHeight, optionWidth, itemHeight - 2, 4);
                optionBg.endFill();
            });
            optionBg.on('pointerleave', () => {
                optionBg.clear();
                optionBg.beginFill(pixiColors.background.interactive);
                optionBg.drawRoundedRect(padding, padding + i * itemHeight, optionWidth, itemHeight - 2, 4);
                optionBg.endFill();
            });

            const optionText = new PIXI.Text(option.label, {
                fontFamily: 'Arial',
                fontSize: fontSize,
                fill: gameColors.buttonText,
                wordWrap: true,
                wordWrapWidth: optionWidth - padding
            });
            optionText.position.set(padding + 5, padding + i * itemHeight + (itemHeight - fontSize) / 2);
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