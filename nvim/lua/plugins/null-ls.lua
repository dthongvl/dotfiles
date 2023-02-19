local null_ls = require("null-ls")
local map = vim.api.nvim_set_keymap

null_ls.setup({
  sources = {
    null_ls.builtins.formatting.eslint,
    null_ls.builtins.formatting.jq, -- json
    null_ls.builtins.formatting.rubocop,
    null_ls.builtins.formatting.rustywind, -- tailwind
    null_ls.builtins.formatting.rustfmt,
    null_ls.builtins.formatting.gofmt,
    null_ls.builtins.code_actions.eslint,
    null_ls.builtins.code_actions.shellcheck,
  },
})

map('n', '<leader>gf', [[<Cmd>lua vim.lsp.buf.format()<CR>]], { noremap = true, silent = true })
