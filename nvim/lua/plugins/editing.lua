return {
  -- Add/delete/change surrounding pairs
  -- {
  --   "kylechui/nvim-surround",
  --   event = { "BufEnter", "BufNewFile" },
  --   opts = {
  --     surrounds = {
  --       t = {
  --         -- add = wrap_with_abbreviation,
  --         add = function()
  --           local input = vim.fn.input 'Emmet Abbreviation:'
  --
  --           if input then
  --             --- hat_tip to https://github.com/b0o/nvim-conf/blob/363e126f6ae3dff5f190680841e790467a00124d/lua/user/util/wrap.lua#L12
  --             local bufnr = 0
  --             local client = unpack(vim.lsp.get_clients{ bufnr = bufnr, name = 'emmet_language_server' })
  --             if client then
  --               local splitter =  'BENNYSPECIALSECRETSTRING'
  --               local response = client.request_sync('emmet/expandAbbreviation', {
  --                   abbreviation = input,
  --                   language = vim.opt.filetype,
  --                   options = {
  --                     text = splitter,
  --                   },
  --                 }, 50, bufnr)
  --               if response then
  --                 if response.err then
  --                   vim.notify(response.err.message)
  --                 else
  --                   return (vim.split(response.result, splitter))
  --                 end
  --               end
  --             end
  --           end
  --         end,
  --         find = function()
  --           return require 'nvim-surround.config'.get_selection { motion = 'at' }
  --         end,
  --         delete = '^(%b<>)().-(%b<>)()$',
  --         change = {
  --           -- TODO: this is cribbed from the original impl
  --           -- but doesn't yet actually call emmet
  --           target = '^<([^%s<>]*)().-([^/]*)()>$',
  --           replacement = function()
  --             local input = vim.fn.input'New Emmet Abbreviation:'
  --             if input then
  --               local element = input:match '^<?([^%s>]*)'
  --               local attributes = input:match '^<?[^%s>]*%s+(.-)>?$'
  --
  --               local open = attributes and element .. ' ' .. attributes or element
  --               local close = element
  --
  --               return { { open }, { close } }
  --             end
  --           end,
  --         },
  --       },
  --     },
  --   },
  --   config = function (_, opts)
  --     require("nvim-surround").setup(opts)
  --   end,
  -- },
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
    "MeanderingProgrammer/render-markdown.nvim",
    opts = {
      file_types = { "markdown", "norg", "rmd", "org" },
      code = {
        sign = false,
        width = "block",
        right_pad = 1,
      },
      heading = {
        sign = false,
        icons = {},
      },
    },
    ft = { "markdown", "norg", "rmd", "org" },
    enabled = true,
  },
}
