return {
  -- tokyonight
  {
    "folke/tokyonight.nvim",
    lazy = false,
    priority = 1000,
    opts = { style = "moon" },
    config = function(_, opts)
      -- require("tokyonight").setup(opts)
      -- vim.cmd.colorscheme("tokyonight")
    end,
  },
  {
    "edeneast/nightfox.nvim",
    lazy = false,
    priority = 1000,
    config = function(_, opts)
      -- vim.cmd.colorscheme("duskfox")
      -- vim.cmd.colorscheme("dayfox")
    end,
  },
  {
    "Shatur/neovim-ayu",
    lazy = false,
    priority = 1000,
    config = function(_, opts)
      require('ayu').setup({
          mirage = false, -- Set to `true` to use `mirage` variant instead of `dark` for dark background.
      })
      vim.cmd.colorscheme("ayu")
    end,
  },
}
