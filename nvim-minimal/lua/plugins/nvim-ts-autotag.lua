return {
	"windwp/nvim-ts-autotag",
	event = "InsertEnter",
	dependencies = { "nvim-treesitter/nvim-treesitter" },
	config = function(_, opts)
		require("nvim-ts-autotag").setup(opts)
	end,
}
