import { HEX_SCALE_LEVELS } from "../configs/config.js";

export class ZoomManager {
  constructor(gridContainer, objectContainer) {
    this.gridContainer = gridContainer;
    this.objectContainer = objectContainer;
  }

  // Apply zoom level to all hexes
  applyZoom() {
    const scale = HEX_SCALE_LEVELS[window.gameState.zoomLevel];

    // Scale the containers instead of individual sprites
    this.gridContainer.scale.set(scale);
    this.objectContainer.scale.set(scale); // objects are 80% of hex size
  }
  // Handle zoom in
  zoomIn() {
    if (window.gameState.zoomLevel < HEX_SCALE_LEVELS.length - 1) {
      window.gameState.zoomLevel++;
      this.applyZoom();
    }
  }

  // Handle zoom out
  zoomOut() {
    if (window.gameState.zoomLevel > 0) {
      window.gameState.zoomLevel--;
      this.applyZoom();
    }
  }
}

export default ZoomManager;
