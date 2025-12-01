local function get_pkg_path(pkg, path, opts)
	pcall(require, "mason") -- make sure Mason is loaded. Will fail when generating docs
	local root = vim.env.MASON or (vim.fn.stdpath("data") .. "/mason")
	opts = opts or {}
	opts.warn = opts.warn == nil and true or opts.warn
	path = path or ""
	local ret = root .. "/packages/" .. pkg .. "/" .. path
	if opts.warn and not vim.loop.fs_stat(ret) and not require("lazy.core.config").headless() then
		vim.notify(
			("Mason package path not found for **%s**:\n- `%s`\nYou may need to force update the package."):format(
				pkg,
				path
			)
		)
	end
	return ret
end

vim.g.inlay_hints = true

local function lsp()
	-- ╭──────────────────────────────────────────────────────────╮
	-- │ ⬇️ disable default keybinds                              │
	-- ╰──────────────────────────────────────────────────────────╯
	for _, bind in ipairs({ "grn", "gra", "gri", "grr", "grt" }) do
		pcall(vim.keymap.del, "n", bind)
	end

	-- ╭──────────────────────────────────────────────────────────╮
	-- │ ⬇️ setup lsp attach                                      │
	-- ╰──────────────────────────────────────────────────────────╯

	vim.api.nvim_create_autocmd("LspAttach", {
		group = vim.api.nvim_create_augroup("lsp-attach", { clear = true }),
		callback = function(ev)
			local client = vim.lsp.get_client_by_id(ev.data.client_id)
			if not client then
				return
			end

			vim.keymap.set("n", "<leader>cl", function()
				Snacks.picker.lsp_config()
			end, { desc = "Lsp Info" })
			vim.keymap.set("n", "gd", vim.lsp.buf.definition, { desc = "LSP [D]efinition" })
			vim.keymap.set("n", "gD", vim.lsp.buf.declaration, { desc = "LSP [D]eclaration" })
			vim.keymap.set("n", "gr", vim.lsp.buf.references, { nowait = true, desc = "LSP [R]eferences" })
			vim.keymap.set("n", "gI", vim.lsp.buf.implementation, { desc = "LSP [I]mplementation" })
			vim.keymap.set("n", "gy", vim.lsp.buf.type_definition, { desc = "LSP T[y]pe Definition" })

			vim.keymap.set("n", "gh", vim.diagnostic.open_float, { buffer = ev.buf, desc = "LSP [H]over Diagnostic" })
			vim.keymap.set(
				{ "n", "v" },
				"<leader>ca",
				vim.lsp.buf.code_action,
				{ buffer = ev.buf, desc = "Code [A]ction" }
			)
			vim.keymap.set("n", "K", function()
				return vim.lsp.buf.hover()
			end, { desc = "Hover" })
			vim.keymap.set("n", "gK", vim.lsp.buf.signature_help, { buffer = ev.buf, desc = "Signature [H]elp" })

			-- rename with IncRename and snacks
			vim.keymap.set("n", "<leader>cr", function()
				return ":IncRename " .. vim.fn.expand("<cword>")
			end, { buffer = ev.buf, desc = "[R]ename", expr = true })

			-- Folding
			if client.supports_method(client, vim.lsp.protocol.Methods.textDocument_foldingRange) then
				-- vim.api.nvim_set_option_value("foldmethod", "expr", { scope = "local" })
				-- vim.api.nvim_set_option_value("foldexpr", "v:lua.vim.lsp.foldexpr()", { scope = "local" })
			end

			-- CodeLens support
			if client.supports_method(client, vim.lsp.protocol.Methods.textDocument_codeLens) then
				vim.lsp.codelens.refresh()
				vim.api.nvim_create_autocmd({ "BufEnter", "CursorHold", "InsertLeave" }, {
					buffer = ev.buf,
					callback = vim.lsp.codelens.refresh,
				})

				vim.keymap.set(
					"n",
					"<leader>cC",
					vim.lsp.codelens.refresh,
					{ buffer = ev.buf, desc = "Code[L]ens refresh" }
				)
				vim.keymap.set("n", "<leader>cc", vim.lsp.codelens.run, { buffer = ev.buf, desc = "Code[L]ens run" })
			end

			-- Inlay hints
			if client.supports_method(client, vim.lsp.protocol.Methods.textDocument_inlayHint) then
				if
					vim.g.inlay_hints
					and vim.api.nvim_buf_is_valid(ev.buf)
					and vim.bo[ev.buf].buftype == ""
					and not vim.tbl_contains({ "vue" }, vim.bo[ev.buf].filetype)
				then
					local mode = vim.api.nvim_get_mode().mode
					vim.lsp.inlay_hint.enable(mode == "n" or mode == "v", { bufnr = ev.buf })

					local inlay_hints_group = vim.api.nvim_create_augroup("toggle_inlay_hints", { clear = false })

					vim.api.nvim_create_autocmd("InsertEnter", {
						group = inlay_hints_group,
						desc = "Enable inlay hints",
						buffer = ev.buf,
						callback = function()
							vim.lsp.inlay_hint.enable(false, { bufnr = ev.buf })
						end,
					})

					vim.api.nvim_create_autocmd("InsertLeave", {
						group = inlay_hints_group,
						desc = "Disable inlay hints",
						buffer = ev.buf,
						callback = function()
							vim.lsp.inlay_hint.enable(true, { bufnr = ev.buf })
						end,
					})

					-- vim.keymap.set("n", "<leader>li", function()
					-- 	vim.lsp.inlay_hint.enable(not vim.lsp.inlay_hint.is_enabled())
					-- end, { desc = "Toggle [I]nlay hint" })
				end
			end
		end,
	})

	-- ╭──────────────────────────────────────────────────────────╮
	-- │ ⬇️ setup vim.diagnostic.Config                           │
	-- ╰──────────────────────────────────────────────────────────╯

	local diagnostic_opts = {
		signs = {
			text = {
				[vim.diagnostic.severity.ERROR] = " ",
				[vim.diagnostic.severity.WARN] = " ",
				[vim.diagnostic.severity.HINT] = " ",
				[vim.diagnostic.severity.INFO] = " ",
			},
			numhl = {
				[vim.diagnostic.severity.ERROR] = "DiagnosticError",
				[vim.diagnostic.severity.WARN] = "DiagnosticWarn",
				[vim.diagnostic.severity.HINT] = "DiagnosticHint",
				[vim.diagnostic.severity.INFO] = "DiagnosticInfo",
			},
		},
		virtual_text = {
			virt_text_pos = "eol_right_align",
		},
		update_in_insert = false,
		underline = false,
		severity_sort = true,
		float = {
			border = "rounded",
			header = "",
		},
	}

	vim.diagnostic.config(diagnostic_opts)

	-- ╭──────────────────────────────────────────────────────────╮
	-- │ ⬇️ server specific capabilities                          │
	-- ╰──────────────────────────────────────────────────────────╯

	local capabilities = vim.lsp.protocol.make_client_capabilities()

	local has_blink = require("lazy.core.config").plugins["blink.cmp"] ~= nil
	if has_blink then
		capabilities = vim.tbl_deep_extend("force", capabilities, {
			textDocument = {
				foldingRange = {
					dynamicRegistration = false,
					lineFoldingOnly = true,
				},
			},
		})
	end

	local has_markdown_oxide = vim.fn.executable("markdown-oxide") == 1
	if has_markdown_oxide then
		capabilities = vim.tbl_deep_extend("force", capabilities, {
			workspace = {
				didChangeWatchedFiles = {
					dynamicRegistration = true,
				},
			},
		})
	end

	vim.lsp.config("*", {
		capabilities = capabilities,
	})

	-- ╭──────────────────────────────────────────────────────────╮
	-- │ ⬇️ this is where magic happens                           │
	-- ╰──────────────────────────────────────────────────────────╯

	local servers = {
		markdown_oxide = {},
		docker_language_server = {},
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
			-- mason = false,
			-- cmd = { vim.fn.expand("~/.asdf/shims/ruby-lsp") },
		},
		rubocop = {},
		lua_ls = {
			-- mason = false, -- set to false if you don't want this server to be installed with mason
			-- Use this to add any additional keymaps
			-- for specific lsp servers
			-- ---@type LazyKeysSpec[]
			-- keys = {},
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
								location = get_pkg_path("vue-language-server", "/node_modules/@vue/language-server"),
								languages = { "vue" },
								configNamespace = "typescript",
								enableForWorkspaceTypeScriptVersions = true,
							},
							{
								name = "typescript-svelte-plugin",
								location = get_pkg_path(
									"svelte-language-server",
									"/node_modules/typescript-svelte-plugin"
								),
								enableForWorkspaceTypeScriptVersions = true,
							},
							{
								name = "@astrojs/ts-plugin",
								location = get_pkg_path("astro-language-server", "/node_modules/@astrojs/ts-plugin"),
								enableForWorkspaceTypeScriptVersions = true,
							},
						},
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
			cmd = { "srb", "tc", "--lsp", "--disable-watchman" },
		},
		vue_ls = {},
		svelte = {},
	}

	local setup = {}

	-- get all the servers that are available through mason-lspconfig
	local mason = require("lazy.core.config").plugins["mason-lspconfig.nvim"]
	local have_mason = mason ~= nil
	local mason_all = have_mason
			and vim.tbl_keys(require("mason-lspconfig.mappings").get_mason_map().lspconfig_to_package)
		or {}
	local mason_exclude = {}

	---@return boolean? exclude automatic setup
	local function configure(server)
		if server == "*" then
			return false
		end
		local sopts = servers[server]
		sopts = sopts == true and {} or (not sopts) and { enabled = false } or sopts

		if sopts.enabled == false then
			mason_exclude[#mason_exclude + 1] = server
			return
		end

		local use_mason = sopts.mason ~= false and vim.tbl_contains(mason_all, server)
		local setup = setup[server] or setup["*"]
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

	local install = vim.tbl_filter(configure, vim.tbl_keys(servers))
	if have_mason then
		local mason_opts = require("lazy.core.plugin").values(mason, "opts", false)

		require("mason-lspconfig").setup({
			ensure_installed = vim.list_extend(install, mason_opts.ensure_installed or {}),
			automatic_enable = { exclude = mason_exclude },
		})
	end
end

vim.schedule(lsp)
