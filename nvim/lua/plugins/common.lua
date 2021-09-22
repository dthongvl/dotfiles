local opt = vim.opt

require'colorizer'.setup()

opt.listchars = {
    eol = "↴",
}

require("indent_blankline").setup {
    show_end_of_line = true,
}
