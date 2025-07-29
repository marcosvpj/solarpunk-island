/**
 * BuildingTooltip - Tooltip system for buildings
 * 
 * Generates tooltip text for buildings, resources, and units.
 * Delegates to individual building classes when possible for specialized tooltips.
 */
export class BuildingTooltip {
    constructor() {
        console.log('[BuildingTooltip] Initialized building tooltip system');
    }
    
    /**
     * Create tooltip text for a hex (building, resource, unit, or empty)
     * @param {Object} hex - The hex to create tooltip for
     * @param {Object} gameState - Current game state
     * @returns {string} Tooltip text
     */
    createHexTooltip(hex, gameState) {
        let tooltipText = `Hex: (${hex.q}, ${hex.r})`;
        
        // Add building information
        if (hex.building) {
            tooltipText += this.getBuildingTooltipInfo(hex.building, gameState);
        }
        
        // Add resource information
        if (hex.resource) {
            tooltipText += this.getResourceTooltipInfo(hex.resource);
        }
        
        // Add unit information
        if (hex.unit) {
            tooltipText += this.getUnitTooltipInfo(hex.unit);
        }
        
        return tooltipText;
    }
    
    /**
     * Get building-specific tooltip information
     * @param {Object} building - The building
     * @param {Object} gameState - Current game state
     * @returns {string} Building tooltip text
     */
    getBuildingTooltipInfo(building, gameState) {
        let tooltipText = `\nBuilding: ${building.type} Lvl ${building.level}`;
        
        // Try to use building's own tooltip method first
        if (typeof building.getTooltipInfo === 'function') {
            const buildingSpecificInfo = building.getTooltipInfo(gameState);
            if (buildingSpecificInfo) {
                tooltipText += `\n${buildingSpecificInfo}`;
                return tooltipText;
            }
        }
        
        // Fallback to manual tooltip generation for buildings without getTooltipInfo
        const fallbackInfo = this.getFallbackBuildingTooltip(building, gameState);
        if (fallbackInfo) {
            tooltipText += `\n${fallbackInfo}`;
        }
        
        return tooltipText;
    }
    
    /**
     * Get fallback tooltip for buildings that don't have getTooltipInfo method
     * @param {Object} building - The building
     * @param {Object} gameState - Current game state
     * @returns {string} Fallback tooltip text
     */
    getFallbackBuildingTooltip(building, gameState) {
        switch (building.type) {
            case 'reactor':
                return this.getReactorFallbackTooltip(building, gameState);
            case 'refinery':
                return this.getRefineryFallbackTooltip(building);
            case 'storage':
                return this.getStorageFallbackTooltip(building);
            case 'drone_factory':
                return this.getDroneFactoryFallbackTooltip(building);
            default:
                return this.getGenericBuildingTooltip(building);
        }
    }
    
    /**
     * Get reactor-specific fallback tooltip
     * @param {Object} reactor - The reactor building
     * @param {Object} gameState - Current game state
     * @returns {string} Reactor tooltip text
     */
    getReactorFallbackTooltip(reactor, gameState) {
        const fuelConsumption = gameState ? gameState.fuelConsumptionPerBuilding : 0.5;
        let tooltipText = `Fuel Cost: +${fuelConsumption}/turn`;
        
        if (reactor.canUpgrade && reactor.canUpgrade()) {
            tooltipText += `\nUpgrade Cost: ${reactor.upgradeCost} materials`;
        }
        
        return tooltipText;
    }
    
    /**
     * Get refinery-specific fallback tooltip
     * @param {Object} refinery - The refinery building
     * @returns {string} Refinery tooltip text
     */
    getRefineryFallbackTooltip(refinery) {
        let tooltipText = '';
        
        if (typeof refinery.getProductionModeDisplay === 'function') {
            tooltipText += refinery.getProductionModeDisplay();
            
            if (refinery.productionMode === 'fuel') {
                tooltipText += `\nProduction: 4 waste → 3 fuel/turn`;
            } else if (refinery.productionMode === 'materials') {
                tooltipText += `\nProduction: 4 waste → 2 materials/turn`;
            } else {
                tooltipText += `\nFuel Mode: 4 waste → 3 fuel/turn`;
                tooltipText += `\nMaterial Mode: 4 waste → 2 materials/turn`;
            }
            
            if (refinery.productionMode !== 'none') {
                const canProduce = (typeof refinery.canProduce === 'function' && refinery.canProduce()) ? '✓' : '⚠';
                tooltipText += ` ${canProduce}`;
                tooltipText += canProduce === '✓' ? ' Ready' : ' Need 4 waste';
            }
        } else {
            tooltipText += 'Converts waste to resources';
        }
        
        return tooltipText;
    }
    
    /**
     * Get storage-specific fallback tooltip
     * @param {Object} storageBuilding - The storage building
     * @returns {string} Storage tooltip text
     */
    getStorageFallbackTooltip(storageBuilding) {
        let tooltipText = '';
        
        if (typeof storageBuilding.getMaxCapacity === 'function') {
            const maxCapacity = storageBuilding.getMaxCapacity();
            tooltipText += `Capacity: +${maxCapacity} (Level ${storageBuilding.level})`;
            
            if (storageBuilding.canUpgrade && storageBuilding.canUpgrade()) {
                // Calculate next level capacity using the same formula as StorageBuilding
                if (storageBuilding.baseCapacityPerLevel && storageBuilding.exponentialMultiplier) {
                    const nextLevelCapacity = Math.floor(
                        storageBuilding.baseCapacityPerLevel * 
                        Math.pow(storageBuilding.exponentialMultiplier, storageBuilding.level)
                    );
                    tooltipText += `\nNext Level: +${nextLevelCapacity} capacity`;
                }
                tooltipText += `\nUpgrade Cost: ${storageBuilding.upgradeCost} materials`;
            }
        } else {
            tooltipText += 'Increases storage capacity';
        }
        
        return tooltipText;
    }
    
    /**
     * Get drone factory-specific fallback tooltip
     * @param {Object} factory - The drone factory building
     * @returns {string} Factory tooltip text
     */
    getDroneFactoryFallbackTooltip(factory) {
        let tooltipText = 'Produces drones for resource collection';
        
        if (factory.canUpgrade && factory.canUpgrade()) {
            tooltipText += `\nUpgrade Cost: ${factory.upgradeCost} materials`;
        }
        
        return tooltipText;
    }
    
    /**
     * Get generic building tooltip for unknown building types
     * @param {Object} building - The building
     * @returns {string} Generic tooltip text
     */
    getGenericBuildingTooltip(building) {
        let tooltipText = `Level ${building.level} building`;
        
        if (building.canUpgrade && building.canUpgrade()) {
            tooltipText += `\nUpgrade Cost: ${building.upgradeCost || 'Unknown'} materials`;
        }
        
        return tooltipText;
    }
    
    /**
     * Get resource-specific tooltip information
     * @param {Object} resource - The resource
     * @returns {string} Resource tooltip text
     */
    getResourceTooltipInfo(resource) {
        return `\nResource: ${resource.type} (${resource.amount}/${resource.maxAmount})`;
    }
    
    /**
     * Get unit-specific tooltip information
     * @param {Object} unit - The unit
     * @returns {string} Unit tooltip text
     */
    getUnitTooltipInfo(unit) {
        let tooltipText = `\nUnit: ${unit.type}`;
        
        // Add unit-specific information if available
        if (unit.health !== undefined) {
            tooltipText += `\nHealth: ${unit.health}`;
        }
        
        if (unit.status) {
            tooltipText += `\nStatus: ${unit.status}`;
        }
        
        return tooltipText;
    }
    
    /**
     * Create detailed tooltip for building (used in context menus, etc.)
     * @param {Object} building - The building
     * @returns {string} Detailed building tooltip
     */
    createDetailedBuildingTooltip(building) {
        if (typeof building.getTooltipInfo === 'function') {
            return building.getTooltipInfo();
        }
        
        let tooltipText = `${building.type} (Level ${building.level})`;
        
        if (building.canUpgrade && building.canUpgrade()) {
            tooltipText += `\nCan upgrade for ${building.upgradeCost} materials`;
        } else {
            tooltipText += `\nMax level reached`;
        }
        
        return tooltipText;
    }
    
    /**
     * Create tooltip for empty hex (shows what can be built there)
     * @param {Object} hex - The empty hex
     * @param {Array} availableBuildingTypes - Available building types
     * @returns {string} Empty hex tooltip
     */
    createEmptyHexTooltip(hex, availableBuildingTypes = []) {
        let tooltipText = `Hex: (${hex.q}, ${hex.r})`;
        
        if (availableBuildingTypes.length > 0) {
            tooltipText += `\nCan build: ${availableBuildingTypes.join(', ')}`;
        } else {
            tooltipText += `\nEmpty hex - right-click to build`;
        }
        
        return tooltipText;
    }
    
    /**
     * Check if a building has custom tooltip capabilities
     * @param {Object} building - The building to check
     * @returns {boolean} True if building has custom tooltip method
     */
    hasCustomTooltip(building) {
        return typeof building.getTooltipInfo === 'function';
    }
    
    /**
     * Get building information for tooltip display
     * @param {Object} building - The building
     * @returns {Object} Building information object
     */
    getBuildingInfo(building) {
        if (typeof building.getBuildingInfo === 'function') {
            return building.getBuildingInfo();
        }
        
        // Fallback info extraction
        return {
            type: building.type,
            level: building.level,
            canUpgrade: building.canUpgrade ? building.canUpgrade() : false,
            upgradeCost: building.upgradeCost || 0,
            maxLevel: building.maxLevel || 5
        };
    }
}

export default BuildingTooltip;