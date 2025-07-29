import { BuildingMenu } from './BuildingMenu.js';

/**
 * BuildingContextMenu - Simple context menu renderer for buildings
 * 
 * Pure menu renderer that delegates to building classes for their menu items.
 * Handles only generic operations and menu rendering.
 */
export class BuildingContextMenu {
    constructor(buildingManager) {
        this.buildingManager = buildingManager;
        
        console.log('[BuildingContextMenu] Initialized simplified building context menu system');
    }
    
    /**
     * Create context menu for a hex (either empty or with building)
     * @param {Object} hex - The hex to create menu for
     * @param {Object} gameState - Current game state
     * @returns {Array} Array of menu items
     */
    createHexContextMenu(hex, gameState) {
        const menuOptions = [];
        
        if (!hex.building) {
            // Empty hex - show building construction options
            this.addBuildingConstructionOptions(menuOptions, hex);
        } else {
            // Hex with building - get building's own menu items
            this.addBuildingMenuItems(menuOptions, hex.building);
            // Add common building operations
            this.addCommonBuildingActions(menuOptions, hex.building);
        }
        
        // Add resource collection if present
        this.addResourceOption(menuOptions, hex);
        
        // Always add cancel option
        this.addCancelOption(menuOptions, gameState);
        
        return menuOptions;
    }
    
    /**
     * Add building construction options for empty hex
     * @param {Array} menuOptions - Menu options array to modify
     * @param {Object} hex - Target hex for construction
     */
    addBuildingConstructionOptions(menuOptions, hex) {
        // Use BuildingMenu configuration for available buildings
        BuildingMenu.build.forEach(building => {
            // Check if building type is available
            if (this.buildingManager.isBuildingTypeAvailable(building.type)) {
                const validation = this.buildingManager.canPlaceBuilding(hex, building.type);
                
                if (validation.success) {
                    menuOptions.push({
                        label: building.label,
                        action: () => this.buildingManager.buildOnHex(hex, building.type)
                    });
                }
            }
        });
    }
    
    /**
     * Add building's own menu items
     * @param {Array} menuOptions - Menu options array to modify
     * @param {Object} building - The building to get options for
     */
    addBuildingMenuItems(menuOptions, building) {
        // Get building-specific menu items if the building supports it
        if (typeof building.getContextMenuItems === 'function') {
            const buildingSpecificItems = building.getContextMenuItems();
            if (buildingSpecificItems && buildingSpecificItems.length > 0) {
                menuOptions.push(...buildingSpecificItems);
            }
        }
        // No fallbacks - buildings that don't implement getContextMenuItems get no custom options
    }
    
    /**
     * Add common building actions (upgrade, demolish)
     * @param {Array} menuOptions - Menu options array to modify
     * @param {Object} building - The building
     */
    addCommonBuildingActions(menuOptions, building) {
        // Upgrade option - always show if building can be upgraded, but disable if no materials
        if (building.canUpgrade && building.canUpgrade()) {
            const playerStorage = window.playerStorage;
            const hasEnoughMaterials = playerStorage && playerStorage.getMaterials() >= building.upgradeCost;
            
            let label = `Upgrade (${building.upgradeCost} materials)`;
            if (!hasEnoughMaterials) {
                const currentMaterials = playerStorage ? playerStorage.getMaterials() : 0;
                const needed = building.upgradeCost - currentMaterials;
                label = `Upgrade (Need ${needed} more materials)`;
            }
            
            menuOptions.push({
                label: label,
                action: hasEnoughMaterials ? () => building.upgrade() : () => {}, // No-op if disabled
                disabled: !hasEnoughMaterials
            });
        }
        
        // Demolish option - always available
        menuOptions.push({
            label: 'Demolish Building',
            action: () => this.buildingManager.demolishBuilding(building.hex)
        });
    }
    
    /**
     * Add cancel option to close the menu
     * @param {Array} menuOptions - Menu options array to modify
     * @param {Object} gameState - Current game state
     */
    addCancelOption(menuOptions, gameState) {
        menuOptions.push({
            label: 'Cancel',
            action: () => {
                // Clear hex selection
                if (gameState && gameState.selectedHex) {
                    gameState.selectedHex.isSelected = false;
                    if (window.updateHexVisuals) {
                        window.updateHexVisuals(gameState.selectedHex);
                    }
                    gameState.selectedHex = null;
                }
            }
        });
    }
    
    /**
     * Add resource collection option to menu
     * @param {Array} menuOptions - Menu options array to modify
     * @param {Object} hex - Hex with resource
     */
    addResourceOption(menuOptions, hex) {
        if (hex.resource) {
            menuOptions.push({
                label: `Collect ${hex.resource.type}`,
                action: () => this.collectResource(hex)
            });
        }
    }
    
    /**
     * Collect resource from hex (compatibility method)
     * @param {Object} hex - Hex with resource
     */
    collectResource(hex) {
        // Try to call the main.js collectResource function if available
        if (window.collectResource) {
            window.collectResource(hex);
        } else {
            console.warn('[BuildingContextMenu] No resource collection method available');
        }
    }
}

export default BuildingContextMenu;