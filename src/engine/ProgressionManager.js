import EventBus from './EventBus.js';
import ConditionManager from './conditions/ConditionManager.js';
import { LEVELS, getLevelById, getNextLevel, isLevelUnlocked } from '../configs/levels.js';

/**
 * ProgressionManager - Central orchestrator for era progression system
 * 
 * Manages the complete campaign progression through levels/eras,
 * handles win/lose conditions, and coordinates with the screen system.
 */
export class ProgressionManager {
    constructor(gameState, playerStorage) {
        this.gameState = gameState;
        this.playerStorage = playerStorage;
        
        // Core managers
        this.conditionManager = new ConditionManager(gameState, playerStorage);
        
        // Progression state
        this.currentLevelId = 1;
        this.currentLevel = null;
        this.completedLevels = [];
        this.campaignStartTime = Date.now();
        this.levelStartTime = Date.now();
        this.isLevelActive = false;
        
        // Statistics
        this.stats = {
            totalLevelsCompleted: 0,
            totalPlayTime: 0,
            averageCompletionTime: 0,
            fastestCompletion: null,
            attempts: 0,
            victories: 0,
            defeats: 0
        };
        
        // Event handlers
        this.setupEventHandlers();
        
        console.log('[ProgressionManager] Initialized progression system');
    }
    
    /**
     * Setup event handlers for condition results
     */
    setupEventHandlers() {
        EventBus.on('conditions:victory', (data) => this.handleVictory(data));
        EventBus.on('conditions:defeat', (data) => this.handleDefeat(data));
        EventBus.on('game:newLevel', (data) => this.startLevel(data.levelId));
        EventBus.on('game:restartLevel', () => this.restartCurrentLevel());
        EventBus.on('game:nextLevel', () => this.advanceToNextLevel());
        
        console.log('[ProgressionManager] Event handlers registered');
    }
    
    /**
     * Start a specific level
     * @param {number} levelId - ID of level to start
     * @returns {boolean} True if level started successfully
     */
    startLevel(levelId = 1) {
        const level = getLevelById(levelId);
        if (!level) {
            console.error(`[ProgressionManager] Invalid level ID: ${levelId}`);
            return false;
        }
        
        if (!isLevelUnlocked(levelId)) {
            console.error(`[ProgressionManager] Level ${levelId} is not unlocked`);
            return false;
        }
        
        // Store current level
        this.currentLevelId = levelId;
        this.currentLevel = level;
        this.isLevelActive = true;
        this.levelStartTime = Date.now();
        
        // Load level conditions
        this.conditionManager.loadLevelConditions(level);
        
        // Reset game state for level
        this.resetGameStateForLevel();
        
        // Update statistics
        this.stats.attempts++;
        
        // Emit level start event
        EventBus.emit('progression:levelStarted', {
            levelId: levelId,
            level: level,
            attempt: this.stats.attempts
        });
        
        console.log(`[ProgressionManager] Started Level ${levelId}: ${level.name}`);
        console.log(`[ProgressionManager] Objective: ${level.description}`);
        
        return true;
    }
    
    /**
     * Check conditions (called each turn)
     * @returns {Object} Condition check results
     */
    checkConditions() {
        if (!this.isLevelActive || !this.currentLevel) {
            return { victory: false, defeat: false };
        }
        
        const results = this.conditionManager.checkAllConditions();
        
        // Emit progress update
        EventBus.emit('progression:conditionsChecked', {
            levelId: this.currentLevelId,
            results: results,
            progress: results.winProgress
        });
        
        return results;
    }
    
    /**
     * Handle victory achievement
     * @param {Object} data - Victory data from conditions
     */
    handleVictory(data) {
        if (!this.isLevelActive) return;
        
        const completionTime = Date.now() - this.levelStartTime;
        const level = this.currentLevel;
        
        // Update statistics
        this.stats.victories++;
        this.stats.totalLevelsCompleted++;
        this.stats.totalPlayTime += completionTime;
        this.stats.averageCompletionTime = this.stats.totalPlayTime / this.stats.totalLevelsCompleted;
        
        if (!this.stats.fastestCompletion || completionTime < this.stats.fastestCompletion.time) {
            this.stats.fastestCompletion = {
                levelId: this.currentLevelId,
                time: completionTime,
                turn: data.turn
            };
        }
        
        // Mark level as completed
        if (!this.completedLevels.includes(this.currentLevelId)) {
            this.completedLevels.push(this.currentLevelId);
        }
        
        // Deactivate level
        this.isLevelActive = false;
        
        // Prepare victory data
        const victoryData = {
            levelId: this.currentLevelId,
            level: level,
            completionTime: completionTime,
            completionTurn: data.turn,
            conditions: data.conditions,
            stats: { ...this.stats },
            nextLevel: getNextLevel(this.currentLevelId),
            isCampaignComplete: this.isCampaignComplete()
        };
        
        console.log(`[ProgressionManager] LEVEL COMPLETED! Level ${this.currentLevelId} in ${Math.round(completionTime/1000)}s (${data.turn} turns)`);
        
        // Emit victory event for screen system
        EventBus.emit('progression:levelCompleted', victoryData);
        
        // Auto-advance to next level if campaign continues
        if (!victoryData.isCampaignComplete) {
            setTimeout(() => {
                EventBus.emit('progression:showNextLevel', victoryData);
            }, 2000); // Brief pause for celebration
        } else {
            EventBus.emit('progression:campaignCompleted', victoryData);
        }
    }
    
    /**
     * Handle defeat/failure
     * @param {Object} data - Defeat data from conditions
     */
    handleDefeat(data) {
        if (!this.isLevelActive) return;
        
        const failTime = Date.now() - this.levelStartTime;
        const level = this.currentLevel;
        
        // Update statistics
        this.stats.defeats++;
        this.stats.totalPlayTime += failTime;
        
        // Deactivate level
        this.isLevelActive = false;
        
        // Prepare defeat data
        const defeatData = {
            levelId: this.currentLevelId,
            level: level,
            failTime: failTime,
            failTurn: data.turn,
            triggeredConditions: data.triggeredConditions,
            stats: { ...this.stats },
            canRetry: true // Always allow retry in current design
        };
        
        console.log(`[ProgressionManager] LEVEL FAILED! Level ${this.currentLevelId} on turn ${data.turn}`);
        console.log(`[ProgressionManager] Failure reasons:`, data.triggeredConditions.map(c => c.condition.getDescription()));
        
        // Emit defeat event for screen system
        EventBus.emit('progression:levelFailed', defeatData);
    }
    
    /**
     * Restart the current level
     */
    restartCurrentLevel() {
        if (this.currentLevelId) {
            console.log(`[ProgressionManager] Restarting Level ${this.currentLevelId}`);
            this.startLevel(this.currentLevelId);
        }
    }
    
    /**
     * Advance to the next level
     */
    advanceToNextLevel() {
        const nextLevel = getNextLevel(this.currentLevelId);
        if (nextLevel && isLevelUnlocked(nextLevel.id)) {
            console.log(`[ProgressionManager] Advancing to Level ${nextLevel.id}: ${nextLevel.name}`);
            this.startLevel(nextLevel.id);
        } else {
            console.log('[ProgressionManager] No next level available or not unlocked');
            EventBus.emit('progression:campaignCompleted', {
                completedLevels: this.completedLevels,
                stats: this.stats
            });
        }
    }
    
    /**
     * Reset game state for level start
     */
    resetGameStateForLevel() {
        // Reset turn counter
        this.gameState.currentTurn = 1;
        this.gameState.timeRemaining = this.gameState.timePerTurn;
        this.gameState.turnProgress = 0;
        
        // Reset game over state
        this.gameState.isGameOver = false;
        this.gameState.gameOverReason = null;
        this.gameState.isPaused = false;
        
        // Note: For Level 1, we DON'T reset the game state since the player
        // should continue from their current progress. The progression system
        // tracks objectives on top of the existing game state.
        
        // Only reset game over states, not the actual game content
        // Resources, buildings, and units should remain as-is
        
        console.log(`[ProgressionManager] Game state reset for Level ${this.currentLevelId}`);
    }
    
    /**
     * Check if campaign is complete
     * @returns {boolean} True if all levels completed
     */
    isCampaignComplete() {
        const enabledLevels = Object.values(LEVELS).filter(level => level.enabled);
        return this.completedLevels.length >= enabledLevels.length;
    }
    
    /**
     * Get current progression status
     * @returns {Object} Progression status
     */
    getStatus() {
        return {
            currentLevelId: this.currentLevelId,
            currentLevel: this.currentLevel,
            isLevelActive: this.isLevelActive,
            completedLevels: [...this.completedLevels],
            stats: { ...this.stats },
            conditions: this.conditionManager.getStatus(),
            campaignProgress: {
                completed: this.completedLevels.length,
                total: Object.values(LEVELS).filter(l => l.enabled).length,
                percentage: Math.round((this.completedLevels.length / Object.values(LEVELS).filter(l => l.enabled).length) * 100)
            }
        };
    }
    
    /**
     * Get level history and statistics
     * @returns {Object} Historical data
     */
    getHistory() {
        return {
            completedLevels: this.completedLevels.map(levelId => ({
                id: levelId,
                level: getLevelById(levelId),
                completedAt: Date.now() // Would be actual completion time in full implementation
            })),
            stats: this.stats,
            campaignStartTime: this.campaignStartTime,
            totalPlayTime: this.stats.totalPlayTime
        };
    }
    
    /**
     * Save progression state (for future save system)
     * @returns {Object} Serializable progression data
     */
    getSaveData() {
        return {
            currentLevelId: this.currentLevelId,
            completedLevels: [...this.completedLevels],
            stats: { ...this.stats },
            campaignStartTime: this.campaignStartTime,
            version: '1.0'
        };
    }
    
    /**
     * Load progression state (for future save system)
     * @param {Object} saveData - Previously saved progression data
     */
    loadSaveData(saveData) {
        if (!saveData || saveData.version !== '1.0') {
            console.warn('[ProgressionManager] Invalid or incompatible save data');
            return false;
        }
        
        this.currentLevelId = saveData.currentLevelId || 1;
        this.completedLevels = saveData.completedLevels || [];
        this.stats = { ...this.stats, ...saveData.stats };
        this.campaignStartTime = saveData.campaignStartTime || Date.now();
        
        console.log(`[ProgressionManager] Loaded progression: Level ${this.currentLevelId}, ${this.completedLevels.length} completed`);
        return true;
    }
    
    /**
     * Clean up manager
     */
    destroy() {
        // Remove event listeners
        EventBus.off('conditions:victory');
        EventBus.off('conditions:defeat');
        EventBus.off('game:newLevel');
        EventBus.off('game:restartLevel');
        EventBus.off('game:nextLevel');
        
        // Clean up condition manager
        if (this.conditionManager) {
            this.conditionManager.clearAllConditions();
        }
        
        console.log('[ProgressionManager] Destroyed progression manager');
    }
}

export default ProgressionManager;