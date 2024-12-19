return {
  {
    "echasnovski/mini.surround",
    version = "*",
    event = "VeryLazy",
    enabled = true,
    opts = {
      n_lines = 100,
      mappings = {
        add = "ys", -- Add surrounding in Normal and Visual modes
        delete = "ds", -- Delete surrounding
        find = "sf", -- Find surrounding (to the right)
        find_left = "sF", -- Find surrounding (to the left)
        highlight = "sh", -- Highlight surrounding
        replace = "cs", -- Replace surrounding
        update_n_lines = "sn", -- Update `n_lines`
        suffix_last = "l", -- Suffix to search with "prev" method
        suffix_next = "n", -- Suffix to search with "next" method
      },
      custom_surroundings = {
        t = {
          input = { "<(%w-)%f[^<%w][^<>]->.-</%1>", "^<.->().*()</[^/]->$" }, -- from https://github.com/echasnovski/mini.surround/blob/14f418209ecf52d1a8de9d091eb6bd63c31a4e01/lua/mini/surround.lua#LL1048C13-L1048C72
          output = function()
            local emmet = require("mini.surround").user_input("Emmet")
            if not emmet then
              return nil
            end
            return require("util.emmet").totag(emmet)
          end,
        },
      },
    },
    config = function(_, opts)
      require("mini.surround").setup(opts)
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
  -- autopairs
  {
    "windwp/nvim-autopairs",
    enabled = false,
    event = "InsertEnter",
    opts = {
      check_ts = true,
      fast_wrap = { map = '<c-e>' },
      ts_config = {
        lua = { 'string' },
        dart = { 'string' },
        javascript = { 'template_string' },
      },
    },
    config = function (_, opts)
      require('nvim-autopairs').setup(opts)
    end
  },
  -- auto pairs
  {
    "echasnovski/mini.pairs",
    event = "VeryLazy",
    opts = {
      modes = { insert = true, command = true, terminal = false },
      -- skip autopair when next character is one of these
      skip_next = [=[[%w%%%'%[%"%.%`%$]]=],
      -- skip autopair when the cursor is inside these treesitter nodes
      skip_ts = { "string" },
      -- skip autopair when next character is closing pair
      -- and there are more closing pairs than opening pairs
      skip_unbalanced = true,
      -- better deal with markdown code blocks
      markdown = true,
    },
    config = function(_, opts)
      require('util').mini.pairs(opts)
    end,
  },
}
