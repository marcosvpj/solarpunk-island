import { Building } from './Building.js';
import EventBus from '../engine/EventBus.js';

/**
 * Refinery class - Converts radioactive waste into fuel or materials
 * 
 * Core building for resource conversion following game design document:
 * - 4 radioactive waste → 3 fuel (survival priority)
 * - 4 radioactive waste → 2 materials (construction priority)
 */
export class Refinery extends Building {
    constructor(hex) {
        super('refinery', hex);
        
        // Refinery-specific properties
        this.conversionRatios = {
            fuel: { input: 4, output: 3 },      // 4 waste → 3 fuel
            materials: { input: 4, output: 2 }  // 4 waste → 2 materials
        };
        
        // Production mode system
        this.productionMode = 'none'; // 'none', 'fuel', 'materials'
        this.isActive = false; // Whether refinery is currently producing
        this.productionHistory = {
            fuel: 0,
            materials: 0,
            totalWasteProcessed: 0
        };
        
        console.log(`[Refinery] Created refinery at (${hex.q}, ${hex.r}) - Production mode: ${this.productionMode}`);
    }

    /**
     * Convert radioactive waste to fuel
     * @returns {boolean} True if conversion successful
     */
    convertToFuel() {
        const playerStorage = window.playerStorage;
        if (!playerStorage) {
            console.warn('[Refinery] PlayerStorage not available');
            return false;
        }

        const ratio = this.conversionRatios.fuel;
        const wasteAvailable = playerStorage.getWaste();

        if (wasteAvailable < ratio.input) {
            console.log(`[Refinery] Insufficient waste for fuel conversion (need ${ratio.input}, have ${wasteAvailable})`);
            return false;
        }

        // Perform conversion
        const wasteRemoved = playerStorage.removeResources(ratio.input, 'radioactive_waste');
        if (wasteRemoved === ratio.input) {
            const fuelAdded = playerStorage.addResources(ratio.output, 'fuel');
            
            EventBus.emit('refinery:converted', {
                refinery: this,
                conversionType: 'fuel',
                wasteUsed: wasteRemoved,
                fuelProduced: fuelAdded
            });

            console.log(`[Refinery] Converted ${wasteRemoved} waste to ${fuelAdded} fuel`);
            return true;
        }

        return false;
    }

    /**
     * Convert radioactive waste to materials
     * @returns {boolean} True if conversion successful
     */
    convertToMaterials() {
        const playerStorage = window.playerStorage;
        if (!playerStorage) {
            console.warn('[Refinery] PlayerStorage not available');
            return false;
        }

        const ratio = this.conversionRatios.materials;
        const wasteAvailable = playerStorage.getWaste();

        if (wasteAvailable < ratio.input) {
            console.log(`[Refinery] Insufficient waste for materials conversion (need ${ratio.input}, have ${wasteAvailable})`);
            return false;
        }

        // Perform conversion
        const wasteRemoved = playerStorage.removeResources(ratio.input, 'radioactive_waste');
        if (wasteRemoved === ratio.input) {
            const materialsAdded = playerStorage.addResources(ratio.output, 'materials');
            
            EventBus.emit('refinery:converted', {
                refinery: this,
                conversionType: 'materials',
                wasteUsed: wasteRemoved,
                materialsProduced: materialsAdded
            });

            console.log(`[Refinery] Converted ${wasteRemoved} waste to ${materialsAdded} materials`);
            return true;
        }

        return false;
    }

    /**
     * Check if refinery can convert to fuel
     * @returns {boolean} True if conversion possible
     */
    canConvertToFuel() {
        const playerStorage = window.playerStorage;
        return playerStorage && playerStorage.getWaste() >= this.conversionRatios.fuel.input;
    }

    /**
     * Check if refinery can convert to materials
     * @returns {boolean} True if conversion possible
     */
    canConvertToMaterials() {
        const playerStorage = window.playerStorage;
        return playerStorage && playerStorage.getWaste() >= this.conversionRatios.materials.input;
    }

    /**
     * Set production mode for automatic processing
     * @param {string} mode - 'none', 'fuel', or 'materials'
     */
    setProductionMode(mode) {
        if (!['none', 'fuel', 'materials'].includes(mode)) {
            console.warn(`[Refinery] Invalid production mode: ${mode}`);
            return;
        }

        const oldMode = this.productionMode;
        this.productionMode = mode;
        this.isActive = mode !== 'none';

        EventBus.emit('refinery:productionModeChanged', {
            refinery: this,
            oldMode: oldMode,
            newMode: mode,
            isActive: this.isActive
        });

        console.log(`[Refinery] Production mode changed: ${oldMode} → ${mode}`);
    }

    /**
     * Process automatic production (called at end of turn)
     * @returns {Object} Production result
     */
    processProduction() {
        if (this.productionMode === 'none') {
            return { produced: false, reason: 'inactive' };
        }

        const playerStorage = window.playerStorage;
        if (!playerStorage) {
            return { produced: false, reason: 'no_storage' };
        }

        // Determine what to produce
        const isProducingFuel = this.productionMode === 'fuel';
        const ratio = isProducingFuel ? this.conversionRatios.fuel : this.conversionRatios.materials;
        const wasteAvailable = playerStorage.getWaste();

        if (wasteAvailable < ratio.input) {
            return { 
                produced: false, 
                reason: 'insufficient_waste', 
                needed: ratio.input, 
                available: wasteAvailable 
            };
        }

        // Perform conversion
        const wasteRemoved = playerStorage.removeResources(ratio.input, 'radioactive_waste');
        if (wasteRemoved === ratio.input) {
            const resourceType = isProducingFuel ? 'fuel' : 'materials';
            const resourcesAdded = playerStorage.addResources(ratio.output, resourceType);

            // Update production history
            this.productionHistory[resourceType] += resourcesAdded;
            this.productionHistory.totalWasteProcessed += wasteRemoved;

            EventBus.emit('refinery:produced', {
                refinery: this,
                productionMode: this.productionMode,
                wasteUsed: wasteRemoved,
                resourcesProduced: resourcesAdded,
                resourceType: resourceType
            });

            return {
                produced: true,
                productionMode: this.productionMode,
                wasteUsed: wasteRemoved,
                resourcesProduced: resourcesAdded,
                resourceType: resourceType
            };
        }

        return { produced: false, reason: 'conversion_failed' };
    }

    /**
     * Check if refinery can produce in current mode
     * @returns {boolean} True if production possible
     */
    canProduce() {
        if (this.productionMode === 'none') return false;
        
        const playerStorage = window.playerStorage;
        if (!playerStorage) return false;

        const ratio = this.productionMode === 'fuel' ? 
            this.conversionRatios.fuel : 
            this.conversionRatios.materials;
        
        return playerStorage.getWaste() >= ratio.input;
    }

    /**
     * Get production mode display name
     * @returns {string} Human-readable production mode
     */
    getProductionModeDisplay() {
        switch (this.productionMode) {
            case 'fuel': return 'Producing Fuel';
            case 'materials': return 'Producing Materials';
            case 'none': return 'Inactive';
            default: return 'Unknown';
        }
    }

    /**
     * Get refinery information for UI/debugging
     * @returns {Object} Refinery info
     */
    getRefineryInfo() {
        return {
            ...this.getInfo(),
            productionMode: this.productionMode,
            productionModeDisplay: this.getProductionModeDisplay(),
            isActive: this.isActive,
            canProduce: this.canProduce(),
            productionHistory: { ...this.productionHistory },
            conversionRatios: this.conversionRatios
        };
    }

    /**
     * Get refinery-specific tooltip information
     * @returns {string} Tooltip text specific to refinery
     */
    getTooltipInfo() {
        let tooltipText = `Converts radioactive waste to resources`;
        tooltipText += `\nMode: ${this.getProductionModeDisplay()}`;
        
        // Show conversion ratios
        tooltipText += `\nFuel: 4 waste → 3 fuel`;
        tooltipText += `\nMaterials: 4 waste → 2 materials`;
        
        // Show current production capability
        const playerStorage = window.playerStorage;
        if (playerStorage) {
            const currentWaste = playerStorage.getWaste();
            const canProduce = this.canProduce();
            
            if (this.productionMode !== 'none') {
                const ratio = this.productionMode === 'fuel' ? 
                    this.conversionRatios.fuel : 
                    this.conversionRatios.materials;
                
                tooltipText += `\nCan Produce: ${canProduce ? 'Yes' : 'No'} (have ${currentWaste}, need ${ratio.input})`;
            } else {
                tooltipText += `\nWaste Available: ${currentWaste}`;
            }
        }
        
        // Show upgrade information if available
        if (this.canUpgrade && this.canUpgrade()) {
            tooltipText += `\nUpgrade Cost: ${this.upgradeCost} materials`;
        }
        
        return tooltipText;
    }

    /**
     * Get refinery-specific context menu items (actions only)
     * @returns {Array} Array of actionable menu items specific to refinery
     */
    getContextMenuItems() {
        const menuItems = [];
        
        // Production mode switching actions
        if (this.productionMode !== 'fuel') {
            menuItems.push({
                label: 'Set to Fuel Production (4 waste → 3 fuel)',
                action: () => this.setProductionMode('fuel')
            });
        }

        if (this.productionMode !== 'materials') {
            menuItems.push({
                label: 'Set to Materials Production (4 waste → 2 materials)',
                action: () => this.setProductionMode('materials')
            });
        }

        if (this.productionMode !== 'none') {
            menuItems.push({
                label: 'Stop Production',
                action: () => this.setProductionMode('none')
            });
        }
        
        return menuItems;
    }

    /**
     * Update refinery (called every frame)
     */
    update() {
        super.update();
        
        // Handle any automatic processing here if needed
        // For now, conversions are manual via context menu
    }

    /**
     * Destroy the refinery
     */
    destroy() {
        // Clear any ongoing processing
        this.isProcessing = false;
        
        // Call parent destroy
        super.destroy();
        
        console.log(`[Refinery] Refinery destroyed`);
    }
}