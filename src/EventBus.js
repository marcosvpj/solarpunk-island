/**
 * EventBus - Lightweight publish/subscribe system for decoupled communication
 * 
 * Allows components to communicate without direct dependencies.
 * Game objects emit events, and systems subscribe to react to changes.
 */

export class EventBus {
    static listeners = new Map();
    static debugMode = false;

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {function} callback - Function to call when event is emitted
     * @returns {function} Unsubscribe function
     */
    static on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        this.listeners.get(event).push(callback);
        
        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {function} callback - Callback to remove
     */
    static off(event, callback) {
        if (!this.listeners.has(event)) return;
        
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        
        if (index !== -1) {
            callbacks.splice(index, 1);
        }
        
        // Clean up empty event arrays
        if (callbacks.length === 0) {
            this.listeners.delete(event);
        }
    }

    /**
     * Emit an event to all subscribers
     * @param {string} event - Event name
     * @param {*} data - Data to pass to callbacks
     */
    static emit(event, data) {
        if (this.debugMode) {
            console.log(`[EventBus] Emitting: ${event}`, data);
        }
        
        const callbacks = this.listeners.get(event);
        if (!callbacks) return;
        
        // Create a copy to prevent issues if listeners are modified during emission
        const callbacksCopy = [...callbacks];
        
        callbacksCopy.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[EventBus] Error in event handler for '${event}':`, error);
            }
        });
    }

    /**
     * Subscribe to an event only once
     * @param {string} event - Event name
     * @param {function} callback - Function to call when event is emitted
     */
    static once(event, callback) {
        const unsubscribe = this.on(event, (data) => {
            unsubscribe();
            callback(data);
        });
        
        return unsubscribe;
    }

    /**
     * Check if there are any listeners for an event
     * @param {string} event - Event name
     * @returns {boolean} True if there are listeners
     */
    static hasListeners(event) {
        return this.listeners.has(event) && this.listeners.get(event).length > 0;
    }

    /**
     * Get all registered event names
     * @returns {string[]} Array of event names
     */
    static getEvents() {
        return Array.from(this.listeners.keys());
    }

    /**
     * Clear all listeners (useful for testing)
     */
    static clear() {
        this.listeners.clear();
    }

    /**
     * Enable/disable debug logging
     * @param {boolean} enabled - Whether to enable debug mode
     */
    static setDebugMode(enabled) {
        this.debugMode = enabled;
    }
}

export default EventBus;