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

    # Declared here so this flake owns its formatter; agent-skill-flake
    # follows it so the lock holds one version.
    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    agent-skill-flake = {
      url = "github:nhooey/agent-skill-flake";
      inputs = {
        nixpkgs.follows = "nixpkgs";
        treefmt-nix.follows = "treefmt-nix";
      };
    };
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import inputs.systems;

      # Bundles agent-skill-flake's own devshell module; don't import a
      # second `devshell` flake module alongside it.
      imports = [
        inputs.agent-skill-flake.flakeModules.devshellSkills
        inputs.treefmt-nix.flakeModule
      ];
      agent-skill-flake.devshellSkills.name = "pa-uimod-superselect";

      perSystem = {
        # `nix fmt` runs nixfmt over .nix and prettier over the mod's
        # JavaScript and JSON and the Markdown; the module adds
        # checks.<system>.treefmt, so `nix flake check` fails on any
        # unformatted file.
        treefmt = {
          projectRootFile = "flake.nix";
          programs.nixfmt.enable = true;
          programs.prettier.enable = true;
          settings.formatter.prettier.includes = [
            "*.js"
            "*.json"
            "*.md"
          ];
          settings.global.excludes = [ "*.lock" ];
        };
      };
    };
}
