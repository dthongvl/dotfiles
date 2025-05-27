#!/usr/bin/env bash
set -eo pipefail

# Fishshell
sudo apt update
sudo apt install fish

# Set fishshell to default shell
chsh -s /usr/bin/fish

# Install fisher
curl -sL https://raw.githubusercontent.com/jorgebucaran/fisher/main/functions/fisher.fish | source && fisher install jorgebucaran/fisher
fisher install rose-pine/fish

# Packages
sudo apt install alacritty flameshot peek tmux curl jq fzf ripgrep ninja-build gettext libtool libtool-bin autoconf automake cmake g++ pkg-config unzip

# Key bindings fzf
mkdir -p ~/.config/fish/functions/
echo fzf_key_bindings > ~/.config/fish/functions/fish_user_key_bindings.fish

# Config files
ln -s -f ~/workspace/dotfiles/nvim ~/.config

ln -s -f ~/workspace/dotfiles/jj ~/.config

ln -s -f ~/workspace/dotfiles/.tmux.conf ~/.tmux.conf

ln -s -f ~/workspace/dotfiles/.wezterm.lua ~/.wezterm.lua

mkdir -p ~/.config/fish
ln -s -f ~/workspace/dotfiles/config.fish ~/.config/fish/config.fish

mkdir -p ~/.config/alacritty
ln -s -f ~/workspace/dotfiles/alacritty.yml ~/.config/alacritty/alacritty.yml

# Mise
curl https://mise.run | sh
mise install --global go node ruby

# Install yarn
npm install -g yarn
yarn global add typescript

# Neovim
git clone https://github.com/neovim/neovim ~/workspace/neovim
(cd ~/workspace/neovim && make CMAKE_BUILD_TYPE=RelWithDebInfo -j4 && sudo make install)

# Tmux Plugin Manager
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

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
