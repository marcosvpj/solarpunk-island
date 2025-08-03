/**
 * Example: How to integrate Long Tomorrow with simplified systems
 */

import { SimpleGameManager } from "./engine/SimpleGameManager.js";
import { longTomorrowManager } from "./systems/longTomorrow/index.js";
import gameModeManager from "./gameModes/GameModeManager.js";

// Example of how to start a Long Tomorrow session
export async function startLongTomorrowSession(app, containers) {
  // 1. Set game mode
  gameModeManager.setGameMode("long_tomorrow");

  // 2. Initialize simple game manager
  const gameManager = new SimpleGameManager(app);
  await gameManager.init(containers);

  // 3. Check if we have previous world state
  const savedData = loadLongTomorrowSave(); // Your save system

  let sessionData;
  if (savedData) {
    // Continue from previous session
    longTomorrowManager.loadSaveData(savedData);
    sessionData = longTomorrowManager.initializeSession({
      previousWorldState: savedData.worldState,
    });
  } else {
    // New Long Tomorrow session
    sessionData = longTomorrowManager.initializeSession();
  }

  // 4. Apply world state to game
  applyWorldStateToGame(gameManager, sessionData.worldState);

  // 5. Setup Long Tomorrow event handlers
  setupLongTomorrowEvents(gameManager);

  console.log("[Long Tomorrow] Session started:", sessionData.sessionId);
  return { gameManager, sessionData };
}

// Apply evolved world state to the game
function applyWorldStateToGame(gameManager, worldState) {
  if (!worldState) return;

  // Apply ruins as interactive hexes
  worldState.ruins.forEach((ruin, hexId) => {
    const [q, r] = hexId.split("_").map(Number);
    const hex = gameManager.getHex(q, r);

    if (hex) {
      hex.ruin = ruin;
      hex.isRuin = true;
    }
  });

  // Apply evolved terrain (forests, etc.)
  worldState.terrain.forEach((terrainData, hexId) => {
    const [q, r] = hexId.split("_").map(Number);
    const hex = gameManager.getHex(q, r);

    if (hex && terrainData.evolved) {
      hex.terrain = terrainData.type;
      hex.evolved = true;
      hex.materialBonus = terrainData.materialBonus;
    }
  });

  // Apply memorials
  worldState.memorials.forEach((memorial, hexId) => {
    const [q, r] = hexId.split("_").map(Number);
    const hex = gameManager.getHex(q, r);

    if (hex) {
      hex.memorial = memorial;
      hex.adjacencyBonus = memorial.adjacencyBonus;
    }
  });
}

// Setup Long Tomorrow specific event handlers
function setupLongTomorrowEvents(gameManager) {
  // Track achievements during gameplay
  EventBus.on("building:built", (data) => {
    longTomorrowManager.achievementSystem.handleBuildingConstructed({
      buildingType: data.building.type,
    });
  });

  EventBus.on("building:demolished", (data) => {
    longTomorrowManager.achievementSystem.handleBuildingRecycled({
      buildingType: data.building.type,
    });
  });

  EventBus.on("game:turnEnded", (data) => {
    longTomorrowManager.achievementSystem.handleTurnCompleted(data);
  });

  // Handle session end for world evolution
  EventBus.on("game:gameOver", (data) => {
    handleLongTomorrowSessionEnd(gameManager, data);
  });
}

// Process session end and world evolution
function handleLongTomorrowSessionEnd(gameManager, endData) {
  const gameState = gameManager.getState();

  // Process session completion and evolve world
  const evolutionData = longTomorrowManager.processSessionCompletion(
    gameState,
    endData,
  );

  // Save the evolved world state
  saveLongTomorrowData(longTomorrowManager.getSaveData());

  // Show evolution summary to player
  showEvolutionSummary(evolutionData);

  console.log("[Long Tomorrow] Session ended, world evolved");
}

// Show what changed between sessions
function showEvolutionSummary(evolutionData) {
  const summary = evolutionData.worldEvolutionSummary;

  let message = "World Evolution Summary:\n\n";

  if (summary.forestsGrown > 0) {
    message += `🌲 ${summary.forestsGrown} new forests grew\n`;
  }

  if (summary.ruinsCreated > 0) {
    message += `🏛️ ${summary.ruinsCreated} buildings became ruins\n`;
  }

  if (summary.resourcePilesCreated > 0) {
    message += `📦 ${summary.resourcePilesCreated} resource piles appeared\n`;
  }

  if (evolutionData.newAchievements.length > 0) {
    message += `\n🏆 New achievements unlocked:\n`;
    evolutionData.newAchievements.forEach((achievement) => {
      message += `• ${achievement.name} (+${achievement.points} research points)\n`;
    });
  }

  // Show to player (integrate with your UI system)
  console.log(message);
}

// Simple save/load functions (integrate with your save system)
function loadLongTomorrowSave() {
  const saved = localStorage.getItem("longTomorrowSave");
  return saved ? JSON.parse(saved) : null;
}

function saveLongTomorrowData(data) {
  localStorage.setItem("longTomorrowSave", JSON.stringify(data));
}

export default {
  startLongTomorrowSession,
  applyWorldStateToGame,
  setupLongTomorrowEvents,
};
