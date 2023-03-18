local servers = {
  "rust_analyzer",
  "gopls",
  "ruby_ls",
  "html",
  "tsserver",
  "cssls",
  "dockerls",
  "astro",
  "eslint",
  "ansiblels",
  "tailwindcss",
  "jsonls",
  "bashls",
  "vimls",
  "yamlls",
  "clangd",
}

require("mason").setup()
-- require("mason-lspconfig").setup {
--   automatic_installation = true,
-- }

local nvim_lsp = require('lspconfig')

local on_attach = function(client, bufnr)
  local map = vim.keymap.set
  local opts = { noremap = true, silent = true }

  map('n', 'gh', vim.lsp.buf.hover, opts)
  map('n', 'gd', vim.lsp.buf.definition, opts)
  map('n', 'gi', vim.lsp.buf.implementation, opts)
  map('n', 'gr', vim.lsp.buf.references, opts)
  map('n', '<leader>rn', vim.lsp.buf.rename, opts)
  map('n', 'gf', function() vim.lsp.buf.format({ async = true }) end, opts)
  map('n', 'ge', vim.diagnostic.open_float, opts)
end

for _, lsp in ipairs(servers) do
  nvim_lsp[lsp].setup { on_attach = on_attach }
end

nvim_lsp.sorbet.setup {
  on_attach = on_attach,
  cmd = { 'srb', 'tc', '--lsp', '--disable-watchman' },
}

nvim_lsp.volar.setup {
  on_attach = on_attach,
  filetypes = {'typescript', 'javascript', 'javascriptreact', 'typescriptreact', 'vue', 'json'},
}
