local map = vim.api.nvim_set_keymap

require'nvim-tree'.setup {
  renderer = {
    highlight_git = true,
    icons = {
      show = {
        git = false,
        folder = true,
        file = true,
        folder_arrow = false,
      },
    },
  },
  git = {
    ignore = true,
  },
}

map('n', '<leader>n', ':NvimTreeToggle<CR>', {})
map('n', '<leader>f', ':NvimTreeFindFile<CR>', {})
