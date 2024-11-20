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
  -- {
  --   'ribru17/bamboo.nvim',
  --   lazy = false,
  --   priority = 1000,
  --   config = function()
  --     require('bamboo').setup {
  --       -- optional configuration here
  --     }
  --     require('bamboo').load()
  --
  --     vim.cmd.colorscheme("bamboo")
  --   end,
  -- },
  {
    "catppuccin/nvim",
    name = "catppuccin",
    lazy = false,
    priority = 1000,
    opts = {
      integrations = {
        -- aerial = true,
        -- alpha = true,
        cmp = true,
        -- dashboard = true,
        flash = true,
        grug_far = true,
        gitsigns = true,
        -- headlines = true,
        illuminate = true,
        indent_blankline = { enabled = true },
        -- leap = true,
        -- lsp_trouble = true,
        mason = true,
        markdown = true,
        -- mini = true,
        native_lsp = {
          enabled = true,
          underlines = {
            errors = { "undercurl" },
            hints = { "undercurl" },
            warnings = { "undercurl" },
            information = { "undercurl" },
          },
        },
        -- navic = { enabled = true, custom_bg = "lualine" },
        neotest = true,
        neotree = true,
        noice = true,
        notify = true,
        semantic_tokens = true,
        telescope = true,
        treesitter = true,
        treesitter_context = true,
        -- which_key = true,
      },
    },
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
  --     vim.cmd.colorscheme("github_dark_high_contrast")
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
  --         mirage = true, -- Set to `true` to use `mirage` variant instead of `dark` for dark background.
  --     })
  --     vim.cmd.colorscheme("ayu")
  --   end,
  -- },
  -- {
  --   'jesseleite/nvim-noirbuddy',
  --   dependencies = {
  --     { 'tjdevries/colorbuddy.nvim' }
  --   },
  --   lazy = false,
  --   priority = 1000,
  --   opts = {
  --     -- All of your `setup(opts)` will go here
  --   },
  -- }
}
