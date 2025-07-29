# The Long Tomorrow - Complete Game Mode Specification
## **Floating Islands: Survival & Recovery**

### Core Philosophy
The Long Tomorrow transforms the discrete, challenge-based story mode into a **living, evolving world** where every decision creates permanent changes. Players inherit the archaeological record of their previous sessions while unlocking permanent upgrades through achievement-driven research, creating a compound experience where each run builds upon all that came before.

---

## Ecological Memory System
### **World Persistence Framework**

#### Natural Succession Between Sessions
Every Long Tomorrow session begins with the **living archaeological record** of the previous session, where the landscape has naturally evolved:

**Parks → Forests**:
- *Transformation*: Maintained park areas become wild forests with dense canopy
- *Benefit*: +1 material/turn passive generation per forest hex
- *Visual*: Lush green hexes with particle effects (falling leaves, wildlife)

**Farms → Forests**:  
- *Transformation*: Abandoned farmland becomes "Fertile Forest" 
- *Benefit*: +2 materials/turn (enriched soil bonus)
- *Visual*: Brighter green with fruit trees, organized grove patterns

**Buildings → Resource Piles/Ruins**:
- *Basic Structures*: 50% construction cost recoverable as material piles
- *Advanced Structures*: 75% cost + rare materials, decay 10% per session
- *High-Level Buildings*: Become interactive ruins with three choices

#### The Three-Choice Ruin System
When significant structures (Level 3+ buildings, Monuments, Advanced Technology) are abandoned, they become **Interactive Ruins**:

**Option 1: Recycle** *(Immediate Resources)*:
- Resource return: 150% of original construction cost
- Bonus: Chance for rare research components and luxury items
- Time: 2 turns to dismantle, clears hex completely
- Strategy: Best for immediate needs, frees valuable land

**Option 2: Restore** *(Enhanced Reconstruction)*:
- Cost: 75% of original construction cost
- Bonus: Restored building starts at +2 levels above base
- Special: "Ancestral" buildings resist first disaster of each type
- Time: 4 turns to restore, shows architectural fusion of old/new

**Option 3: Memorialize** *(Permanent Adjacency)*:
- Cost: 1 material for memorial marker
- Bonus: +15% efficiency to ALL 6 adjacent buildings
- Properties: Stacks additively, immune to disasters, permanent
- Strategy: Long-term district efficiency investment

#### Soil Memory System
The land remembers how it was treated:

**Enriched Soil** *(from successful agriculture)*:
- Visual: Golden tint, small plant growth around edges
- Bonus: +25% efficiency for agricultural buildings
- Growth: +5% per successful season (max 50%)
- Duration: Persists 3 sessions without farming

**Depleted Soil** *(from failed farming)*:
- Visual: Grayish-brown, cracked earth texture
- Penalty: -50% efficiency until restored
- Recovery: Special "Soil Treatment" building or 2+ sessions as forest

**Contaminated Soil** *(from industrial disasters)*:
- Visual: Reddish tint with warning particles
- Effects: No residential buildings, -25% all efficiency
- Spread: Slowly contaminates adjacent hexes
- Cleanup: Requires specialized remediation technology

#### Cultural Sediment Layers
Population memories create lasting impressions:

**Beloved Ground** *(sustained happiness sites)*:
- Trigger: 50+ population happy for 20+ turns
- Bonus: +2 happiness to any residential building
- Visual: Warm glow with memorial flowers

**Cursed Ground** *(disaster/abandonment sites)*:
- Trigger: Major population loss from disasters
- Effects: -1 happiness, +25% resistance to same disaster type
- Visual: Dark tint with occasional ghost particles

**Sacred Ground** *(monument sites)*:
- Trigger: Monument stood for 30+ turns
- Bonus: +50% population growth, industrial buildings forbidden
- Visual: Golden highlight with architectural remnants

#### Infrastructure Memory
**Established Drone Routes**: Heavy traffic creates permanent flight paths (+25% speed)
**Abandoned Utilities**: Power/water/communication remnants provide free services to adjacent hexes

---

## Meta-Progression System
### **Research & Achievement Framework**

#### Research Point Economy
Players earn **research points** through achievements across all game modes, creating permanent upgrades for future Long Tomorrow runs:

**Efficiency Achievements**:
- *"Zero Waste"*: Recycle 20+ buildings → **5 points**
- *"Just In Time"*: Complete level with <10 fuel storage → **3 points**  
- *"Perfect Grid"*: All buildings get adjacency bonuses → **4 points**
- *"Resource Sage"*: 95%+ refinery efficiency for 20 turns → **4 points**

**Survival Achievements**:
- *"Storm Rider"*: Survive 10+ disasters in one run → **6 points**
- *"Phoenix Rising"*: Rebuild from <5 to 50+ population → **8 points**
- *"The Long Watch"*: Complete 200+ turn session → **10 points**
- *"Against All Odds"*: Win after 5+ disasters → **7 points**

**Social Achievements**:
- *"Utopian Society"*: 100+ population, perfect happiness, 10 turns → **7 points**
- *"True Equality"*: All habitations same level, 20 turns → **5 points**
- *"Green Paradise"*: 50+ population, renewable energy only → **6 points**
- *"Cultural Renaissance"*: All luxury types simultaneously → **5 points**

**Exploration Achievements**:
- *"Master Builder"*: Construct every building type → **6 points**
- *"Island Chain"*: Manage 5+ islands simultaneously → **12 points**
- *"Archaeological Survey"*: Interact with 50+ ruins → **8 points**

#### Research Specialization Trees
**Target Rate**: 8-12 research points per story completion, with **diminishing returns** on repeated achievements (50% after 3rd time).

##### The Archaeologist Path *(Ruin Mastery)*
**Tier 1** - *"Keen Eye"* *(3 points)*:
- Hovering reveals ruin contents and all three outcomes
- Memorial placement shows adjacency bonus preview

**Tier 2** - *"Master Restorer"* *(5 points)*: 
- Restored buildings gain +2 levels instead of +1
- 25% chance for "Ancestral" trait (disaster immunity)

**Tier 3** - *"Living Monument"* *(8 points)*:
- Memorials affect entire hex ring (7 hexes) instead of adjacent (6)
- Can upgrade memorials for specialized bonuses

##### The Naturalist Path *(Ecological Harmony)*
**Tier 1** - *"Forest Wisdom"* *(3 points)*:
- Forests provide +1 material/turn generation
- Preview which parks/farms become forests next session

**Tier 2** - *"Cultivation Master"* *(5 points)*:
- Manually plant forests (3 materials, 3 turns to grow)
- Agricultural buildings +25% efficiency when adjacent to forests

**Tier 3** - *"Symbiotic Architecture"* *(8 points)*:
- "Living Buildings" self-repair and grow more efficient
- Buildings adjacent to 3+ forests gain "Overgrown" status (+50% efficiency)

##### The Survivor Path *(Disaster Mastery)*
**Tier 1** - *"Storm Sense"* *(4 points)*:
- Early warning: see disasters 1 turn in advance
- Disaster probability indicators during events

**Tier 2** - *"Emergency Protocols"* *(6 points)*:
- Buildings share resources with neighbors during disasters
- 50% chance minor disasters resolve automatically

**Tier 3** - *"Adaptive Infrastructure"* *(10 points)*:
- Buildings auto-repair minor damage over 2-3 turns
- Disaster resistance increases permanently with each survival

##### The Innovator Path *(Technology Focus)*
**Tier 1** - *"Efficient Design"* *(4 points)*:
- All buildings consume 15% less fuel
- Construction costs reduced by 1 material (minimum 1)

**Tier 2** - *"Integrated Systems"* *(7 points)*:
- "Multi-use" buildings with combined functions
- Research labs generate +1 material per 3 turns

**Tier 3** - *"Technological Singularity"* *(12 points)*:
- "AI-Assisted" buildings optimize efficiency automatically
- "Network Nodes" share adjacency bonuses across unlimited distance

---

## Session Transition Process

#### World State Calculation
1. **Structure Analysis**: Catalog all buildings, levels, operational status
2. **Population Tracking**: Record happiness, distribution, cultural events
3. **Environmental Assessment**: Document soil, contamination, ecosystems
4. **Infrastructure Mapping**: Record drone routes, utilities, cultural sites

#### Transformation Application
1. **Natural Succession**: Parks/farms → forests based on abandonment
2. **Structural Evolution**: Buildings → resource piles or interactive ruins
3. **Soil Development**: Apply enrichment/depletion from previous management
4. **Cultural Imprinting**: Create beloved/cursed/sacred ground markers

#### New Session Preparation
1. **Ruin Placement**: Interactive ruins with calculated restoration costs
2. **Resource Distribution**: Salvage piles with appropriate contents
3. **Environmental Setup**: Soil modifiers and contamination zones
4. **Memorial Integration**: Existing memorials provide adjacency bonuses

---

## Balancing & Progression

#### Power Scaling Control
- **Memorial Saturation**: Maximum 30% of island can be memorialized
- **Resource Decay**: Uncollected piles diminish 10% between sessions
- **Soil Degradation**: Unused enriched soil slowly returns to normal
- **Contamination Spread**: Ignored pollution creates expanding dead zones

#### Strategic Depth Creation
- **Specialization Pressure**: Ruin choices create civilization specialties
- **Historical Weight**: Older memorials stronger but occupy premium land
- **Ecological Balance**: Efficiency vs sustainability creates different world states
- **Cultural Continuity**: Happiness/cultural sites provide cumulative bonuses

#### Long Tomorrow Bonus System
- **First Run**: Double research points for first 10 achievements
- **Compound Growth**: Each memorial placement becomes strategic for next session
- **Legacy Planning**: Late-run decisions made with next session in mind

---

## User Interface & Experience

#### Achievement Journal
- **Visual Progress**: Bars showing advancement toward each achievement
- **Recent Unlocks**: Highlight achievements from last 3 sessions
- **Legacy Gallery**: Screenshots/replays of major moments
- **Research Planner**: Preview trees, plan point allocation

#### Long Tomorrow History
- **Civilization Profile**: Research focus, achievement statistics
- **Archaeological View**: Visual map showing ruins, memorials, transformed terrain
- **Cultural Timeline**: Major events across all sessions
- **Specialization Display**: Current research tree progress

This system transforms The Long Tomorrow from a series of isolated sessions into a **living historical record** where every decision leaves permanent traces, creating an ever-evolving world that grows more complex and personally meaningful with each run.