# Super Select #
![Super Select Icon](img/icon.png)

A Planetary Annihilation UI Mod

## Description ##
This is a modification for the popular real-time strategy game: Planetary Annihilation.

In general it adds many more ways to select units. Specifically it currently has these three features:
- **Select Previous Selection:** Selects the previous selection, up to 32 selections ago.
- **Select Next Selection:** Goes forward in the list of selections after going back. Exactly like a "Selection Undo Buffer".
- **Select Each Unit in Selection:** Cycles through each individual unit of the current selection.

All three features are compatible with each other. Try it and you'll see.

The three keybindings have no defaults: bind them in the game's Settings, under Keybindings, in the "Super Select" group.

## Installation ##
If you just want to use the mod, don't bother downloading the code from GitHub. Follow these steps:

- Install [PA Mod Manager (PAMM)](https://forums.uberent.com/threads/rel-pa-mod-manager-cross-platform.59992/)
- Run PAMM
- Click on the "Available Mods" section
- Type "super select" in the search box
- Find the "Super Select" item and click the "install" link

## Contributing ##
If you would like contribute, send a pull request. Just don't send me tabs. I hate tabs.

To get the mod working from the source code, follow these steps:
- Clone the github repository somewhere
- Copy the checkout (the directory holding `modinfo.json`) to this directory, naming it `com.pa.coldboot.superselect`:
  * Mac OS: `~/Library/Application Support/Uber Entertainment/Planetary Annihilation/client_mods/`
- Run PAMM
- Click on the "UI Mods" section
- Find the "Super Select" and click it to activate

## Forum Discussion ##
The discussion is at [[REL] [CLIENT] Super Select](https://forums.uberent.com/threads/rel-client-super-select.68706/) at the Planetary Annihilation forums.
