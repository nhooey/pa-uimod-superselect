"""Tests for scripts/superselect.py: argument parsing and the pure parts."""

import importlib.util
import io
import json
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "superselect.py"
spec = importlib.util.spec_from_file_location("superselect", SCRIPT)
superselect = importlib.util.module_from_spec(spec)
spec.loader.exec_module(superselect)

PA = Path("Uber Entertainment") / "Planetary Annihilation" / "client_mods"


class ParserTest(unittest.TestCase):
    def parse(self, *argv):
        return superselect.build_parser().parse_args(list(argv))

    def test_install_options(self):
        args = self.parse("--client-mods", "/m", "install", "--link", "--force")
        self.assertEqual(args.command, "install")
        self.assertEqual(args.client_mods, "/m")
        self.assertTrue(args.link)
        self.assertTrue(args.force)

    def test_install_defaults(self):
        args = self.parse("install")
        self.assertFalse(args.link)
        self.assertFalse(args.force)
        self.assertIsNone(args.client_mods)
        self.assertIsNone(args.root)

    def test_commands(self):
        for command in ("install", "uninstall", "path"):
            self.assertEqual(self.parse(command).command, command)

    def test_command_required(self):
        with redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            self.parse()

    def test_unknown_command(self):
        with redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            self.parse("build")

    def test_help_lists_commands(self):
        text = superselect.build_parser().format_help()
        for command in ("install", "uninstall", "path"):
            self.assertIn(command, text)


class ClientModsTest(unittest.TestCase):
    def test_darwin(self):
        self.assertEqual(
            superselect.default_client_mods("darwin", "/h", {}),
            Path("/h/Library/Application Support") / PA,
        )

    def test_linux(self):
        self.assertEqual(
            superselect.default_client_mods("linux", "/h", {}), Path("/h/.local") / PA
        )

    def test_windows_localappdata(self):
        self.assertEqual(
            superselect.default_client_mods("win32", "/h", {"LOCALAPPDATA": "/l"}),
            Path("/l") / PA,
        )

    def test_windows_fallback(self):
        self.assertEqual(
            superselect.default_client_mods("win32", "/h", {}),
            Path("/h/AppData/Local") / PA,
        )

    def test_option_beats_environment(self):
        environ = {superselect.CLIENT_MODS_ENV: "/env"}
        self.assertEqual(superselect.resolve_client_mods("/opt", environ), Path("/opt"))

    def test_environment(self):
        environ = {superselect.CLIENT_MODS_ENV: "/env"}
        self.assertEqual(superselect.resolve_client_mods(None, environ), Path("/env"))


class CheckoutTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name).resolve() / "checkout"
        (self.root / "ui" / "mods").mkdir(parents=True)
        (self.root / "ui" / "mods" / "a.js").write_text("// a\n")
        (self.root / "README.md").write_text("readme\n")
        self.write_modinfo("com.example.mod")
        self.mods = Path(self.tmp.name).resolve() / "client_mods"

    def write_modinfo(self, identifier):
        (self.root / "modinfo.json").write_text(json.dumps({"identifier": identifier}))

    def run_main(self, *argv):
        out = io.StringIO()
        with redirect_stdout(out):
            superselect.main(
                ["--root", str(self.root), "--client-mods", str(self.mods), *argv]
            )
        return out.getvalue()

    def test_find_root_walks_up(self):
        found = superselect.find_root(environ={}, cwd=self.root / "ui" / "mods")
        self.assertEqual(found, self.root)

    def test_find_root_prefers_prj_root(self):
        found = superselect.find_root(environ={"PRJ_ROOT": "/p"}, cwd=self.root)
        self.assertEqual(found, Path("/p"))

    def test_bad_identifier(self):
        for identifier in ("", "../x", ".."):
            self.write_modinfo(identifier)
            with self.assertRaises(SystemExit):
                superselect.mod_identifier(self.root)

    def test_path(self):
        self.assertEqual(self.run_main("path").strip(), str(self.mods / "com.example.mod"))

    def test_install_copies_mod_entries_only(self):
        self.run_main("install")
        target = self.mods / "com.example.mod"
        self.assertTrue((target / "modinfo.json").is_file())
        self.assertEqual((target / "ui" / "mods" / "a.js").read_text(), "// a\n")
        self.assertFalse((target / "README.md").exists())
        self.assertFalse((target / "ui").is_symlink())

    def test_install_link(self):
        self.run_main("install", "--link")
        target = self.mods / "com.example.mod"
        self.assertTrue((target / "ui").is_symlink())
        self.assertEqual((target / "ui").resolve(), self.root / "ui")

    def test_install_refuses_then_forces(self):
        self.run_main("install")
        with self.assertRaises(SystemExit):
            self.run_main("install")
        self.run_main("install", "--force", "--link")
        self.assertTrue((self.mods / "com.example.mod" / "ui").is_symlink())

    def test_uninstall(self):
        self.run_main("install")
        self.run_main("uninstall")
        self.assertFalse((self.mods / "com.example.mod").exists())
        with self.assertRaises(SystemExit):
            self.run_main("uninstall")


if __name__ == "__main__":
    unittest.main()
