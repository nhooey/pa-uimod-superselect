#!/usr/bin/env python3
"""Install Super Select into Planetary Annihilation's client_mods directory.

The game loads a client mod from a directory under client_mods named after
the mod's identifier in modinfo.json. This tool puts the checkout's mod
files there, by copy or symlink, and takes them out again.
"""

import argparse
import json
import os
import shutil
import sys
from pathlib import Path

# The files and directories the game reads; the rest of the checkout
# (flake, docs, images the mod links by URL) stays behind.
MOD_ENTRIES = ("modinfo.json", "ui")

CLIENT_MODS_ENV = "PA_CLIENT_MODS"


def default_client_mods(platform=None, home=None, environ=None):
    """Return the game's client_mods directory for a platform."""
    platform = sys.platform if platform is None else platform
    home = Path.home() if home is None else Path(home)
    environ = os.environ if environ is None else environ
    if platform == "darwin":
        base = home / "Library" / "Application Support"
    elif platform.startswith("win"):
        local = environ.get("LOCALAPPDATA")
        base = Path(local) if local else home / "AppData" / "Local"
    else:
        base = home / ".local"
    return base / "Uber Entertainment" / "Planetary Annihilation" / "client_mods"


def resolve_client_mods(option, environ=None):
    """Pick the client_mods directory: option, then environment, then default."""
    environ = os.environ if environ is None else environ
    if option:
        return Path(option).expanduser()
    if environ.get(CLIENT_MODS_ENV):
        return Path(environ[CLIENT_MODS_ENV]).expanduser()
    return default_client_mods(environ=environ)


def find_root(option=None, environ=None, cwd=None):
    """Find the checkout: the option, $PRJ_ROOT, or the nearest modinfo.json."""
    environ = os.environ if environ is None else environ
    if option:
        return Path(option).expanduser()
    if environ.get("PRJ_ROOT"):
        return Path(environ["PRJ_ROOT"])
    start = Path.cwd() if cwd is None else Path(cwd)
    for directory in (start, *start.parents):
        if (directory / "modinfo.json").is_file():
            return directory
    raise SystemExit(f"superselect: no modinfo.json in {start} or above; pass --root")


def mod_identifier(root):
    """Read the mod's identifier, its directory name under client_mods."""
    with open(Path(root) / "modinfo.json", encoding="utf-8") as handle:
        identifier = json.load(handle).get("identifier")
    if not identifier or "/" in identifier or identifier in (".", ".."):
        raise SystemExit(f"superselect: bad identifier in modinfo.json: {identifier!r}")
    return identifier


def remove(path):
    """Remove a file, symlink or directory tree, if present."""
    if path.is_symlink() or path.is_file():
        path.unlink()
    elif path.is_dir():
        shutil.rmtree(path)


def refuse_checkout(root, target):
    """Refuse to remove a target that is, or holds, the checkout itself.

    A clone made straight into client_mods under the identifier's name is
    the install target too; removing it would delete the checkout. A
    symlink to the checkout is fine: removing it only unlinks it.
    """
    if target.is_symlink() or not target.exists():
        return
    checkout = Path(root).resolve()
    resolved = target.resolve()
    if resolved == checkout or resolved in checkout.parents:
        raise SystemExit(
            f"superselect: {target} holds this checkout; refusing to remove it"
        )


def install(root, target, link=False, force=False):
    """Copy or symlink the mod's entries from root into target."""
    refuse_checkout(root, target)
    if target.exists() or target.is_symlink():
        if not force:
            raise SystemExit(f"superselect: {target} exists; pass --force to replace it")
        remove(target)
    target.mkdir(parents=True)
    for name in MOD_ENTRIES:
        source = Path(root) / name
        destination = target / name
        if link:
            destination.symlink_to(source.resolve())
        elif source.is_dir():
            shutil.copytree(source, destination)
        else:
            shutil.copy2(source, destination)


def build_parser():
    parser = argparse.ArgumentParser(
        prog="superselect",
        description="Install Super Select into Planetary Annihilation's client_mods.",
    )
    parser.add_argument(
        "--root", help="the checkout holding modinfo.json (default: $PRJ_ROOT)"
    )
    parser.add_argument(
        "--client-mods",
        help=f"the game's client_mods directory (default: ${CLIENT_MODS_ENV}, "
        "else the platform's usual place)",
    )
    commands = parser.add_subparsers(dest="command", required=True, metavar="COMMAND")

    install_parser = commands.add_parser(
        "install", help="copy the mod into client_mods, named by its identifier"
    )
    install_parser.add_argument(
        "--link",
        action="store_true",
        help="symlink to the checkout instead of copying, so edits show on reload",
    )
    install_parser.add_argument(
        "--force", action="store_true", help="replace an installed copy"
    )
    commands.add_parser("uninstall", help="remove the mod from client_mods")
    commands.add_parser("path", help="print where install puts the mod")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    root = find_root(args.root)
    target = resolve_client_mods(args.client_mods) / mod_identifier(root)
    if args.command == "path":
        print(target)
    elif args.command == "install":
        install(root, target, link=args.link, force=args.force)
        print(f"Installed {target}; activate Super Select in PA Mod Manager.")
    elif args.command == "uninstall":
        if not (target.exists() or target.is_symlink()):
            raise SystemExit(f"superselect: {target} is not installed")
        refuse_checkout(root, target)
        remove(target)
        print(f"Removed {target}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
