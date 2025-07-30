/**
 * ResearchPointManager - Manages research points and meta-progression
 * 
 * Handles the research point economy for Long Tomorrow mode, including:
 * - Achievement-based research point earning
 * - Research tree progression
 * - Specialization path management
 */

import EventBus from '../../engine/EventBus.js';

// Research specialization trees from the specification
export const RESEARCH_TREES = {
    ARCHAEOLOGIST: {
        id: 'archaeologist',
        name: 'The Archaeologist Path',
        description: 'Masters of ruin interaction and historical preservation',
        color: '#8B4513', // Brown
        tiers: {
            1: {
                id: 'keen_eye',
                name: 'Keen Eye',
                cost: 3,
                description: 'Hovering reveals ruin contents and all three outcomes. Memorial placement shows adjacency bonus preview.',
                unlocked: false
            },
            2: {
                id: 'master_restorer',
                name: 'Master Restorer',
                cost: 5,
                description: 'Restored buildings gain +2 levels instead of +1. 25% chance for "Ancestral" trait (disaster immunity).',
                unlocked: false,
                requires: ['keen_eye']
            },
            3: {
                id: 'living_monument',
                name: 'Living Monument',
                cost: 8,
                description: 'Memorials affect entire hex ring (7 hexes) instead of adjacent (6). Can upgrade memorials for specialized bonuses.',
                unlocked: false,
                requires: ['master_restorer']
            }
        }
    },
    
    NATURALIST: {
        id: 'naturalist',
        name: 'The Naturalist Path',
        description: 'Masters of ecological harmony and sustainable development',
        color: '#228B22', // Forest Green
        tiers: {
            1: {
                id: 'forest_wisdom',
                name: 'Forest Wisdom',
                cost: 3,
                description: 'Forests provide +1 material/turn generation. Preview which parks/farms become forests next session.',
                unlocked: false
            },
            2: {
                id: 'cultivation_master',
                name: 'Cultivation Master',
                cost: 5,
                description: 'Manually plant forests (3 materials, 3 turns to grow). Agricultural buildings +25% efficiency when adjacent to forests.',
                unlocked: false,
                requires: ['forest_wisdom']
            },
            3: {
                id: 'symbiotic_architecture',
                name: 'Symbiotic Architecture',
                cost: 8,
                description: '"Living Buildings" self-repair and grow more efficient. Buildings adjacent to 3+ forests gain "Overgrown" status (+50% efficiency).',
                unlocked: false,
                requires: ['cultivation_master']
            }
        }
    },
    
    SURVIVOR: {
        id: 'survivor',
        name: 'The Survivor Path',
        description: 'Masters of disaster preparation and crisis management',
        color: '#DC143C', // Crimson
        tiers: {
            1: {
                id: 'storm_sense',
                name: 'Storm Sense',
                cost: 4,
                description: 'Early warning: see disasters 1 turn in advance. Disaster probability indicators during events.',
                unlocked: false
            },
            2: {
                id: 'emergency_protocols',
                name: 'Emergency Protocols',
                cost: 6,
                description: 'Buildings share resources with neighbors during disasters. 50% chance minor disasters resolve automatically.',
                unlocked: false,
                requires: ['storm_sense']
            },
            3: {
                id: 'adaptive_infrastructure',
                name: 'Adaptive Infrastructure',
                cost: 10,
                description: 'Buildings auto-repair minor damage over 2-3 turns. Disaster resistance increases permanently with each survival.',
                unlocked: false,
                requires: ['emergency_protocols']
            }
        }
    },
    
    INNOVATOR: {
        id: 'innovator',
        name: 'The Innovator Path',
        description: 'Masters of technological advancement and efficiency',
        color: '#4169E1', // Royal Blue
        tiers: {
            1: {
                id: 'efficient_design',
                name: 'Efficient Design',
                cost: 4,
                description: 'All buildings consume 15% less fuel. Construction costs reduced by 1 material (minimum 1).',
                unlocked: false
            },
            2: {
                id: 'integrated_systems',
                name: 'Integrated Systems',
                cost: 7,
                description: '"Multi-use" buildings with combined functions. Research labs generate +1 material per 3 turns.',
                unlocked: false,
                requires: ['efficient_design']
            },
            3: {
                id: 'technological_singularity',
                name: 'Technological Singularity',
                cost: 12,
                description: '"AI-Assisted" buildings optimize efficiency automatically. "Network Nodes" share adjacency bonuses across unlimited distance.',
                unlocked: false,
                requires: ['integrated_systems']
            }
        }
    }
};

export class ResearchPointManager {
    constructor() {
        this.totalResearchPoints = 0;
        this.spentResearchPoints = 0;
        this.availableResearchPoints = 0;
        
        // Research tree progress
        this.researchProgress = this.initializeResearchProgress();
        
        // Achievement tracking for diminishing returns
        this.achievementCompletions = new Map(); // achievementId -> count
        
        console.log('[ResearchPointManager] Initialized');
    }
    
    /**
     * Initialize research progress with all trees locked
     */
    initializeResearchProgress() {
        const progress = {};
        
        Object.keys(RESEARCH_TREES).forEach(treeKey => {
            const tree = RESEARCH_TREES[treeKey];
            progress[tree.id] = {
                totalPointsSpent: 0,
                unlockedTiers: [],
                availableTiers: [1] // Tier 1 is always available
            };
        });
        
        return progress;
    }
    
    /**
     * Award research points for achievement completion
     * @param {string} achievementId - Achievement identifier
     * @param {number} basePoints - Base points for the achievement
     * @returns {number} Actual points awarded (after diminishing returns)
     */
    awardResearchPoints(achievementId, basePoints) {
        const completionCount = this.achievementCompletions.get(achievementId) || 0;
        
        // Apply diminishing returns after 3rd completion (50% reduction)
        let actualPoints = basePoints;
        if (completionCount >= 3) {
            actualPoints = Math.floor(basePoints * 0.5);
        }
        
        // Update tracking
        this.achievementCompletions.set(achievementId, completionCount + 1);
        this.totalResearchPoints += actualPoints;
        this.availableResearchPoints += actualPoints;
        
        console.log(`[ResearchPointManager] Awarded ${actualPoints} research points for ${achievementId} (completion #${completionCount + 1})`);
        
        EventBus.emit('research:pointsAwarded', {
            achievementId,
            pointsAwarded: actualPoints,
            totalPoints: this.totalResearchPoints,
            availablePoints: this.availableResearchPoints,
            completionCount: completionCount + 1
        });
        
        return actualPoints;
    }
    
    /**
     * Purchase a research upgrade
     * @param {string} treeId - Research tree identifier
     * @param {number} tier - Tier to purchase
     * @returns {boolean} Success/failure
     */
    purchaseResearch(treeId, tier) {
        const tree = RESEARCH_TREES[treeId.toUpperCase()];
        if (!tree) {
            console.warn('[ResearchPointManager] Invalid research tree:', treeId);
            return false;
        }
        
        const tierData = tree.tiers[tier];
        if (!tierData) {
            console.warn('[ResearchPointManager] Invalid tier:', tier, 'for tree:', treeId);
            return false;
        }
        
        // Check if already unlocked
        if (tierData.unlocked) {
            console.warn('[ResearchPointManager] Research already unlocked:', treeId, tier);
            return false;
        }
        
        // Check requirements
        if (!this.canPurchaseResearch(treeId, tier)) {
            console.warn('[ResearchPointManager] Requirements not met for:', treeId, tier);
            return false;
        }
        
        // Check cost
        if (this.availableResearchPoints < tierData.cost) {
            console.warn('[ResearchPointManager] Insufficient research points for:', treeId, tier);
            return false;
        }
        
        // Purchase
        this.availableResearchPoints -= tierData.cost;
        this.spentResearchPoints += tierData.cost;
        tierData.unlocked = true;
        
        // Update tree progress
        const progress = this.researchProgress[tree.id];
        progress.totalPointsSpent += tierData.cost;
        progress.unlockedTiers.push(tier);
        
        // Unlock next tier if it exists
        if (tree.tiers[tier + 1]) {
            progress.availableTiers.push(tier + 1);
        }
        
        console.log(`[ResearchPointManager] Purchased research: ${tree.name} - ${tierData.name}`);
        
        EventBus.emit('research:purchased', {
            treeId: tree.id,
            tier,
            tierData,
            remainingPoints: this.availableResearchPoints
        });
        
        return true;
    }
    
    /**
     * Check if a research upgrade can be purchased
     * @param {string} treeId - Research tree identifier
     * @param {number} tier - Tier to check
     * @returns {boolean} Can purchase
     */
    canPurchaseResearch(treeId, tier) {
        const tree = RESEARCH_TREES[treeId.toUpperCase()];
        if (!tree) return false;
        
        const tierData = tree.tiers[tier];
        if (!tierData || tierData.unlocked) return false;
        
        // Check cost
        if (this.availableResearchPoints < tierData.cost) return false;
        
        // Check requirements
        if (tierData.requires) {
            for (const requiredId of tierData.requires) {
                let foundRequired = false;
                for (const [reqTier, reqTierData] of Object.entries(tree.tiers)) {
                    if (reqTierData.id === requiredId && reqTierData.unlocked) {
                        foundRequired = true;
                        break;
                    }
                }
                if (!foundRequired) return false;
            }
        }
        
        return true;
    }
    
    /**
     * Get research tree status
     * @param {string} treeId - Research tree identifier
     * @returns {Object} Tree status
     */
    getResearchTreeStatus(treeId) {
        const tree = RESEARCH_TREES[treeId.toUpperCase()];
        if (!tree) return null;
        
        const progress = this.researchProgress[tree.id];
        
        return {
            tree,
            progress,
            unlockedCount: progress.unlockedTiers.length,
            totalTiers: Object.keys(tree.tiers).length,
            canAffordAny: this.canAffordAnyUpgrade(tree.id)
        };
    }
    
    /**
     * Check if player can afford any upgrade in a tree
     * @param {string} treeId - Research tree identifier
     * @returns {boolean} Can afford any upgrade
     */
    canAffordAnyUpgrade(treeId) {
        const tree = RESEARCH_TREES[treeId.toUpperCase()];
        if (!tree) return false;
        
        for (const [tier, tierData] of Object.entries(tree.tiers)) {
            if (this.canPurchaseResearch(treeId, parseInt(tier))) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get all available research options
     * @returns {Array} Available research options
     */
    getAvailableResearch() {
        const available = [];
        
        Object.values(RESEARCH_TREES).forEach(tree => {
            Object.entries(tree.tiers).forEach(([tier, tierData]) => {
                if (this.canPurchaseResearch(tree.id, parseInt(tier))) {
                    available.push({
                        treeId: tree.id,
                        treeName: tree.name,
                        tier: parseInt(tier),
                        tierData,
                        canAfford: this.availableResearchPoints >= tierData.cost
                    });
                }
            });
        });
        
        return available.sort((a, b) => a.tierData.cost - b.tierData.cost);
    }
    
    /**
     * Check if a specific research is unlocked
     * @param {string} treeId - Research tree identifier
     * @param {number} tier - Tier to check
     * @returns {boolean} Is unlocked
     */
    isResearchUnlocked(treeId, tier) {
        const tree = RESEARCH_TREES[treeId.toUpperCase()];
        if (!tree) return false;
        
        const tierData = tree.tiers[tier];
        return tierData ? tierData.unlocked : false;
    }
    
    /**
     * Get research point summary
     * @returns {Object} Point summary
     */
    getPointsSummary() {
        return {
            total: this.totalResearchPoints,
            spent: this.spentResearchPoints,
            available: this.availableResearchPoints,
            achievements: this.achievementCompletions.size,
            trees: Object.keys(RESEARCH_TREES).length
        };
    }
    
    /**
     * Get specialization focus based on spending
     * @returns {string|null} Primary specialization
     */
    getPrimarySpecialization() {
        let maxSpent = 0;
        let primaryTree = null;
        
        Object.entries(this.researchProgress).forEach(([treeId, progress]) => {
            if (progress.totalPointsSpent > maxSpent) {
                maxSpent = progress.totalPointsSpent;
                primaryTree = treeId;
            }
        });
        
        return primaryTree;
    }
    
    /**
     * Reset research progress (for testing/development)
     */
    resetResearch() {
        console.log('[ResearchPointManager] Resetting research progress');
        
        this.totalResearchPoints = 0;
        this.spentResearchPoints = 0;
        this.availableResearchPoints = 0;
        this.achievementCompletions.clear();
        
        // Reset all unlocks
        Object.values(RESEARCH_TREES).forEach(tree => {
            Object.values(tree.tiers).forEach(tierData => {
                tierData.unlocked = false;
            });
        });
        
        this.researchProgress = this.initializeResearchProgress();
        
        EventBus.emit('research:reset');
    }
    
    /**
     * Load research progress from save data
     * @param {Object} saveData - Saved research data
     */
    loadProgress(saveData) {
        if (!saveData) return;
        
        this.totalResearchPoints = saveData.totalResearchPoints || 0;
        this.spentResearchPoints = saveData.spentResearchPoints || 0;
        this.availableResearchPoints = saveData.availableResearchPoints || 0;
        
        if (saveData.achievementCompletions) {
            this.achievementCompletions = new Map(saveData.achievementCompletions);
        }
        
        if (saveData.researchProgress) {
            this.researchProgress = saveData.researchProgress;
            
            // Restore unlocked status
            Object.values(RESEARCH_TREES).forEach(tree => {
                const progress = this.researchProgress[tree.id];
                if (progress && progress.unlockedTiers) {
                    progress.unlockedTiers.forEach(tier => {
                        if (tree.tiers[tier]) {
                            tree.tiers[tier].unlocked = true;
                        }
                    });
                }
            });
        }
        
        console.log('[ResearchPointManager] Progress loaded from save');
        EventBus.emit('research:loaded', this.getPointsSummary());
    }
    
    /**
     * Get save data for research progress
     * @returns {Object} Save data
     */
    getSaveData() {
        return {
            totalResearchPoints: this.totalResearchPoints,
            spentResearchPoints: this.spentResearchPoints,
            availableResearchPoints: this.availableResearchPoints,
            achievementCompletions: Array.from(this.achievementCompletions.entries()),
            researchProgress: this.researchProgress
        };
    }
}

export default ResearchPointManager;