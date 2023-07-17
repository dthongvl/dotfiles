return {
  -- file explorer
  {
    'nvim-neo-tree/neo-tree.nvim',
    cmd = { 'Neotree' },
    keys = { { '<leader>e', '<Cmd>Neotree toggle reveal<CR>', desc = 'NeoTree' } },
    config = function()
      vim.g.neo_tree_remove_legacy_commands = 1

      require('neo-tree').setup({
        sources = { 'filesystem', 'git_status', 'document_symbols' },
        source_selector = {
          winbar = true,
          separator_active = '',
          sources = {
            { source = 'filesystem' },
            { source = 'git_status' },
            { source = 'document_symbols' },
          },
        },
        enable_git_status = true,
        git_status_async = true,
        filesystem = {
          hijack_netrw_behavior = 'open_current',
          use_libuv_file_watcher = true,
          group_empty_dirs = false,
          follow_current_file = {
            enabled = true,
          },
          filtered_items = {
            visible = true,
            hide_dotfiles = false,
            hide_gitignored = true,
            never_show = { '.DS_Store' },
          },
          window = {
            mappings = {
              ['/'] = 'noop',
              ['g/'] = 'fuzzy_finder',
            },
          },
        },
        default_component_configs = {
          name = {
            highlight_opened_files = true,
          },
          document_symbols = {
            follow_cursor = true,
          },
        },
        window = {
          mappings = {
            ['o'] = 'toggle_node',
            ['<CR>'] = 'open_with_window_picker',
            ['<c-s>'] = 'split_with_window_picker',
            ['<c-v>'] = 'vsplit_with_window_picker',
            ['<esc>'] = 'revert_preview',
            ['P'] = { 'toggle_preview', config = { use_float = false } },
          },
        },
      })
    end,
    dependencies = {
      'nvim-lua/plenary.nvim',
      'MunifTanjim/nui.nvim',
      'nvim-tree/nvim-web-devicons',
      {
        's1n7ax/nvim-window-picker',
        version = '*',
        config = function()
          require('window-picker').setup({
            hint = 'floating-big-letter',
            autoselect_one = true,
            include_current = false,
            other_win_hl_color = '#e35e4f',
            filter_rules = {
              bo = {
                filetype = { 'neo-tree-popup', 'quickfix' },
                buftype = { 'terminal', 'quickfix', 'nofile' },
              },
            },
          })
        end,
      },
    },
  },
	{
		"nvim-tree/nvim-tree.lua",
    enabled = false,
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
    dependencies = {
      'nvim-lua/plenary.nvim',
      { "nvim-telescope/telescope-fzf-native.nvim", enabled = vim.fn.executable "make" == 1, build = "make" },
    },
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
    config = function (_, opts)
      local telescope = require('telescope')
      telescope.setup(opts)
      telescope.load_extension('fzf')
    end
  },
  -- search/replace in multiple files
  {
    "nvim-pack/nvim-spectre",
    cmd = "Spectre",
    opts = { open_cmd = "noswapfile vnew" },
    -- stylua: ignore
    keys = {
      { "<leader>sw", function() require("spectre").open_visual({ select_word = true }) end, desc = "Search current word in files (Spectre)" },
    },
  },
}
