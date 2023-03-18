return {
  -- Add/delete/change surrounding pairs
  {
    "kylechui/nvim-surround",
    event = { "BufEnter", "BufNewFile" },
    config = function ()
      require("nvim-surround").setup()
    end,
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
    event = { "BufReadPost", "BufNewFile" },
    dependencies = {
      "hrsh7th/nvim-cmp",
    },
    opts = {
      check_ts = true,
    },
  },
  {
    "windwp/nvim-ts-autotag",
    event = { "BufWinEnter", "BufNewFile" },
  },
  {
    "ethanholz/nvim-lastplace",
    event = { "BufWinEnter", "FileType" },
    opts = {
      lastplace_ignore_buftype = { "quickfix", "nofile", "help" },
      lastplace_ignore_filetype = { "gitcommit", "gitrebase", "svn", "hgcommit" },
    },
  },
}
