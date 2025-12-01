-- bootstrap {{{

local profiler = require("profiler")

-- ╭──────────────────────────────────────────────────────────╮
-- │ ⬇️ Option section                                        │
-- ╰──────────────────────────────────────────────────────────╯

profiler.start("options")
require("config.options")
profiler.stop("options")

-- ╭──────────────────────────────────────────────────────────╮
-- │ ⬇️ Mapping section                                       │
-- ╰──────────────────────────────────────────────────────────╯

profiler.start("mappings")
require("config.mappings")
profiler.stop("mappings")

-- ╭──────────────────────────────────────────────────────────╮
-- │ ⬇️ Autocmds section                                      │
-- ╰──────────────────────────────────────────────────────────╯

profiler.start("autocmds")
require("config.autocmds")
profiler.stop("autocmds")

-- ╭──────────────────────────────────────────────────────────╮
-- │ ⬇️ Lazy section                                          │
-- ╰──────────────────────────────────────────────────────────╯

profiler.start("lazy")

local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not (vim.uv or vim.loop).fs_stat(lazypath) then
	local lazyrepo = "https://github.com/folke/lazy.nvim.git"
	local out = vim.fn.system({
		"git",
		"clone",
		"--filter=blob:none",
		"--branch=stable",
		lazyrepo,
		lazypath,
	})
	if vim.v.shell_error ~= 0 then
		vim.api.nvim_echo({
			{ "Failed to clone lazy.nvim:\n", "ErrorMsg" },
			{ out, "WarningMsg" },
			{ "\nPress any key to exit..." },
		}, true, {})
		vim.fn.getchar()
		os.exit(1)
	end
end
vim.opt.rtp:prepend(lazypath)
vim.keymap.set("n", "<leader>l", ":Lazy<CR>", { desc = "[L]azy" })

require("lazy").setup({
	spec = {
		-- ╭──────────────────────────────────────────────────────────╮
		-- │ ⬇️ EDITOR                                                │
		-- ╰──────────────────────────────────────────────────────────╯
		{ import = "plugins.blink" }, -- completion
		{ import = "plugins.conform" }, -- format
		{ import = "plugins.nvim-lint" }, -- lint
		{ import = "plugins.mini" }, -- editor, icons and more
		{ import = "plugins.nvim-treesitter" }, -- syntax highlighting
		{ import = "plugins.nvim-lspconfig" }, -- lspconfig
		{ import = "plugins.nvim-ts-autotag" }, -- auto add HTML tags
		-- ╭──────────────────────────────────────────────────────────╮
		-- │ ⬇️ TOOLS                                                 │
		-- ╰──────────────────────────────────────────────────────────╯
		{ import = "plugins.snacks" }, -- quality of life plugins
		{ import = "plugins.mason" }, -- auto install lsp server, formatter, linter
		{ import = "plugins.grug-far" }, -- search and replace globally
		{ import = "plugins.inc-rename" }, -- LSP renaming with immediate visual feedback
		{ import = "plugins.hunk" }, -- diff editor for jj
		{ import = "plugins.flash" }, -- quick jump
		{ import = "plugins.nvim-ufo" }, -- folding
		{ import = "plugins.ts-comments" }, -- enhance neovim's native comments
		{ import = "plugins.vim-tmux-navigator" }, -- navigate between tmux and neovim
		{ import = "plugins.windsurf" }, -- AI auto completion
		-- ╭──────────────────────────────────────────────────────────╮
		-- │ ⬇️ UI                                                    │
		-- ╰──────────────────────────────────────────────────────────╯
		{ import = "plugins.colorschemes" },
		{ import = "plugins.trouble" }, -- trouble UI
		{ import = "plugins.todo-comments" }, -- highlight TODO comments
		{ import = "plugins.gitsigns" },
		{ import = "plugins.bufferline" }, -- manage buffers
		{ import = "plugins.nvim-highlight-colors" },
		{ import = "plugins.nvim-lightbulb" },
		{ import = "plugins.lualine" },
		-- { import = 'plugins.render-markdown' },
		-- ╭──────────────────────────────────────────────────────────╮
		-- │ ⬇️ AI                                                    │
		-- ╰──────────────────────────────────────────────────────────╯
		-- { import = 'plugins.copilot' },
	},
	defaults = { lazy = true, version = false }, -- always use the latest git commit
	checker = { enabled = true, notify = false },
	change_detection = { notify = false },
	performance = {
		rtp = {
			-- see full list:
			-- https://github.com/neovim/neovim/tree/master/runtime/plugin
			disabled_plugins = {
				"tohtml.lua",
				"gzip.vim",
				"man.lua",
				"tarPlugin.vim",
				"zipPlugin.vim",
				"rplugin.vim",
			},
		},
	},
	rocks = {
		enabled = false,
		hererocks = false,
	},
})

profiler.stop("lazy")

-- ╭──────────────────────────────────────────────────────────╮
-- │ ⬇️ Lsp section                                           │
-- ╰──────────────────────────────────────────────────────────╯

profiler.start("lsp")
require("config.lsp")
profiler.stop("lsp")

-- profiler.report()
