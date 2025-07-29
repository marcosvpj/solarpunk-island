import EventBus from '../EventBus.js';
import { CONDITION_TYPES } from '../../configs/levels.js';

// Import condition classes
import { BuildingCountCondition, BuildingActiveCondition, ConsecutiveTurnsCondition } from './BuildingConditions.js';
import { SurvivalCondition, FuelDepletionCondition, TurnLimitCondition } from './SurvivalConditions.js';

/**
 * ConditionManager - Orchestrates all condition checking
 * 
 * Central manager for win/lose conditions. Handles condition registration,
 * checking, and result aggregation for the progression system.
 */
export class ConditionManager {
    constructor(gameState, playerStorage) {
        this.gameState = gameState;
        this.playerStorage = playerStorage;
        
        // Condition registry
        this.conditionClasses = {
            'BuildingCountCondition': BuildingCountCondition,
            'BuildingActiveCondition': BuildingActiveCondition,
            'ConsecutiveTurnsCondition': ConsecutiveTurnsCondition,
            'SurvivalCondition': SurvivalCondition,
            'FuelDepletionCondition': FuelDepletionCondition,
            'TurnLimitCondition': TurnLimitCondition
        };
        
        // Active conditions
        this.winConditions = [];
        this.loseConditions = [];
        
        // State tracking
        this.lastWinCheck = false;
        this.lastLoseCheck = false;
        this.checkHistory = [];
        
        console.log('[ConditionManager] Initialized condition management system');
    }
    
    /**
     * Load conditions from level configuration
     * @param {Object} levelConfig - Level configuration with win/lose conditions
     */
    loadLevelConditions(levelConfig) {
        this.clearAllConditions();
        
        // Load win conditions
        if (levelConfig.winConditions) {
            levelConfig.winConditions.forEach((config, index) => {
                try {
                    const condition = this.createCondition(config);
                    if (condition) {
                        this.winConditions.push(condition);
                        console.log(`[ConditionManager] Loaded win condition ${index + 1}:`, condition.getDescription());
                    }
                } catch (error) {
                    console.error(`[ConditionManager] Failed to load win condition ${index + 1}:`, error);
                }
            });
        }
        
        // Load lose conditions
        if (levelConfig.loseConditions) {
            levelConfig.loseConditions.forEach((config, index) => {
                try {
                    const condition = this.createCondition(config);
                    if (condition) {
                        this.loseConditions.push(condition);
                        console.log(`[ConditionManager] Loaded lose condition ${index + 1}:`, condition.getDescription());
                    }
                } catch (error) {
                    console.error(`[ConditionManager] Failed to load lose condition ${index + 1}:`, error);
                }
            });
        }
        
        console.log(`[ConditionManager] Loaded ${this.winConditions.length} win conditions and ${this.loseConditions.length} lose conditions`);
    }
    
    /**
     * Create a condition instance from configuration
     * @param {Object} config - Condition configuration
     * @returns {BaseCondition|null} Created condition or null if failed
     */
    createCondition(config) {
        if (!config.type) {
            console.error('[ConditionManager] Condition config missing type:', config);
            return null;
        }
        
        const conditionClassName = CONDITION_TYPES[config.type];
        if (!conditionClassName) {
            console.error(`[ConditionManager] Unknown condition type: ${config.type}`);
            return null;
        }
        
        const ConditionClass = this.conditionClasses[conditionClassName];
        if (!ConditionClass) {
            console.error(`[ConditionManager] Condition class not registered: ${conditionClassName}`);
            return null;
        }
        
        return new ConditionClass(config, this.gameState, this.playerStorage);
    }
    
    /**
     * Check all conditions and return results
     * @returns {Object} Check results with win/lose status
     */
    checkAllConditions() {
        const turn = this.gameState.currentTurn;
        
        // Check win conditions (ALL must be met)
        const winResults = this.winConditions.map(condition => ({
            condition,
            result: condition.check(),
            status: condition.getStatus()
        }));
        console.log(winResults)
        const allWinConditionsMet = winResults.length > 0 && winResults.every(result => result.result);
        
        // Check lose conditions (ANY can trigger)
        const loseResults = this.loseConditions.map(condition => ({
            condition,
            result: condition.check(),
            status: condition.getStatus()
        }));
        const anyLoseConditionMet = loseResults.some(result => result.result);
        
        // Prepare results
        const results = {
            turn,
            victory: allWinConditionsMet,
            defeat: anyLoseConditionMet,
            winConditions: winResults,
            loseConditions: loseResults,
            winProgress: this.calculateWinProgress(winResults),
            timestamp: Date.now()
        };
        
        // Track state changes
        const winChanged = allWinConditionsMet !== this.lastWinCheck;
        const loseChanged = anyLoseConditionMet !== this.lastLoseCheck;
        
        if (winChanged || loseChanged) {
            this.onConditionStateChange(results);
        }
        
        this.lastWinCheck = allWinConditionsMet;
        this.lastLoseCheck = anyLoseConditionMet;
        
        // Store check in history (keep last 10)
        this.checkHistory.push(results);
        if (this.checkHistory.length > 10) {
            this.checkHistory.shift();
        }
        
        return results;
    }
    
    /**
     * Calculate overall progress toward victory (0-1)
     * @param {Array} winResults - Win condition check results
     * @returns {number} Progress percentage
     */
    calculateWinProgress(winResults) {
        if (winResults.length === 0) return 1.0;
        
        const totalProgress = winResults.reduce((sum, result) => {
            return sum + result.condition.getProgress();
        }, 0);
        
        return totalProgress / winResults.length;
    }
    
    /**
     * Handle condition state changes
     * @param {Object} results - Current check results
     */
    onConditionStateChange(results) {
        if (results.victory) {
            this.onVictoryAchieved(results);
        }
        
        if (results.defeat) {
            this.onDefeatTriggered(results);
        }
        
        // Emit general state change event
        EventBus.emit('conditions:stateChanged', results);
    }
    
    /**
     * Handle victory achievement
     * @param {Object} results - Victory results
     */
    onVictoryAchieved(results) {
        console.log(`[ConditionManager] VICTORY achieved on turn ${results.turn}!`);
        
        // Emit victory event
        EventBus.emit('conditions:victory', {
            turn: results.turn,
            conditions: results.winConditions,
            progress: results.winProgress
        });
        
        // Emit general game event
        EventBus.emit('game:victory', results);
    }
    
    /**
     * Handle defeat trigger
     * @param {Object} results - Defeat results
     */
    onDefeatTriggered(results) {
        const triggeredConditions = results.loseConditions.filter(result => result.result);
        console.log(`[ConditionManager] DEFEAT triggered on turn ${results.turn} by:`, 
                   triggeredConditions.map(r => r.condition.getDescription()));
        
        // Emit defeat event
        EventBus.emit('conditions:defeat', {
            turn: results.turn,
            triggeredConditions,
            allConditions: results.loseConditions
        });
        
        // Emit general game event
        EventBus.emit('game:defeat', results);
    }
    
    /**
     * Get current condition status for UI display
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            winConditions: this.winConditions.map(c => c.getStatus()),
            loseConditions: this.loseConditions.map(c => c.getStatus()),
            winProgress: this.lastWinCheck ? 1.0 : this.calculateWinProgress(
                this.winConditions.map(c => ({ condition: c, result: c.isMet }))
            ),
            lastCheck: this.checkHistory[this.checkHistory.length - 1] || null
        };
    }
    
    /**
     * Reset all conditions
     */
    resetAllConditions() {
        this.winConditions.forEach(condition => condition.reset());
        this.loseConditions.forEach(condition => condition.reset());
        
        this.lastWinCheck = false;
        this.lastLoseCheck = false;
        this.checkHistory = [];
        
        console.log('[ConditionManager] Reset all conditions');
    }
    
    /**
     * Clear all conditions
     */
    clearAllConditions() {
        this.winConditions = [];
        this.loseConditions = [];
        this.lastWinCheck = false;
        this.lastLoseCheck = false;
        this.checkHistory = [];
        
        console.log('[ConditionManager] Cleared all conditions');
    }
    
    /**
     * Get debug information
     * @returns {Object} Debug data
     */
    getDebugInfo() {
        return {
            conditionsLoaded: {
                win: this.winConditions.length,
                lose: this.loseConditions.length
            },
            lastResults: {
                win: this.lastWinCheck,
                lose: this.lastLoseCheck
            },
            history: this.checkHistory.length,
            conditions: {
                win: this.winConditions.map(c => c.getDebugInfo()),
                lose: this.loseConditions.map(c => c.getDebugInfo())
            }
        };
    }
}

export default ConditionManager;