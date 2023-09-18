local function augroup(name)
  return vim.api.nvim_create_augroup("lazyvim_" .. name, { clear = true })
end

return {
  -- lspconfig
  {
    "neovim/nvim-lspconfig",
    event = { "BufReadPre", "BufNewFile" },
    dependencies = {
      { "folke/neoconf.nvim", cmd = "Neoconf", config = false, dependencies = { "nvim-lspconfig" } },
      { "folke/neodev.nvim",  opts = { experimental = { pathStrict = true } } },
      "mason.nvim",
      "williamboman/mason-lspconfig.nvim",
      { "hrsh7th/cmp-nvim-lsp" },
    },
    ---@class PluginLspOpts
    opts = {
      capabilities = {
      },
      -- options for vim.diagnostic.config()
      diagnostics = {
        underline = true,
        update_in_insert = false,
        virtual_text = {
          spacing = 4,
          source = "if_many",
          prefix = "●",
          -- this will set set the prefix to a function that returns the diagnostics icon based on the severity
          -- this only works on a recent 0.10.0 build. Will be set to "●" when not supported
          -- prefix = "icons",
        },
        severity_sort = true,
      },
      -- Enable this to enable the builtin LSP inlay hints on Neovim >= 0.10.0
      -- Be aware that you also will need to properly configure your LSP server to
      -- provide the inlay hints.
      inlay_hints = {
        enabled = true
      },
      -- Automatically format on save
      autoformat = true,
      -- options for vim.lsp.buf.format
      -- `bufnr` and `filter` is handled by the LazyVim formatter,
      -- but can be also overridden when specified
      format = {
        formatting_options = nil,
        timeout_ms = nil,
      },
      -- LSP Server Settings
      ---@type lspconfig.options
      servers = {
        lua_ls = {},
        -- tsserver = {},
        -- eslint = {},
        html = {},
        cssls = {},
        solargraph = {},
        -- ruby_ls = {},
        astro = {},
        ansiblels = {},
        tailwindcss = {},
        jsonls = {},
        bashls = {},
        vimls = {},
        yamlls = {},
        clangd = {},
        gopls = {},
        rust_analyzer = {},
        dockerls = {},
        -- docker_compose_language_service = {},
        sorbet = {
          cmd = { 'srb', 'tc', '--lsp', '--disable-watchman' },
        },
        volar = {
          filetypes = { 'typescript', 'javascript', 'javascriptreact', 'typescriptreact', 'vue', 'json' },
        },
        svelte = {},
      },
      -- you can do any additional lsp server setup here
      -- return true if you don't want this server to be setup with lspconfig
      ---@type table<string, fun(server:string, opts:_.lspconfig.options):boolean?>
      setup = {
        -- example to setup with typescript.nvim
        -- tsserver = function(_, opts)
        --   require("typescript").setup({ server = opts })
        --   return true
        -- end,
        -- Specify * to use this function as a fallback for any server
        -- ["*"] = function(server, opts) end,
        gopls = function(_, opts)
          -- workaround for gopls not supporting semanticTokensProvider
          -- https://github.com/golang/go/issues/54531#issuecomment-1464982242
          require("util").on_attach(function(client, _)
            if client.name == "gopls" then
              if not client.server_capabilities.semanticTokensProvider then
                local semantic = client.config.capabilities.textDocument.semanticTokens
                client.server_capabilities.semanticTokensProvider = {
                  full = true,
                  legend = {
                    tokenTypes = semantic.tokenTypes,
                    tokenModifiers = semantic.tokenModifiers,
                  },
                  range = true,
                }
              end
            end
          end)
          -- end workaround
        end,
      },
    },
    ---@param opts PluginLspOpts
    config = function(_, opts)
      local Util = require("util")

      if Util.has("neoconf.nvim") then
        local plugin = require("lazy.core.config").spec.plugins["neoconf.nvim"]
        require("neoconf").setup(require("lazy.core.plugin").values(plugin, "opts", false))
      end

      -- setup autoformat
      require("plugins.lsp.format").setup(opts)

      Util.on_attach(function(client, buffer)
        require("plugins.lsp.keymaps").on_attach(client, buffer)
      end)

      local inlay_hint = vim.lsp.buf.inlay_hint or vim.lsp.inlay_hint

      if opts.inlay_hints.enabled and inlay_hint then
        Util.on_attach(function(client, buffer)
          if client.supports_method('textDocument/inlayHint') then
            local group = augroup(("LspInlayHints%d"):format(buffer))

            vim.api.nvim_create_autocmd("InsertEnter", {
              group = group,
              buffer = buffer,
              callback = function()
                inlay_hint(buffer, false)
              end,
            })

            vim.api.nvim_create_autocmd("InsertLeave", {
              group = group,
              buffer = buffer,
              callback = function()
                inlay_hint(buffer, true)
              end,
            })

            inlay_hint(buffer, true)
          end
        end)
      end

      vim.diagnostic.config(vim.deepcopy(opts.diagnostics))

      local servers = opts.servers
      local has_cmp, cmp_nvim_lsp = pcall(require, "cmp_nvim_lsp")
      local capabilities = vim.tbl_deep_extend(
        "force",
        {},
        vim.lsp.protocol.make_client_capabilities(),
        has_cmp and cmp_nvim_lsp.default_capabilities() or {},
        opts.capabilities or {}
      )

      local function setup(server)
        local server_opts = vim.tbl_deep_extend("force", {
          capabilities = vim.deepcopy(capabilities),
        }, servers[server] or {})

        if opts.setup[server] then
          if opts.setup[server](server, server_opts) then
            return
          end
        elseif opts.setup["*"] then
          if opts.setup["*"](server, server_opts) then
            return
          end
        end
        require("lspconfig")[server].setup(server_opts)
      end

      -- get all the servers that are available thourgh mason-lspconfig
      local have_mason, mlsp = pcall(require, "mason-lspconfig")
      local all_mslp_servers = {}
      if have_mason then
        all_mslp_servers = vim.tbl_keys(require("mason-lspconfig.mappings.server").lspconfig_to_package)
      end

      local ensure_installed = {} ---@type string[]
      for server, server_opts in pairs(servers) do
        if server_opts then
          server_opts = server_opts == true and {} or server_opts
          -- run manual setup if mason=false or if this is a server that cannot be installed with mason-lspconfig
          if server_opts.mason == false or not vim.tbl_contains(all_mslp_servers, server) then
            setup(server)
          else
            ensure_installed[#ensure_installed + 1] = server
          end
        end
      end

      if have_mason then
        mlsp.setup({ ensure_installed = ensure_installed, handlers = { setup } })
      end
    end,
  },

  -- formatters
  {
    "jose-elias-alvarez/null-ls.nvim",
    event = { "BufReadPre", "BufNewFile" },
    dependencies = { "mason.nvim" },
    opts = function()
      local null_ls = require("null-ls")

      return {
        root_dir = require("null-ls.utils").root_pattern(".null-ls-root", ".neoconf.json", "Makefile", ".git"),
        sources = {
          null_ls.builtins.formatting.jq,
          null_ls.builtins.formatting.trim_whitespace,
          null_ls.builtins.formatting.terraform_fmt,
          null_ls.builtins.code_actions.eslint,
          null_ls.builtins.code_actions.gomodifytags,
          null_ls.builtins.code_actions.impl,
          null_ls.builtins.diagnostics.shellcheck,
          null_ls.builtins.diagnostics.rubocop,
          null_ls.builtins.diagnostics.eslint,
          null_ls.builtins.diagnostics.ansiblelint,
          null_ls.builtins.diagnostics.luacheck,
          null_ls.builtins.diagnostics.terraform_validate,
          null_ls.builtins.diagnostics.hadolint,
        },
      }
    end,
  },

  -- cmdline tools and lsp servers
  {
    "williamboman/mason.nvim",
    cmd = "Mason",
    build = ":MasonUpdate",
    keys = { { "<leader>cm", "<cmd>Mason<cr>", desc = "Mason" } },
    config = function(_, opts)
      require("mason").setup(opts)
    end,
  },
  -- bridges mason.nvim with the null-ls plugin
  {
      "jay-babu/mason-null-ls.nvim",
      event = { "BufReadPre", "BufNewFile" },
      dependencies = {
        "williamboman/mason.nvim",
        "jose-elias-alvarez/null-ls.nvim",
      },
      opts = {
        ensure_installed = nil,
        automatic_installation = true,
        automatic_setup = false,
      },
  },
  {
    'DNLHC/glance.nvim',
    opts = {
      preview_win_opts = { relativenumber = false },
      theme = { enable = true, mode = 'darken' },
    },
  },
  {
    'kosayoda/nvim-lightbulb',
    event = 'LspAttach',
    opts = {
      autocmd = { enabled = true },
      sign = { enabled = false },
      float = { enabled = true, win_opts = { border = 'none' } },
    },
  },
}
