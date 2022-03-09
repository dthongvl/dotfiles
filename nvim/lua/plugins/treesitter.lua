require'nvim-treesitter.configs'.setup {
  ensure_installed = { "vue", "go", "python", "rust", "ruby", "javascript", "typescript", "c", "cpp", "css", "html", "json" },
  highlight = {
    enable = true,
  },
  context_commentstring = {
    enable = true,
    enable_autocmd = false,
  },
}
