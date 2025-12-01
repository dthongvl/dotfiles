return {
	"folke/trouble.nvim",
	event = { "BufReadPre", "BufNewFile", "BufWritePre" },
	cmd = "Trouble",
	keys = {
		{
			"<leader>xx",
			"<cmd>Trouble diagnostics toggle filter.buf=0<cr>",
			desc = "Buffer Diagnostics (Trouble)",
		},
	},
	config = function(_, opts)
		require("trouble").setup(opts)
	end,
}
