return {
  -- Add/delete/change surrounding pairs
  {
    "kylechui/nvim-surround",
    config = function ()
      require("nvim-surround").setup()
    end,
  },
  -- comment
  {
    "numToStr/Comment.nvim",
    config = function ()
      require("Comment").setup()
    end
  },
  -- autopairs
  {
    "windwp/nvim-autopairs",
    dependencies = {
      "nvim-cmp",
    },
    opts = {
      check_ts = true,
    },
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
