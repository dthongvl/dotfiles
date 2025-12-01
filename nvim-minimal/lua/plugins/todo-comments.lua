return {
	"folke/todo-comments.nvim",
	dependencies = { "nvim-lua/plenary.nvim" },
	cmd = { "TodoTrouble", "TodoTelescope" },
	event = { "BufReadPre", "BufNewFile", "BufWritePre" },
	keys = {
		{ "<leader>xT", "<cmd>Trouble todo toggle<cr>", desc = "Todo (Trouble)" },
		{
			"<leader>xt",
			"<cmd>Trouble todo toggle filter = {tag = {TODO,FIX,FIXME}}<cr>",
			desc = "Todo/Fix/Fixme (Trouble)",
		},
	},
	config = function(_, opts)
		require("todo-comments").setup(opts)
	end,
}
