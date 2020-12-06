abbr -a e nvim
abbr -a o xdg-open
abbr -a g git
abbr -a gc 'git checkout'
abbr -a ga 'git add -p'
abbr -a gs 'git status'

set -x ORACLE_HOME /opt/oracle/
set -x LD_LIBRARY_PATH /opt/oracle/instantclient
set -x JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64

set -gx PATH $PATH $HOME/.rbenv/bin (yarn global bin) /usr/local/go/bin $HOME/.local/bin $JAVA_HOME/bin
set fish_greeting 'No Sana No Life'

status --is-interactive; and rbenv init - | source
