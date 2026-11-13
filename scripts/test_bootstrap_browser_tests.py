import os
from pathlib import Path
import pty
import shutil
import subprocess
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("bootstrap-browser-tests.sh")


class BootstrapTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.log = self.root / "commands"
        self.env = {
            **os.environ,
            "PATH": str(self.bin),
            "FIXTURE": str(self.root),
            "TERM": "xterm-256color",
        }
        self.env.pop("NO_COLOR", None)
        self.env.pop("NODE_EXTRA_CA_CERTS", None)
        for name in ("mktemp", "rm", "rmdir", "dirname", "grep", "cat"):
            (self.bin / name).symlink_to(shutil.which(name))
        self.command("uname", 'echo "${FIXTURE_PLATFORM:-Darwin}"')
        self.command("git", """
case "$3" in
    rev-parse)
        if [ "$4" = --short ]; then echo abc123; else echo true; fi
        ;;
    symbolic-ref)
        test ! -f "$FIXTURE/detached" || exit 1
        echo test-branch
        ;;
    status)
        test ! -f "$FIXTURE/git-status-fails" || exit 1
        if [ -f "$FIXTURE/dirty" ]; then echo '?? untracked'; fi
        ;;
    *) exit 2 ;;
esac
""")
        self.command("node", """
if [ "$1" = --version ]; then echo v22.0.0; exit 0; fi
test -f "$FIXTURE/node-ok"
""")
        self.command("python3", 'test -f "$FIXTURE/python-ok" && echo 3.14.4')
        self.command("npm", """
echo "npm $*" >> "$FIXTURE/commands"
printf '%s\\n' "${NODE_EXTRA_CA_CERTS-unset}" >> "$FIXTURE/ca-values"
if [ "$1" = --version ]; then
    test -f "$FIXTURE/npm-ok" && echo 11.0.0
    exit $?
fi
case "$*" in
    *"screenshot "*)
        if [ ! -f "$FIXTURE/browser-ok" ]; then
            if [ -f "$FIXTURE/cache-miss" ]; then
                echo 'npm error code ENOTCACHED' >&2
                echo 'npm error detailed cache miss' >&2
            else
                echo 'Chromium launch failed' >&2
            fi
            exit 1
        fi
        for argument in "$@"; do output=$argument; done
        printf 'image' > "$output"
        ;;
    *"install --force chromium"*)
        test ! -f "$FIXTURE/repair-fails" || exit 1
        : > "$FIXTURE/browser-ok"
        ;;
    *"install chromium"*)
        if [ -f "$FIXTURE/tls-error" ]; then
            echo UNABLE_TO_GET_ISSUER_CERT_LOCALLY >&2
            exit 1
        fi
        if [ ! -f "$FIXTURE/needs-force" ]; then
            : > "$FIXTURE/browser-ok"
        fi
        ;;
    *) exit 2 ;;
esac
""")
        self.command("brew", """
echo "brew $*" >> "$FIXTURE/commands"
case "$1" in
    --version) echo Homebrew ;;
    --prefix) echo "$FIXTURE" ;;
    list) test -f "$FIXTURE/installed" ;;
    outdated)
        test ! -f "$FIXTURE/outdated-error" || exit 1
        if [ -f "$FIXTURE/outdated" ]; then echo "$3"; fi
        ;;
    install|reinstall|upgrade)
        if [ "$2" = node ]; then
            : > "$FIXTURE/node-ok"
            : > "$FIXTURE/npm-ok"
        else
            : > "$FIXTURE/python-ok"
        fi
        ;;
    *) exit 2 ;;
esac
""")
        for name in ("node-ok", "npm-ok", "python-ok", "browser-ok", "installed"):
            self.mark(name)

    def command(self, name, body):
        path = self.bin / name
        path.write_text("#!/bin/bash\n" + body + "\n")
        path.chmod(0o755)

    def mark(self, name):
        (self.root / name).touch()

    def run_script(self, *args, success=True):
        result = subprocess.run(
            ["/bin/bash", str(SCRIPT), *args], env=self.env,
            capture_output=True, text=True, timeout=15,
        )
        self.assertEqual(result.returncode == 0, success, result.stdout + result.stderr)
        return result

    def commands(self):
        return self.log.read_text() if self.log.exists() else ""

    def test_healthy_tools_are_reused_without_installing(self):
        result = self.run_script()
        self.assertIn("browser launch/screenshot check", result.stdout)
        self.assertIn("Script version: 1.2.0", result.stdout)
        self.assertIn("Branch: test-branch", result.stdout)
        self.assertIn("Commit: abc123", result.stdout)
        self.assertIn("Worktree: clean", result.stdout)
        self.assertNotIn("brew ", self.commands())
        self.assertNotIn("install chromium", self.commands())

    def test_macos_certificate_default_and_explicit_overrides(self):
        if not (Path("/etc/ssl/cert.pem").is_file() and os.access("/etc/ssl/cert.pem", os.R_OK)):
            self.skipTest("macOS certificate bundle is not available")
        result = self.run_script("--check")
        self.assertIn("Using macOS certificate bundle: /etc/ssl/cert.pem", result.stdout)
        self.assertEqual(set((self.root / "ca-values").read_text().splitlines()), {"/etc/ssl/cert.pem"})
        for value in ("/custom/trusted.pem", ""):
            with self.subTest(value=value):
                (self.root / "ca-values").unlink()
                self.env["NODE_EXTRA_CA_CERTS"] = value
                result = self.run_script("--check")
                self.assertNotIn("Using macOS certificate bundle", result.stdout)
                self.assertEqual(set((self.root / "ca-values").read_text().splitlines()), {value})

    def test_other_platforms_do_not_set_macos_certificate_bundle(self):
        self.env["FIXTURE_PLATFORM"] = "Linux"
        result = self.run_script("--check")
        self.assertNotIn("Using macOS certificate bundle", result.stdout)
        self.assertEqual(set((self.root / "ca-values").read_text().splitlines()), {"unset"})

    def test_git_dirty_detached_and_status_failure(self):
        self.mark("dirty")
        self.mark("detached")
        result = self.run_script("--check")
        self.assertIn("Branch: (detached HEAD)", result.stdout)
        self.assertIn("Worktree: dirty", result.stdout)
        self.mark("git-status-fails")
        result = self.run_script("--check", success=False)
        self.assertIn("Could not determine Git worktree status", result.stderr)

    def test_offline_cache_miss_is_explained_and_debug_shows_details(self):
        (self.root / "browser-ok").unlink()
        self.mark("cache-miss")
        result = self.run_script("--check", success=False)
        self.assertIn("offline npm cache (ENOTCACHED)", result.stderr)
        self.assertNotIn("detailed cache miss", result.stderr)
        self.assertIn("Rerun without --check", result.stderr)
        result = self.run_script("--debug", "--check", success=False)
        self.assertIn("Debug: enabled", result.stdout)
        self.assertIn("detailed cache miss", result.stderr)
        self.assertNotIn("install chromium", self.commands())

    def test_other_browser_errors_are_visible_without_debug(self):
        (self.root / "browser-ok").unlink()
        result = self.run_script("--check", success=False)
        self.assertIn("Chromium launch failed", result.stderr)

    def test_check_does_not_repair_broken_runtimes_or_browser(self):
        for name in ("npm-ok", "browser-ok"):
            with self.subTest(name=name):
                (self.root / name).unlink()
                self.run_script("--check", success=False)
                self.mark(name)
        self.assertNotIn("brew ", self.commands())
        self.assertNotIn("install chromium", self.commands())

    def test_broken_npm_and_python_are_reinstalled_and_rechecked(self):
        (self.root / "npm-ok").unlink()
        (self.root / "python-ok").unlink()
        self.run_script()
        self.assertIn("brew reinstall node", self.commands())
        self.assertIn("brew reinstall python", self.commands())

    def test_outdated_node_is_upgraded(self):
        (self.root / "node-ok").unlink()
        self.mark("outdated")
        self.run_script()
        self.assertIn("brew upgrade node", self.commands())
        self.assertNotIn("brew reinstall", self.commands())

    def test_failed_outdated_check_does_not_trigger_reinstall(self):
        (self.root / "node-ok").unlink()
        self.mark("outdated-error")
        result = self.run_script(success=False)
        self.assertIn("Could not check Homebrew updates", result.stderr)
        self.assertNotIn("brew reinstall", self.commands())

    def test_non_homebrew_runtime_is_not_overwritten(self):
        (self.root / "node-ok").unlink()
        external = self.root / "external"
        external.mkdir()
        (external / "node").write_text("#!/bin/bash\nexit 1\n")
        (external / "node").chmod(0o755)
        self.env["PATH"] = str(external) + ":" + str(self.bin)
        result = self.run_script(success=False)
        self.assertIn("not managed", result.stderr)
        self.assertNotIn("brew reinstall", self.commands())

    def test_missing_browser_is_installed_and_verified(self):
        (self.root / "browser-ok").unlink()
        self.mark("cache-miss")
        result = self.run_script()
        self.assertIn("offline npm cache (ENOTCACHED)", result.stderr)
        self.assertNotIn("detailed cache miss", result.stderr)
        self.assertIn("passed the runtime and headless browser checks", result.stdout)
        self.assertIn("playwright install chromium", self.commands())
        self.assertEqual(self.commands().count("screenshot --browser"), 2)

    def test_broken_browser_is_force_reinstalled_once(self):
        (self.root / "browser-ok").unlink()
        self.mark("needs-force")
        self.run_script()
        self.assertEqual(self.commands().count("install --force chromium"), 1)
        self.assertEqual(self.commands().count("screenshot --browser"), 3)

    def test_browser_repair_failure_is_not_reported_as_success(self):
        (self.root / "browser-ok").unlink()
        self.mark("needs-force")
        self.mark("repair-fails")
        result = self.run_script(success=False)
        self.assertIn("Chromium repair failed", result.stderr)
        self.assertNotIn("passed the runtime", result.stdout)

    def test_tls_failure_is_explicit_and_no_tls_settings_are_changed(self):
        (self.root / "browser-ok").unlink()
        self.mark("tls-error")
        result = self.run_script(success=False)
        self.assertIn("UNABLE_TO_GET_ISSUER_CERT_LOCALLY", result.stderr)
        self.assertIn("NODE_EXTRA_CA_CERTS", result.stderr)
        self.assertNotIn("npm config", self.commands())
        self.assertNotIn("install --force", self.commands())

    def test_help_colours_and_no_color(self):
        plain = self.run_script("--help").stdout
        self.assertNotIn("\033", plain)
        for overrides, coloured in (({}, True), ({"NO_COLOR": "1"}, False), ({"TERM": "dumb"}, False)):
            with self.subTest(overrides=overrides):
                master, slave = pty.openpty()
                try:
                    process = subprocess.Popen(
                        ["/bin/bash", str(SCRIPT), "--help"],
                        env={**self.env, **overrides}, stdout=slave, stderr=subprocess.PIPE,
                    )
                    os.close(slave)
                    output = bytearray()
                    while True:
                        try:
                            chunk = os.read(master, 4096)
                        except OSError as error:
                            if error.errno != 5:
                                raise
                            break
                        if not chunk:
                            break
                        output.extend(chunk)
                    _, errors = process.communicate(timeout=15)
                    self.assertEqual(process.returncode, 0, errors)
                finally:
                    os.close(master)
                self.assertEqual(b"\033[" in output, coloured)
        self.assertEqual(self.commands(), "")

    def test_extra_arguments_are_rejected_without_changes(self):
        self.run_script("--check", "unexpected", success=False)
        self.assertEqual(self.commands(), "")


if __name__ == "__main__":
    unittest.main()
