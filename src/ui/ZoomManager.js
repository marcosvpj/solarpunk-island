import { HEX_SCALE_LEVELS } from '../config.js';

export class ZoomManager {
    constructor(gamestate, gridContainer, objectContainer) {
        this.gameState = gamestate
        this.gridContainer = gridContainer
        this.objectContainer = objectContainer
    }

    // Handle zoom in
    zoomIn() {
        if (this.gameState.zoomLevel < HEX_SCALE_LEVELS.length - 1) {
            this.gameState.zoomLevel++;
            this.applyZoom();
        }
    }

    // Handle zoom out
    zoomOut() {
        if (this.gameState.zoomLevel > 0) {
            this.gameState.zoomLevel--;
            this.applyZoom();
        }
    }

    // Apply zoom level to all hexes
    applyZoom(gridContainer, objectContainer) {
        const scale = HEX_SCALE_LEVELS[this.gameState.zoomLevel];

        // Scale the containers instead of individual sprites
        this.gridContainer.scale.set(scale);
        this.objectContainer.scale.set(scale); // objects are 80% of hex size
    }
}

export default ZoomManager;