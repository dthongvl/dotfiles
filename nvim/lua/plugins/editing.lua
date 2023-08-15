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
    event = { "BufEnter", "BufNewFile" },
    keys = { '<space>m', '<space>j', '<space>s' },
    dependencies = { 'nvim-treesitter/nvim-treesitter' },
    config = function (_, opts)
      require('treesj').setup(opts)
    end
  },
  -- comment
  {
    "numToStr/Comment.nvim",
    event = { "BufEnter", "BufNewFile" },
    dependencies = {
      "JoosepAlviste/nvim-ts-context-commentstring",
    },
    opts = function (_, opts)
      local ok, integration = pcall(require, 'ts_context_commentstring.integrations.comment_nvim')
      if ok then opts.pre_hook = integration.create_pre_hook() end
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
}
