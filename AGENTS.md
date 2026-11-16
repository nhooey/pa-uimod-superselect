# pa-uimod-superselect

Super Select, a client UI mod for the game Planetary Annihilation that adds ways to select units: select the previous or next selection, and cycle through each unit of the current selection. The mod is plain JavaScript the game loads from `ui/mods/superselect/`, described to the game and to PA Mod Manager by `modinfo.json`.

## Build and test

- There is no build step and no automated test suite: copy the checkout into the game's `client_mods` directory and activate the mod in PA Mod Manager to try it, as `README.md` describes.
- `nix develop`: the dev shell, with the project's skills installed into `.agents/skills/` from the `skills-devshell/` sub-flake.
- `nix fmt`: formats the repository with treefmt (nixfmt for `.nix`, prettier for JavaScript, JSON and Markdown).
- `nix flake check`: checks the flake, its dev shell and that every file is formatted.
