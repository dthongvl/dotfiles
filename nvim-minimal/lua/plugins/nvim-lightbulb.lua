return {
	"kosayoda/nvim-lightbulb",
	event = "LspAttach",
	opts = {
		autocmd = { enabled = true },
		sign = { enabled = false },
		float = { enabled = true, win_opts = { border = "none" } },
	},
}
