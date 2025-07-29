import { HEX_OFFSET_X, HEX_OFFSET_Y, HEX_HEIGHT, HEX_SIZE } from './configs/config.js';

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
        this.y = HEX_OFFSET_Y * r + (q % 2 === 0 ? 0 : HEX_HEIGHT / 2);
    }

    getPixelPosition() {
        return { x: this.x, y: this.y };
    }

    assignRandomTerrain() {
        if (Math.random() >= .7) {
            this.sprite = PIXI.Sprite.from('assets/hex-grass.png');
            this.terrain = 'grass'
        } else {
            this.sprite = PIXI.Sprite.from('assets/hex-ground.png');
            this.terrain = 'ground'
        }
    }
    assignRandomResource() {
        const resourceProbability = Math.random()
        if (q != 0 && r != 0 && Math.random() > .8) {
            if (Math.random() > .5) {
                addResourceToHex(this, 'radioactive_waste', 500);
            } else {
                addResourceToHex(this, 'forest', 200);
            }
        }
    }

}

export default Hex;