return {
  {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    event = { "BufReadPost", "BufNewFile" },
    cmd = { "TSUpdateSync", "TSUpdate", "TSInstall" },
    dependencies = {
      { "nvim-treesitter/nvim-treesitter-textobjects" },
    },
    keys = {
      { "<c-space>", desc = "Increment selection" },
      { "<bs>",      desc = "Decrement selection", mode = "x" },
    },
    opts = {
      auto_install = true,
      highlight = {
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
        'hcl',
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
        'toml',
        'tsx',
        'typescript',
        'vim',
        'vimdoc',
        'vue',
        'xml',
        'yaml',
      },
      incremental_selection = {
        enable = true,
        keymaps = {
          init_selection = "<C-space>",
          node_incremental = "<C-space>",
          scope_incremental = "<nop>",
          node_decremental = "<bs>",
        },
      },
      textobjects = {
        select = {
          enable = true,
          lookahead = true,
          -- include_surrounding_whitespace = true,
          keymaps = {
            ['af'] = { query = '@function.outer', desc = 'ts: all function' },
            ['if'] = { query = '@function.inner', desc = 'ts: inner function' },
            ['ac'] = { query = '@class.outer', desc = 'ts: all class' },
            ['ic'] = { query = '@class.inner', desc = 'ts: inner class' },
            -- ['aC'] = { query = '@conditional.outer', desc = 'ts: all conditional' },
            -- ['iC'] = { query = '@conditional.inner', desc = 'ts: inner conditional' },
            -- ['aL'] = { query = '@assignment.lhs', desc = 'ts: assignment lhs' },
            -- ['aR'] = { query = '@assignment.rhs', desc = 'ts: assignment rhs' },
          },
        },
        move = {
          enable = true,
          set_jumps = true,
          goto_next_start = { [']m'] = '@function.outer', [']M'] = '@class.outer' },
          goto_previous_start = { ['[m'] = '@function.outer', ['[M'] = '@class.outer' },
        },
      },
    },
    ---@param opts TSConfig
    config = function(_, opts)
      require('nvim-treesitter.configs').setup(opts)
    end,
  },
  -- comments
  {
    "folke/ts-comments.nvim",
    event = "VeryLazy",
    opts = {},
  },
  {
    'nvim-treesitter/playground',
    cmd = { 'TSPlaygroundToggle' },
    dependencies = { 'nvim-treesitter/nvim-treesitter' },
  },
  {
    "windwp/nvim-ts-autotag",
    event = "InsertEnter",
    dependencies = { 'nvim-treesitter/nvim-treesitter' },
  },
  {
    'nvim-treesitter/nvim-treesitter-context',
    event = 'VeryLazy',
    opts = {
      multiline_threshold = 4,
      separator = '─', -- alternatives: ▁ ─ ▄
      mode = 'cursor',
    },
  },
}
