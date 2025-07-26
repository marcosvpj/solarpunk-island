import { GameObject } from './GameObject.js';
import EventBus from '../EventBus.js';

/**
 * Unit class - Represents mobile units like drones
 * 
 * Handles unit movement, pathfinding, and task assignment.
 * Emits events for movement and state changes.
 */
export class Unit extends GameObject {
    constructor(type, hex) {
        // Get sprite path based on unit type
        const spritePath = Unit.getSpritePathForType(type);
        super(type, spritePath, hex);
        
        this.speed = 1; // Hexes per second
        this.path = []; // Array of hexes to move through
        this.targetHex = null; // Final destination
        this.currentTask = null; // Current task assignment
        this.state = 'idle'; // idle, moving, working
        this.lastMoveTime = Date.now();
        this.moveInterval = 1000; // Time between hex moves (ms)
    }

    /**
     * Get sprite path for unit type
     * @param {string} type - Unit type
     * @returns {string} Sprite path
     */
    static getSpritePathForType(type) {
        const spriteMap = {
            'drone': 'assets/unit-drone.png',
            'scout': 'assets/unit-scout.png',
            'worker': 'assets/unit-worker.png'
        };
        
        // Fallback to a basic sprite if specific type not found
        return spriteMap[type] || 'assets/resource.png'; // Using resource as placeholder
    }

    /**
     * Set target hex and calculate path
     * @param {Hex} targetHex - Destination hex
     */
    setTarget(targetHex) {
        if (this.isDestroyed || !targetHex) return;
        
        this.targetHex = targetHex;
        this.path = this.calculatePath(this.hex, targetHex);
        this.state = this.path.length > 0 ? 'moving' : 'idle';
        
        EventBus.emit('unit:targetSet', {
            unit: this,
            targetHex,
            pathLength: this.path.length
        });
        
        console.log(`[Unit] ${this.type} set target to (${targetHex.q}, ${targetHex.r})`);
    }

    /**
     * Calculate path from current hex to target (simple direct path for now)
     * @param {Hex} startHex - Starting hex
     * @param {Hex} endHex - Target hex
     * @returns {Hex[]} Array of hexes representing the path
     */
    calculatePath(startHex, endHex) {
        // TODO: Implement proper pathfinding (A* algorithm)
        // For now, return direct path (just the target)
        if (startHex === endHex) return [];
        return [endHex];
    }

    /**
     * Move along the calculated path
     */
    moveAlongPath() {
        if (this.isDestroyed || this.path.length === 0 || this.state !== 'moving') {
            return;
        }
        
        const now = Date.now();
        if (now - this.lastMoveTime < this.moveInterval) {
            return; // Not time to move yet
        }
        
        const nextHex = this.path.shift();
        if (nextHex) {
            // Use parent's moveTo which emits events
            super.moveTo(nextHex);
            this.lastMoveTime = now;
            
            EventBus.emit('unit:moved', {
                unit: this,
                fromHex: this.hex,
                toHex: nextHex
            });
        }
        
        // Check if we've reached the destination
        if (this.path.length === 0) {
            this.state = 'idle';
            this.targetHex = null;
            
            EventBus.emit('unit:reachedTarget', {
                unit: this,
                hex: this.hex
            });
            
            console.log(`[Unit] ${this.type} reached destination`);
        }
    }

    /**
     * Assign a task to this unit
     * @param {Object} task - Task object with type and parameters
     */
    assignTask(task) {
        if (this.isDestroyed) return;
        
        this.currentTask = task;
        this.state = 'working';
        
        EventBus.emit('unit:taskAssigned', {
            unit: this,
            task
        });
        
        console.log(`[Unit] ${this.type} assigned task: ${task.type}`);
    }

    /**
     * Complete current task
     */
    completeTask() {
        if (!this.currentTask) return;
        
        const completedTask = this.currentTask;
        this.currentTask = null;
        this.state = 'idle';
        
        EventBus.emit('unit:taskCompleted', {
            unit: this,
            task: completedTask
        });
        
        console.log(`[Unit] ${this.type} completed task: ${completedTask.type}`);
    }

    /**
     * Update unit (called every frame)
     */
    update() {
        super.update();
        
        // Handle movement
        if (this.state === 'moving') {
            this.moveAlongPath();
        }
        
        // Handle task processing
        if (this.state === 'working' && this.currentTask) {
            // Process current task (implement specific task logic here)
            this.processCurrentTask();
        }
    }

    /**
     * Process the current task
     */
    processCurrentTask() {
        if (!this.currentTask) return;
        
        // Simple task completion after delay
        const taskDuration = this.currentTask.duration || 2000; // 2 seconds default
        
        if (Date.now() - this.currentTask.startTime >= taskDuration) {
            this.completeTask();
        }
    }

    /**
     * Get unit information
     * @returns {Object} Unit info
     */
    getUnitInfo() {
        return {
            ...this.getInfo(),
            speed: this.speed,
            state: this.state,
            targetHex: this.targetHex ? {q: this.targetHex.q, r: this.targetHex.r} : null,
            pathLength: this.path.length,
            currentTask: this.currentTask ? this.currentTask.type : null
        };
    }

    /**
     * Destroy the unit
     */
    destroy() {
        if (this.isDestroyed) return;
        
        // Clear any ongoing tasks
        this.currentTask = null;
        this.path = [];
        this.targetHex = null;
        
        // Emit unit-specific destruction event
        EventBus.emit('unit:destroyed', this);
        
        // Call parent destroy
        super.destroy();
        
        console.log(`[Unit] ${this.type} unit destroyed`);
    }
}