return {
	"stevearc/conform.nvim",
	dependencies = { "mason.nvim" },
  event = { "BufReadPost", "BufNewFile", "BufWritePre" },
	cmd = { "ConformInfo" },
	keys = {
		{ "<leader>ci", ":ConformInfo<CR>", desc = "[C]onform info" },
		{
			"<leader>cf",
			function()
				require("conform").format({ async = true, lsp_fallback = true })
			end,
			mode = { "n", "x" },
			desc = "[F]ormat buffer",
		},
	},
	opts = {
		notify_on_error = false,
		notify_no_formatters = false,
		default_format_opts = {
			timeout_ms = 3000,
			async = false, -- not recommended to change
			quiet = false, -- not recommended to change
			lsp_format = "fallback", -- not recommended to change
		},
		formatters_by_ft = {
			lua = { "stylua" },
			fish = { "fish_indent" },
			sh = { "shfmt" },
			javascript = { "eslint" },
			typescript = { "eslint" },
			vue = { "eslint" },
			ruby = { "rubocop" },
			["markdown"] = { "prettier", "markdownlint-cli2", "markdown-toc" },
			["markdown.mdx"] = { "prettier", "markdownlint-cli2", "markdown-toc" },
			go = { "goimports", "gofumpt" },
			astro = { "prettier" },
			svelte = { "prettier" },
			hcl = { "packer_fmt" },
			terraform = { "terraform_fmt" },
			tf = { "terraform_fmt" },
			["terraform-vars"] = { "terraform_fmt" },
			plsql = { "sqlfluff" },
			mysql = { "sqlfluff" },
			sql = { "sqlfluff" },
			json = { "jq" },
			["_"] = { "trim_whitespace" },
		},
		format_on_save = function()
			-- Skip formatting if triggered from my special save command.
			if vim.g.skip_formatting then
				vim.g.skip_formatting = false
				return nil
			end

			-- Stop if we disabled auto-formatting.
			if not vim.g.autoformat then
				return nil
			end

			return {}
		end,
	},
	init = function()
		-- Use conform for gq.
		vim.o.formatexpr = "v:lua.require'conform'.formatexpr()"

		-- Start auto-formatting by default
		vim.g.autoformat = true
	end,
}
