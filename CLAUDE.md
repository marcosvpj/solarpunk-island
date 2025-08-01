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