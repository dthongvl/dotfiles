abbr -a e nvim
abbr -a o xdg-open
abbr -a g git
abbr -a gc 'git checkout'
abbr -a gp 'git pull'
abbr -a gm 'git checkout master'
abbr -a ga 'git add -p'
abbr -a gs 'git status'
abbr -a gd 'git diff'
abbr -a gcm 'git commit -m "'
abbr -a ber 'bundle exec rspec'

set -x ORACLE_HOME /opt/oracle/
set -x LD_LIBRARY_PATH /opt/oracle/instantclient
set -x TERM xterm-256color
set -x EDITOR nvim
set -x HELIX_RUNTIME ~/workspace/helix/runtime
set -x PNPM_HOME ~/.local/share/pnpm
set -x ASDF_FORCE_PREPEND yes

fish_add_path (yarn global bin)
fish_add_path $HOME/.local/bin
fish_add_path $HOME/.cargo/bin
fish_add_path $HOME/workspace/diff-so-fancy
fish_add_path $PNPM_HOME

set fish_greeting 'No Sana No Life'

source ~/.asdf/asdf.fish
source ~/.config/fish/private_config.fish
# source ~/.config/fish/themes/kanagawa.fish

fish_config theme choose "Rosé Pine Dawn"
