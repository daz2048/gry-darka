import importlib.util
import os
from pathlib import Path
import shlex
import subprocess
import tempfile
import unittest
from unittest import mock


SCRIPT = Path(__file__).with_name("game-server-aliases.py")
WRAPPER = SCRIPT.with_name("game-server.sh")
spec = importlib.util.spec_from_file_location("game_server_aliases", SCRIPT)
aliases = importlib.util.module_from_spec(spec)
spec.loader.exec_module(aliases)


class AliasTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.home = Path(self.directory.name)
        self.config = self.home / ".zshrc"
        self.env = {
            **os.environ, "HOME": str(self.home), "ZDOTDIR": str(self.home),
            "SHELL": "/bin/zsh",
        }

    def run_wrapper(self, *args, success=True):
        result = subprocess.run(
            ["/bin/bash", str(WRAPPER), *args], env=self.env,
            capture_output=True, text=True, timeout=30,
        )
        self.assertEqual(result.returncode == 0, success, result.stdout + result.stderr)
        return result

    def shell(self, code, shell="/bin/zsh"):
        result = subprocess.run(
            [shell, "-lic", code], env=self.env,
            capture_output=True, text=True, timeout=15, cwd="/",
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        return result

    def test_install_forward_arguments_repeat_and_uninstall(self):
        original = "# existing settings\nalias ga='git add'\n"
        self.config.write_text(original)
        self.config.chmod(0o640)
        self.run_wrapper("--install-aliases", "--with-game")
        installed = self.config.read_text()
        self.assertIn("alias game-server=", installed)
        self.assertIn("alias game=", installed)
        self.assertEqual(installed.count("alias ga="), 1)
        self.assertEqual(self.config.stat().st_mode & 0o777, 0o640)
        backups = list(self.home.glob(".zshrc.gry-darka-backup-*"))
        self.assertEqual(len(backups), 1)
        self.assertEqual(backups[0].read_text(), original)
        self.assertIn("GAME SERVER // HELP", self.shell("game-server --help").stdout)
        self.assertIn("GAME SERVER // HELP", self.shell("game --help").stdout)
        self.assertIn("git add", self.shell("alias ga").stdout)
        self.run_wrapper("--install-aliases", "--with-game")
        self.assertEqual(self.config.read_text(), installed)
        self.run_wrapper("--uninstall-aliases")
        self.assertEqual(self.config.read_text(), original)
        self.run_wrapper("--uninstall-aliases")
        self.assertEqual(self.config.read_text(), original)

    def test_primary_only(self):
        self.run_wrapper("--install-aliases")
        self.assertIn("alias game-server=", self.config.read_text())
        self.assertNotIn("alias game=", self.config.read_text())

    def test_alias_and_function_conflicts_leave_config_unchanged(self):
        for definition in ("alias game='echo occupied'\n", "game() { echo occupied; }\n"):
            with self.subTest(definition=definition):
                original = "alias game-server='echo reserved'\n" + definition
                self.config.write_text(original)
                result = self.run_wrapper("--install-aliases", "--with-game")
                self.assertIn("Skipped game-server", result.stdout)
                self.assertIn("Skipped game:", result.stdout)
                self.assertEqual(self.config.read_text(), original)

    def test_executable_conflict_skips_only_that_name(self):
        executable = self.home / "game"
        executable.write_text("#!/bin/sh\nexit 0\n")
        executable.chmod(0o700)
        self.config.write_text(f"export PATH={shlex.quote(str(self.home))}:$PATH\n")
        result = self.run_wrapper("--install-aliases", "--with-game")
        self.assertIn("Skipped game:", result.stdout)
        self.assertIn("alias game-server=", self.config.read_text())
        self.assertNotIn("alias game=", self.config.read_text())

    def test_load_guard_preserves_new_command_and_local_alias(self):
        self.run_wrapper("--install-aliases", "--with-game")
        executable = self.home / "game"
        executable.write_text("#!/bin/sh\nprintf 'external-command\\n'\n")
        executable.chmod(0o700)
        self.config.write_text(
            f"export PATH={shlex.quote(str(self.home))}:$PATH\n" + self.config.read_text()
        )
        self.assertIn("external-command", self.shell("game").stdout)
        result = self.shell("alias game-server='echo local'; source ~/.zshrc\nalias game-server")
        self.assertIn("local", result.stdout)
        self.assertIn("shortcut skipped", result.stderr)

    def test_bash_install_and_forwarding(self):
        self.env["SHELL"] = "/bin/bash"
        config = self.home / ".bash_profile"
        config.write_text("# bash settings\n")
        self.run_wrapper("--install-aliases")
        self.assertIn("GAME SERVER // HELP", self.shell("game-server --help", "/bin/bash").stdout)
        self.run_wrapper("--uninstall-aliases")
        self.assertEqual(config.read_text(), "# bash settings\n")

    def test_zdotdir_from_startup_configuration(self):
        config_directory = self.home / "shell settings"
        config_directory.mkdir()
        (self.home / ".zshenv").write_text(
            f"export ZDOTDIR={shlex.quote(str(config_directory))}\n"
        )
        self.run_wrapper("--install-aliases")
        self.assertFalse(self.config.exists())
        self.assertIn(aliases.START, (config_directory / ".zshrc").read_text())

    def test_symlinked_config_is_preserved(self):
        target = self.home / "dotfiles"
        target.write_text("# settings\n")
        self.config.symlink_to(target)
        self.run_wrapper("--install-aliases")
        self.assertTrue(self.config.is_symlink())
        self.assertIn(aliases.START, target.read_text())
        self.run_wrapper("--uninstall-aliases")
        self.assertEqual(target.read_text(), "# settings\n")

    def test_path_quoting_with_spaces_and_apostrophe(self):
        script = self.home / "game's directory" / "game-server.sh"
        script.parent.mkdir()
        script.write_text("#!/bin/sh\nprintf '<%s>\\n' \"$@\"\n")
        script.chmod(0o700)
        with mock.patch.object(aliases, "SCRIPT", script):
            self.config.write_text(aliases.alias_block(["game-server"]))
        self.assertEqual(self.shell("game-server 'one two' --debug").stdout, "<one two>\n<--debug>\n")

    def test_malformed_markers_fail_without_changes(self):
        original = aliases.START + "# incomplete block\n"
        self.config.write_text(original)
        self.run_wrapper("--install-aliases", success=False)
        self.assertEqual(self.config.read_text(), original)
        self.run_wrapper("--uninstall-aliases", success=False)
        self.assertEqual(self.config.read_text(), original)

    def test_invalid_cli_and_unsupported_shell(self):
        self.run_wrapper("--with-game", success=False)
        self.run_wrapper("--install-aliases", "s", success=False)
        self.env["SHELL"] = "/bin/sh"
        self.run_wrapper("--install-aliases", success=False)
        self.assertFalse(self.config.exists())

    def test_builtin_and_failed_probe(self):
        self.assertFalse(aliases.available("/bin/zsh", "printf"))
        with mock.patch.object(subprocess, "run", return_value=subprocess.CompletedProcess(
            [], 2, "", "startup failed",
        )):
            with self.assertRaisesRegex(ValueError, "Conflict check failed"):
                aliases.available("/bin/zsh", "game-server")
        with mock.patch.object(subprocess, "run", return_value=subprocess.CompletedProcess(
            [], 0, "", "",
        )):
            with self.assertRaisesRegex(ValueError, "Conflict check failed"):
                aliases.available("/bin/zsh", "game-server")


if __name__ == "__main__":
    unittest.main()
