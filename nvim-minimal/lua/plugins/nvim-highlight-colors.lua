return {
  "brenoprata10/nvim-highlight-colors",
  opts = {
    enable_tailwind = true,
  },
  config = function(_, opts)
    require 'nvim-highlight-colors'.setup(opts)
  end,
}
