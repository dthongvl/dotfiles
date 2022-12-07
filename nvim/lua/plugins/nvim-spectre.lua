local map = vim.api.nvim_set_keymap

require('spectre').setup({
  mapping = {
    -- workaround for my keymap for close buffer
    ['send_to_qf'] = {
      map = "<leader>qf",
      cmd = "<cmd>lua require('spectre.actions').send_to_qf()<CR>",
      desc = "send all item to quickfix"
    }
  }
})

map('n', '<leader>S', [[<Cmd>lua require('spectre').open()<CR>]], { noremap = true })
map('n', '<leader>sw', [[<Cmd>lua require('spectre').open_visual({select_word=true})<CR>]], { noremap = true })
map('v', '<leader>s', [[<Cmd>lua require('spectre').open_visual()<CR>]], { noremap = true })
