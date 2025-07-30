/**
 * Long Tomorrow Systems Index
 * 
 * Central export point for all Long Tomorrow game mode systems.
 * Provides easy access to the core systems that enable the persistent,
 * evolving world experience described in the specification.
 */

import { WorldStateManager } from './WorldStateManager.js';
import { ResearchPointManager, RESEARCH_TREES } from './ResearchPointManager.js';
import { AchievementSystem, ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from './AchievementSystem.js';

// Export individual classes
export {
    WorldStateManager,
    ResearchPointManager,
    AchievementSystem
};

// Export constants
export {
    RESEARCH_TREES,
    ACHIEVEMENTS,
    ACHIEVEMENT_CATEGORIES
};

/**
 * LongTomorrowManager - Orchestrates all Long Tomorrow systems
 * 
 * This manager class coordinates between the WorldStateManager,
 * ResearchPointManager, and AchievementSystem to provide a unified
 * interface for Long Tomorrow mode functionality.
 */
export class LongTomorrowManager {
    constructor() {
        // Initialize core systems
        this.researchPointManager = new ResearchPointManager();
        this.achievementSystem = new AchievementSystem(this.researchPointManager);
        this.worldStateManager = new WorldStateManager();
        
        // System integration
        this.setupSystemIntegration();
        
        console.log('[LongTomorrowManager] Initialized Long Tomorrow systems');
    }
    
    /**
     * Set up integration between systems
     */
    setupSystemIntegration() {
        // The systems are already integrated through EventBus,
        // but we can add additional coordination here if needed
        
        // Example: When world evolves, check for achievements
        // EventBus.on('worldState:evolved', this.checkWorldEvolutionAchievements.bind(this));
    }
    
    /**
     * Initialize a new Long Tomorrow session
     * @param {Object} options - Session initialization options
     * @returns {Object} Session initialization data
     */
    initializeSession(options = {}) {
        console.log('[LongTomorrowManager] Initializing new Long Tomorrow session');
        
        // Initialize world state
        const worldState = this.worldStateManager.initializeWorldState(options.previousWorldState);
        
        // Check for any immediate achievements or unlocks
        const researchSummary = this.researchPointManager.getPointsSummary();
        const achievementStats = this.achievementSystem.getAchievementStats();
        
        return {
            worldState,
            researchSummary,
            achievementStats,
            sessionId: worldState.sessionId,
            sessionNumber: worldState.sessionNumber
        };
    }
    
    /**
     * Process session completion and world evolution
     * @param {Object} gameState - Final game state
     * @param {Object} sessionData - Session completion data
     * @returns {Object} Evolution summary and next session data
     */
    processSessionCompletion(gameState, sessionData = {}) {
        console.log('[LongTomorrowManager] Processing session completion for world evolution');
        
        // Record current session state
        const sessionState = this.worldStateManager.recordSessionState(gameState, sessionData);
        
        // Evolve world for next session
        const newWorldState = this.worldStateManager.evolveWorldState(sessionState);
        
        // Get updated research and achievement status
        const researchSummary = this.researchPointManager.getPointsSummary();
        const achievementStats = this.achievementSystem.getAchievementStats();
        const newAchievements = this.achievementSystem.sessionAchievements;
        
        return {
            sessionState,
            newWorldState,
            researchSummary,
            achievementStats,
            newAchievements,
            worldEvolutionSummary: this.generateEvolutionSummary(sessionState, newWorldState)
        };
    }
    
    /**
     * Generate a summary of world evolution changes
     * @param {Object} sessionState - Completed session state
     * @param {Object} newWorldState - Evolved world state
     * @returns {Object} Evolution summary
     */
    generateEvolutionSummary(sessionState, newWorldState) {
        const summary = {
            forestsGrown: newWorldState.stats.forestsGrown - (sessionState.worldState?.stats.forestsGrown || 0),
            ruinsCreated: newWorldState.ruins.size,
            resourcePilesCreated: 0, // Count from terrain
            soilChanges: newWorldState.soilMemory.size,
            culturalSites: newWorldState.culturalSites.size
        };
        
        // Count resource piles in terrain
        newWorldState.terrain.forEach(terrain => {
            if (terrain.type === 'resource_pile') {
                summary.resourcePilesCreated++;
            }
        });
        
        return summary;
    }
    
    /**
     * Get research tree status for UI
     * @returns {Object} Research tree status
     */
    getResearchTreeStatus() {
        const trees = {};
        
        Object.keys(RESEARCH_TREES).forEach(treeKey => {
            const tree = RESEARCH_TREES[treeKey];
            trees[tree.id] = this.researchPointManager.getResearchTreeStatus(tree.id);
        });
        
        return {
            trees,
            availablePoints: this.researchPointManager.availableResearchPoints,
            totalPoints: this.researchPointManager.totalResearchPoints,
            primarySpecialization: this.researchPointManager.getPrimarySpecialization()
        };
    }
    
    /**
     * Get achievement progress for UI
     * @returns {Object} Achievement progress data
     */
    getAchievementProgress() {
        return {
            categories: this.achievementSystem.getAchievementsByCategory(),
            stats: this.achievementSystem.getAchievementStats(),
            recent: this.achievementSystem.getRecentAchievements(),
            session: this.achievementSystem.sessionAchievements
        };
    }
    
    /**
     * Get world history and state for UI
     * @returns {Object} World state data
     */
    getWorldStateData() {
        return {
            currentState: this.worldStateManager.getCurrentWorldState(),
            history: this.worldStateManager.getWorldHistory(),
            stats: this.worldStateManager.getWorldStats()
        };
    }
    
    /**
     * Purchase research upgrade
     * @param {string} treeId - Research tree ID
     * @param {number} tier - Tier to purchase
     * @returns {boolean} Success
     */
    purchaseResearch(treeId, tier) {
        return this.researchPointManager.purchaseResearch(treeId, tier);
    }
    
    /**
     * Check if research can be purchased
     * @param {string} treeId - Research tree ID
     * @param {number} tier - Tier to check
     * @returns {boolean} Can purchase
     */
    canPurchaseResearch(treeId, tier) {
        return this.researchPointManager.canPurchaseResearch(treeId, tier);
    }
    
    /**
     * Check if research is unlocked
     * @param {string} treeId - Research tree ID
     * @param {number} tier - Tier to check
     * @returns {boolean} Is unlocked
     */
    isResearchUnlocked(treeId, tier) {
        return this.researchPointManager.isResearchUnlocked(treeId, tier);
    }
    
    /**
     * Get save data for all Long Tomorrow systems
     * @returns {Object} Complete save data
     */
    getSaveData() {
        return {
            worldState: this.worldStateManager.getCurrentWorldState(),
            worldHistory: this.worldStateManager.getWorldHistory(),
            researchProgress: this.researchPointManager.getSaveData(),
            achievementData: this.achievementSystem.getSaveData(),
            version: '1.0.0', // For save compatibility
            timestamp: Date.now()
        };
    }
    
    /**
     * Load save data for all Long Tomorrow systems
     * @param {Object} saveData - Complete save data
     */
    loadSaveData(saveData) {
        if (!saveData) {
            console.warn('[LongTomorrowManager] No save data provided');
            return;
        }
        
        console.log('[LongTomorrowManager] Loading Long Tomorrow save data');
        
        // Load research progress
        if (saveData.researchProgress) {
            this.researchPointManager.loadProgress(saveData.researchProgress);
        }
        
        // Load achievement data
        if (saveData.achievementData) {
            this.achievementSystem.loadSaveData(saveData.achievementData);
        }
        
        // Load world state
        if (saveData.worldState) {
            this.worldStateManager.initializeWorldState(saveData.worldState);
        }
        
        // Load world history
        if (saveData.worldHistory) {
            this.worldStateManager.worldHistory = saveData.worldHistory;
        }
        
        console.log('[LongTomorrowManager] Save data loaded successfully');
    }
    
    /**
     * Reset all Long Tomorrow systems (for development/testing)
     */
    reset() {
        console.log('[LongTomorrowManager] Resetting all Long Tomorrow systems');
        
        this.researchPointManager.resetResearch();
        this.achievementSystem = new AchievementSystem(this.researchPointManager);
        this.worldStateManager = new WorldStateManager();
        
        console.log('[LongTomorrowManager] Reset complete');
    }
}

// Create and export singleton instance for global use
export const longTomorrowManager = new LongTomorrowManager();

export default {
    WorldStateManager,
    ResearchPointManager,
    AchievementSystem,
    LongTomorrowManager,
    longTomorrowManager,
    RESEARCH_TREES,
    ACHIEVEMENTS,
    ACHIEVEMENT_CATEGORIES
};