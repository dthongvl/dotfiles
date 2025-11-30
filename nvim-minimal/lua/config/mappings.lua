local function map(mode, lhs, rhs, opts)
  opts = opts or {}
  opts.silent = opts.silent ~= false
  vim.keymap.set(mode, lhs, rhs, opts)
end

vim.schedule(function()
  -- better up/down
  map({ "n", "x" }, "j", "v:count == 0 ? 'gj' : 'j'", { expr = true, silent = true })
  map({ "n", "x" }, "k", "v:count == 0 ? 'gk' : 'k'", { expr = true, silent = true })

  -- copy & paste
  map("n", "Y", "y$", { desc = "Copy to end of line" })
  map("v", "<leader>p", "\"_dP", { desc = "Paste replace visual selection without copying it" })
  map('n', '<leader>y', ':%y+<CR>', { desc = '[Y]ank buffer' })

  -- Move to window using the <ctrl> hjkl keys
  map("n", "<C-h>", "<C-w>h", { desc = "Go to left window" })
  map("n", "<C-j>", "<C-w>j", { desc = "Go to lower window" })
  map("n", "<C-k>", "<C-w>k", { desc = "Go to upper window" })
  map("n", "<C-l>", "<C-w>l", { desc = "Go to right window" })

  -- Move Lines
  map("n", "<A-j>", "<cmd>m .+1<cr>==", { desc = "Move down" })
  map("n", "<A-k>", "<cmd>m .-2<cr>==", { desc = "Move up" })
  map("i", "<A-j>", "<esc><cmd>m .+1<cr>==gi", { desc = "Move down" })
  map("i", "<A-k>", "<esc><cmd>m .-2<cr>==gi", { desc = "Move up" })
  map("v", "<A-j>", ":m '>+1<cr>gv=gv", { desc = "Move down" })
  map("v", "<A-k>", ":m '<-2<cr>gv=gv", { desc = "Move up" })

  -- buffers
  map("n", "<S-h>", "<cmd>BufferLineCyclePrev<cr>", { desc = "Prev buffer" })
  map("n", "<S-l>", "<cmd>BufferLineCycleNext<cr>", { desc = "Next buffer" })

  -- Clear search with <esc>
  map({ "i", "n" }, "<esc>", "<cmd>:noh<cr><esc>", { desc = "Escape and clear hlsearch" })

  -- turn the word under cursor to upper case
  map('i', '<C-u>', '<Esc>viwUea', { desc = 'Turn into upper case' })

  -- turn the current word into title case
  map('i', '<C-t>', '<Esc>b~lea', { desc = 'Turn into title case' })

  -- Save file
  map({ "n" }, "<leader>ww", "<cmd>w<cr><esc>", { desc = "Save file" })

  -- Quit
  map("n", "<leader>qq", "<cmd>qa<cr>", { desc = "Quit all" })

  -- Windows
  map("n", "<leader>wd", "<C-W>c", { desc = "Delete window", remap = true })
end)
