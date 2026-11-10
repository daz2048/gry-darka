"""Opt-in, conflict-safe shell shortcuts for the game server."""

import argparse
import os
from pathlib import Path
import shlex
import stat
import subprocess
import sys
import tempfile


START = "# >>> gry-darka game-server aliases >>>\n"
END = "# <<< gry-darka game-server aliases <<<\n"
SCRIPT = Path(__file__).resolve().with_name("game-server.sh")


def managed_range(text):
    if START not in text and END not in text:
        return None
    if text.count(START) != 1 or text.count(END) != 1:
        raise ValueError("Ambiguous alias markers; configuration left unchanged.")
    start = text.index(START)
    end = text.index(END)
    if end < start or (start and text[start - 1] != "\n"):
        raise ValueError("Invalid alias markers; configuration left unchanged.")
    return start, end + len(END)


def alias_block(names):
    command = shlex.quote(str(SCRIPT))
    lines = [START]
    for name in names:
        lines.extend([
            f"if command -v {name} >/dev/null 2>&1; then\n",
            f"    printf '%s\\n' 'gry-darka: {name} already exists; shortcut skipped.' >&2\n",
            "else\n",
            f"    alias {name}={shlex.quote(command)}\n",
            "fi\n",
        ])
    lines.append(END)
    return "".join(lines)


def shell_config(shell):
    name = Path(shell).name
    if name not in ("zsh", "bash"):
        raise ValueError("Only zsh and bash are supported; no configuration changed.")
    if name == "zsh":
        # Ask zsh itself: startup files may set ZDOTDIR.
        result = subprocess.run(
            [shell, "-lic", 'printf "\\0%s\\0" "${ZDOTDIR:-$HOME}/.zshrc"'],
            capture_output=True, text=True, check=True, timeout=15,
        )
        fields = result.stdout.split("\0")
        if len(fields) != 3 or not fields[1].startswith("/"):
            raise ValueError("Could not determine zsh startup file safely.")
        return Path(fields[1]).resolve()
    home = Path.home()
    for filename in (".bash_profile", ".bash_login", ".profile"):
        path = home / filename
        if path.exists():
            return path.resolve()
    return home / ".bash_profile"


def available(shell, name):
    result = subprocess.run(
        [shell, "-lic",
         'if command -v "$1" >/dev/null 2>&1; then '
         'printf "\\0occupied\\0"; else printf "\\0available\\0"; fi',
         "game-server-alias-check", name],
        capture_output=True, text=True, timeout=15,
    )
    fields = result.stdout.split("\0")
    if result.returncode != 0 or len(fields) != 3 or fields[1] not in ("available", "occupied"):
        raise ValueError(
            f"Conflict check failed for {name}: {result.stderr.strip() or result.returncode}"
        )
    return fields[1] == "available"


def write_config(path, original, updated):
    if path.exists() and path.read_text() != original:
        raise ValueError("Shell configuration changed during installation; please retry.")
    mode = stat.S_IMODE(path.stat().st_mode) if path.exists() else 0o600
    backup = None
    if path.exists():
        with tempfile.NamedTemporaryFile(
            mode="w", prefix=f"{path.name}.gry-darka-backup-", dir=path.parent,
            delete=False,
        ) as file:
            file.write(original)
            backup = file.name
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", prefix=f"{path.name}.gry-darka-", dir=path.parent, delete=False,
        ) as file:
            temporary = Path(file.name)
            file.write(updated)
            file.flush()
            os.fchmod(file.fileno(), mode)
        temporary.replace(path)
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()
    if backup:
        print(f"Configuration backup: {backup}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("install-aliases", "uninstall-aliases"))
    parser.add_argument("--with-game", action="store_true")
    args = parser.parse_args()
    if args.with_game and args.action != "install-aliases":
        parser.error("--with-game requires install-aliases")
    shell = os.environ.get("SHELL", "")
    if not shell:
        raise ValueError("SHELL is unset; no configuration changed.")
    config = shell_config(shell)
    original = config.read_text() if config.exists() else ""
    region = managed_range(original)
    if args.action == "uninstall-aliases":
        if region is None:
            print("No managed aliases installed.")
            return
        start, end = region
        write_config(config, original, original[:start] + original[end:])
        print(f"Removed managed aliases from {config}. Open a new terminal to apply.")
        print("Existing terminals retain their aliases until closed or manually unaliased.")
        return
    if region is not None:
        print(f"Managed aliases already present in {config}; nothing changed.")
        print("To change the selection, uninstall first, then install again.")
        return
    names = ["game-server", "game"] if args.with_game else ["game-server"]
    free = []
    for name in names:
        if available(shell, name):
            free.append(name)
        else:
            print(f"Skipped {name}: an alias, function, builtin or command already exists.")
    if not free:
        print("No available shortcuts; configuration unchanged.")
        return
    separator = "\n" if original and not original.endswith("\n") else ""
    write_config(config, original, original + separator + alias_block(free))
    print(f"Installed {', '.join(free)} in {config}. Open a new terminal to use them.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, subprocess.SubprocessError) as error:
        print(f"Alias setup failed: {error}", file=sys.stderr)
        sys.exit(1)
