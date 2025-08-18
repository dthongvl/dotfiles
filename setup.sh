#!/usr/bin/env bash
set -eo pipefail

# Fishshell
sudo add-apt-repository ppa:fish-shell/release-4
sudo apt update
sudo apt install fish git

# Set fishshell to default shell
chsh -s /usr/bin/fish

# Install fisher
curl -sL https://raw.githubusercontent.com/jorgebucaran/fisher/main/functions/fisher.fish | source && fisher install jorgebucaran/fisher
fisher install rose-pine/fish

# Packages
sudo apt install flatpak
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
flatpak install flathub org.wezfurlong.wezterm
flatpak install flathub app.zen_browser.zen
flatpak install flathub md.obsidian.Obsidian

sudo apt install alacritty flameshot peek tmux curl jq fzf ripgrep ninja-build gettext libtool libtool-bin autoconf automake cmake g++ pkg-config unzip

# Mise
curl https://mise.run | sh
mise install --global go node ruby python rust pnpm

# Config files
ln -s -f ~/workspace/dotfiles/nvim ~/.config

curl -L --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/cargo-bins/cargo-binstall/main/install-from-binstall-release.sh | bash
cargo binstall --strategies crate-meta-data jj-cli
cargo install --locked difftastic
ln -s -f ~/workspace/dotfiles/jj ~/.config

git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
ln -s -f ~/workspace/dotfiles/.tmux.conf ~/.tmux.conf

ln -s -f ~/workspace/dotfiles/.wezterm.lua ~/.wezterm.lua

mkdir -p ~/.config/fish
ln -s -f ~/workspace/dotfiles/config.fish ~/.config/fish/config.fish

mkdir -p ~/.config/alacritty
ln -s -f ~/workspace/dotfiles/alacritty.yml ~/.config/alacritty/alacritty.yml

# Install yarn
npm install -g yarn
yarn global add typescript

# Neovim
git clone https://github.com/neovim/neovim ~/workspace/neovim
(cd ~/workspace/neovim && make CMAKE_BUILD_TYPE=RelWithDebInfo -j4 && sudo make install)

# Tmux Plugin Manager
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
# Install with Prefix + Shift I


# GNOME extensions:
# Astra Monitor
# Auto move windows
# Dash to dock
# - Disable switch app number
# GNOME Tweaks
# - map Caplock <-> Ctrl
# - disable middle click paste
#
# Ubuntu keyboard configs
# - switch/move workspace Super + number
# - close app Super + Q
# - open Terminal with Super + T
# https://www.nerdfonts.com/font-downloads
# Fantasque Sans Mono

# Git
git clone https://github.com/so-fancy/diff-so-fancy ~/workspace/diff-so-fancy
git config --global core.pager "diff-so-fancy | less --tabs=4 -RFX"
git config --global interactive.diffFilter "diff-so-fancy --patch"
git config --global color.ui true

git config --global color.diff-highlight.oldNormal    "red bold"
git config --global color.diff-highlight.oldHighlight "red bold 52"
git config --global color.diff-highlight.newNormal    "green bold"
git config --global color.diff-highlight.newHighlight "green bold 22"

git config --global color.diff.meta       "11"
git config --global color.diff.frag       "magenta bold"
git config --global color.diff.func       "146 bold"
git config --global color.diff.commit     "yellow bold"
git config --global color.diff.old        "red bold"
git config --global color.diff.new        "green bold"
git config --global color.diff.whitespace "red reverse"
