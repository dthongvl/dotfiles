local map = vim.api.nvim_set_keymap

require('bufferline').setup {
  options = {
    offsets = { { filetype = "NvimTree", text = "NvimTree" } },
    numbers = 'ordinal',
    show_buffer_close_icons = false,
    show_buffer_icons = false,
    show_close_icon = false,
  },
  highlights = {
    fill = {
      guibg = "#232936",
    },
    buffer_selected = {
      guifg = '#1b202a',
      guibg = '#608cc3',
    },
  }
}

map('', '<leader>1', ':BufferLineGoToBuffer 1<CR>', { noremap = true, silent = true })
map('', '<leader>2', ':BufferLineGoToBuffer 2<CR>', { noremap = true, silent = true })
map('', '<leader>3', ':BufferLineGoToBuffer 3<CR>', { noremap = true, silent = true })
map('', '<leader>4', ':BufferLineGoToBuffer 4<CR>', { noremap = true, silent = true })
map('', '<leader>5', ':BufferLineGoToBuffer 5<CR>', { noremap = true, silent = true })
map('', '<leader>6', ':BufferLineGoToBuffer 6<CR>', { noremap = true, silent = true })
map('', '<leader>7', ':BufferLineGoToBuffer 7<CR>', { noremap = true, silent = true })
map('', '<leader>8', ':BufferLineGoToBuffer 8<CR>', { noremap = true, silent = true })
map('', '<leader>9', ':BufferLineGoToBuffer 9<CR>', { noremap = true, silent = true })

map('', '<C-]>', ':BufferLineCycleNext<CR>', { noremap = true, silent = true })
map('', '<C-[>', ':BufferLineCyclePrev<CR>', { noremap = true, silent = true })
