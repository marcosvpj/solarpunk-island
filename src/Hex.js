import { HEX_OFFSET_X, HEX_HEIGHT } from './configs/config.js';

// Hex grid data structure
export class Hex {
    constructor(q, r) {
        this.q = q; // Column
        this.r = r; // Row
        this.s = -q - r; // Cube coordinate
        this.container = new PIXI.Container();
        this.sprite = null;
        this.building = null;
        this.resource = null;
        this.unit = null;
        this.isHovered = false;
        this.isSelected = false;
        this.eventData = null;

        // Calculate position relative to grid center
        this.x = HEX_OFFSET_X * q;
        this.y = HEX_HEIGHT * r + (q % 2 === 0 ? 0 : HEX_HEIGHT / 2);
    }

    getPixelPosition() {
        return { x: this.x, y: this.y };
    }
}

export default Hex;