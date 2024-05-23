return {
  -- git signs
  {
    "lewis6991/gitsigns.nvim",
    event = { "BufReadPre", "BufNewFile" },
    opts = {
      current_line_blame = true,
      signs = {
        add = { text = "▎" },
        change = { text = "▎" },
        delete = { text = "" },
        topdelete = { text = "" },
        changedelete = { text = "▎" },
        untracked = { text = "▎" },
      },
      on_attach = function(buffer)
        local gs = package.loaded.gitsigns

        local function map(mode, l, r, desc)
          vim.keymap.set(mode, l, r, { buffer = buffer, desc = desc })
        end

        -- stylua: ignore start
        map("n", "]h", gs.next_hunk, "Next Hunk")
        map("n", "[h", gs.prev_hunk, "Prev Hunk")
        map({ "n", "v" }, "<leader>ghs", ":Gitsigns stage_hunk<CR>", "Stage Hunk")
        map({ "n", "v" }, "<leader>ghr", ":Gitsigns reset_hunk<CR>", "Reset Hunk")
        map("n", "<leader>ghS", gs.stage_buffer, "Stage Buffer")
        map("n", "<leader>ghu", gs.undo_stage_hunk, "Undo Stage Hunk")
        map("n", "<leader>ghR", gs.reset_buffer, "Reset Buffer")
        map("n", "<leader>ghp", gs.preview_hunk, "Preview Hunk")
        map("n", "<leader>ghb", function() gs.blame_line({ full = true }) end, "Blame Line")
        map("n", "<leader>ghd", gs.diffthis, "Diff This")
        map("n", "<leader>ghD", function() gs.diffthis("~") end, "Diff This ~")
        map({ "o", "x" }, "ih", ":<C-U>Gitsigns select_hunk<CR>", "GitSigns Select Hunk")
      end,
    },
  },
  {
    'sindrets/diffview.nvim',
    cmd = { 'DiffviewOpen', 'DiffviewFileHistory' },
    keys = {
      { '<localleader>gd', '<Cmd>DiffviewOpen<CR>', desc = 'diffview: open', mode = 'n' },
      { 'gh', [[:'<'>DiffviewFileHistory<CR>]], desc = 'diffview: file history', mode = 'v' },
      {
        '<localleader>gh',
        '<Cmd>DiffviewFileHistory<CR>',
        desc = 'diffview: file history',
        mode = 'n',
      },
    },
    opts = {
      default_args = { DiffviewFileHistory = { '%' } },
      enhanced_diff_hl = true,
      hooks = {
        diff_buf_read = function()
          local opt = vim.opt_local
          opt.wrap, opt.list, opt.relativenumber = false, false, false
          opt.colorcolumn = ''
        end,
      },
      view = {
        merge_tool = {
          layout = "diff3_mixed",
        },
      },
      keymaps = {
        view = { q = '<Cmd>DiffviewClose<CR>' },
        file_panel = { q = '<Cmd>DiffviewClose<CR>' },
        file_history_panel = { q = '<Cmd>DiffviewClose<CR>' },
      },
    },
  },
  {
    'NeogitOrg/neogit',
    branch = 'nightly',
    cmd = 'Neogit',
    dependencies = {
      'nvim-lua/plenary.nvim',
    },
    keys = {
      { '<localleader>gs', function() require('neogit').open() end, desc = 'open status buffer' },
      { '<localleader>gc', function() require('neogit').open({ 'commit' }) end, desc = 'open commit buffer' },
      { '<localleader>gl', function() require('neogit').popups.pull.create() end, desc = 'open pull popup' },
      { '<localleader>gp', function() require('neogit').popups.push.create() end, desc = 'open push popup' },
    },
    opts = {
      signs = {
        section = { '', '󰘕' }, -- "󰁙", "󰁊"
        item = { '▸', '▾' },
        hunk = { '󰐕', '󰍴' },
      },
      integrations = {
        diffview = true,
      },
    },
  },
}
