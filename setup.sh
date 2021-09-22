#!/usr/bin/env bash
set -eo pipefail

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
curl -L https://github.com/rust-analyzer/rust-analyzer/releases/latest/download/rust-analyzer-x86_64-unknown-linux-gnu.gz | gunzip -c - > ~/.local/bin/rust-analyzer
chmod +x ~/.local/bin/rust-analyzer
rustup component add rust-src

# Packages
sudo apt install alacritty curl jq ripgrep ninja-build gettext libtool libtool-bin autoconf automake cmake g++ pkg-config unzip rbenv
yarn global add vscode-html-languageserver-bin typescript typescript-language-server vscode-css-languageserver-bin dockerfile-language-server-nodejs vscode-json-languageserver vls vim-language-server yaml-language-server

# Config files
ln -s -f ~/workspace/dotfiles/nvim ~/.config/nvim

ln -s -f ~/workspace/dotfiles/.tmux.conf ~/.tmux.conf

ln -s -f ~/workspace/dotfiles/config.fish ~/.config/fish

ln -s -f ~/workspace/dotfiles/alacritty.yml ~/.config/alacritty/alacritty.yml

# Autojump
git clone https://github.com/wting/autojump ~/workspace/autojump
python3 ~/workspace/autojump/install.py

# Neovim
git clone https://github.com/neovim/neovim ~/workspace/neovim
(cd ~/workspace/neovim && make CMAKE_BUILD_TYPE=RelWithDebInfo -j4 && sudo make install)

# Nodejs
npm install -g yarn
yarn global add n
