local function lsp()
  -- ╭──────────────────────────────────────────────────────────╮
  -- │ ⬇️ disable default keybinds                              │
  -- ╰──────────────────────────────────────────────────────────╯
  for _, bind in ipairs({ 'grn', 'gra', 'gri', 'grr', 'grt' }) do
    pcall(vim.keymap.del, 'n', bind)
  end

  -- ╭──────────────────────────────────────────────────────────╮
  -- │ ⬇️ setup lsp attach                                      │
  -- ╰──────────────────────────────────────────────────────────╯

  vim.api.nvim_create_autocmd('LspAttach', {
    group = vim.api.nvim_create_augroup('lsp-attach', { clear = true }),
    callback = function(ev)
      local client = vim.lsp.get_client_by_id(ev.data.client_id)
      if not client then return end

      vim.keymap.set('n', 'gd', vim.lsp.buf.definition, { desc = 'LSP [D]efinition' })
      vim.keymap.set('n', 'gD', vim.lsp.buf.declaration, { desc = 'LSP [D]eclaration' })
      vim.keymap.set('n', 'gr', vim.lsp.buf.references, { nowait = true, desc = 'LSP [R]eferences' })
      vim.keymap.set('n', 'gI', vim.lsp.buf.implementation, { desc = 'LSP [I]mplementation' })
      vim.keymap.set('n', 'gy', vim.lsp.buf.type_definition, { desc = 'LSP T[y]pe Definition' })

      vim.keymap.set('n', 'gh', vim.diagnostic.open_float, { buffer = ev.buf, desc = 'LSP [H]over Diagnostic' })
      vim.keymap.set({ 'n', 'v' }, '<leader>ca', vim.lsp.buf.code_action, { buffer = ev.buf, desc = 'Code [A]ction' })
      vim.keymap.set('n', 'K', function() return vim.lsp.buf.hover() end, { desc = 'Hover' })
      vim.keymap.set('n', 'gK', vim.lsp.buf.signature_help, { buffer = ev.buf, desc = 'Signature [H]elp' })
      vim.keymap.set('n', '<leader>cr', vim.lsp.buf.rename, { buffer = ev.buf, desc = '[R]ename' })

      -- CodeLens support
      if client.supports_method(client, vim.lsp.protocol.Methods.textDocument_codeLens) then
        vim.keymap.set('n', '<leader>cC', vim.lsp.codelens.refresh, { buffer = ev.buf, desc = 'Code[L]ens refresh' })
        vim.keymap.set('n', '<leader>cc', vim.lsp.codelens.run, { buffer = ev.buf, desc = 'Code[L]ens run' })
      end

      -- Inlay hints
      if client.supports_method(client, vim.lsp.protocol.Methods.textDocument_inlayHint) then
        vim.keymap.set(
          'n',
          '<leader>li',
          function() vim.lsp.inlay_hint.enable(not vim.lsp.inlay_hint.is_enabled()) end,
          { desc = 'Toggle [I]nlay hint' }
        )
      end
    end,
  })

  -- ╭──────────────────────────────────────────────────────────╮
  -- │ ⬇️ setup vim.diagnostic.Config                           │
  -- ╰──────────────────────────────────────────────────────────╯

  local diagnostic_opts = {
    signs = {
      text = {
        [vim.diagnostic.severity.ERROR] = ' ',
        [vim.diagnostic.severity.WARN] = ' ',
        [vim.diagnostic.severity.HINT] = ' ',
        [vim.diagnostic.severity.INFO] = ' ',
      },
      numhl = {
        [vim.diagnostic.severity.ERROR] = 'DiagnosticError',
        [vim.diagnostic.severity.WARN] = 'DiagnosticWarn',
        [vim.diagnostic.severity.HINT] = 'DiagnosticHint',
        [vim.diagnostic.severity.INFO] = 'DiagnosticInfo',
      },
    },
    virtual_text = {
      virt_text_pos = 'eol_right_align',
    },
    update_in_insert = false,
    underline = true,
    severity_sort = true,
    float = {
      border = 'rounded',
      header = '',
    },
  }

  vim.diagnostic.config(diagnostic_opts)

  -- ╭──────────────────────────────────────────────────────────╮
  -- │ ⬇️ server specific capabilities                          │
  -- ╰──────────────────────────────────────────────────────────╯

  local capabilities = vim.lsp.protocol.make_client_capabilities()

  local has_blink = require('lazy.core.config').plugins['blink.cmp'] ~= nil
  if has_blink then
    capabilities = vim.tbl_deep_extend('force', capabilities, {
      textDocument = {
        foldingRange = {
          dynamicRegistration = false,
          lineFoldingOnly = true,
        },
      },
    })
  end

  local has_markdown_oxide = vim.fn.executable('markdown-oxide') == 1
  if has_markdown_oxide then
    capabilities = vim.tbl_deep_extend('force', capabilities, {
      workspace = {
        didChangeWatchedFiles = {
          dynamicRegistration = true,
        },
      },
    })
  end

  vim.lsp.config('*', {
    capabilities = capabilities,
  })

  -- ╭──────────────────────────────────────────────────────────╮
  -- │ ⬇️ this is where magic happens                           │
  -- ╰──────────────────────────────────────────────────────────╯

  local servers = {
    'cssls',
    'lua_ls',
    'bashls',
    'yamlls',
    'jsonls',
    'markdown_oxide',
    'taplo',
    'basedpyright',
    'docker_language_server',
  }

  vim.lsp.enable(servers)
end

vim.schedule(lsp)
