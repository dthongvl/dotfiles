local global = vim.g

global.ale_linter_aliases = {
  rspec = { 'ruby' },
  vue = { 'vue', 'javascript' },
}

global.ale_linters = {
  ruby = { 'rubocop' },
  rspec = { 'rubocop' },
  vue = { 'eslint', 'vls' },
}

global.ale_fixers = {
  javascript = { 'eslint' },
  vue = { 'eslint' },
  ruby = { 'rubocop' },
}

global.ale_disable_lsp = true
