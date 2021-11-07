-- Automatically generated packer.nvim plugin loader code

if vim.api.nvim_call_function('has', {'nvim-0.5'}) ~= 1 then
  vim.api.nvim_command('echohl WarningMsg | echom "Invalid Neovim version for packer.nvim! | echohl None"')
  return
end

vim.api.nvim_command('packadd packer.nvim')

local no_errors, error_msg = pcall(function()

  local time
  local profile_info
  local should_profile = false
  if should_profile then
    local hrtime = vim.loop.hrtime
    profile_info = {}
    time = function(chunk, start)
      if start then
        profile_info[chunk] = hrtime()
      else
        profile_info[chunk] = (hrtime() - profile_info[chunk]) / 1e6
      end
    end
  else
    time = function(chunk, start) end
  end
  
local function save_profiles(threshold)
  local sorted_times = {}
  for chunk_name, time_taken in pairs(profile_info) do
    sorted_times[#sorted_times + 1] = {chunk_name, time_taken}
  end
  table.sort(sorted_times, function(a, b) return a[2] > b[2] end)
  local results = {}
  for i, elem in ipairs(sorted_times) do
    if not threshold or threshold and elem[2] > threshold then
      results[i] = elem[1] .. ' took ' .. elem[2] .. 'ms'
    end
  end

  _G._packer = _G._packer or {}
  _G._packer.profile_output = results
end

time([[Luarocks path setup]], true)
local package_path_str = "/home/dthongvl/.cache/nvim/packer_hererocks/2.1.0-beta3/share/lua/5.1/?.lua;/home/dthongvl/.cache/nvim/packer_hererocks/2.1.0-beta3/share/lua/5.1/?/init.lua;/home/dthongvl/.cache/nvim/packer_hererocks/2.1.0-beta3/lib/luarocks/rocks-5.1/?.lua;/home/dthongvl/.cache/nvim/packer_hererocks/2.1.0-beta3/lib/luarocks/rocks-5.1/?/init.lua"
local install_cpath_pattern = "/home/dthongvl/.cache/nvim/packer_hererocks/2.1.0-beta3/lib/lua/5.1/?.so"
if not string.find(package.path, package_path_str, 1, true) then
  package.path = package.path .. ';' .. package_path_str
end

if not string.find(package.cpath, install_cpath_pattern, 1, true) then
  package.cpath = package.cpath .. ';' .. install_cpath_pattern
end

time([[Luarocks path setup]], false)
time([[try_loadstring definition]], true)
local function try_loadstring(s, component, name)
  local success, result = pcall(loadstring(s))
  if not success then
    vim.schedule(function()
      vim.api.nvim_notify('packer.nvim: Error running ' .. component .. ' for ' .. name .. ': ' .. result, vim.log.levels.ERROR, {})
    end)
  end
  return result
end

time([[try_loadstring definition]], false)
time([[Defining packer_plugins]], true)
_G.packer_plugins = {
  LuaSnip = {
    config = { "require'plugins/luasnip'" },
    loaded = false,
    needs_bufread = false,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/LuaSnip",
    url = "https://github.com/L3MON4D3/LuaSnip"
  },
  ale = {
    config = { "require'plugins/ale'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/ale",
    url = "https://github.com/dense-analysis/ale"
  },
  ["ansible-vim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/ansible-vim",
    url = "https://github.com/pearofducks/ansible-vim"
  },
  ["bufferline.nvim"] = {
    config = { "require'plugins/bufferline'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/bufferline.nvim",
    url = "https://github.com/akinsho/bufferline.nvim"
  },
  ["cmp-buffer"] = {
    after_files = { "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/cmp-buffer/after/plugin/cmp_buffer.lua" },
    load_after = {
      ["nvim-cmp"] = true
    },
    loaded = false,
    needs_bufread = false,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/cmp-buffer",
    url = "https://github.com/hrsh7th/cmp-buffer"
  },
  ["cmp-nvim-lsp"] = {
    after_files = { "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/cmp-nvim-lsp/after/plugin/cmp_nvim_lsp.lua" },
    load_after = {
      ["nvim-cmp"] = true
    },
    loaded = false,
    needs_bufread = false,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/cmp-nvim-lsp",
    url = "https://github.com/hrsh7th/cmp-nvim-lsp"
  },
  ["cmp-nvim-lua"] = {
    after_files = { "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/cmp-nvim-lua/after/plugin/cmp_nvim_lua.lua" },
    load_after = {
      ["nvim-cmp"] = true
    },
    loaded = false,
    needs_bufread = false,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/cmp-nvim-lua",
    url = "https://github.com/hrsh7th/cmp-nvim-lua"
  },
  ["cmp-path"] = {
    after_files = { "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/cmp-path/after/plugin/cmp_path.lua" },
    load_after = {
      ["nvim-cmp"] = true
    },
    loaded = false,
    needs_bufread = false,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/cmp-path",
    url = "https://github.com/hrsh7th/cmp-path"
  },
  cmp_luasnip = {
    after_files = { "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/cmp_luasnip/after/plugin/cmp_luasnip.lua" },
    load_after = {
      ["nvim-cmp"] = true
    },
    loaded = false,
    needs_bufread = false,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/cmp_luasnip",
    url = "https://github.com/saadparwaiz1/cmp_luasnip"
  },
  ["diffview.nvim"] = {
    config = { "require'plugins/diffview'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/diffview.nvim",
    url = "https://github.com/sindrets/diffview.nvim"
  },
  fzf = {
    config = { "require'plugins/fzf'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/fzf",
    url = "https://github.com/junegunn/fzf"
  },
  ["fzf.vim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/fzf.vim",
    url = "https://github.com/junegunn/fzf.vim"
  },
  ["gitsigns.nvim"] = {
    config = { "require'plugins/gitsigns'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/gitsigns.nvim",
    url = "https://github.com/lewis6991/gitsigns.nvim"
  },
  ["html5.vim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/html5.vim",
    url = "https://github.com/othree/html5.vim"
  },
  ["incsearch.vim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/incsearch.vim",
    url = "https://github.com/haya14busa/incsearch.vim"
  },
  ["indent-blankline.nvim"] = {
    config = { "require'plugins/indent-blankline'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/indent-blankline.nvim",
    url = "https://github.com/lukas-reineke/indent-blankline.nvim"
  },
  ["lsp-status.nvim"] = {
    config = { "require'plugins/lsp-status'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/lsp-status.nvim",
    url = "https://github.com/nvim-lua/lsp-status.nvim"
  },
  ["lualine.nvim"] = {
    config = { "require'plugins/lualine'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/lualine.nvim",
    url = "https://github.com/hoob3rt/lualine.nvim"
  },
  neogit = {
    config = { "require'plugins/neogit'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/neogit",
    url = "https://github.com/TimUntersberger/neogit"
  },
  nerdcommenter = {
    config = { "require'plugins/nerdcommenter'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/nerdcommenter",
    url = "https://github.com/preservim/nerdcommenter"
  },
  ["nightfox.nvim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/nightfox.nvim",
    url = "https://github.com/EdenEast/nightfox.nvim"
  },
  ["nvim-autopairs"] = {
    config = { "require'plugins/autopairs'" },
    load_after = {
      ["nvim-cmp"] = true
    },
    loaded = false,
    needs_bufread = false,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/nvim-autopairs",
    url = "https://github.com/windwp/nvim-autopairs"
  },
  ["nvim-cmp"] = {
    after = { "cmp-nvim-lua", "nvim-autopairs", "cmp_luasnip", "cmp-path", "cmp-buffer", "cmp-nvim-lsp" },
    config = { "require'plugins/nvim-cmp'" },
    loaded = false,
    needs_bufread = false,
    only_cond = false,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/nvim-cmp",
    url = "https://github.com/hrsh7th/nvim-cmp",
    wants = { "LuaSnip" }
  },
  ["nvim-colorizer.lua"] = {
    config = { "require'plugins/nvim-colorizer'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/nvim-colorizer.lua",
    url = "https://github.com/norcalli/nvim-colorizer.lua"
  },
  ["nvim-lspconfig"] = {
    config = { "require'plugins/lspconfig'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/nvim-lspconfig",
    url = "https://github.com/neovim/nvim-lspconfig"
  },
  ["nvim-tree.lua"] = {
    config = { "require'plugins/nvim-tree'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/nvim-tree.lua",
    url = "https://github.com/kyazdani42/nvim-tree.lua"
  },
  ["nvim-treesitter"] = {
    config = { "require'plugins/treesitter'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/nvim-treesitter",
    url = "https://github.com/nvim-treesitter/nvim-treesitter"
  },
  ["nvim-web-devicons"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/nvim-web-devicons",
    url = "https://github.com/kyazdani42/nvim-web-devicons"
  },
  ["packer.nvim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/packer.nvim",
    url = "https://github.com/wbthomason/packer.nvim"
  },
  ["plenary.nvim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/plenary.nvim",
    url = "https://github.com/nvim-lua/plenary.nvim"
  },
  ["rust.vim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/rust.vim",
    url = "https://github.com/rust-lang/rust.vim"
  },
  ["splitjoin.vim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/splitjoin.vim",
    url = "https://github.com/AndrewRadev/splitjoin.vim"
  },
  ["telescope.nvim"] = {
    config = { "require'plugins/telescope'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/telescope.nvim",
    url = "https://github.com/nvim-telescope/telescope.nvim"
  },
  ["typescript-vim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/typescript-vim",
    url = "https://github.com/leafgarland/typescript-vim"
  },
  ["vim-fugitive"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/vim-fugitive",
    url = "https://github.com/tpope/vim-fugitive"
  },
  ["vim-go"] = {
    config = { "require'plugins/go'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/vim-go",
    url = "https://github.com/fatih/vim-go"
  },
  ["vim-javascript"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/vim-javascript",
    url = "https://github.com/pangloss/vim-javascript"
  },
  ["vim-jsx-pretty"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/vim-jsx-pretty",
    url = "https://github.com/MaxMEllon/vim-jsx-pretty"
  },
  ["vim-surround"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/vim-surround",
    url = "https://github.com/tpope/vim-surround"
  },
  ["vim-terraform"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/vim-terraform",
    url = "https://github.com/hashivim/vim-terraform"
  },
  ["vim-tmux-navigator"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/vim-tmux-navigator",
    url = "https://github.com/christoomey/vim-tmux-navigator"
  },
  ["vim-vue"] = {
    config = { "require'plugins/vue'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/vim-vue",
    url = "https://github.com/posva/vim-vue"
  }
}

time([[Defining packer_plugins]], false)
-- Config for: fzf
time([[Config for fzf]], true)
require'plugins/fzf'
time([[Config for fzf]], false)
-- Config for: nerdcommenter
time([[Config for nerdcommenter]], true)
require'plugins/nerdcommenter'
time([[Config for nerdcommenter]], false)
-- Config for: lualine.nvim
time([[Config for lualine.nvim]], true)
require'plugins/lualine'
time([[Config for lualine.nvim]], false)
-- Config for: neogit
time([[Config for neogit]], true)
require'plugins/neogit'
time([[Config for neogit]], false)
-- Config for: telescope.nvim
time([[Config for telescope.nvim]], true)
require'plugins/telescope'
time([[Config for telescope.nvim]], false)
-- Config for: nvim-treesitter
time([[Config for nvim-treesitter]], true)
require'plugins/treesitter'
time([[Config for nvim-treesitter]], false)
-- Config for: bufferline.nvim
time([[Config for bufferline.nvim]], true)
require'plugins/bufferline'
time([[Config for bufferline.nvim]], false)
-- Config for: gitsigns.nvim
time([[Config for gitsigns.nvim]], true)
require'plugins/gitsigns'
time([[Config for gitsigns.nvim]], false)
-- Config for: ale
time([[Config for ale]], true)
require'plugins/ale'
time([[Config for ale]], false)
-- Config for: vim-vue
time([[Config for vim-vue]], true)
require'plugins/vue'
time([[Config for vim-vue]], false)
-- Config for: nvim-colorizer.lua
time([[Config for nvim-colorizer.lua]], true)
require'plugins/nvim-colorizer'
time([[Config for nvim-colorizer.lua]], false)
-- Config for: nvim-tree.lua
time([[Config for nvim-tree.lua]], true)
require'plugins/nvim-tree'
time([[Config for nvim-tree.lua]], false)
-- Config for: diffview.nvim
time([[Config for diffview.nvim]], true)
require'plugins/diffview'
time([[Config for diffview.nvim]], false)
-- Config for: vim-go
time([[Config for vim-go]], true)
require'plugins/go'
time([[Config for vim-go]], false)
-- Config for: indent-blankline.nvim
time([[Config for indent-blankline.nvim]], true)
require'plugins/indent-blankline'
time([[Config for indent-blankline.nvim]], false)
-- Config for: nvim-lspconfig
time([[Config for nvim-lspconfig]], true)
require'plugins/lspconfig'
time([[Config for nvim-lspconfig]], false)
-- Config for: lsp-status.nvim
time([[Config for lsp-status.nvim]], true)
require'plugins/lsp-status'
time([[Config for lsp-status.nvim]], false)
vim.cmd [[augroup packer_load_aucmds]]
vim.cmd [[au!]]
  -- Event lazy-loads
time([[Defining lazy-load event autocommands]], true)
vim.cmd [[au InsertEnter * ++once lua require("packer.load")({'nvim-cmp'}, { event = "InsertEnter *" }, _G.packer_plugins)]]
time([[Defining lazy-load event autocommands]], false)
vim.cmd("augroup END")
if should_profile then save_profiles() end

end)

if not no_errors then
  vim.api.nvim_command('echohl ErrorMsg | echom "Error in packer_compiled: '..error_msg..'" | echom "Please check your config for correctness" | echohl None')
end
