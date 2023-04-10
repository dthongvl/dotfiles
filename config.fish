abbr -a e nvim
abbr -a o xdg-open
abbr -a g git
abbr -a gc 'git checkout'
abbr -a gcom 'git checkout master'
abbr -a ga 'git add -p'
abbr -a gs 'git status'
abbr -a gd 'git diff'
abbr -a gcm 'git commit -m "'
abbr -a ber 'bundle exec rspec'

set -x ORACLE_HOME /opt/oracle/
set -x LD_LIBRARY_PATH /opt/oracle/instantclient
set -x TERM xterm-256color
set -x EDITOR nvim

set -gx PATH $PATH (yarn global bin) $HOME/.local/bin $HOME/.cargo/bin $HOME/workspace/diff-so-fancy
set fish_greeting 'No Sana No Life'

source ~/.asdf/asdf.fish

if test -f $HOME/.config/fish/nightfox.fish; . $HOME/.config/fish/nightfox.fish; end
