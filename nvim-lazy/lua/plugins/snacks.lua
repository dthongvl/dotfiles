return {
  "folke/snacks.nvim",
  opts = {
    picker = {
      sources = {
        explorer = {
          -- This ensures hidden files are always visible in the explorer
          hidden = true,
          layout = { layout = { position = "right" } },
          -- Optional: you can also ignore patterns here if needed
          -- ignored = { ".git" },
        },
      },
    },
  },
}
