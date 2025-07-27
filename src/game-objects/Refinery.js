import { Building } from './Building.js';
import EventBus from '../EventBus.js';

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
        
        // Production state
        this.isProcessing = false;
        this.lastProcessTime = Date.now();
        this.processInterval = 2000; // 2 seconds per conversion
        
        console.log(`[Refinery] Created refinery at (${hex.q}, ${hex.r})`);
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
     * Get refinery information for UI/debugging
     * @returns {Object} Refinery info
     */
    getRefineryInfo() {
        return {
            ...this.getInfo(),
            conversionRatios: this.conversionRatios,
            canConvertToFuel: this.canConvertToFuel(),
            canConvertToMaterials: this.canConvertToMaterials(),
            isProcessing: this.isProcessing
        };
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