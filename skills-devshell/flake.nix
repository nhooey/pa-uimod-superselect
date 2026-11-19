{
  description = "pa-uimod-superselect dev-shell skill set — an isolated sub-flake invoked at RUNTIME by the root devShell, never a root input, so the skill sources live only in THIS flake's lock.";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    systems.url = "github:nix-systems/default";

    # The builder lib; it carries no skill inputs.
    agent-skill-flake = {
      url = "github:nhooey/agent-skill-flake";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # skillspkgs' per-family combinations; this repository takes the
    # browser-extensions-and-game-mods family's. It follows `nixpkgs` but not
    # `agent-skill-flake`, so the combination keeps its own compatible builder.
    skillspkgs-combinations = {
      url = "github:nhooey/skillspkgs?dir=sources/combinations";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      nixpkgs,
      agent-skill-flake,
      ...
    }@inputs:
    agent-skill-flake.lib.mkDevshellSkillsFlake {
      inherit nixpkgs;
      systems = import inputs.systems;
      name = "pa-uimod-superselect-devshell";
      sources = [
        # The family's one skill source. No additions: the mod is JavaScript
        # like the rest of its family.
        {
          source = inputs.skillspkgs-combinations.combinations.browser-extensions-and-game-mods;
        }
      ];
    };
}
