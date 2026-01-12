return {
	"julienvincent/hunk.nvim",
	dependencies = { "MunifTanjim/nui.nvim" },
	cmd = { "DiffEditor" },
	config = function()
		require("hunk").setup()
	end,
}
