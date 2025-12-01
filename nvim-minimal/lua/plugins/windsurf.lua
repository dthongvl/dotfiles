return {
	"Exafunction/windsurf.nvim",
	dependencies = {
		"nvim-lua/plenary.nvim",
	},
	cmd = "Codeium",
	event = "InsertEnter",
	opts = {
		enable_cmp_source = false,
		virtual_text = {
			enabled = true,
		},
	},
	config = function(_, opts)
		require("codeium").setup(opts)
	end,
}
