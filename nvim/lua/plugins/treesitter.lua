return {
  {
    "nvim-treesitter/nvim-treesitter",
    branch = "main",
    version = false, -- last release is way too old and doesn't work on Windows
    build = function()
      local TS = require("nvim-treesitter")
      if not TS.get_installed then
        vim.notify("Please restart Neovim and run `:TSUpdate` to use the `nvim-treesitter` **main** branch.")
        return
      end
      require("util").treesitter.ensure_treesitter_cli(function()
        TS.update(nil, { summary = true })
      end)
    end,
    event = { "BufReadPost", "BufNewFile" },
    cmd = { "TSUpdate", "TSInstall", "TSLog", "TSUninstall" },
    keys = {
      { "<c-space>", desc = "Increment selection" },
      { "<bs>",      desc = "Decrement selection", mode = "x" },
    },
    opts = {
      auto_install = true,
      highlight = {
        enable = true,
      },
      folds = {
        enable = true,
      },
      indent = {
        enable = true,
        disable = { "python" },
      },
      autopairs = {
        enable = true,
      },
      endwise = {
        enable = true,
      },
      autotag = {
        enable = true,
      },
      ensure_installed = {
        'astro',
        'bash',
        'c',
        'comment',
        'cpp',
        'css',
        'dockerfile',
        'fish',
        'git_config',
        'git_rebase',
        'gitattributes',
        'gitcommit',
        'gitignore',
        'go',
        'gomod',
        'gosum',
        'gowork',
        'html',
        'javascript',
        'jsdoc',
        'json',
        'json5',
        'jsonc',
        'lua',
        'luadoc',
        'markdown',
        'markdown_inline',
        'python',
        'regex',
        'ron',
        'ruby',
        'rust',
        'scss',
        'sql',
        'svelte',
        'terraform',
        'hcl',
        'toml',
        'tsx',
        'typescript',
        'vim',
        'vimdoc',
        'vue',
        'xml',
        'yaml',
        'zig',
      },
    },
    ---@param opts lazyvim.TSConfig
    config = function(_, opts)
      local TS = require("nvim-treesitter")
      local Util = require("util")

      setmetatable(require("nvim-treesitter.install"), {
        __newindex = function(_, k)
          if k == "compilers" then
            vim.schedule(function()
              vim.notify({
                "Setting custom compilers for `nvim-treesitter` is no longer supported.",
                "",
                "For more info, see:",
                "- [compilers](https://docs.rs/cc/latest/cc/#compile-time-requirements)",
              })
            end)
          end
        end,
      })

      -- some quick sanity checks
      if not TS.get_installed then
        return vim.notify("Please use `:Lazy` and update `nvim-treesitter`")
      elseif type(opts.ensure_installed) ~= "table" then
        return vim.notify("`nvim-treesitter` opts.ensure_installed must be a table")
      end

      -- setup treesitter
      TS.setup(opts)
      Util.treesitter.get_installed(true) -- initialize the installed langs

      -- install missing parsers
      local install = vim.tbl_filter(function(lang)
        return not Util.treesitter.have(lang)
      end, opts.ensure_installed or {})
      if #install > 0 then
        Util.treesitter.ensure_treesitter_cli(function()
          TS.install(install, { summary = true }):await(function()
            Util.treesitter.get_installed(true) -- refresh the installed langs
          end)
        end)
      end

      vim.api.nvim_create_autocmd("FileType", {
        group = vim.api.nvim_create_augroup("lazyvim_treesitter", { clear = true }),
        callback = function(ev)
          if not Util.treesitter.have(ev.match) then
            return
          end

          -- highlighting
          if vim.tbl_get(opts, "highlight", "enable") ~= false then
            pcall(vim.treesitter.start)
          end

          -- indents
          if vim.tbl_get(opts, "indent", "enable") ~= false and Util.treesitter.have(ev.match, "indents") then
            vim.api.nvim_set_option_value("indentexpr", "v:lua.require('util').treesitter.indentexpr()", { scope = "local" })
          end

          -- folds
          if vim.tbl_get(opts, "folds", "enable") ~= false and Util.treesitter.have(ev.match, "folds") then
            vim.api.nvim_set_option_value("foldmethod", "expr", { scope = "local" })
            vim.api.nvim_set_option_value("foldexpr", "v:lua.require('util').treesitter.foldexpr()", { scope = "local" })
          end
        end,
      })
    end,
  },
  {
    "nvim-treesitter/nvim-treesitter-textobjects",
    branch = "main",
    event = "VeryLazy",
    opts = {
      move = {
        enable = true,
        set_jumps = true, -- whether to set jumps in the jumplist
        -- LazyVim extention to create buffer-local keymaps
        keys = {
          goto_next_start = { ["]f"] = "@function.outer", ["]c"] = "@class.outer", ["]a"] = "@parameter.inner" },
          goto_next_end = { ["]F"] = "@function.outer", ["]C"] = "@class.outer", ["]A"] = "@parameter.inner" },
          goto_previous_start = { ["[f"] = "@function.outer", ["[c"] = "@class.outer", ["[a"] = "@parameter.inner" },
          goto_previous_end = { ["[F"] = "@function.outer", ["[C"] = "@class.outer", ["[A"] = "@parameter.inner" },
        },
      },
    },
    config = function(_, opts)
      local TS = require("nvim-treesitter-textobjects")
      if not TS.setup then
        vim.notify("Please use `:Lazy` and update `nvim-treesitter`")
        return
      end
      TS.setup(opts)

      vim.api.nvim_create_autocmd("FileType", {
        group = vim.api.nvim_create_augroup("lazyvim_treesitter_textobjects", { clear = true }),
        callback = function(ev)
          if not (vim.tbl_get(opts, "move", "enable") and require("util").treesitter.have(ev.match, "textobjects")) then
            return
          end
          ---@type table<string, table<string, string>>
          local moves = vim.tbl_get(opts, "move", "keys") or {}

          for method, keymaps in pairs(moves) do
            for key, query in pairs(keymaps) do
              local desc = query:gsub("@", ""):gsub("%..*", "")
              desc = desc:sub(1, 1):upper() .. desc:sub(2)
              desc = (key:sub(1, 1) == "[" and "Prev " or "Next ") .. desc
              desc = desc .. (key:sub(2, 2) == key:sub(2, 2):upper() and " End" or " Start")
              if not (vim.wo.diff and key:find("[cC]")) then
                vim.keymap.set({ "n", "x", "o" }, key, function()
                  require("nvim-treesitter-textobjects.move")[method](query, "textobjects")
                end, {
                  buffer = ev.buf,
                  desc = desc,
                  silent = true,
                })
              end
            end
          end
        end,
      })
    end,
  },
  -- comments
  {
    "folke/ts-comments.nvim",
    event = "VeryLazy",
    opts = {},
  },
  {
    "windwp/nvim-ts-autotag",
    event = "InsertEnter",
    dependencies = { 'nvim-treesitter/nvim-treesitter' },
  },
}
