local function augroup(name)
  return vim.api.nvim_create_augroup("lazyvim_" .. name, { clear = true })
end

return {
	{
		"mason-org/mason.nvim",
    cmd = "Mason",
    build = ":MasonUpdate",
    keys = { { "<leader>cm", "<cmd>Mason<cr>", desc = "Mason" } },
		opts = {
      ensure_installed = {
        'golangci-lint',
        'goimports',
        'gofumpt',
        'markdownlint-cli2',
        'markdown-toc',
        'hadolint',
        'shellcheck',
        'rubocop',
        'tflint',
        'sqlfluff',
      },
    },
	},
  {
    "mason-org/mason-lspconfig.nvim",
    opts = {},
    dependencies = {
      { "mason-org/mason.nvim", opts = {} },
      "neovim/nvim-lspconfig",
    },
  },
  -- lspconfig
  {
    "neovim/nvim-lspconfig",
    event = { "BufReadPre", "BufNewFile", "BufWritePre" },
    dependencies = {
      {
        "folke/neoconf.nvim",
        cmd = "Neoconf",
        config = false,
        dependencies = { "nvim-lspconfig" },
      },
      {
        "folke/neodev.nvim",
        opts = {},
      },
      "yioneko/nvim-vtsls",
    },
    ---@class PluginLspOpts
    opts = function ()
      return {
        -- options for vim.diagnostic.config()
        diagnostics = {
          underline = false,
          update_in_insert = false,
          severity_sort = true,
          virtual_lines = false,
          virtual_text = {
            spacing = 2,
            source = "if_many",
            prefix = "●",
            -- this will set set the prefix to a function that returns the diagnostics icon based on the severity
            -- this only works on a recent 0.10.0 build. Will be set to "●" when not supported
            -- prefix = "icons",
          },
          float = {
            source = 'always',
            border = 'rounded',
          },
          signs = {
            text = {
              [vim.diagnostic.severity.ERROR] = " ",
              [vim.diagnostic.severity.WARN] = " ",
              [vim.diagnostic.severity.HINT] = " ",
              [vim.diagnostic.severity.INFO] = " ",
            },
          },
        },
        -- Enable this to enable the builtin LSP inlay hints on Neovim >= 0.10.0
        -- Be aware that you also will need to properly configure your LSP server to
        -- provide the inlay hints.
        inlay_hints = {
          enabled = true,
          exclude = { "vue" }, -- filetypes for which you don't want to enable inlay hints
        },
        -- Enable this to enable the builtin LSP code lenses on Neovim >= 0.10.0
        -- Be aware that you also will need to properly configure your LSP server to
        -- provide the code lenses.
        codelens = {
          enabled = false,
        },
        -- Enable this to enable the builtin LSP folding on Neovim.
        -- Be aware that you also will need to properly configure your LSP server to
        -- provide the folds.
        folds = {
          enabled = true,
        },
        -- add any global capabilities here
        capabilities = {
          workspace = {
            fileOperations = {
              didRename = true,
              willRename = true,
            },
          },
        },
        -- LSP Server Settings
        ---@type lspconfig.options
        servers = {
          copilot = {
            -- stylua: ignore
            keys = {
              {
                "<M-]>",
                function() vim.lsp.inline_completion.select({ count = 1 }) end,
                desc = "Next Copilot Suggestion",
                mode = { "i", "n" },
              },
              {
                "<M-[>",
                function() vim.lsp.inline_completion.select({ count = -1 }) end,
                desc = "Prev Copilot Suggestion",
                mode = { "i", "n" },
              },
            },
          },
          zls = {},
          terraformls = {},
          taplo = {},
          ruby_lsp = {
            mason = false,
            -- cmd = { vim.fn.expand("~/.asdf/shims/ruby-lsp") },
          },
          rubocop = {},
          lua_ls = {
            settings = {
              Lua = {
                workspace = {
                  checkThirdParty = false,
                },
                codeLens = {
                  enable = true,
                },
                completion = {
                  callSnippet = "Replace",
                },
                doc = {
                  privateName = { "^_" },
                },
                hint = {
                  enable = true,
                  setType = false,
                  paramType = true,
                  paramName = "Disable",
                  semicolon = "Disable",
                  arrayIndex = "Disable",
                },
              },
            },
          },
          ts_ls = {
            enabled = false,
          },
          -- denols = {},
          vtsls = {
            -- explicitly add default filetypes, so that we can extend
            -- them in related extras
            filetypes = {
              "javascript",
              "javascriptreact",
              "javascript.jsx",
              "typescript",
              "typescriptreact",
              "typescript.tsx",
              "vue",
            },
            settings = {
              complete_function_calls = true,
              vtsls = {
                enableMoveToFileCodeAction = true,
                autoUseWorkspaceTsdk = true,
                experimental = {
                  maxInlayHintLength = 30,
                  completion = {
                    enableServerSideFuzzyMatch = true,
                  },
                },
                tsserver = {
                  globalPlugins = {
                    {
                      name = "@vue/typescript-plugin",
                      location = require('util').get_pkg_path("vue-language-server", "/node_modules/@vue/language-server"),
                      languages = { "vue" },
                      configNamespace = "typescript",
                      enableForWorkspaceTypeScriptVersions = true,
                    },
                    {
                      name = "typescript-svelte-plugin",
                      location = require('util').get_pkg_path("svelte-language-server", "/node_modules/typescript-svelte-plugin"),
                      enableForWorkspaceTypeScriptVersions = true,
                    },
                    {
                      name = "@astrojs/ts-plugin",
                      location = require('util').get_pkg_path("astro-language-server", "/node_modules/@astrojs/ts-plugin"),
                      enableForWorkspaceTypeScriptVersions = true,
                    },
                  }
                },
              },
              typescript = {
                updateImportsOnFileMove = { enabled = "always" },
                suggest = {
                  completeFunctionCalls = true,
                },
                inlayHints = {
                  enumMemberValues = { enabled = true },
                  functionLikeReturnTypes = { enabled = true },
                  parameterNames = { enabled = "literals" },
                  parameterTypes = { enabled = true },
                  propertyDeclarationTypes = { enabled = true },
                  variableTypes = { enabled = false },
                },
              },
            },
          },
          eslint = {},
          html = {},
          cssls = {},
          astro = {},
          ansiblels = {},
          marksman = {},
          tailwindcss = {
            filetypes_exclude = { "markdown" },
          },
          jsonls = {},
          bashls = {},
          vimls = {},
          yamlls = {},
          clangd = {
            keys = {
              { "<leader>cR", "<cmd>ClangdSwitchSourceHeader<cr>", desc = "Switch Source/Header (C/C++)" },
            },
            root_dir = function(fname)
              return require("lspconfig.util").root_pattern(
                "Makefile",
                "configure.ac",
                "configure.in",
                "config.h.in",
                "meson.build",
                "meson_options.txt",
                "build.ninja"
              )(fname) or require("lspconfig.util").root_pattern("compile_commands.json", "compile_flags.txt")(
                fname
              ) or require("lspconfig.util").find_git_ancestor(fname)
            end,
            capabilities = {
              offsetEncoding = { "utf-16" },
            },
            cmd = {
              "clangd",
              "--background-index",
              "--clang-tidy",
              "--header-insertion=iwyu",
              "--completion-style=detailed",
              "--function-arg-placeholders",
              "--fallback-style=llvm",
            },
            init_options = {
              usePlaceholders = true,
              completeUnimported = true,
              clangdFileStatus = true,
            },
          },
          gopls = {
            settings = {
              gopls = {
                gofumpt = true,
                codelenses = {
                  gc_details = false,
                  generate = true,
                  regenerate_cgo = true,
                  run_govulncheck = true,
                  test = true,
                  tidy = true,
                  upgrade_dependency = true,
                  vendor = true,
                },
                hints = {
                  assignVariableTypes = true,
                  compositeLiteralFields = true,
                  compositeLiteralTypes = true,
                  constantValues = true,
                  functionTypeParameters = true,
                  parameterNames = true,
                  rangeVariableTypes = true,
                },
                analyses = {
                  fieldalignment = true,
                  nilness = true,
                  unusedparams = true,
                  unusedwrite = true,
                  useany = true,
                },
                usePlaceholders = true,
                completeUnimported = true,
                staticcheck = true,
                directoryFilters = { "-.git", "-.vscode", "-.idea", "-.vscode-test", "-node_modules" },
                semanticTokens = true,
              },
            },
          },
          rust_analyzer = { enabled = false },
          dockerls = {},
          -- docker_compose_language_service = {},
          sorbet = {
            cmd = { 'srb', 'tc', '--lsp', '--disable-watchman' },
          },
          vue_ls = {},
          svelte = {},
        },
        -- you can do any additional lsp server setup here
        -- return true if you don't want this server to be setup with lspconfig
        ---@type table<string, fun(server:string, opts:_.lspconfig.options):boolean?>
        setup = {
          copilot = function()
            vim.schedule(function()
              vim.lsp.inline_completion.enable()
            end)
            -- Accept inline suggestions or next edits
            require("util").cmp.actions.ai_accept = function()
              return vim.lsp.inline_completion.get()
            end
          end,
          -- example to setup with typescript.nvim
          -- tsserver = function(_, opts)
          --   require("tsserver").setup({ server = opts })
          --   return true
          -- end,
          -- Specify * to use this function as a fallback for any server
          -- ["*"] = function(server, opts) end,
          gopls = function(_, opts)
            -- workaround for gopls not supporting semanticTokensProvider
            -- https://github.com/golang/go/issues/54531#issuecomment-1464982242
            require("util").lsp.on_attach(function(client, _)
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
            end, "gopls")
            -- end workaround
          end,
          clangd = function(_, opts)
            local clangd_ext_opts = require("util").opts("clangd_extensions.nvim")
            require("clangd_extensions").setup(vim.tbl_deep_extend("force", clangd_ext_opts or {}, { server = opts }))
            return false
          end,
          tailwindcss = function(_, opts)
            local tw = require("lspconfig.configs.tailwindcss")
            opts.filetypes = opts.filetypes or {}

            -- Add default filetypes
            vim.list_extend(opts.filetypes, tw.default_config.filetypes)

            -- Remove excluded filetypes
            --- @param ft string
            opts.filetypes = vim.tbl_filter(function(ft)
              return not vim.tbl_contains(opts.filetypes_exclude or {}, ft)
            end, opts.filetypes)

            -- Add additional filetypes
            vim.list_extend(opts.filetypes, opts.filetypes_include or {})
          end,
          vtsls = function(_, opts)
            if vim.lsp.config.denols and vim.lsp.config.vtsls then
              ---@param server string
              local resolve = function(server)
                local markers, root_dir = vim.lsp.config[server].root_markers, vim.lsp.config[server].root_dir
                vim.lsp.config(server, {
                  root_dir = function(bufnr, on_dir)
                    local is_deno = vim.fs.root(bufnr, { "deno.json", "deno.jsonc" }) ~= nil
                    if is_deno == (server == "denols") then
                      if root_dir then
                        return root_dir(bufnr, on_dir)
                      elseif type(markers) == "table" then
                        local root = vim.fs.root(bufnr, markers)
                        return root and on_dir(root)
                      end
                    end
                  end,
                })
              end
              resolve("denols")
              resolve("vtsls")
            end
            -- copy typescript settings to javascript
            opts.settings.javascript =
              vim.tbl_deep_extend("force", {}, opts.settings.typescript, opts.settings.javascript or {})
          end,
        },
      }
    end,
    ---@param opts PluginLspOpts
    config = vim.schedule_wrap(function(_, opts)
      local Util = require("util")

      if Util.has("neoconf.nvim") then
        require("neoconf").setup(Util.opts("neoconf.nvim"))
      end

      -- setup keymaps
      Util.lsp.on_attach(function(client, buffer)
        require("plugins.lsp.keymaps").on_attach(client, buffer)
      end)

      Util.lsp.setup()
      Util.lsp.on_dynamic_capability(require("plugins.lsp.keymaps").on_attach)

      -- inlay hints
      if opts.inlay_hints.enabled then
        Util.lsp.on_supports_method("textDocument/inlayHint", function(client, buffer)
          if
            vim.api.nvim_buf_is_valid(buffer)
            and vim.bo[buffer].buftype == ""
            and not vim.tbl_contains(opts.inlay_hints.exclude, vim.bo[buffer].filetype)
          then
            vim.lsp.inlay_hint.enable(true, { bufnr = buffer })
          end
        end)
      end

      -- folds
      if opts.folds.enabled then
        Util.lsp.on_supports_method("textDocument/foldingRange", function(client, buffer)
          vim.api.nvim_set_option_value("foldmethod", "expr", { scope = "local" })
          vim.api.nvim_set_option_value("foldexpr", "v:lua.vim.lsp.foldexpr()", { scope = "local" })
        end)
      end

      -- code lens
      if opts.codelens.enabled and vim.lsp.codelens then
        Util.lsp.on_supports_method("textDocument/codeLens", function(client, buffer)
          vim.lsp.codelens.refresh()
          vim.api.nvim_create_autocmd({ "BufEnter", "CursorHold", "InsertLeave" }, {
            buffer = buffer,
            callback = vim.lsp.codelens.refresh,
          })
        end)
      end

      vim.diagnostic.config(vim.deepcopy(opts.diagnostics))

      if opts.capabilities then
        vim.lsp.config("*", { capabilities = opts.capabilities })
      end

      -- get all the servers that are available through mason-lspconfig
      local have_mason = pcall(require, "mason-lspconfig.nvim")
      local mason_all = have_mason
          and vim.tbl_keys(require("mason-lspconfig.mappings").get_mason_map().lspconfig_to_package)
        or {} --[[ @as string[] ]]
      local mason_exclude = {} ---@type string[]

      ---@return boolean? exclude automatic setup
      local function configure(server)
        local sopts = opts.servers[server]
        sopts = sopts == true and {} or (not sopts) and { enabled = false } or sopts --[[@as lazyvim.lsp.Config]]

        if sopts.enabled == false then
          mason_exclude[#mason_exclude + 1] = server
          return
        end

        local use_mason = sopts.mason ~= false and vim.tbl_contains(mason_all, server)
        local setup = opts.setup[server] or opts.setup["*"]
        if setup and setup(server, sopts) then
          mason_exclude[#mason_exclude + 1] = server
        else
          vim.lsp.config(server, sopts) -- configure the server
          if not use_mason then
            vim.lsp.enable(server)
          end
        end
        return use_mason
      end

      local install = vim.tbl_filter(configure, vim.tbl_keys(opts.servers))
      if have_mason then
        require("mason-lspconfig").setup({
          ensure_installed = vim.list_extend(install, Util.opts("mason-lspconfig.nvim").ensure_installed or {}),
          automatic_enable = { exclude = mason_exclude },
        })
      end
    end),
  },
  -- linters
  {
    'mfussenegger/nvim-lint',
    event = 'BufReadPost',
    opts = {
      -- Event to trigger linters
      events = { "BufWritePost", "BufReadPost", "InsertLeave" },
      linters_by_ft = {
        javascript = { 'eslint' },
        typescript = { 'eslint' },
        vue = { 'eslint' },
        markdown = { 'markdownlint-cli2' },
        go = { 'golangci-lint' },
        ruby = { 'rubocop', 'ruby' },
        dockerfile = { 'hadolint' },
        bash = { 'shellcheck' },
        terraform = { "terraform_validate" },
        tf = { "terraform_validate" },
        sql = { "sqlfluff" },
        mysql = { "sqlfluff" },
        plsql = { "sqlfluff" },
      },
      linters = {},
    },
    config = function(_, opts)
      local M = {}

      local lint = require("lint")
      for name, linter in pairs(opts.linters) do
        if type(linter) == "table" and type(lint.linters[name]) == "table" then
          lint.linters[name] = vim.tbl_deep_extend("force", lint.linters[name], linter)
          if type(linter.prepend_args) == "table" then
            lint.linters[name].args = lint.linters[name].args or {}
            vim.list_extend(lint.linters[name].args, linter.prepend_args)
          end
        else
          lint.linters[name] = linter
        end
      end
      lint.linters_by_ft = opts.linters_by_ft

      function M.debounce(ms, fn)
        local timer = vim.uv.new_timer()
        return function(...)
          local argv = { ... }
          timer:start(ms, 0, function()
            timer:stop()
            vim.schedule_wrap(fn)(unpack(argv))
          end)
        end
      end

      function M.lint()
        -- Use nvim-lint's logic first:
        -- * checks if linters exist for the full filetype first
        -- * otherwise will split filetype by "." and add all those linters
        -- * this differs from conform.nvim which only uses the first filetype that has a formatter
        local names = lint._resolve_linter_by_ft(vim.bo.filetype)

        -- Create a copy of the names table to avoid modifying the original.
        names = vim.list_extend({}, names)

        -- Add fallback linters.
        if #names == 0 then
          vim.list_extend(names, lint.linters_by_ft["_"] or {})
        end

        -- Add global linters.
        vim.list_extend(names, lint.linters_by_ft["*"] or {})

        -- Filter out linters that don't exist or don't match the condition.
        local ctx = { filename = vim.api.nvim_buf_get_name(0) }
        ctx.dirname = vim.fn.fnamemodify(ctx.filename, ":h")
        names = vim.tbl_filter(function(name)
          local linter = lint.linters[name]
          if not linter then
            Util.warn("Linter not found: " .. name, { title = "nvim-lint" })
          end
          return linter and not (type(linter) == "table" and linter.condition and not linter.condition(ctx))
        end, names)

        -- Run linters.
        if #names > 0 then
          lint.try_lint(names)
        end
      end

      vim.api.nvim_create_autocmd(opts.events, {
        group = vim.api.nvim_create_augroup("nvim-lint", { clear = true }),
        callback = M.debounce(100, M.lint),
      })
    end,
  },
  -- formatters
  {
    'stevearc/conform.nvim',
    event = 'BufReadPre',
    opts = {
      formatters = {
        ["markdown-toc"] = {
          condition = function(_, ctx)
            for _, line in ipairs(vim.api.nvim_buf_get_lines(ctx.buf, 0, -1, false)) do
              if line:find("<!%-%- toc %-%->") then
                return true
              end
            end
          end,
        },
        ["markdownlint-cli2"] = {
          condition = function(_, ctx)
            local diag = vim.tbl_filter(function(d)
              return d.source == "markdownlint"
            end, vim.diagnostic.get(ctx.buf))
            return #diag > 0
          end,
        },
      },
      formatters_by_ft = {
        -- lua = { 'stylua' },
        -- javascript = { 'eslint' },
        -- typescript = { 'eslint' },
        -- vue = { 'eslint' },
        -- ruby = { 'rubocop' },
        -- ["markdown"] = { "prettier", "markdownlint-cli2", "markdown-toc" },
        -- ["markdown.mdx"] = { "prettier", "markdownlint-cli2", "markdown-toc" },
        go = { 'goimports', 'gofumpt' },
        astro = { 'prettier' },
        svelte = { 'prettier' },
        hcl = { "packer_fmt" },
        terraform = { "terraform_fmt" },
        tf = { "terraform_fmt" },
        ["terraform-vars"] = { "terraform_fmt" },
        plsql = { 'sqlfluff' },
        mysql = { 'sqlfluff' },
        sql = { 'sqlfluff' },
        -- json = { 'jq' },
        ['_'] = { 'trim_whitespace' },
      },
      format_on_save = function(bufnr)
        -- Disable autoformat on certain filetypes
        -- local ignore_filetypes = { "javascript", "typescript", "vue", "ruby", "markdown", "dockerfile" }
        -- if vim.tbl_contains(ignore_filetypes, vim.bo[bufnr].filetype) then
        --   return
        -- end

        -- Disable with a global or buffer-local variable
        if vim.g.disable_autoformat or vim.b[bufnr].disable_autoformat then
          return
        end

        return { timeout_ms = 500, lsp_fallback = false }
      end,
    },
    config = function(_, opts)
      require('conform').setup(opts)
    end,
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
  {
    "smjonas/inc-rename.nvim",
    config = function()
      require("inc_rename").setup()
    end,
  },
}
