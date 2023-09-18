return {
  {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    event = { "BufReadPost", "BufNewFile" },
    cmd = { "TSUpdateSync" },
    dependencies = {
      { "nvim-treesitter/nvim-treesitter-textobjects" },
    },
    keys = {
      { "<c-space>", desc = "Increment selection" },
      { "<bs>", desc = "Decrement selection", mode = "x" },
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
      context_commentstring = {
        enable = true,
        enable_autocmd = false,
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
        'comment',
        'fish',
        'c',
        'cpp',
        'css',
        'dockerfile',
        'go',
        'html',
        'typescript',
        'javascript',
        'jsdoc',
        'json',
        'lua',
        'luadoc',
        'markdown',
        'markdown_inline',
        'python',
        'ruby',
        'rust',
        'scss',
        'sql',
        'terraform',
        'hcl',
        'regex',
        'vim',
        'vimdoc',
        'vue',
        'yaml',
        'svelte',
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
    config = function (_, opts)
      require('nvim-treesitter.configs').setup(opts)
    end,
  },
  -- comments
  {
    "JoosepAlviste/nvim-ts-context-commentstring",
    lazy = true,
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
  -- for ruby, lua
  {
    "RRethy/nvim-treesitter-endwise",
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
