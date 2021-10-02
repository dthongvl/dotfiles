local cmd = vim.api.nvim_command

-- Auto remove trailing spaces
cmd([[autocmd BufWritePre * %s/\s\+$//e]])

-- Return to last edit position when opening files (You want this!)
cmd([[au BufReadPost * if line("'\"") > 1 && line("'\"") <= line("$") | exe "normal! g'\"" | endif]])