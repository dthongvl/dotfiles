vim.api.nvim_create_autocmd('TextYankPost', {
  desc = 'Highlight when yanking (copying) text',
  group = vim.api.nvim_create_augroup('highlight_yanked_text', { clear = true }),
  callback = function() vim.hl.on_yank({ higroup = 'IncSearch', timeout = 300 }) end,
})

vim.api.nvim_create_autocmd('BufReadPost', {
  desc = 'Restore cursor to last edit position',
  group = vim.api.nvim_create_augroup('restore_cursor_position', { clear = true }),
  callback = function(ev)
    local mark = vim.api.nvim_buf_get_mark(ev.buf, '"')
    local lcount = vim.api.nvim_buf_line_count(ev.buf)
    if mark[1] > 0 and mark[1] <= lcount then pcall(vim.api.nvim_win_set_cursor, 0, mark) end
  end,
})

vim.api.nvim_create_autocmd('BufRead', {
  desc = 'Syntax highlight for env files',
  group = vim.api.nvim_create_augroup('dotenv', { clear = true }),
  pattern = { '.env', '.env.*', '.secrets' },
  callback = function() vim.bo.filetype = 'dosini' end,
})
