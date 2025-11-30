return {
  'nvim-mini/mini.nvim',
  event = { 'VeryLazy' },
  config = function()
    require('mini.icons').setup()
    MiniIcons.mock_nvim_web_devicons()

    require('mini.statusline').setup()
    require('mini.splitjoin').setup()
    require('mini.pairs').setup()
    require('mini.comment').setup()
    require('mini.surround').setup()
  end
}
