/**
 * AchievementSystem - Manages achievements and research point awards
 * 
 * Tracks player achievements across all game modes and awards research points
 * for Long Tomorrow mode progression. Based on the specification achievements.
 */

import EventBus from '../../engine/EventBus.js';

// Achievement definitions from the specification
export const ACHIEVEMENTS = {
    // Efficiency Achievements
    ZERO_WASTE: {
        id: 'zero_waste',
        name: 'Zero Waste',
        description: 'Recycle 20+ buildings in a single session',
        category: 'efficiency',
        points: 5,
        condition: { type: 'buildings_recycled', target: 20 },
        icon: 'recycle'
    },
    
    JUST_IN_TIME: {
        id: 'just_in_time',
        name: 'Just In Time',
        description: 'Complete level with <10 fuel storage',
        category: 'efficiency',
        points: 3,
        condition: { type: 'low_fuel_victory', target: 10 },
        icon: 'fuel'
    },
    
    PERFECT_GRID: {
        id: 'perfect_grid',
        name: 'Perfect Grid',
        description: 'All buildings get adjacency bonuses',
        category: 'efficiency',
        points: 4,
        condition: { type: 'all_adjacency_bonuses' },
        icon: 'grid'
    },
    
    RESOURCE_SAGE: {
        id: 'resource_sage',
        name: 'Resource Sage',
        description: '95%+ refinery efficiency for 20 turns',
        category: 'efficiency',
        points: 4,
        condition: { type: 'refinery_efficiency', target: 0.95, duration: 20 },
        icon: 'sage'
    },
    
    // Survival Achievements
    STORM_RIDER: {
        id: 'storm_rider',
        name: 'Storm Rider',
        description: 'Survive 10+ disasters in one run',
        category: 'survival',
        points: 6,
        condition: { type: 'disasters_survived', target: 10 },
        icon: 'storm'
    },
    
    PHOENIX_RISING: {
        id: 'phoenix_rising',
        name: 'Phoenix Rising',
        description: 'Rebuild from <5 to 50+ population',
        category: 'survival',
        points: 8,
        condition: { type: 'population_recovery', from: 5, to: 50 },
        icon: 'phoenix'
    },
    
    THE_LONG_WATCH: {
        id: 'the_long_watch',
        name: 'The Long Watch',
        description: 'Complete 200+ turn session',
        category: 'survival',
        points: 10,
        condition: { type: 'long_session', target: 200 },
        icon: 'watch'
    },
    
    AGAINST_ALL_ODDS: {
        id: 'against_all_odds',
        name: 'Against All Odds',
        description: 'Win after surviving 5+ disasters',
        category: 'survival',
        points: 7,
        condition: { type: 'disaster_victory', target: 5 },
        icon: 'odds'
    },
    
    // Social Achievements
    UTOPIAN_SOCIETY: {
        id: 'utopian_society',
        name: 'Utopian Society',
        description: '100+ population, perfect happiness, 10 turns',
        category: 'social',
        points: 7,
        condition: { type: 'utopian_state', population: 100, happiness: 1.0, duration: 10 },
        icon: 'utopia'
    },
    
    TRUE_EQUALITY: {
        id: 'true_equality',
        name: 'True Equality',
        description: 'All habitations same level, 20 turns',
        category: 'social',
        points: 5,
        condition: { type: 'equal_habitations', duration: 20 },
        icon: 'equality'
    },
    
    GREEN_PARADISE: {
        id: 'green_paradise',
        name: 'Green Paradise',
        description: '50+ population, renewable energy only',
        category: 'social',
        points: 6,
        condition: { type: 'renewable_only', population: 50 },
        icon: 'green'
    },
    
    CULTURAL_RENAISSANCE: {
        id: 'cultural_renaissance',
        name: 'Cultural Renaissance',
        description: 'All luxury types simultaneously',
        category: 'social',
        points: 5,
        condition: { type: 'all_luxuries' },
        icon: 'culture'
    },
    
    // Exploration Achievements
    MASTER_BUILDER: {
        id: 'master_builder',
        name: 'Master Builder',
        description: 'Construct every building type',
        category: 'exploration',
        points: 6,
        condition: { type: 'all_building_types' },
        icon: 'builder'
    },
    
    ISLAND_CHAIN: {
        id: 'island_chain',
        name: 'Island Chain',
        description: 'Manage 5+ islands simultaneously',
        category: 'exploration',
        points: 12,
        condition: { type: 'multiple_islands', target: 5 },
        icon: 'islands'
    },
    
    ARCHAEOLOGICAL_SURVEY: {
        id: 'archaeological_survey',
        name: 'Archaeological Survey',
        description: 'Interact with 50+ ruins',
        category: 'exploration',
        points: 8,
        condition: { type: 'ruin_interactions', target: 50 },
        icon: 'archaeology'
    }
};

export const ACHIEVEMENT_CATEGORIES = {
    efficiency: { name: 'Efficiency', color: '#FFD700', icon: 'efficiency' },
    survival: { name: 'Survival', color: '#DC143C', icon: 'survival' },
    social: { name: 'Social', color: '#32CD32', icon: 'social' },
    exploration: { name: 'Exploration', color: '#4169E1', icon: 'exploration' }
};

export class AchievementSystem {
    constructor(researchPointManager = null) {
        this.researchPointManager = researchPointManager;
        
        // Achievement progress tracking
        this.achievementProgress = new Map(); // achievementId -> progress data
        this.unlockedAchievements = new Set();
        this.sessionAchievements = []; // Achievements unlocked this session
        
        // Session tracking for achievement conditions
        this.sessionStats = this.createEmptySessionStats();
        
        this.initializeAchievements();
        this.setupEventListeners();
        
        console.log('[AchievementSystem] Initialized with', Object.keys(ACHIEVEMENTS).length, 'achievements');
    }
    
    /**
     * Initialize achievement progress tracking
     */
    initializeAchievements() {
        Object.values(ACHIEVEMENTS).forEach(achievement => {
            this.achievementProgress.set(achievement.id, {
                progress: 0,
                maxProgress: this.getAchievementMaxProgress(achievement),
                unlocked: false,
                unlockedAt: null,
                sessionProgress: 0
            });
        });
    }
    
    /**
     * Set up event listeners for achievement tracking
     */
    setupEventListeners() {
        // Building events
        EventBus.on('building:constructed', this.handleBuildingConstructed.bind(this));
        EventBus.on('building:recycled', this.handleBuildingRecycled.bind(this));
        EventBus.on('building:upgraded', this.handleBuildingUpgraded.bind(this));
        
        // Population events
        EventBus.on('population:changed', this.handlePopulationChanged.bind(this));
        EventBus.on('population:happiness', this.handleHappinessChanged.bind(this));
        
        // Disaster events
        EventBus.on('disaster:occurred', this.handleDisasterOccurred.bind(this));
        EventBus.on('disaster:survived', this.handleDisasterSurvived.bind(this));
        
        // Game state events
        EventBus.on('game:turnCompleted', this.handleTurnCompleted.bind(this));
        EventBus.on('game:victory', this.handleGameVictory.bind(this));
        EventBus.on('game:sessionStarted', this.handleSessionStarted.bind(this));
        EventBus.on('game:sessionEnded', this.handleSessionEnded.bind(this));
        
        // Ruin events (for Long Tomorrow)
        EventBus.on('ruin:interacted', this.handleRuinInteraction.bind(this));
    }
    
    /**
     * Create empty session stats for tracking
     */
    createEmptySessionStats() {
        return {
            buildingsConstructed: 0,
            buildingsRecycled: 0,
            buildingTypesBuilt: new Set(),
            
            population: 0,
            peakPopulation: 0,
            lowPopulation: Infinity,
            happiness: 0,
            
            disastersOccurred: 0,
            disastersSurvived: 0,
            
            turn: 0,
            refineryEfficiencyStreak: 0,
            
            ruinInteractions: 0,
            
            // Tracking for complex achievements
            allBuildingsHaveAdjacency: false,
            allHabitationsSameLevel: false,
            renewableEnergyOnly: true,
            allLuxuryTypes: new Set()
        };
    }
    
    /**
     * Handle building construction events
     */
    handleBuildingConstructed(data) {
        this.sessionStats.buildingsConstructed++;
        this.sessionStats.buildingTypesBuilt.add(data.buildingType);
        
        // Check Master Builder achievement
        this.checkMasterBuilderProgress();
        
        // Check renewable energy status
        if (data.buildingType === 'reactor' && data.fuelType !== 'renewable') {
            this.sessionStats.renewableEnergyOnly = false;
        }
        
        this.checkAchievementProgress();
    }
    
    /**
     * Handle building recycled events
     */
    handleBuildingRecycled(data) {
        this.sessionStats.buildingsRecycled++;
        this.updateAchievementProgress('zero_waste', 1);
        this.checkAchievementProgress();
    }
    
    /**
     * Handle population changes
     */
    handlePopulationChanged(data) {
        this.sessionStats.population = data.population;
        this.sessionStats.peakPopulation = Math.max(this.sessionStats.peakPopulation, data.population);
        this.sessionStats.lowPopulation = Math.min(this.sessionStats.lowPopulation, data.population);
        
        // Check Phoenix Rising conditions
        if (this.sessionStats.lowPopulation <= 5 && data.population >= 50) {
            this.unlockAchievement('phoenix_rising');
        }
        
        this.checkAchievementProgress();
    }
    
    /**
     * Handle happiness changes
     */
    handleHappinessChanged(data) {
        this.sessionStats.happiness = data.happiness;
        this.checkAchievementProgress();
    }
    
    /**
     * Handle disaster events
     */
    handleDisasterOccurred(data) {
        this.sessionStats.disastersOccurred++;
        this.checkAchievementProgress();
    }
    
    handleDisasterSurvived(data) {
        this.sessionStats.disastersSurvived++;
        this.updateAchievementProgress('storm_rider', 1);
        this.checkAchievementProgress();
    }
    
    /**
     * Handle turn completion
     */
    handleTurnCompleted(data) {
        this.sessionStats.turn = data.turn;
        
        // Check refinery efficiency streak
        if (data.refineryEfficiency >= 0.95) {
            this.sessionStats.refineryEfficiencyStreak++;
            if (this.sessionStats.refineryEfficiencyStreak >= 20) {
                this.unlockAchievement('resource_sage');
            }
        } else {
            this.sessionStats.refineryEfficiencyStreak = 0;
        }
        
        // Check long session achievement
        if (data.turn >= 200) {
            this.unlockAchievement('the_long_watch');
        }
        
        this.checkAchievementProgress();
    }
    
    /**
     * Handle game victory
     */
    handleGameVictory(data) {
        // Check disaster victory
        if (this.sessionStats.disastersSurvived >= 5) {
            this.unlockAchievement('against_all_odds');
        }
        
        // Check fuel efficiency victory
        if (data.finalFuelStorage < 10) {
            this.unlockAchievement('just_in_time');
        }
        
        this.checkAchievementProgress();
    }
    
    /**
     * Handle session events
     */
    handleSessionStarted(data) {
        this.sessionStats = this.createEmptySessionStats();
        this.sessionAchievements = [];
        console.log('[AchievementSystem] New session started, stats reset');
    }
    
    handleSessionEnded(data) {
        console.log('[AchievementSystem] Session ended with', this.sessionAchievements.length, 'new achievements');
        EventBus.emit('achievements:sessionSummary', {
            newAchievements: [...this.sessionAchievements],
            totalUnlocked: this.unlockedAchievements.size,
            sessionStats: { ...this.sessionStats }
        });
    }
    
    /**
     * Handle ruin interactions (Long Tomorrow specific)
     */
    handleRuinInteraction(data) {
        this.sessionStats.ruinInteractions++;
        this.updateAchievementProgress('archaeological_survey', 1);
        this.checkAchievementProgress();
    }
    
    /**
     * Update achievement progress
     */
    updateAchievementProgress(achievementId, amount) {
        const progress = this.achievementProgress.get(achievementId);
        if (!progress || progress.unlocked) return;
        
        progress.progress += amount;
        progress.sessionProgress += amount;
        
        // Check if achievement is now complete
        if (progress.progress >= progress.maxProgress) {
            this.unlockAchievement(achievementId);
        }
    }
    
    /**
     * Unlock an achievement
     */
    unlockAchievement(achievementId) {
        if (this.unlockedAchievements.has(achievementId)) return;
        
        const achievement = ACHIEVEMENTS[achievementId.toUpperCase()];
        if (!achievement) {
            console.warn('[AchievementSystem] Unknown achievement:', achievementId);
            return;
        }
        
        const progress = this.achievementProgress.get(achievement.id);
        if (!progress) return;
        
        // Mark as unlocked
        this.unlockedAchievements.add(achievement.id);
        progress.unlocked = true;
        progress.unlockedAt = Date.now();
        this.sessionAchievements.push(achievement);
        
        console.log('[AchievementSystem] Achievement unlocked:', achievement.name);
        
        // Award research points if research manager is available
        if (this.researchPointManager) {
            this.researchPointManager.awardResearchPoints(achievement.id, achievement.points);
        }
        
        EventBus.emit('achievement:unlocked', {
            achievement,
            sessionAchievements: this.sessionAchievements.length,
            totalAchievements: this.unlockedAchievements.size
        });
    }
    
    /**
     * Check all achievement progress conditions
     */
    checkAchievementProgress() {
        // Perfect Grid - all buildings have adjacency bonuses
        // Note: This would need integration with building system
        
        // Utopian Society
        if (this.sessionStats.population >= 100 && this.sessionStats.happiness >= 1.0) {
            // Would need to track duration
        }
        
        // Green Paradise
        if (this.sessionStats.population >= 50 && this.sessionStats.renewableEnergyOnly) {
            this.unlockAchievement('green_paradise');
        }
        
        // Add more complex condition checks as needed
    }
    
    /**
     * Check Master Builder progress
     */
    checkMasterBuilderProgress() {
        // This would need to be integrated with the actual building system
        // to know what building types exist and have been built
        const totalBuildingTypes = 6; // reactor, refinery, storage, drone_factory, habitat, greenhouse
        
        if (this.sessionStats.buildingTypesBuilt.size >= totalBuildingTypes) {
            this.unlockAchievement('master_builder');
        }
    }
    
    /**
     * Get achievement max progress for tracking
     */
    getAchievementMaxProgress(achievement) {
        const condition = achievement.condition;
        
        switch (condition.type) {
            case 'buildings_recycled':
            case 'disasters_survived':
            case 'long_session':
            case 'ruin_interactions':
                return condition.target;
            default:
                return 1; // Binary achievements
        }
    }
    
    /**
     * Get achievement progress for UI
     */
    getAchievementProgress(achievementId) {
        const achievement = ACHIEVEMENTS[achievementId.toUpperCase()];
        const progress = this.achievementProgress.get(achievement.id);
        
        if (!achievement || !progress) return null;
        
        return {
            achievement,
            progress: progress.progress,
            maxProgress: progress.maxProgress,
            unlocked: progress.unlocked,
            unlockedAt: progress.unlockedAt,
            sessionProgress: progress.sessionProgress,
            percentage: progress.maxProgress > 0 ? (progress.progress / progress.maxProgress) * 100 : 0
        };
    }
    
    /**
     * Get all achievements by category
     */
    getAchievementsByCategory() {
        const categories = {};
        
        Object.keys(ACHIEVEMENT_CATEGORIES).forEach(category => {
            categories[category] = {
                info: ACHIEVEMENT_CATEGORIES[category],
                achievements: []
            };
        });
        
        Object.values(ACHIEVEMENTS).forEach(achievement => {
            const progress = this.getAchievementProgress(achievement.id);
            if (progress) {
                categories[achievement.category].achievements.push(progress);
            }
        });
        
        return categories;
    }
    
    /**
     * Get recent achievements (last 3 sessions)
     */
    getRecentAchievements(sessionCount = 3) {
        const cutoffTime = Date.now() - (sessionCount * 24 * 60 * 60 * 1000); // Approximate
        
        return Array.from(this.unlockedAchievements)
            .map(id => this.getAchievementProgress(id))
            .filter(progress => progress && progress.unlockedAt > cutoffTime)
            .sort((a, b) => b.unlockedAt - a.unlockedAt);
    }
    
    /**
     * Get achievement statistics
     */
    getAchievementStats() {
        const totalAchievements = Object.keys(ACHIEVEMENTS).length;
        const unlockedCount = this.unlockedAchievements.size;
        
        const categoryStats = {};
        Object.keys(ACHIEVEMENT_CATEGORIES).forEach(category => {
            const categoryAchievements = Object.values(ACHIEVEMENTS).filter(a => a.category === category);
            const unlockedInCategory = categoryAchievements.filter(a => this.unlockedAchievements.has(a.id)).length;
            
            categoryStats[category] = {
                total: categoryAchievements.length,
                unlocked: unlockedInCategory,
                percentage: (unlockedInCategory / categoryAchievements.length) * 100
            };
        });
        
        return {
            total: totalAchievements,
            unlocked: unlockedCount,
            percentage: (unlockedCount / totalAchievements) * 100,
            categories: categoryStats,
            sessionAchievements: this.sessionAchievements.length
        };
    }
    
    /**
     * Save achievement data
     */
    getSaveData() {
        return {
            unlockedAchievements: Array.from(this.unlockedAchievements),
            achievementProgress: Array.from(this.achievementProgress.entries()),
            sessionStats: this.sessionStats
        };
    }
    
    /**
     * Load achievement data
     */
    loadSaveData(saveData) {
        if (!saveData) return;
        
        if (saveData.unlockedAchievements) {
            this.unlockedAchievements = new Set(saveData.unlockedAchievements);
        }
        
        if (saveData.achievementProgress) {
            this.achievementProgress = new Map(saveData.achievementProgress);
        }
        
        if (saveData.sessionStats) {
            this.sessionStats = { ...this.createEmptySessionStats(), ...saveData.sessionStats };
            // Restore Sets
            if (saveData.sessionStats.buildingTypesBuilt) {
                this.sessionStats.buildingTypesBuilt = new Set(saveData.sessionStats.buildingTypesBuilt);
            }
            if (saveData.sessionStats.allLuxuryTypes) {
                this.sessionStats.allLuxuryTypes = new Set(saveData.sessionStats.allLuxuryTypes);
            }
        }
        
        console.log('[AchievementSystem] Loaded save data:', this.unlockedAchievements.size, 'achievements unlocked');
    }
}

export default AchievementSystem;