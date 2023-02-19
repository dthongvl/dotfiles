#!/usr/bin/env bash
set -eo pipefail

# Fishshell
sudo apt-add-repository ppa:fish-shell/release-3
sudo apt update
sudo apt install fish

# Set fishshell to default shell
chsh -s /usr/bin/fish

# Asdf
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.11.1
mkdir -p ~/.config/fish/completions; and ln -s ~/.asdf/completions/asdf.fish ~/.config/fish/completions

# Install yarn
npm install -g yarn

# Packages
sudo apt install alacritty flameshot peek tmux curl jq fzf ripgrep ninja-build gettext libtool libtool-bin autoconf automake cmake g++ pkg-config unzip
yarn global add typescript rustywind

# Key bindings fzf
mkdir -p ~/.config/fish/functions/
echo fzf_key_bindings > ~/.config/fish/functions/fish_user_key_bindings.fish

# Config files
ln -s -f ~/workspace/dotfiles/nvim ~/.config

ln -s -f ~/workspace/dotfiles/.tmux.conf ~/.tmux.conf

mkdir -p ~/.config/fish
ln -s -f ~/workspace/dotfiles/config.fish ~/.config/fish/config.fish

mkdir -p ~/.config/alacritty
ln -s -f ~/workspace/dotfiles/alacritty.yml ~/.config/alacritty/alacritty.yml

# Jump
wget https://github.com/gsamokovarov/jump/releases/download/v0.40.0/jump_0.40.0_amd64.deb && sudo dpkg -i jump_0.40.0_amd64.deb

# Neovim
git clone https://github.com/neovim/neovim ~/workspace/neovim
(cd ~/workspace/neovim && make CMAKE_BUILD_TYPE=RelWithDebInfo -j4 && sudo make install)

# Packer for Neovim
git clone --depth 1 https://github.com/wbthomason/packer.nvim\
 ~/.local/share/nvim/site/pack/packer/start/packer.nvim

# Tmux Plugin Manager
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
mkdir -p ~/.local/bin
curl -L https://github.com/rust-analyzer/rust-analyzer/releases/latest/download/rust-analyzer-x86_64-unknown-linux-gnu.gz | gunzip -c - > ~/.local/bin/rust-analyzer
chmod +x ~/.local/bin/rust-analyzer
rustup component add rust-src
