# GAME DEVELOPMENT TODO

---

# CRITICAL PRIORITY - Core Survival Loop (Game Design Document Implementation)

## Phase 1: Fuel & Survival System (HIGHEST PRIORITY)
- [ ] **Fuel Consumption System**
  - Add fuel consumption per turn (6 base + 0.5 per building)
  - Implement game over when fuel reaches zero
  - Add "turns remaining" calculation and warnings
  - Visual fuel level indicators (no numeric UI)

- [ ] **Multi-Resource Economy** 
  - Expand PlayerStorage to handle fuel, materials, radioactive waste separately
  - Update UI to show fuel vs materials vs waste
  - Implement resource allocation decisions

- [ ] **Resource Refining System**
  - Create Refinery building class extending Building
  - Implement conversion: 4 radioactive waste → 3 fuel OR 2 materials
  - Add refinery context menu for conversion choices
  - Connect to existing drone collection system

- [ ] **Victory/Defeat Conditions**
  - Game over screen when fuel = 0
  - Victory conditions based on population/buildings/time survived
  - Session statistics and retry mechanics

## Phase 2: Strategic Depth (HIGH PRIORITY)
- [ ] **Adjacency Bonus System**
  - Refineries +15% efficiency near reactor
  - Refineries +10% efficiency near storage
  - Visual indicators for bonus zones
  - Hex highlighting for optimal placement

- [ ] **Reactor Stress System**
  - Track island capacity (buildings vs reactor level)
  - Reduce efficiency: 70-90% = 90% eff, 90-100% = 80% eff
  - Visual stress indicators on reactor
  - Upgrade options to increase capacity

- [ ] **Visual-Only Feedback ("Zero UI Numérica")**
  - Replace numeric counters with visual sprites
  - Fuel = barrel stacks, materials = crate piles
  - Building states through sprite changes
  - Population = lit windows in habitats

## Phase 3: Building Specialization (MEDIUM PRIORITY)
- [ ] **Habitat System**
  - Create Habitat building class
  - Population capacity and growth mechanics
  - Visual population indicators (lit windows)
  - Population consumption of resources

- [ ] **Production Buildings**
  - Specialized Refinery buildings (fuel vs materials)
  - Building upgrade systems
  - Production efficiency bonuses
  - Resource processing animations

## Phase 4: Events & Polish (LOW PRIORITY)
- [ ] **Random Events System**
  - Reactor failures, drone breakdowns, resource discoveries
  - Event choice mechanics
  - Risk/reward balancing

- [ ] **Drone Durability**
  - Drone wear and repair mechanics
  - Maintenance costs in materials
  - Strategic drone management

---

# FUTURE FEATURES TODO

## Individual Storage Building System

### Phase 1: Visual Storage States
- [ ] Create storage sprites for different fill levels:
  - `assets/storage-empty.png` (0-25% filled)
  - `assets/storage-quarter.png` (25-50% filled)
  - `assets/storage-half.png` (50-75% filled)
  - `assets/storage-full.png` (75-100% filled)
  - `assets/storage-overflowing.png` (100%+ filled)
- [ ] Implement `updateStorageVisuals()` method in StorageBuilding class
- [ ] Add fill percentage calculation and sprite switching based on `currentCapacity/maxCapacity`
- [ ] Add visual feedback when storage buildings fill up or empty
- [ ] Test sprite transitions during resource collection and storage

### Phase 2: Individual Building Capacity
- [ ] Enable `useIndividualStorage` feature flag in StorageBuilding and PlayerStorage
- [ ] Implement per-building resource tracking (move away from global storage)
- [ ] Add storage building tooltips showing individual capacity: "45/112 capacity"
- [ ] Handle overflow when individual storage buildings are full
- [ ] Create resource transfer between storage buildings when one is full
- [ ] Add "Storage Building Full" notifications

### Phase 3: Unit AI and Logistics
- [ ] Implement "nearest storage building" pathfinding algorithm for units
- [ ] Add unit AI to deposit resources in closest available storage building
- [ ] Create resource transfer system between storage buildings (auto-balancing)
- [ ] Add storage optimization strategies (priority buildings, manual transfer)
- [ ] Implement unit queuing when storage buildings are busy
- [ ] Add visual indicators showing unit destinations

### Phase 4: Advanced Storage Features
- [ ] Different storage types for different resources:
  - **Mineral Storage** - Stores minerals, ore, metals
  - **Energy Storage** - Stores energy cells, batteries
  - **Food Storage** - Refrigerated storage for perishables
  - **Liquid Storage** - Tanks for water, chemicals, fuel
- [ ] Storage building specialization and efficiency bonuses
- [ ] Storage networks and conveyor belt systems
- [ ] Resource distribution automation (smart logistics)
- [ ] Storage security (protected vs. exposed storage)
- [ ] Bulk storage vs. high-security storage trade-offs

---

## Other Future Enhancements

### Enhanced Production Buildings
- [ ] Create `ProductionBuilding` class extending `Building`
- [ ] Specialized production logic for different building types:
  - **Reactor** - Energy production, radiation management
  - **Drone Factory** - Unit production, assembly lines
  - **Refinery** - Resource processing, efficiency upgrades
  - **Greenhouse** - Food production, environmental requirements
  - **Habitat** - Population housing, worker capacity

### Resource Management System
- [ ] Implement different resource types with unique properties:
  - **Radioactive Waste** - Decays over time, requires special storage
  - **Minerals** - Stable, used for construction
  - **Energy** - Powers buildings, stored in batteries
  - **Food** - Feeds population, spoils over time
  - **Water** - Essential for life support, recycling systems
- [ ] Resource conversion and processing chains
- [ ] Resource quality tiers (low/medium/high grade)
- [ ] Market system for resource trading

### Advanced Unit System
- [ ] Create specialized unit classes:
  - **Worker Drone** - Resource collection, construction
  - **Scout Drone** - Exploration, reconnaissance
  - **Transport Unit** - Resource hauling, logistics
  - **Defense Unit** - Security, protection
- [ ] Unit AI improvements:
  - A* pathfinding with obstacle avoidance
  - Task prioritization and scheduling
  - Collaborative behaviors (swarm intelligence)
- [ ] Unit upgrades and specialization
- [ ] Unit maintenance and repair systems

### Environmental Systems
- [ ] Weather effects and seasonal changes
- [ ] Resource depletion and regeneration
- [ ] Environmental hazards (radiation, storms, meteor impacts)
- [ ] Ecosystem balance and sustainability metrics
- [ ] Climate control and terraforming

### Technology Research Tree
- [ ] Research points generation and allocation
- [ ] Technology unlocks for new buildings and units
- [ ] Efficiency improvements and automation research
- [ ] Advanced materials and construction techniques
- [ ] Space exploration and off-world expansion

---

## Technical Improvements

### Performance Optimizations
- [ ] Spatial partitioning for large-scale unit pathfinding
- [ ] Level-of-detail (LOD) system for distant objects
- [ ] Resource pooling for sprites and game objects
- [ ] Batch operations for bulk resource transfers
- [ ] WebWorker support for heavy calculations

### Code Architecture
- [ ] Entity-Component-System (ECS) migration for better scalability
- [ ] Save/load system for game state persistence
- [ ] Modding API for custom buildings and units
- [ ] Multiplayer foundation (synchronized game state)
- [ ] Mobile touch controls and responsive UI

### Visual Enhancements
- [ ] Particle effects for resource collection and production
- [ ] Animated sprites for working buildings and moving units
- [ ] Lighting system with day/night cycles
- [ ] UI animations and transitions
- [ ] Sound effects and ambient audio

---

## Implementation Notes

### Current Architecture
- **StorageBuilding** class ready for individual storage with `useIndividualStorage` feature flag
- **PlayerStorage** manager handles both global and individual storage modes
- **Event system** in place for storage state changes and UI updates
- **Exponential capacity formula**: `50 * Math.pow(1.5, level - 1)`

### Storage Capacity Progression
| Level | Capacity | Total with Base (100) |
|-------|----------|--------------------|
| 1     | 50       | 150               |
| 2     | 75       | 175               |
| 3     | 112      | 212               |
| 4     | 168      | 268               |
| 5     | 252      | 352               |

### Development Priority
1. **High Priority**: Individual storage with visual sprites (Phase 1-2)
2. **Medium Priority**: Unit AI and logistics (Phase 3)
3. **Low Priority**: Advanced features and specialization (Phase 4)

### Design Principles
- **Incremental Complexity**: Each phase builds on the previous
- **Backward Compatibility**: Global storage fallback always available
- **Event-Driven**: Use existing EventBus for all state changes
- **Modular**: Each system should work independently
- **Performance-Conscious**: Consider impact on game loop and rendering