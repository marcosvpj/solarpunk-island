/**
 * Level Configuration System
 * 
 * Data-driven progression system based on the 10-level campaign design.
 * Each level teaches new mechanics while constraining familiar ones.
 */

// Condition types for win/lose conditions
export const CONDITION_TYPES = {
    // Building-related conditions
    'building_count': 'BuildingCountCondition',
    'building_active': 'BuildingActiveCondition',
    'consecutive_turns': 'ConsecutiveTurnsCondition',
    
    // Survival conditions
    'survival_turns': 'SurvivalCondition',
    'fuel_depletion': 'FuelDepletionCondition',
    'turn_limit': 'TurnLimitCondition',
    
    // Future conditions (when features are implemented)
    'population_count': 'PopulationCondition',        // Level 2+
    'adjacency_bonus': 'AdjacencyCondition',         // Level 3
    'drone_types': 'DroneTypeCondition',             // Level 4
    'storage_limit': 'StorageLimitCondition',        // Level 5
    'event_survival': 'EventSurvivalCondition',      // Level 6
    'energy_renewable': 'RenewableEnergyCondition',  // Level 7
    'spatial_constraint': 'SpatialConstraintCondition', // Level 8
    'social_balance': 'SocialBalanceCondition',      // Level 9
    'efficiency_limit': 'EfficiencyCondition'       // Level 10
};

// Feature flags for unimplemented mechanics
export const GAME_FEATURES = {
    population: false,
    habitation: false,
    luxury_items: false,
    adjacency_bonuses: false,
    drone_specialization: false,
    event_system: false,
    renewable_energy: false,
    social_mechanics: false,
    efficiency_tracking: false
};

// Complete level progression from progression.md
export const LEVELS = {
    1: {
        id: 1,
        name: "First Spark",
        description: "Build 1 fuel refinery + 1 material refinery, then survive 3 turns",
        shortDescription: "Master the basics of refinery operation",
        
        // New mechanics introduced
        newMechanics: ["Basic building", "Fuel consumption", "Resource conversion"],
        
        // Game features required (all currently implemented)
        requiredFeatures: [],
        enabled: true,
        
        // Story context
        storyIntro: "Your floating island needs energy to survive. Learn to convert radioactive waste into fuel and materials to keep your civilization alive.",
        
        // Win conditions (ALL must be met)
        winConditions: [
            {
                type: 'building_count',
                building: 'refinery',
                productionMode: 'fuel',
                min: 1,
                description: "Build 1 fuel-producing refinery"
            },
            {
                type: 'building_count', 
                building: 'refinery',
                productionMode: 'materials',
                min: 1,
                description: "Build 1 materials-producing refinery"
            },
            {
                type: 'consecutive_turns',
                turns: 3,
                requirements: ['both_refineries_operational'],
                description: "Keep both refineries operational for 3 consecutive turns"
            }
        ],
        
        // Lose conditions (ANY triggers failure)
        loseConditions: [
            {
                type: 'fuel_depletion',
                description: "Civilization falls if fuel reaches zero"
            },
            {
                type: 'turn_limit',
                maxTurns: 25,
                description: "Complete objectives within 25 turns"
            }
        ],
        
        // Rewards for completion
        rewards: {
            title: "Island Pioneer",
            description: "You've mastered the basic survival loop!",
            unlocks: ["Level 2: Growing Community"]
        }
    },
    
    2: {
        id: 2,
        name: "Growing Community",
        description: "House 15 people in exactly 3 habitations (5 each)",
        shortDescription: "Manage population and social needs",
        
        newMechanics: ["Population", "Habitation buildings", "Luxury items"],
        requiredFeatures: ['population', 'habitation', 'luxury_items'],
        enabled: false, // Will auto-enable when features are implemented
        
        storyIntro: "More survivors have arrived! You must house them efficiently while managing their basic needs for water and electricity.",
        
        winConditions: [
            {
                type: 'population_count',
                exact: 15,
                description: "Maintain exactly 15 population"
            },
            {
                type: 'building_count',
                building: 'habitation',
                exact: 3,
                description: "Build exactly 3 habitation buildings"
            },
            {
                type: 'population_per_building',
                building: 'habitation',
                exact: 5,
                description: "Each habitation must house exactly 5 people"
            }
        ],
        
        loseConditions: [
            {
                type: 'fuel_depletion',
                description: "Civilization falls if fuel reaches zero"
            },
            {
                type: 'population_unhappy',
                threshold: 0.5,
                description: "Civilization falls if more than 50% are unhappy"
            }
        ],
        
        rewards: {
            title: "Community Builder",
            description: "You've learned to balance individual and collective needs!",
            unlocks: ["Level 3: Perfect Harmony"]
        }
    },
    
    3: {
        id: 3,
        name: "Perfect Harmony", 
        description: "Create a 6-building cluster where every building gets an adjacency bonus",
        shortDescription: "Master spatial optimization with adjacency bonuses",
        
        newMechanics: ["Adjacency bonuses", "Spatial puzzle mechanics"],
        requiredFeatures: ['adjacency_bonuses'],
        enabled: false,
        
        storyIntro: "Discover the power of thoughtful city planning. Buildings work better when placed strategically near each other.",
        
        winConditions: [
            {
                type: 'building_count',
                total: 6,
                description: "Build exactly 6 buildings"
            },
            {
                type: 'adjacency_bonus',
                buildings: 6,
                bonusType: 'all',
                description: "Every building must receive an adjacency bonus"
            },
            {
                type: 'spatial_constraint',
                pattern: 'hub_and_spoke',
                centerHex: 'required',
                description: "Arrange buildings around 1 central hex"
            }
        ],
        
        loseConditions: [
            {
                type: 'fuel_depletion',
                description: "Civilization falls if fuel reaches zero"
            },
            {
                type: 'turn_limit',
                maxTurns: 30,
                description: "Complete the spatial puzzle within 30 turns"
            }
        ],
        
        rewards: {
            title: "Master Planner",
            description: "You've unlocked the secrets of efficient city design!",
            unlocks: ["Level 4: The Dance of Drones"]
        }
    },
    
    4: {
        id: 4,
        name: "The Dance of Drones",
        description: "Operate 3 different drone types simultaneously for 5 turns",
        shortDescription: "Manage specialized drone fleets and maintenance cycles",
        
        newMechanics: ["Drone specialization", "Durability system", "Repair cycles"],
        requiredFeatures: ['drone_specialization'],
        enabled: false,
        
        storyIntro: "Your automation needs have grown. Specialized drones can handle different tasks, but they require careful management and maintenance.",
        
        winConditions: [
            {
                type: 'drone_types',
                types: ['collector', 'builder', 'repair'],
                simultaneousOperation: 5,
                description: "Run 3 drone types simultaneously for 5 turns"
            },
            {
                type: 'drone_count',
                max: 6,
                description: "Never exceed 6 total drones"
            }
        ],
        
        loseConditions: [
            {
                type: 'fuel_depletion',
                description: "Civilization falls if fuel reaches zero"
            },
            {
                type: 'drone_breakdown',
                totalFailures: 3,
                description: "Too many drone failures indicate poor management"
            }
        ],
        
        rewards: {
            title: "Fleet Commander",
            description: "You've mastered the art of automation management!",
            unlocks: ["Level 5: Lean Times"]
        }
    },
    
    5: {
        id: 5,
        name: "Lean Times",
        description: "Reach 20 population while never storing more than 15 fuel",
        shortDescription: "Master just-in-time resource management",
        
        newMechanics: ["Storage pressure", "Just-in-time economics"],
        requiredFeatures: ['population', 'storage_limits'],
        enabled: false,
        
        storyIntro: "Resources are scarce. You must learn to thrive with minimal stockpiles, turning survival into an art of precise timing.",
        
        winConditions: [
            {
                type: 'population_count',
                min: 20,
                description: "Reach 20 population"
            },
            {
                type: 'storage_limit',
                resource: 'fuel',
                max: 15,
                continuous: true,
                description: "Never store more than 15 fuel"
            }
        ],
        
        loseConditions: [
            {
                type: 'fuel_depletion',
                description: "Civilization falls if fuel reaches zero"
            },
            {
                type: 'storage_exceeded',
                resource: 'fuel',
                limit: 15,
                description: "Failed to maintain lean fuel storage"
            }
        ],
        
        rewards: {
            title: "Efficiency Expert",
            description: "You've learned to do more with less!",
            unlocks: ["Level 6: Storm Season"]
        }
    }
    
    // Levels 6-10 would continue here following the same pattern
    // Will be implemented as their required features are developed
};

// Helper functions for level management
export function getLevelById(levelId) {
    return LEVELS[levelId] || null;
}

export function getEnabledLevels() {
    return Object.values(LEVELS).filter(level => level.enabled);
}

export function getNextLevel(currentLevelId) {
    const nextId = currentLevelId + 1;
    return LEVELS[nextId] || null;
}

export function isLevelUnlocked(levelId) {
    const level = LEVELS[levelId];
    if (!level) return false;
    
    // Check if all required features are implemented
    return level.enabled && level.requiredFeatures.every(feature => GAME_FEATURES[feature]);
}

export function getLevelProgress(levelId) {
    const level = LEVELS[levelId];
    if (!level) return null;
    
    return {
        id: level.id,
        name: level.name,
        description: level.shortDescription,
        unlocked: isLevelUnlocked(levelId),
        winConditions: level.winConditions.length,
        loseConditions: level.loseConditions.length,
        newMechanics: level.newMechanics,
        requiredFeatures: level.requiredFeatures,
        missingFeatures: level.requiredFeatures.filter(feature => !GAME_FEATURES[feature])
    };
}

// Development helper to enable features as they're implemented
export function enableFeature(featureName) {
    if (featureName in GAME_FEATURES) {
        GAME_FEATURES[featureName] = true;
        
        // Auto-enable levels that now have all required features
        Object.values(LEVELS).forEach(level => {
            if (!level.enabled && level.requiredFeatures.every(feature => GAME_FEATURES[feature])) {
                level.enabled = true;
                console.log(`[Levels] Auto-enabled level ${level.id}: ${level.name}`);
            }
        });
        
        console.log(`[Levels] Enabled feature: ${featureName}`);
    }
}

// Get campaign statistics
export function getCampaignStats() {
    const totalLevels = Object.keys(LEVELS).length;
    const enabledLevels = getEnabledLevels().length;
    const implementedFeatures = Object.values(GAME_FEATURES).filter(enabled => enabled).length;
    const totalFeatures = Object.keys(GAME_FEATURES).length;
    
    return {
        totalLevels,
        enabledLevels,
        implementedFeatures,
        totalFeatures,
        completionPercentage: Math.round((enabledLevels / totalLevels) * 100)
    };
}