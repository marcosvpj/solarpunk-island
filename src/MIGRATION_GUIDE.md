# Migration Guide - Simplified Game Architecture

## Quick Start with New Systems

### 1. Replace Complex Initialization

**Old way (main.js):**
```javascript
// Complex initialization with many managers
uiManager = new UIManager(uiContainer, app);
sceneManager = new SceneManager(objectContainer);
gameStateManager = new GameStateManager();
buildingManager = new BuildingManager(gameState);
// ... many more managers
```

**New way:**
```javascript
import SimpleGameManager from './engine/SimpleGameManager.js';

const gameManager = new SimpleGameManager(app);
await gameManager.init(containers);
```

### 2. Use Data-Driven Building Configuration

**Old way:**
```javascript
// Hard-coded values scattered everywhere
const building = {
    cost: 25,
    fuelConsumption: 0.5,
    maxLevel: 5
};
```

**New way:**
```javascript
import { getBuildingData, calculateBuildingCost } from './configs/GameData.js';

const buildingData = getBuildingData('reactor');
const cost = calculateBuildingCost('reactor', level);
```

### 3. Simplified Building Operations

**Old way:**
```javascript
// Multiple classes for building operations
buildingManager.buildOnHex(hex, type);
buildingContextMenu.createHexContextMenu(hex);
buildingTooltip.createHexTooltip(hex);
```

**New way:**
```javascript
// Single system handles everything
gameManager.buildingSystem.build(hex, type);
const menu = gameManager.buildingSystem.getHexContextMenu(hex);
const tooltip = building.getTooltip();
```

### 4. Clean State Access

**Old way:**
```javascript
// Multiple state sources
gameState.buildings
GameStateManager.getBuildings()
window.gameState
```

**New way:**
```javascript
// Single source of truth
const state = gameManager.getState();
const buildings = state.buildings;
```

## Benefits of New Architecture

### ✅ Easy Content Addition
```javascript
// Add new building in GameData.js
export const BUILDINGS = {
    solar_panel: {
        name: 'Solar Panel',
        cost: { materials: 15 },
        fuelConsumption: 0,
        energyProduction: 2,
        description: 'Clean energy source'
    }
};
// That's it! System automatically handles menus, tooltips, building logic
```

### ✅ Simple Balance Changes
```javascript
// Change game balance in GameData.js
export const GAME_BALANCE = {
    turn: {
        duration: 45, // Longer turns
        baseFuelConsumption: 2 // Less fuel consumption
    }
};
```

### ✅ No More State Synchronization Issues
- Single state object
- No EventBus syncing between arrays and Maps
- Clear data flow

### ✅ Reduced Global Variables
- One gameManager instead of 10+ global managers
- Clean imports instead of window.* references

## Gradual Migration Steps

1. **Start with GameData.js** - Move hard-coded values
2. **Replace Building System** - Use SimpleBuildingSystem 
3. **Use SimpleGameManager** - Replace complex initialization
4. **Clean up main.js** - Remove unused managers
5. **Update screens** - Use simplified state access

## Performance Benefits

- Fewer object allocations
- Single state object reduces memory
- No redundant event emissions
- Cleaner garbage collection

## Maintenance Benefits

- Single place to modify game parameters
- Easy to add new content types
- Clear separation of concerns
- Reduced cognitive complexity