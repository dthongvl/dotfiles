return {
	{
		"nvim-tree/nvim-tree.lua",
    version = "*",
    dependencies = {
      "nvim-tree/nvim-web-devicons",
    },
    keys = {
      {
        "<leader>e",
        function ()
          require("nvim-tree.api").tree.toggle({ find_file = true, focus = true })
        end,
        desc = "File Explorer",
      },
    },
    opts = {
      update_focused_file = {
        enable = true,
      },
      renderer = {
        highlight_git = true,
        icons = {
          show = {
            git = false,
          }
        }
      }
    },
	},
  {
    'nvim-telescope/telescope.nvim',
    cmd = "Telescope",
    tag = '0.1.2',
    dependencies = { 'nvim-lua/plenary.nvim' },
    keys = {
      {
        "<leader>/",
        function ()
          require('telescope.builtin').live_grep()
        end,
        desc = "Find in Files (Grep)",
      },
      {
        "<leader>f",
        function ()
          require('telescope.builtin').find_files()
        end,
        desc = "Find Files (root dir)",
      },
      {
        "<leader>b",
        function ()
          require('telescope.builtin').buffers()
        end,
        desc = "Buffers",
      },
    },
    opts = {
    },
  },
  -- search/replace in multiple files
  {
    "nvim-pack/nvim-spectre",
    cmd = "Spectre",
    opts = { open_cmd = "noswapfile vnew" },
    -- stylua: ignore
    keys = {
      { "<leader>sw", function() require("spectre").open_visual({ select_word = true }) end, desc = "Replace current word in files (Spectre)" },
    },
  },
}
