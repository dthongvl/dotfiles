return {
  -- tokyonight
  -- {
  --   "folke/tokyonight.nvim",
  --   lazy = false,
  --   priority = 1000,
  --   opts = { style = "night" },
  --   config = function(_, opts)
  --     require("tokyonight").setup(opts)
  --     vim.cmd.colorscheme("tokyonight")
  --   end,
  -- },
  -- {
  --   "sainnhe/everforest",
  --   lazy = false,
  --   priority = 1000,
  --   config = function(_, opts)
  --     vim.opt.background = 'dark'
  --     vim.g.everforest_background = 'medium'
  --     vim.cmd.colorscheme("everforest")
  --   end,
  -- },
  {
    "catppuccin/nvim",
    name = "catppuccin",
    lazy = false,
    priority = 1000,
    config = function(_, opts)
      vim.cmd.colorscheme("catppuccin-frappe")
    end,
  },
  -- {
  --   "projekt0n/github-nvim-theme",
  --   lazy = false,
  --   priority = 1000,
  --   config = function(_, opts)
  --     require('github-theme').setup(opts)
  --     vim.cmd.colorscheme("github_dark_tritanopia")
  --   end,
  -- },
  -- {
  --     'Verf/deepwhite.nvim',
  --     lazy = false,
  --     priority = 1000,
  --     config = function(_, opts)
  --       vim.cmd.colorscheme("deepwhite")
  --     end,
  -- },
  -- {
  --     'oxfist/night-owl.nvim',
  --     lazy = false,
  --     priority = 1000,
  --     config = function(_, opts)
  --       vim.cmd.colorscheme("night-owl")
  --     end,
  -- },
  -- {
  --   "edeneast/nightfox.nvim",
  --   lazy = false,
  --   priority = 1000,
  --   config = function(_, opts)
  --     vim.cmd.colorscheme("duskfox")
  --     -- vim.cmd.colorscheme("dayfox")
  --   end,
  -- },
  -- {
  --   "Shatur/neovim-ayu",
  --   lazy = false,
  --   priority = 1000,
  --   config = function(_, opts)
  --     require('ayu').setup({
  --         mirage = false, -- Set to `true` to use `mirage` variant instead of `dark` for dark background.
  --     })
  --     vim.cmd.colorscheme("ayu")
  --   end,
  -- },
}
