#!/usr/bin/env bash
set -eo pipefail

# Fishshell
sudo apt-add-repository ppa:fish-shell/release-3
sudo apt update
sudo apt install fish

# Set fishshell to default shell
chsh -s /usr/bin/fish

# Nodejs
sudo apt install npm
# make cache folder (if missing) and take ownership
sudo mkdir -p /usr/local/n
sudo chown -R $(whoami) /usr/local/n
# make sure the required folders exist (safe to execute even if they already exist)
sudo mkdir -p /usr/local/bin /usr/local/lib /usr/local/include /usr/local/share
# take ownership of Node.js install destination folders
sudo chown -R $(whoami) /usr/local/bin /usr/local/lib /usr/local/include /usr/local/share

# Install yarn
npm install -g yarn
yarn global add n

# Packages
sudo apt install alacritty flameshot tmux curl jq fzf ripgrep ninja-build gettext libtool libtool-bin autoconf automake cmake g++ pkg-config unzip rbenv
yarn global add typescript vscode-langservers-extracted typescript-language-server dockerfile-language-server-nodejs vim-language-server yaml-language-server @volar/vue-language-server

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
