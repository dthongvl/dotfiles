abbr -a e nvim
abbr -a o xdg-open
abbr -a g git
abbr -a gco 'git checkout'
abbr -a gcom 'git checkout master'
abbr -a ga 'git add -p'
abbr -a gs 'git status'
abbr -a gd 'git diff'
abbr -a gcm 'git commit -m "'

set -x ORACLE_HOME /opt/oracle/
set -x LD_LIBRARY_PATH /opt/oracle/instantclient

set -gx PATH $PATH $HOME/.rbenv/bin (yarn global bin) /usr/local/go/bin $HOME/.local/bin $HOME/.cargo/bin $HOME/workspace/diff-so-fancy
set fish_greeting 'No Sana No Life'

status --is-interactive; and rbenv init - | source

if test -f /home/dthongvl/.autojump/share/autojump/autojump.fish; . /home/dthongvl/.autojump/share/autojump/autojump.fish; end
