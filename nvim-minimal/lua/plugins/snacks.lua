return {
	"folke/snacks.nvim",
	priority = 1000,
	lazy = false,
	keys = {
		{
			"<leader><space>",
			function()
				Snacks.picker.smart()
			end,
			desc = "Smart Find Files",
		},
		{
			"<leader>f",
			function()
				Snacks.picker.files()
			end,
			desc = "[F]iles",
		},
		{
			"<leader>/",
			function()
				Snacks.picker.grep()
			end,
			desc = "[G]rep live",
		},
		{
			"<leader>b",
			function()
				Snacks.picker.buffers()
			end,
			desc = "[B]uffers",
		},
		{
			"<leader>e",
			function()
				Snacks.explorer()
			end,
			desc = "[E]xplorer",
		},
		{
			"<leader>gg",
			function()
				Snacks.lazygit()
			end,
			desc = "Lazy[g]it",
		},
		{
			"<leader>un",
			function()
				Snacks.notifier.hide()
			end,
			desc = "Dismiss All Notifications",
		},
		{
			"<leader>n",
			function()
				Snacks.notifier.show_history()
			end,
			desc = "Notification History",
		},
		{
			"<leader>ss",
			function()
				Snacks.picker.lsp_symbols()
			end,
			desc = "LSP Symbols",
		},
	},
	config = function()
		require("snacks").setup({
			bigfile = { enabled = true },
			notifier = { enabled = true },
			input = { enabled = true },
			scroll = { enabled = true },
			quickfile = { enabled = true },
			statuscolumn = { enabled = true },
			words = { enabled = true },
			explorer = {
				enabled = true,
				trash = true,
			},
			picker = {
				sources = {
					explorer = {
						layout = { layout = { position = "right" } },
					},
				},
			},
			indent = { enabled = true },
		})
	end,
}
