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
        const fontSize = this.getResponsiveFontSize(this.isMobile ? 12 : 16);
        const padding = this.getResponsiveSize(10);
        
        // Create text first to measure its dimensions
        const tooltipText = new PIXI.Text({
            text: text,
            style: {
                fontFamily: 'Arial',
                fontSize: fontSize,
                fill: gameColors.tooltipText,
                wordWrap: true,
                wordWrapWidth: tooltipWidth - (padding * 2)
            }
        });
        
        // Calculate dynamic height based on text content
        const textBounds = tooltipText.getBounds();
        const tooltipHeight = Math.max(
            this.getResponsiveSize(60), // Minimum height
            textBounds.height + (padding * 2) // Dynamic height based on content
        );
        
        // Create a container for the tooltip
        this.tooltip = new PIXI.Container();
        
        // Create the background graphics with dynamic height
        const tooltipBg = new PIXI.Graphics();
        tooltipBg.roundRect(0, 0, tooltipWidth, tooltipHeight, 8);
        tooltipBg.stroke(2, gameColors.tooltipBorder);
        tooltipBg.fill({color: gameColors.tooltipBackground, alpha: 0.95});
        
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
        if (tooltipY + tooltipHeight > this.app.screen.height) {
            tooltipY = this.app.screen.height - tooltipHeight - 10;
        }
        
        this.tooltip.position.set(tooltipX, tooltipY);

        // Position text within the tooltip
        tooltipText.position.set(padding, padding);
        
        // Add both background and text to the container
        this.tooltip.addChild(tooltipBg);
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
        
        this.contextMenu = new PIXI.Container();

        const contextMenuBackground = new PIXI.Graphics();
        contextMenuBackground.roundRect(0, 0, menuWidth, menuHeight, 8);
        contextMenuBackground.fill({color:gameColors.menuBackground, alpha:0.95});
        contextMenuBackground.stroke(2, gameColors.tooltipBorder);
        
        // Simple positioning since hex is guaranteed to be centered
        // Position menu slightly offset from center to avoid covering the hex
        const menuX = position.x - menuWidth / 2;
        const menuY = position.y - menuHeight / 2;
        console.log(`[Ui] Draw menu at (${menuX}, ${menuY})`);
        
        this.contextMenu.position.set(menuX, menuY);
        // contextMenuBackground.position.set(menuX, menuY);
        this.contextMenu.addChild(contextMenuBackground);

        // Add options
        options.forEach((option, i) => {
            const optionWidth = menuWidth - padding * 2;
            const isDisabled = option.disabled === true;
            
            // Create a container for each option
            const optionContainer = new PIXI.Container();
            
            const optionBg = new PIXI.Graphics();
            optionBg.roundRect(padding, padding + i * itemHeight, optionWidth, itemHeight - 2, 4);
            
            // Use different colors for disabled items
            const bgColor = isDisabled ? pixiColors.background.secondary : pixiColors.background.interactive;
            optionBg.fill({color: bgColor});
            
            // Only make interactive if not disabled
            if (!isDisabled) {
                optionContainer.interactive = true;
                optionContainer.buttonMode = true;

                optionContainer.on('pointerdown', () => {
                    option.action();
                    this.clearContextMenu();
                });

                optionContainer.on('pointerenter', () => {
                    optionBg.clear();
                    optionBg.roundRect(padding, padding + i * itemHeight, optionWidth, itemHeight - 2, 4);
                    optionBg.fill({color:pixiColors.state.success});
                });
                optionContainer.on('pointerleave', () => {
                    optionBg.clear();
                    optionBg.roundRect(padding, padding + i * itemHeight, optionWidth, itemHeight - 2, 4);
                    optionBg.fill({color:pixiColors.background.interactive});
                });
            }

            const optionText = new PIXI.Text({
                text: option.label,
                style: {
                    fontFamily: 'Arial',
                    fontSize: fontSize,
                    fill: isDisabled ? gameColors.textDisabled : gameColors.buttonText,
                    wordWrap: true,
                    wordWrapWidth: optionWidth - padding
                }
            });
            optionText.position.set(padding + 5, padding + i * itemHeight + (itemHeight - fontSize) / 2);
            
            // Add both background and text to the container
            optionContainer.addChild(optionBg);
            optionContainer.addChild(optionText);
            this.contextMenu.addChild(optionContainer);
            // this.contextMenu.addChild(optionContainer);
        });

        // this.uiContainer.addChild(this.contextMenu);
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