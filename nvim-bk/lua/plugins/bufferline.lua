local map = vim.api.nvim_set_keymap

require('bufferline').setup {
  options = {
    offsets = { { filetype = "NvimTree", text = "NvimTree" } },
    numbers = 'ordinal',
    show_buffer_icons = false,
    show_close_icon = false,
  },
  -- highlights = {
  --   fill = {
  --     guibg = "#232936",
  --   },
  --   buffer_selected = {
  --     guifg = '#1b202a',
  --     guibg = '#608cc3',
  --   },
  -- }
}

map('n', '<C-]>', ':BufferLineCycleNext<CR>', { noremap = true, silent = true })
map('n', 'gt', ':BufferLineCycleNext<CR>', { noremap = true, silent = true })
map('n', '<C-[>', ':BufferLineCyclePrev<CR>', { noremap = true, silent = true })
map('n', 'gb', ':BufferLinePick<CR>', { noremap = true, silent = true })
map('', '<leader>tn', ':enew<CR>', { noremap = true, silent = true })
map('', '<leader>tc', ':BufferLineCloseLeft<CR>:BufferLineCloseRight<CR>', { noremap = true, silent = true })
