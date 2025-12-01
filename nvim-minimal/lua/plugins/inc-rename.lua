return {
	"smjonas/inc-rename.nvim",
	event = { "LspAttach" },
	opts = {
		input_buffer_type = "snacks",
	},
	config = function(_, opts)
		require("inc_rename").setup(opts)
	end,
}
