return {
	"nvim-lualine/lualine.nvim",
	event = "VeryLazy",
	opts = function()
		return {
			options = {
				theme = "auto",
				globalstatus = true,
			},
			sections = {
				lualine_a = { "mode" },
				lualine_b = { "branch" },
				lualine_c = {
					{
						"diagnostics",
					},
					{ "filetype", icon_only = true, separator = "", padding = { left = 1, right = 0 } },
					{
						"filename",
						path = 0,
						symbols = {
							modified = "  ",
							readonly = "[Readonly]",
							unnamed = "[No name]",
							newfile = "[New]",
						},
					},
				},
				lualine_x = {
					Snacks.profiler.status(),
					{
						"searchcount",
					},
				},
				lualine_y = {
					{
						-- lsp server name
						function()
							local bufnr = vim.api.nvim_get_current_buf()
							local active_clients = vim.lsp.get_clients({
								bufnr = bufnr,
							})

							-- filter clients
							local server_names = "No active LSP clients"
							local hide_server_names = { "copilot" }
							local clients = vim.tbl_filter(function(s)
								return not vim.tbl_contains(hide_server_names, s.name)
							end, active_clients)
							local client_names = vim.tbl_map(function(s)
								return s.name
							end, clients)

							if next(client_names) ~= nil then
								server_names = " " .. table.concat(client_names, "|")
							end

							return server_names
						end,
					},
				},
				lualine_z = {
					{
						function()
							local line = vim.fn.line(".")
							local line_total = vim.fn.line("$")
							return string.format("%3d|%3d", line, line_total)
						end,
					},
					{
						function()
							local col = vim.fn.charcol(".")
							local col_total = vim.fn.charcol("$") - 1
							return string.format("%-2d|%-2d", col, col_total)
						end,
					},
				},
			},
			extensions = { "lazy", "neo-tree", "fzf" },
		}
	end,
}
