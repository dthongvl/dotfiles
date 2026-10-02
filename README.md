# dotfiles

## 1. Install on a new machine

```bash
set -e
sudo apt install git stow nodejs npm  # macOS: brew install git stow node

git clone git@github.com:dthongvl/dotfiles.git ~/workspace/dotfiles
cd ~/workspace/dotfiles
./dot init --dry-run
./dot init

# The entire skills directory and CLI metadata now point into this checkout.
readlink "$HOME/.agents/skills"
readlink "$HOME/.agents/.skill-lock.json"
```

## 2. Migrate an existing machine

```bash
set -e
sudo apt install stow                # macOS: brew install stow
cd ~/workspace/dotfiles

# Remove old Stow links before pulling moved/deleted files.
if [ -x ./dot ]; then ./dot unstow; fi
git pull --ff-only

# Back up existing configs and the WHOLE skills directory, not individual files.
backup="$(mktemp -d "$HOME/dotfiles-backup.XXXXXX")"
paths=(
  .tmux.conf .wezterm.lua
  .config/fish/config.fish .config/ghostty/config .config/herdr/config.toml
  .config/jj/config.toml .config/nvim .config/webfox/config.yaml
  .pi/agent/APPEND_SYSTEM.md .pi/agent/settings.json .pi/agent/subagent-models.json
  .pi/agent/agents .pi/agent/extensions .pi/agent/lib
  .agents/skills .agents/.skill-lock.json
)
for path in "${paths[@]}"; do
  if [ -e "$HOME/$path" ] || [ -L "$HOME/$path" ]; then
    mkdir -p "$backup/$(dirname "$path")"
    mv "$HOME/$path" "$backup/$path"
  fi
done
printf 'Keep this backup; review any local skill/config changes: %s\n' "$backup"

# Stop and resolve any conflicts before proceeding.
./dot stow --dry-run
./dot stow
```

## 3. Install a new skill

```bash
set -e
# Review the source first. This writes directly into dotfiles/home/.agents/skills/.
# --agent '*' targets every agent; some agents do not support global installs.
# Keep this flag: Pi-only installs use ~/.pi/agent/skills instead of the shared folder.
XDG_STATE_HOME='' npx --yes skills@1.7.0 add owner/repository \
  --global --agent '*' --skill skill-name --yes

# No staging, copying, metadata merging, or restowing is needed.
cd ~/workspace/dotfiles
git status --short

# When ready to review and commit the skill:
git add -- home/.agents/skills/skill-name home/.agents/.skill-lock.json
git diff --cached
# git commit -m "Add skill-name"
# git push

# On other machines: pull the committed contents into the already linked directory.
# cd ~/workspace/dotfiles && ./dot update
```

```bash
# Updates overwrite repository skill contents directly: inspect changes before committing.
# Only commit skill content you are authorized to store in this repository; never commit credentials.
# Non-universal agents' links are created locally by npx, not synchronized by Git.
# On another machine, rerun the same upstream install command for those agents;
# this can refresh the shared skill contents, so review its Git diff afterward.
# Keep XDG_STATE_HOME empty for skills commands so metadata uses the linked global file.
```
