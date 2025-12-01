return {
	"akinsho/bufferline.nvim",
	event = "VeryLazy",
	keys = {
		{ "<leader>bp", "<Cmd>BufferLinePick<CR>", desc = "Pick buffer" },
		{ "<leader>co", "<Cmd>BufferLineCloseOthers<CR>", desc = "Delete other buffers" },
		{ "<leader>br", "<Cmd>BufferLineCloseRight<CR>", desc = "Delete Buffers to the Right" },
	},
	opts = {
		options = {
			close_command = function(n)
				Snacks.bufdelete.delete({
					buf = n,
				})
			end,
			right_mouse_command = function(n)
				Snacks.bufdelete.delete({
					buf = n,
				})
			end,
			diagnostics = "nvim_lsp",
			always_show_bufferline = false,
			offsets = {
				{
					filetype = "neo-tree",
					text = "Neo-tree",
					highlight = "Directory",
					text_align = "left",
				},
			},
		},
	},
}
