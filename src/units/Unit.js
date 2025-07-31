import { GameObject } from '../engine/GameObject.js';
import EventBus from '../engine/EventBus.js';

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
        this.accumulatedDelta = 0; // Accumulated delta time for scaled movement
        
        // Smooth movement properties
        this.smoothMovement = false; // Enable smooth pixel movement (override in subclasses)
        this.currentPixelPosition = { x: hex.x, y: hex.y }; // Current sprite position
        this.targetPixelPosition = { x: hex.x, y: hex.y }; // Target sprite position
        this.movementSpeed = 60; // Pixels per second for smooth movement
        this.isMovingSmooth = false;
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
     * Calculate path from current hex to target using simple pathfinding
     * @param {Hex} startHex - Starting hex
     * @param {Hex} endHex - Target hex
     * @returns {Hex[]} Array of hexes representing the path
     */
    calculatePath(startHex, endHex) {
        if (startHex === endHex) return [];
        
        // Get global hex grid for pathfinding
        const hexes = window.gameState?.hexes || [];
        if (hexes.length === 0) return [endHex];
        
        // Simple pathfinding: create a straight line path through hexes
        const path = [];
        const dq = endHex.q - startHex.q;
        const dr = endHex.r - startHex.r;
        const distance = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
        
        // Create intermediate steps
        for (let i = 1; i <= distance; i++) {
            const t = i / distance;
            const q = Math.round(startHex.q + (dq * t));
            const r = Math.round(startHex.r + (dr * t));
            
            // Find the hex at these coordinates
            const stepHex = hexes.find(hex => hex.q === q && hex.r === r);
            if (stepHex && !path.includes(stepHex)) {
                path.push(stepHex);
            }
        }
        
        // Ensure target is the last step
        if (path[path.length - 1] !== endHex) {
            path.push(endHex);
        }
        
        return path;
    }

    /**
     * Move along the calculated path (supports both discrete and smooth movement)
     */
    moveAlongPath() {
        if (this.isDestroyed || this.path.length === 0 || this.state !== 'moving') {
            return;
        }
        
        if (this.smoothMovement) {
            this.moveSmoothly();
        } else {
            this.moveDiscrete();
        }
    }

    /**
     * Discrete hex-to-hex movement (original behavior)
     */
    moveDiscrete() {
        // Use accumulated delta time instead of real time for game speed scaling
        const moveIntervalInSeconds = this.moveInterval / 1000;
        if (this.accumulatedDelta < moveIntervalInSeconds) {
            return; // Not time to move yet
        }
        
        const nextHex = this.path.shift();
        if (nextHex) {
            const fromHex = this.hex;
            
            // Clear unit reference from old hex (for ground units)
            if (fromHex && fromHex.unit === this && this.type !== 'drone') {
                fromHex.unit = null;
            }
            
            // Use parent's moveTo which emits events
            super.moveTo(nextHex);
            
            // Update unit reference in new hex (drones can stack, so only update if empty)
            if (this.type === 'drone') {
                // Drones are flying units, they don't block the hex
                // Keep the hex.unit reference for the first drone or ground unit
                if (!nextHex.unit || nextHex.unit.type === 'drone') {
                    nextHex.unit = this;
                }
            } else {
                // Ground units occupy the hex exclusively
                nextHex.unit = this;
            }
            
            // Reset accumulated delta time after movement
            this.accumulatedDelta = 0;
            
            EventBus.emit('unit:moved', {
                unit: this,
                fromHex: fromHex,
                toHex: nextHex
            });
            
            console.log(`[Unit] ${this.type} moved from (${fromHex.q}, ${fromHex.r}) to (${nextHex.q}, ${nextHex.r})`);
        }
        
        // Check if we've reached the destination
        if (this.path.length === 0) {
            this.state = 'idle';
            this.targetHex = null;
            
            EventBus.emit('unit:reachedTarget', {
                unit: this,
                hex: this.hex
            });
            
            console.log(`[Unit] ${this.type} reached destination at (${this.hex.q}, ${this.hex.r})`);
        }
    }

    /**
     * Smooth pixel-perfect movement
     */
    moveSmoothly() {
        if (!this.isMovingSmooth && this.path.length > 0) {
            // Start moving to next hex
            const nextHex = this.path.shift();
            if (nextHex) {
                this.targetPixelPosition = { x: nextHex.x, y: nextHex.y };
                this.isMovingSmooth = true;
                
                // Update logical hex position immediately for gameplay purposes
                const fromHex = this.hex;
                this.hex = nextHex;
                
                // Update hex references
                if (fromHex && fromHex.unit === this && this.type !== 'drone') {
                    fromHex.unit = null;
                }
                
                if (this.type === 'drone') {
                    if (!nextHex.unit || nextHex.unit.type === 'drone') {
                        nextHex.unit = this;
                    }
                } else {
                    nextHex.unit = this;
                }
                
                console.log(`[Unit] ${this.type} starting smooth movement to (${nextHex.q}, ${nextHex.r})`);
            }
        }
        
        if (this.isMovingSmooth) {
            // Calculate movement delta based on actual frame time
            const deltaTime = this.deltaTime || 1/60; // Use stored deltaTime or fallback
            const moveDistance = this.movementSpeed * deltaTime;
            
            // Calculate direction vector
            const dx = this.targetPixelPosition.x - this.currentPixelPosition.x;
            const dy = this.targetPixelPosition.y - this.currentPixelPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < moveDistance) {
                // Reached target position
                this.currentPixelPosition.x = this.targetPixelPosition.x;
                this.currentPixelPosition.y = this.targetPixelPosition.y;
                this.isMovingSmooth = false;
                
                // Emit movement event
                EventBus.emit('unit:smoothMoved', {
                    unit: this,
                    position: { ...this.currentPixelPosition }
                });
                
                // Check if we've reached the final destination
                if (this.path.length === 0) {
                    this.state = 'idle';
                    this.targetHex = null;
                    
                    EventBus.emit('unit:reachedTarget', {
                        unit: this,
                        hex: this.hex
                    });
                    
                    console.log(`[Unit] ${this.type} reached destination at (${this.hex.q}, ${this.hex.r})`);
                }
            } else {
                // Move towards target
                const moveX = (dx / distance) * moveDistance;
                const moveY = (dy / distance) * moveDistance;
                
                this.currentPixelPosition.x += moveX;
                this.currentPixelPosition.y += moveY;
                
                // Emit position update event for rendering
                EventBus.emit('unit:smoothMoved', {
                    unit: this,
                    position: { ...this.currentPixelPosition }
                });
            }
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
     * @param {number} deltaTime - Time since last frame (optional)
     */
    update(deltaTime = 1/60) {
        super.update();
        
        // Store delta time for smooth movement calculations
        this.deltaTime = deltaTime;
        
        // Accumulate delta time for discrete movement scaling
        this.accumulatedDelta += deltaTime;
        
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