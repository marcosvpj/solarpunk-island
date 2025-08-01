/**
 * GameData.js - Centralized game configuration
 * Data-driven approach to game parameters
 */

// Building definitions - easy to modify and extend
export const BUILDINGS = {
  reactor: {
    name: "Reactor",
    cost: { materials: 25 },
    fuelConsumption: 0.5,
    maxLevel: 3,
    upgradeMultiplier: 1.5,
    sprite: "building-reactor.png",
    description: "Provides power to your island and expands it through upgrades",
    fuelConsumptionRate: 0.5, // Fuel consumed per turn per level
    powerOutput: 1, // Power provided per level
    baseUpgradeCost: 50, // Materials needed for upgrade
    expansionRadius: { // Island radius per reactor level
      1: 2, // Level 1: radius 2 (initial)
      2: 3, // Level 2: radius 3 (first expansion)
      3: 4, // Level 3: radius 4 (second expansion)
      4: 5, // Level 4: radius 5 (third expansion)
    },
  },
  refinery: {
    name: "Refinery",
    cost: { materials: 10 },
    fuelConsumption: 0.5,
    maxLevel: 3,
    upgradeMultiplier: 2.0,
    sprite: "building-refinery.png",
    description: "Converts waste to fuel or materials",
    production: {
      fuel: { input: 10, output: 5 }, // 10 waste → 5 fuel
      materials: { input: 10, output: 5 }, // 10 waste → 5 materials
    },
  },
  storage: {
    name: "Storage",
    cost: { materials: 10 },
    fuelConsumption: 0.2,
    maxLevel: 4,
    upgradeMultiplier: 1.2,
    sprite: "building-storage.png",
    description: "Increases storage capacity",
    baseCapacity: 50,
    capacityPerLevel: 25,
    baseCapacityPerLevel: 50, // Base storage per level
    exponentialMultiplier: 1.5, // Exponential growth factor
  },
  drone_factory: {
    name: "Drone Factory",
    cost: { materials: 10 },
    fuelConsumption: 0.8,
    maxLevel: 3,
    upgradeMultiplier: 1.8,
    sprite: "building-factory.png",
    description: "Produces drones for resource collection",
    droneProductionCost: 5,
    maxDronesPerLevel: 2,
    baseUpgradeCost: 10,
  },
  habitat: {
    name: "Habitat",
    cost: { materials: 10 },
    fuelConsumption: 0.3,
    maxLevel: 4,
    upgradeMultiplier: 1.5,
    sprite: "building-habitat.png",
    description: "Houses population",
    housingCapacity: 5, // People housed per level
    comfortLevel: 1, // Quality of life provided per level
    baseUpgradeCost: 75, // Materials needed for upgrade
  },
  greenhouse: {
    name: "Greenhouse",
    cost: { materials: 10 },
    fuelConsumption: 0.4,
    maxLevel: 5,
    upgradeMultiplier: 1.4,
    sprite: "building-greenhouse.png",
    description: "Produces food",
    foodProduction: 3,
    waterConsumption: 1,
    foodProductionRate: 3, // Food produced per turn per level
    baseUpgradeCost: 60, // Materials needed for upgrade
  },
  park: {
    name: "Park",
    cost: { materials: 10 },
    fuelConsumption: 0.1,
    maxLevel: 4,
    upgradeMultiplier: 1.3,
    sprite: "building-park.png",
    description: "Provides quality of life",
    comfortLevel: 1, // Quality of life provided per level
    baseUpgradeCost: 75, // Materials needed for upgrade
  },
};

// Resource definitions
export const RESOURCES = {
  radioactive_waste: {
    name: "Radioactive Waste",
    sprite: "resource-radioactive_waste.png",
    baseAmount: 500,
    collectionRate: 10,
    color: "#ff4444",
  },
  forest: {
    name: "Forest",
    sprite: "resource-forest.png",
    baseAmount: 200,
    collectionRate: 5,
    color: "#44ff44",
  },
};

// Terrain definitions
export const TERRAIN = {
  grass: {
    name: "Grass",
    sprite: "hex-grass.png",
    buildable: true,
    color: "#88cc88",
  },
  ground: {
    name: "Ground",
    sprite: "hex-ground.png",
    buildable: true,
    color: "#cc8888",
  },
  sky: {
    name: "Sky",
    sprite: "hex-sky.png",
    buildable: false,
    color: "#8888cc",
  },
};

// Unit definitions - data-driven unit configuration
export const UNITS = {
  drone: {
    name: "Drone",
    carryingCapacity: 5, // Base carrying capacity
    moveInterval: 800, // Time between hex moves (ms)
    speed: 2, // Hexes per second (for discrete movement)
    movementSpeed: 80, // Pixels per second (for smooth movement)
    taskDelay: 1500, // Delay between task completion and next task (ms)
    efficiency: 1.0, // Collection efficiency multiplier
    upgradeLevel: 1, // Starting upgrade level
    smoothMovement: true, // Enable smooth movement for flying units
    sprite: "unit-drone.png",
    description:
      "Automated resource collector that flies between resource nodes and storage",
  },
};

// Game balance parameters
export const GAME_BALANCE = {
  turn: {
    duration: 30, // seconds
    baseFuelConsumption: 2,
    fuelPerBuilding: 0.5,
  },
  grid: {
    radius: 2,
    hexSize: 32,
    guaranteedResources: {
      radioactive_waste: "radius", // At least radius count
      forest: "radius * 0.5", // At least half radius count
    },
  },
  storage: {
    baseCapacity: 100,
    storageMultiplier: 1.5,
  },
  progression: {
    fuelWarningTurns: 3,
    gameOverDelay: 1000,
  },
  population: {
    foodConsumptionPerPerson: 1, // Food consumed per person per turn
    growthChance: 0.3, // Chance of population growth when conditions are met
    starvationRate: 0.5, // Population lost per turn when food is insufficient
    maxGrowthPerTurn: 1, // Maximum population increase per turn
  },
  initialResources: {
    radioactive_waste: 0, // Raw material collected by drones
    fuel: 50, // Keeps island flying (~3 turns survival)
    materials: 260, // Used for building construction
    population: 5, // Starting colonists
    food: 15, // Starting food supply (~3 turns for starting population)
  },
};

// Context menu definitions - data-driven menus
export const CONTEXT_MENUS = {
  empty_hex: [
    {
      id: "build",
      label: "Build...",
      icon: "build",
      submenu: "building_types",
    },
  ],
  building: [
    {
      id: "upgrade",
      label: "Upgrade",
      icon: "upgrade",
      condition: "canUpgrade",
    },
    { id: "demolish", label: "Demolish", icon: "demolish" },
  ],
  resource: [
    {
      id: "collect",
      label: "Collect",
      icon: "collect",
      condition: "hasCapacity",
    },
  ],
  building_types: Object.keys(BUILDINGS).map((type) => ({
    id: `build_${type}`,
    label: `Build ${BUILDINGS[type].name}`,
    icon: type,
    cost: BUILDINGS[type].cost,
    condition: "canAfford",
  })),
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

export function getUnitData(type) {
  return UNITS[type] || null;
}

export function getBuildingProperty(type, property, fallback = null) {
  return BUILDINGS[type]?.[property] ?? fallback;
}

export function getTerrainData(type) {
  return TERRAIN[type] || null;
}

export function calculateBuildingCost(type, level = 1) {
  const building = getBuildingData(type);
  if (!building) return null;

  const baseCost = building.cost.materials;
  return {
    materials: Math.floor(
      baseCost * Math.pow(building.upgradeMultiplier, level - 1),
    ),
  };
}

export function canAffordBuilding(type, level, playerStorage) {
  const cost = calculateBuildingCost(type, level);
  return playerStorage.getMaterials() >= cost.materials;
}
