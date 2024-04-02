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
            leave_dirs_open = true,
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
          position = 'right',
          mappings = {
            ['o'] = 'toggle_node',
            ['<CR>'] = 'open_with_window_picker',
            ['<c-s>'] = 'split_with_window_picker',
            ['<c-v>'] = 'vsplit_with_window_picker',
            ['<esc>'] = 'revert_preview',
            ['P'] = { 'toggle_preview', config = { use_float = false } },
            ["Y"] = function(state)
              local node = state.tree:get_node()
              local path = node:get_id()
              vim.fn.setreg("+", path, "c")
            end,
          },
        },
      })
    end,
    dependencies = {
      'nvim-lua/plenary.nvim',
      'MunifTanjim/nui.nvim',
      'nvim-tree/nvim-web-devicons',
      {
        'ten3roberts/window-picker.nvim',
        name = 'window-picker',
        config = function()
          local picker = require('window-picker')
          picker.setup()
          picker.pick_window = function()
            return picker.select(
              { hl = 'WindowPicker', prompt = 'Pick window: ' },
              function(winid) return winid or nil end
            )
          end
        end,
      },
    },
  },
  {
    'nvim-telescope/telescope.nvim',
    cmd = "Telescope",
    tag = '0.1.6',
    dependencies = {
      'nvim-lua/plenary.nvim',
      { "nvim-telescope/telescope-fzf-native.nvim", enabled = vim.fn.executable "make" == 1, build = "make" },
    },
    keys = {
      {
        "<leader>/",
        function()
          require('telescope.builtin').live_grep()
        end,
        desc = "Find in Files (Grep)",
      },
      {
        "<leader>f",
        function()
          require('telescope.builtin').find_files()
        end,
        desc = "Find Files (root dir)",
      },
      {
        "<leader>b",
        function()
          require('telescope.builtin').buffers()
        end,
        desc = "Buffers",
      },
    },
    opts = {
      -- defaults = {
      --   sorting_strategy = "ascending",
      -- },
    },
    config = function(_, opts)
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
      { "<leader>sw", function() require("spectre").open_visual({ select_word = true }) end,
        desc = "Search current word in files (Spectre)" },
    },
  },
}
