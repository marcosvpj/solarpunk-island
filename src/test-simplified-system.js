/**
 * Test script for simplified building system
 * Run this in browser console to verify functionality
 */

console.log('Testing Simplified Building System...');

// Test 1: Check if GameData is loaded
import { getBuildingData, calculateBuildingCost } from './configs/GameData.js';

const reactorData = getBuildingData('reactor');
console.log('✓ Reactor data:', reactorData);

const cost = calculateBuildingCost('reactor', 2);
console.log('✓ Level 2 reactor cost:', cost);

// Test 2: Check if SimpleBuildingSystem is available
if (window.simpleBuildingSystem) {
    console.log('✓ SimpleBuildingSystem is available globally');
    
    // Test 3: Check if existing buildings are properly enhanced
    const buildings = window.gameState.buildings;
    if (buildings.length > 0) {
        const firstBuilding = buildings[0];
        console.log('✓ First building:', firstBuilding.type, firstBuilding.level);
        
        if (firstBuilding.getTooltip) {
            console.log('✓ Building has getTooltip method');
            console.log('  Tooltip:', firstBuilding.getTooltip());
        }
        
        if (firstBuilding.getContextMenu) {
            console.log('✓ Building has getContextMenu method');
            console.log('  Menu items:', firstBuilding.getContextMenu().length);
        }
    }
} else {
    console.log('✗ SimpleBuildingSystem not found');
}

console.log('Test complete. Check for any errors above.');

export default {
    reactorData,
    cost
};