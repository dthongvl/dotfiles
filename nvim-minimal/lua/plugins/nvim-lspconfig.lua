return {
  'neovim/nvim-lspconfig',
  event = { "BufReadPre", "BufNewFile", "BufWritePre" },
  dependencies = {
    "mason.nvim",
    { "mason-org/mason-lspconfig.nvim", config = function() end },
  },
}
