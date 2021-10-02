local cmp = require'cmp'
-- local luasnip = require'luasnip'

local feedkey = function(key)
  vim.api.nvim_feedkeys(vim.api.nvim_replace_termcodes(key, true, true, true), "n", true)
end

cmp.setup({
  -- snippet = {
    -- expand = function(args)
      -- if luasnip then
        -- luasnip.lsp_expand(args.body)
      -- end
    -- end,
  -- },
  mapping = {
    ['<Cr>'] = cmp.mapping.confirm {
      behavior = cmp.ConfirmBehavior.Replace,
      select = true,
    },
    ['<Tab>'] = cmp.mapping(function(fallback)
      if vim.fn.pumvisible() == 1 then
        feedkey("<C-n>")
      -- elseif luasnip and luasnip.expand_or_jumpable() then
        -- luasnip.expand_or_jump()
      elseif has_words_before() then
        cmp.complete()
      else
        fallback()
      end
    end, { "i", "s", }),
    ['<S-Tab>'] = cmp.mapping(function(fallback)
      if vim.fn.pumvisible() == 1 then
        feedkey("<C-p>")
      -- elseif luasnip and luasnip.jumpable(-1) then
        -- luasnip.jump(-1)
      else
        fallback()
      end
    end, { "i", "s", }),
  },
  sources = {
    { name = 'nvim_lsp' },
    -- { name = 'luasnip' },
    { name = 'path' },
    { name = 'nvim_lua' },
    { name = 'buffer' }, -- consider to disable on very large buffer
  }
})
