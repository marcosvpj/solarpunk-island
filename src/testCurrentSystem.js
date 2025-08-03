/**
 * Test current system functionality
 * This can be run in the browser console to verify everything works
 */

async function testSimplifiedSystems() {
    console.log('🔧 Testing Simplified Systems Implementation...');
    
    // Test 1: GameData configuration
    try {
        const { getBuildingData, calculateBuildingCost, BUILDINGS } = await import('./configs/GameData.js');
        
        console.log('✅ GameData loaded');
        console.log('  - Available buildings:', Object.keys(BUILDINGS));
        
        const reactorData = getBuildingData('reactor');
        console.log('  - Reactor data:', reactorData);
        
        const cost = calculateBuildingCost('reactor', 2);
        console.log('  - Level 2 reactor cost:', cost);
        
    } catch (error) {
        console.error('❌ GameData test failed:', error);
    }
    
    // Test 2: SimpleBuildingSystem integration
    if (window.simpleBuildingSystem) {
        console.log('✅ SimpleBuildingSystem available');
        
        // Test with existing buildings
        const buildings = window.gameState?.buildings || [];
        console.log(`  - Managing ${buildings.length} buildings`);
        
        if (buildings.length > 0) {
            const firstBuilding = buildings[0];
            console.log('  - First building:', firstBuilding.type, `Level ${firstBuilding.level}`);
            
            // Test tooltip
            if (firstBuilding.getTooltip) {
                const tooltip = firstBuilding.getTooltip();
                console.log('  - Tooltip:', tooltip.substring(0, 50) + '...');
            }
            
            // Test context menu
            if (firstBuilding.getContextMenu) {
                const menu = firstBuilding.getContextMenu();
                console.log(`  - Context menu has ${menu.length} options`);
            }
        }
        
    } else {
        console.log('❌ SimpleBuildingSystem not found');
    }
    
    // Test 3: Game state consistency
    if (window.gameState) {
        console.log('✅ Game state available');
        console.log(`  - Buildings: ${window.gameState.buildings.length}`);
        console.log(`  - Resources: ${window.gameState.resources.length}`);
        console.log(`  - Units: ${window.gameState.units.length}`);
        console.log(`  - Hexes: ${window.gameState.hexes.length}`);
    }
    
    // Test 4: Long Tomorrow integration
    try {
        const { longTomorrowManager } = await import('./systems/longTomorrow/index.js');
        console.log('✅ Long Tomorrow systems loaded');
        console.log('  - Research trees available:', Object.keys(longTomorrowManager.researchPointManager.researchProgress));
    } catch (error) {
        console.log('⚠️  Long Tomorrow systems not loaded (this is OK if not using Long Tomorrow mode)');
    }
    
    console.log('🎉 System test complete!');
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    // Wait a bit for systems to initialize
    setTimeout(testSimplifiedSystems, 2000);
}

export default testSimplifiedSystems;