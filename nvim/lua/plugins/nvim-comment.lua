local map = vim.api.nvim_set_keymap

require('nvim_comment').setup({
  hook = function()
    require("ts_context_commentstring.internal").update_commentstring()
  end,
})

map('', '<C-_>', ':CommentToggle<CR>', {})
