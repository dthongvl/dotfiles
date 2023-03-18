return {
  -- tokyonight
  {
    "folke/tokyonight.nvim",
    lazy = false,
    priority = 1000,
    opts = { style = "moon" },
    config = function(_, opts)
      require("tokyonight").setup(opts)
      vim.cmd.colorscheme("tokyonight")
    end,
  },
  {
    "cocopon/iceberg.vim",
    lazy = false,
    priority = 1000,
    config = function(_, opts)
      -- vim.opt.background = 'light'
      -- vim.cmd.colorscheme("iceberg")
    end,
  },
}
