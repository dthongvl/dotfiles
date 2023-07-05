return {
  -- Add/delete/change surrounding pairs
  {
    "kylechui/nvim-surround",
    event = { "BufEnter", "BufNewFile" },
    config = function ()
      require("nvim-surround").setup()
    end,
  },
  -- Switch between single-line and multiline forms of code
  {
    'Wansmer/treesj',
    dependencies = { 'nvim-treesitter/nvim-treesitter' },
    opts = { use_default_keymaps = false },
    keys = {
      { 'gS', '<Cmd>TSJSplit<CR>', desc = 'split expression to multiple lines' },
      { 'gJ', '<Cmd>TSJJoin<CR>', desc = 'join expression to single line' },
    },
  },
  -- comment
  {
    "numToStr/Comment.nvim",
    event = { "BufEnter", "BufNewFile" },
    dependencies = {
      "JoosepAlviste/nvim-ts-context-commentstring",
    },
    config = function ()
      require("Comment").setup({
        pre_hook = require('ts_context_commentstring.integrations.comment_nvim').create_pre_hook(),
      })
    end
  },
  -- autopairs
  {
    "windwp/nvim-autopairs",
    event = "InsertEnter",
    dependencies = {
      "hrsh7th/nvim-cmp",
    },
    config = function ()
      local autopairs = require('nvim-autopairs')
      local cmp_autopairs = require('nvim-autopairs.completion.cmp')
      require('cmp').event:on('confirm_done', cmp_autopairs.on_confirm_done())
      autopairs.setup({
        close_triple_quotes = true,
        check_ts = true,
        fast_wrap = { map = '<c-e>' },
        ts_config = {
          lua = { 'string' },
          dart = { 'string' },
          javascript = { 'template_string' },
        },
      })
    end
  },
  {
    "windwp/nvim-ts-autotag",
    event = "InsertEnter",
    dependencies = { 'nvim-treesitter/nvim-treesitter' },
  },
  -- for ruby, lua
  {
    "RRethy/nvim-treesitter-endwise",
    event = "InsertEnter",
    dependencies = { 'nvim-treesitter/nvim-treesitter' },
  },
}
