return {
  'folke/snacks.nvim',
  priority = 1000,
  lazy = false,
  keys = {
    { '<leader>e', function() Snacks.explorer() end, desc = '[E]xplorer' },
    { '<C-p>', function() Snacks.picker.files() end, desc = '[F]iles' },
    { '<leader>/', function() Snacks.picker.grep() end, desc = '[G]rep live' },
    { '<leader>gg', function() Snacks.lazygit() end, desc = 'Lazy[g]it' },
  },
  config = function()
    require('snacks').setup({
      bigfile = { enabled = true },
      input = { enabled = true },
      quickfile = { enabled = true },
      statuscolumn = { enabled = true },
      words = { enabled = true },
      explorer = { enabled = true, trash = true },
      indent = {
        indent = {
          enabled = true,
          only_scope = true,
          only_current = true,
        },
        animate = {
          enabled = false,
        },
        scope = {
          enabled = false,
        },
      },
    })
  end
}
