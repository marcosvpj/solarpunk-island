import Hex from '../Hex.js';
import GameObjectFactory from '../engine/GameObjectFactory.js';
import { GAME_BALANCE } from '../configs/GameData.js';

/**
 * HexGrid - Handles hexagonal grid expansion
 * Works with existing grid creation logic in main.js
 */
export class HexGrid {
    constructor(gameState) {
        this.gameState = gameState;
        this.currentRadius = GAME_BALANCE.grid.radius; // Start with initial radius
        this.hexes = [];
        this.gridContainer = null;
    }

    /**
     * Create a ring of hexes at specified distance from center
     * Uses main.js createHex function to maintain consistency
     * @param {number} ring - Ring number (1+ = rings, no center)
     * @returns {Array} Array of hex objects in this ring
     */
    createHexRing(ring) {
        const ringHexes = [];
        const startIndex = this.hexes.length;
        let hexIndex = startIndex;

        // Ring hexes using axial coordinates (same logic as main.js)
        for (let q = -ring; q <= ring; q++) {
            const r1 = Math.max(-ring, -q - ring);
            const r2 = Math.min(ring, -q + ring);

            for (let r = r1; r <= r2; r++) {
                // Only include hexes at exactly ring distance
                if (Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r)) === ring) {
                    // Use the same coordinate transformation as main.js
                    const row = r + (q - (q & 1)) / 2;
                    const hex = window.createHex(q, row, hexIndex++);
                    ringHexes.push(hex);
                }
            }
        }

        console.log(`[HexGrid] Created ring ${ring} with ${ringHexes.length} hexes`);
        return ringHexes;
    }

    /**
     * Expand grid to new radius by adding outer rings
     * @param {number} newRadius - Target radius to expand to
     */
    expandToRadius(newRadius) {
        if (newRadius <= this.currentRadius) {
            console.log(`[HexGrid] Already at radius ${this.currentRadius}, no expansion needed`);
            return;
        }

        console.log(`[HexGrid] Expanding from radius ${this.currentRadius} to ${newRadius}`);

        // Add new rings
        for (let ring = this.currentRadius + 1; ring <= newRadius; ring++) {
            this.addNewRing(ring);
        }

        this.currentRadius = newRadius;
        
        // Update game state hexes array
        this.gameState.hexes = this.hexes;

        // Re-center grid to accommodate new size
        if (window.centerGrid) {
            window.centerGrid();
        }

        console.log(`[HexGrid] Expansion complete. Grid now has ${this.hexes.length} hexes`);
    }

    /**
     * Add a new ring of hexes with animation
     * @param {number} ring - Ring number to add
     */
    addNewRing(ring) {
        const newHexes = this.createHexRing(ring);
        
        // Add resources to new hexes using main.js logic
        this.distributeResourcesToHexes(newHexes);

        // Add hexes to main array and game state
        this.hexes.push(...newHexes);
        this.gameState.hexes.push(...newHexes);

        // Animate new hexes
        this.animateNewHexes(newHexes);

        console.log(`[HexGrid] Added ring ${ring} with ${newHexes.length} hexes`);
    }

    /**
     * Distribute resources randomly to hexes (excluding center)
     * @param {Object} resourceCounts - Object with resource types and counts
     */
    distributeResources(resourceCounts) {
        const availableHexes = this.hexes.filter(hex => hex.q !== 0 || hex.r !== 0);
        this.distributeResourcesToHexes(availableHexes, resourceCounts);
    }

    /**
     * Distribute resources to specific hex array
     * @param {Array} hexes - Hexes to distribute resources to
     * @param {Object} resourceCounts - Resource counts (optional, uses defaults)
     */
    distributeResourcesToHexes(hexes, resourceCounts = null) {
        if (!resourceCounts) {
            // Default resource distribution for new rings
            resourceCounts = {
                radioactive_waste: Math.max(1, Math.floor(hexes.length * 0.3)),
                forest: Math.max(1, Math.floor(hexes.length * 0.2))
            };
        }

        // Distribute radioactive waste
        const wasteHexes = hexes.filter(hex => hex.terrain === 'ground' && !hex.resource);
        const shuffledWasteHexes = this.shuffleArray(wasteHexes);
        for (let i = 0; i < Math.min(resourceCounts.radioactive_waste, shuffledWasteHexes.length); i++) {
            this.addResourceToHex(shuffledWasteHexes[i], 'radioactive_waste', 500);
        }

        // Distribute forest
        const forestHexes = hexes.filter(hex => hex.terrain === 'grass' && !hex.resource);
        const shuffledForestHexes = this.shuffleArray(forestHexes);
        for (let i = 0; i < Math.min(resourceCounts.forest, shuffledForestHexes.length); i++) {
            this.addResourceToHex(shuffledForestHexes[i], 'forest', 200);
        }
    }

    /**
     * Add resource to hex using main.js function
     * @param {Hex} hex - Target hex
     * @param {string} type - Resource type
     * @param {number} amount - Resource amount
     */
    addResourceToHex(hex, type, amount) {
        if (hex.resource) return;
        window.addResourceToHex(hex, type, amount);
    }


    /**
     * Animate new hexes appearing
     * @param {Array} newHexes - Array of new hex objects
     */
    animateNewHexes(newHexes) {
        newHexes.forEach((hex, index) => {
            // Start invisible
            hex.sprite.alpha = 0;
            
            // Fade in with slight delay for wave effect
            setTimeout(() => {
                if (hex.sprite && !hex.sprite.destroyed) {
                    // Simple fade in animation
                    const fadeIn = () => {
                        hex.sprite.alpha += 0.05;
                        if (hex.sprite.alpha < 1 && !hex.sprite.destroyed) {
                            requestAnimationFrame(fadeIn);
                        } else if (!hex.sprite.destroyed) {
                            hex.sprite.alpha = 1;
                        }
                    };
                    fadeIn();
                }
            }, index * 50); // Stagger animation
        });
    }


    /**
     * Shuffle array utility
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled copy
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Clean up all hexes and resources
     */
    cleanup() {
        this.hexes.forEach(hex => {
            if (hex.sprite) {
                hex.sprite.off("pointerover", hex.hoverHandler);
                hex.sprite.off("pointerout", hex.hoverEndHandler);
                hex.sprite.off("pointerdown", hex.clickHandler);

                if (this.gridContainer) {
                    this.gridContainer.removeChild(hex.sprite);
                }
                hex.sprite.destroy();
            }
        });

        this.hexes.length = 0;
        this.currentRadius = GAME_BALANCE.grid.radius;
    }

    /**
     * Get current grid info
     * @returns {Object} Grid information
     */
    getGridInfo() {
        return {
            radius: this.currentRadius,
            hexCount: this.hexes.length,
            resourceCount: this.hexes.filter(hex => hex.resource).length,
            buildingCount: this.hexes.filter(hex => hex.building).length
        };
    }
}

export default HexGrid;