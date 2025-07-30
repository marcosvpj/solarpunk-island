/**
 * GameData.js - Centralized game configuration
 * Data-driven approach to game parameters
 */

// Building definitions - easy to modify and extend
export const BUILDINGS = {
    reactor: {
        name: 'Reactor',
        cost: { materials: 25 },
        fuelConsumption: 0.5,
        maxLevel: 5,
        upgradeMultiplier: 1.5,
        sprite: 'building-reactor.png',
        description: 'Provides power to your island'
    },
    refinery: {
        name: 'Refinery', 
        cost: { materials: 10 },
        fuelConsumption: 0.5,
        maxLevel: 3,
        upgradeMultiplier: 2.0,
        sprite: 'building-refinery.png',
        description: 'Converts waste to fuel or materials',
        production: {
            fuel: { input: { radioactive_waste: 4 }, output: { fuel: 3 } },
            materials: { input: { radioactive_waste: 4 }, output: { materials: 2 } }
        }
    },
    storage: {
        name: 'Storage',
        cost: { materials: 10 },
        fuelConsumption: 0.2,
        maxLevel: 4,
        upgradeMultiplier: 1.2,
        sprite: 'building-storage.png',
        description: 'Increases storage capacity',
        baseCapacity: 50,
        capacityPerLevel: 25
    },
    drone_factory: {
        name: 'Drone Factory',
        cost: { materials: 10 },
        fuelConsumption: 0.8,
        maxLevel: 3,
        upgradeMultiplier: 1.8,
        sprite: 'building-factory.png',
        description: 'Produces drones for resource collection',
        droneProductionCost: 5,
        maxDronesPerLevel: 2,
        baseUpgradeCost: 10
    },
    habitat: {
        name: 'Habitat',
        cost: { materials: 10 },
        fuelConsumption: 0.3,
        maxLevel: 4,
        upgradeMultiplier: 1.5,
        sprite: 'building-habitat.png',
        description: 'Houses population',
        housingCapacity: 5
    },
    greenhouse: {
        name: 'Greenhouse',
        cost: { materials: 10 },
        fuelConsumption: 0.4,
        maxLevel: 5,
        upgradeMultiplier: 1.4,
        sprite: 'building-greenhouse.png',
        description: 'Produces food',
        foodProduction: 3,
        waterConsumption: 1
    }
};

// Resource definitions
export const RESOURCES = {
    radioactive_waste: {
        name: 'Radioactive Waste',
        sprite: 'resource-radioactive_waste.png',
        baseAmount: 500,
        collectionRate: 10,
        color: '#ff4444'
    },
    forest: {
        name: 'Forest',
        sprite: 'resource-forest.png', 
        baseAmount: 200,
        collectionRate: 5,
        color: '#44ff44'
    }
};

// Terrain definitions
export const TERRAIN = {
    grass: {
        name: 'Grass',
        sprite: 'hex-grass.png',
        buildable: true,
        color: '#88cc88'
    },
    ground: {
        name: 'Ground', 
        sprite: 'hex-ground.png',
        buildable: true,
        color: '#cc8888'
    },
    sky: {
        name: 'Sky',
        sprite: 'hex-sky.png',
        buildable: false,
        color: '#8888cc'
    }
};

// Game balance parameters
export const GAME_BALANCE = {
    turn: {
        duration: 30, // seconds
        baseFuelConsumption: 3,
        fuelPerBuilding: 0.5
    },
    grid: {
        radius: 2,
        hexSize: 32
    },
    storage: {
        baseCapacity: 100,
        storageMultiplier: 1.5
    },
    progression: {
        fuelWarningTurns: 3,
        gameOverDelay: 1000
    },
    initialResources: {
        radioactive_waste: 0,    // Raw material collected by drones
        fuel: 15,                // Keeps island flying (~3 turns survival)
        materials: 50            // Used for building construction
    }
};

// Context menu definitions - data-driven menus
export const CONTEXT_MENUS = {
    empty_hex: [
        { id: 'build', label: 'Build...', icon: 'build', submenu: 'building_types' }
    ],
    building: [
        { id: 'upgrade', label: 'Upgrade', icon: 'upgrade', condition: 'canUpgrade' },
        { id: 'demolish', label: 'Demolish', icon: 'demolish' }
    ],
    resource: [
        { id: 'collect', label: 'Collect', icon: 'collect', condition: 'hasCapacity' }
    ],
    building_types: Object.keys(BUILDINGS).map(type => ({
        id: `build_${type}`,
        label: `Build ${BUILDINGS[type].name}`,
        icon: type,
        cost: BUILDINGS[type].cost,
        condition: 'canAfford'
    }))
};

// Export helper functions
export function getBuildingData(type) {
    return BUILDINGS[type] || null;
}

export function getResourceData(type) {
    return RESOURCES[type] || null;
}

export function getInitialResources() {
    return { ...GAME_BALANCE.initialResources };
}

export function getTerrainData(type) {
    return TERRAIN[type] || null;
}

export function calculateBuildingCost(type, level = 1) {
    const building = getBuildingData(type);
    if (!building) return null;
    
    const baseCost = building.cost.materials;
    return {
        materials: Math.floor(baseCost * Math.pow(building.upgradeMultiplier, level - 1))
    };
}

export function canAffordBuilding(type, level, playerStorage) {
    const cost = calculateBuildingCost(type, level);
    return playerStorage.getMaterials() >= cost.materials;
}