# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based hexagonal grid strategy game framework built with PixiJS and Vite. The project serves as a boilerplate for building turn-based strategy games with building placement, resource management, and hex-based movement.

## Development Commands

- `npm start` or `npm run dev` - Start development server on port 8080
- `npm run build` - Build production version (includes linting)
- `npm run lint` - Run ESLint code quality checks

## Architecture

### Core Structure
- **Entry Point**: `src/main.js` - Game initialization and coordination
- **Configuration**: `src/configs/GameData.js` - Centralized game data and balance
- **UI System**: `src/ui/GameUI.js` - Modular resource panels and game interface
- **Building System**: `src/engine/SimpleBuildingSystem.js` - Unified building management
- **Styling**: `assets/style.css` - UI components and responsive design

### PixiJS Container Hierarchy
```
PIXI.Application
├── worldContainer (handles grid positioning/centering)
│   ├── gridContainer (hex terrain sprites)
│   └── objectContainer (buildings, resources, units)
└── uiContainer (tooltips, menus, turn display)
```

### Game Object System
- **GameObject base class**: Manages sprite lifecycle and positioning
- **Building class**: Placeable structures with upgrade systems (Reactor, Factory, Refinery)
- **Resource class**: Collectible items with quantity tracking
- **Unit class**: Mobile entities (framework exists for pathfinding)

### Coordinate System
- Uses **axial coordinates (q, r)** for hex positioning
- Flat-top hexagon orientation
- Grid radius configurable (default: 5 rings ≈ 91 hexes)
- Conversion utilities between axial, pixel, and screen coordinates

### Game State Management
- Turn-based system with 30-second turns
- Game speed controls (1x/2x/4x)
- Pause/Resume functionality
- Real-time UI updates at 60 FPS target

## Key Technical Details

### Performance Specifications
From `specs.md`:
- Desktop: 60 FPS target
- Mobile: 30 FPS target
- Memory limit: <100MB on mobile
- Mobile limits: max 50 buildings, 20 units, 100 particles

### Browser Support
- Chrome 78+, Firefox 70+, Safari 14+, Edge 79+
- Mobile touch controls implemented

### Zoom System
- 5 zoom levels (1x to 3x scale)
- Container-based scaling with dynamic repositioning
- Zoom controls in bottom-right UI

## Code Patterns

### Adding New Game Objects
1. Extend the GameObject base class
2. Implement required methods: `update()`, `destroy()`
3. Add sprite management in constructor
4. Register with appropriate container (gridContainer or objectContainer)

### Hex Grid Operations
- Use axial coordinate system consistently
- Leverage existing coordinate conversion utilities
- All hex operations should use the established q,r coordinate pattern

### UI Components
- Floating tooltips managed by dedicated tooltip system
- Context menus use right-click style positioning
- All UI updates happen through the main game loop

## Development Guidelines

### Core Principles
- **Avoid Overengineering**: Choose the simplest solution that solves the problem effectively
- **Follow Existing Patterns**: Study and replicate established code patterns in the project
- **Data-Driven Approach**: Use `GameData.js` for configuration instead of hardcoded values
- **Clean Code Focus**: Prioritize readability, maintainability, and modularity
- **Incremental Improvements**: Make small, focused changes rather than large architectural shifts

### Decision Framework
Before implementing new features or changes:

1. **Pattern Analysis**: Does a similar pattern already exist in the codebase?
2. **Complexity Assessment**: Is this the minimal viable solution?
3. **Maintenance Impact**: Will this be easy to modify as the project evolves?
4. **Configuration First**: Can this be made data-driven through GameData.js?
5. **Benefit Evaluation**: Do the benefits justify any architectural changes?

### Implementation Standards
- **Extend, Don't Replace**: Prefer extending existing systems over creating new ones
- **Single Responsibility**: Each class/function should have one clear purpose
- **Configuration Over Code**: Use GameData.js for game balance, costs, and behaviors
- **Event-Driven Architecture**: Use EventBus for loose coupling between systems
- **Mobile-First**: Consider mobile performance constraints in all decisions

### Major Changes Policy
Only suggest significant architectural changes when:
- Clear performance or maintainability benefits are demonstrated
- The change aligns with existing patterns and doesn't increase complexity
- The implementation path is incremental and low-risk
- The benefits substantially outweigh the refactoring costs

## Asset Requirements

- Hex sprites: 32×28px PNG format
- Building sprites: Consistent sizing for grid alignment
- All assets loaded via `PIXI.Assets.load()` with batch loading

## Important Notes

- Architecture has been modernized from single-file to modular system
- Mobile-first responsive design considerations throughout
- ESLint and Prettier configured for code quality
- Historic documentation available in `archive/` directory

## Recent Improvements

- ✅ Data-driven configuration system implemented (`GameData.js`)
- ✅ Simplified building system with unified management
- ✅ Enhanced UX with reorganized resource panels
- ✅ Clean code refactoring applied throughout