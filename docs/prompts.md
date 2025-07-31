
# Todo prompts

[x] I split html,css and javascript for easer maintance. But I have 2 problems: There is nowhere in th UI the information about turns. And most pressing, when zooming, the sprites scales, their position keeps the same, making them a mess
[x] I want to have a minimalist cohesive color palette. Create and use a dedicated palette config file with constants for the colors used in the game to easy change and visualization of the color palette in use
[x] The current plan looks solid and I am inclined to proceed with, but what if next I want to each storage building display their current capacity using specific sprites? The units shall deposit the resources in the nearest storage building with enough storage space. Doing so will make the game pretier, but how much complex it would be?
[x] How to implement drone units (assets/unit-drone.png), avaliable to be build in the drone factory building. They should gather resources from the nearest radioactive waste tiles and bring them to nearest storage buildings if avaliable or directily to the reactor if not. Each drone can hold 5 units of resource per trip, but able to be more with upgrades that will be implemented next
[x] Could we make the drone movement pixel perfect instead of following the grid? so they have a smooth movement instead of looking like pieces in a bord moving?

[x] There is some important informations missing on the UI and on the tooltips, like fuel consuption rate should be show in the main UI and on the reactor tooltip , fuel production rate should be show on the refineries tooltip and the total shown in the main UI, total storage limit should be shown in the main UI and each storage building should show their limit.

[x] The tooltips are not expanding with the content, making the UI broke

[x] Some issues I found when using mobile device:

- cant move the map when the zoom chosen prevent to view the entire island on the small screen
- the hex grid is not aligned in the center of the screen
- the UI informations ant tooltips are too big
- the menu for hex and building dont fit in the screen, also when clicking outsite it should close

[x] Lets make the game look more polished. Lets add some screens. A starting screen and a progression screen. The star screen will have a menu to start a new game or continue the previous session (when the saving feature is implemented). The progression screen will show in which era (to be implemented) the last session stoped and have a option to continue. How to make those menus and screen simple and modular so its easy to add another for the future features? 

[-] Help me with the progression of the game. I was thinking in something like eras or stages of the civilization, each level has increasing challenges representing some era. Like the first level - Surviving - how also works as tutorial - only require to survive 10 turn (so the player can get familiar with the fuel dynamics). The second - Building strong foundations - gather 500 fuel and 500 materials and so on... What do you think?
[-] Lets add progression to the game. The first step is add win conditions. After each win, we show a congratulations message for the successful civilization grow and then the player start a new era with more challenging win condition. If the player reaches the win conditions they are redirected to the progression screen showing the eras they completed. If the player not reach the win condition and lose, their civilization fall and the campaing ends and the player need to start again from starting era. The eras are described in the @progression.md file, note that some of their win/lose conditions depends on features not implemented yet, so lets start implementing the first one and support for easly add the another ones when the features they require are implemented

## Core systems

[x] Add habitat building
[x] Add greenhouse building
[x] Add population resource
[x] Add food resource

[] Add habitats upgrades

[] Add luxury buildings

## Map

[] Currently the game start with a small island, but we need space to grow, so as the game theme tell, the island depend on the reactor to keep afloat, so lets use the reactor upgrades to allow island expansion, so when the player upgrade the reactor a new ring of hexes should apear around the island
[x] Add forest tiles
[x] Add the possibility to build parks in forest tiles

## Bugs

[?] When there is only the starting building, the fuel is not consumed

[x] Dont use the campaing win/lose condition on the Long Tomorow game mode. As defined in the specification, the Long Tomorow mode is like an endless mode where there is no win condition, only lose - run out of fuel - where the player can play as long they want.

[x] I changed how the hex grid are generated with random resources, but there is a problem that I am having a hard time solving. Because the probabilities there is a chance that a grid is generated without any radioactive waste, making tha grid impossible to play. Help me ensure that when the grid is created there is at least `radius` quantities of radioactive waste tiles in the grid.

## Speed control

[x] Hide the speed menu when not playing, and add a button to go back to the start menu

[-] Drone speed are not scaled when changing the game speed

## Polish

[] Make buildings take time to be built, instead of being built instatnly

[x] Tooltips dont expand with content

[] Use the sprites @assets/building-storage-full.png and @assets/building-storage-half.png to represent the capacity of storage buindings

[x] Currently at the start screen we have a optio to `New game` then the option to select the game mode. Lets change that. Make it that in the start screen we have a option `Play campaing` and `Play The Long Tomorrow`, removing that intermediary step.

[x] If no storage building avaliable, make the drones delivery directli to refinery

## Maintainability

[x] The @src/main.js file is getting too big, doing too much. Lets organizse a little. Could we extract all the code responsible for UI elements to improve maintainability?

[x] Extract buildings logic from @src/main.js

[x] Is @buildings/BuildingMenu.js being used? That file add the option to build Habitat, but the option dont apear in the building menu

[x] Unit Drone data is not defined in the GameData.js, also there still hardcoded building data in their classes, even tho that data is defined in the config file.

## Save

[] Saving. There sould be only one save per time, when starting a new game the last session saved is overewrited.

## Offline

[x] make the game a PWA

[] offline mode is not working on mobile

[x] Use a local version of Pixi instead of getting it from cdn

---

[x] Analize the game and think hard about any inconsistencies and bugs and suggest simple solutions keeping it easy to modify and add new content, using a more data driven structures avoiding overengineering it.

[] Look at the gameplay loop and systems and think if you can identify any issues, inconsistencies or bugs that could affect the enjoiment of the game

[] Publish the game in Github pages

[] Using the ux-design-expert agent analize the game and identify possible issues and improvements in the UI/UX

---

## Claude web

About the ecological memory:
Love the idea that each new endless game seesion instead of generating a new map, it generate one based on the state of the last session, like transforming parks and farms in forests, refinaries and storage transformed in piles of resources and some of the high level buildings shown like ruins that can be recycled for resources, restored as their previous building with level 2 as bonus, or transformed in a memorial with gives adjacent production bonus for the surrounding buildings
About the meta-progression:
What if those upgrades be achievements that reward the player with research points that they can use to unlock the upgrades they choose that most fit their play style?
