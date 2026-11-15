{
  description = "Super Select: a Planetary Annihilation UI mod with more ways to select units";

  # Zero skill-source inputs: the dev shell's skills live only in
  # ./skills-devshell (its own flake and lock), reconciled at runtime.
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    systems.url = "github:nix-systems/default";

    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };

    agent-skill-flake = {
      url = "github:nhooey/agent-skill-flake";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import inputs.systems;

      # Bundles agent-skill-flake's own devshell module; don't import a
      # second `devshell` flake module alongside it.
      imports = [ inputs.agent-skill-flake.flakeModules.devshellSkills ];
      agent-skill-flake.devshellSkills.name = "pa-uimod-superselect";
    };
}
