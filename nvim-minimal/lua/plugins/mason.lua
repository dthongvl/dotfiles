return {
  "mason-org/mason.nvim",
  build = ":MasonUpdate",
  lazy = false,
  keys = {
    { '<leader>tm', ':Mason<CR>', desc = '[M]ason' },
  },
  opts = {
    ensure_installed = {
      -- 'golangci-lint',
      -- 'goimports',
      -- 'gofumpt',
      -- 'markdownlint-cli2',
      -- 'markdown-toc',
      -- 'hadolint',
      -- 'shellcheck',
      -- 'rubocop',
      -- 'tflint',
      -- 'sqlfluff',
    },
  },
  config = function(_, opts)
    local mason = require("mason")
    local mason_lspconfig = require("mason-lspconfig")

    mason.setup()
    mason_lspconfig.setup({
      ensure_installed = opts.ensure_installed
    });
  end,
  dependencies = {
    "williamboman/mason-lspconfig.nvim",
    "neovim/nvim-lspconfig",
  },
}
