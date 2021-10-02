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
  ale = {
    config = { "require'plugins/ale'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/ale"
  },
  ["ansible-vim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/ansible-vim"
  },
  ["bufferline.nvim"] = {
    config = { "require'plugins/bufferline'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/bufferline.nvim"
  },
  ["cmp-buffer"] = {
    after_files = { "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/cmp-buffer/after/plugin/cmp_buffer.lua" },
    load_after = {},
    loaded = true,
    needs_bufread = false,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/cmp-buffer"
  },
  ["cmp-nvim-lsp"] = {
    after_files = { "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/cmp-nvim-lsp/after/plugin/cmp_nvim_lsp.lua" },
    load_after = {},
    loaded = true,
    needs_bufread = false,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/cmp-nvim-lsp"
  },
  ["cmp-nvim-lua"] = {
    after_files = { "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/cmp-nvim-lua/after/plugin/cmp_nvim_lua.lua" },
    load_after = {},
    loaded = true,
    needs_bufread = false,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/cmp-nvim-lua"
  },
  ["cmp-path"] = {
    after_files = { "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/cmp-path/after/plugin/cmp_path.lua" },
    load_after = {},
    loaded = true,
    needs_bufread = false,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/cmp-path"
  },
  ["diffview.nvim"] = {
    config = { "require'plugins/diffview'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/diffview.nvim"
  },
  fzf = {
    config = { "require'plugins/fzf'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/fzf"
  },
  ["fzf.vim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/fzf.vim"
  },
  ["gitsigns.nvim"] = {
    config = { "require'plugins/gitsigns'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/gitsigns.nvim"
  },
  ["html5.vim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/html5.vim"
  },
  ["incsearch.vim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/incsearch.vim"
  },
  ["indent-blankline.nvim"] = {
    config = { "require'plugins/indent-blankline'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/indent-blankline.nvim"
  },
  ["lsp-status.nvim"] = {
    config = { "require'plugins/lsp-status'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/lsp-status.nvim"
  },
  ["lualine.nvim"] = {
    config = { "require'plugins/lualine'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/lualine.nvim"
  },
  neogit = {
    config = { "require'plugins/neogit'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/neogit"
  },
  nerdcommenter = {
    config = { "require'plugins/nerdcommenter'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/nerdcommenter"
  },
  ["nightfox.nvim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/nightfox.nvim"
  },
  ["nvim-autopairs"] = {
    config = { "require'plugins/autopairs'" },
    load_after = {},
    loaded = true,
    needs_bufread = false,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/opt/nvim-autopairs"
  },
  ["nvim-cmp"] = {
    after = { "nvim-autopairs", "cmp-buffer", "cmp-nvim-lsp", "cmp-nvim-lua", "cmp-path" },
    loaded = true,
    only_config = true
  },
  ["nvim-colorizer.lua"] = {
    config = { "require'plugins/nvim-colorizer'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/nvim-colorizer.lua"
  },
  ["nvim-lspconfig"] = {
    config = { "require'plugins/lspconfig'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/nvim-lspconfig"
  },
  ["nvim-tree.lua"] = {
    config = { "require'plugins/nvim-tree'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/nvim-tree.lua"
  },
  ["nvim-treesitter"] = {
    config = { "require'plugins/treesitter'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/nvim-treesitter"
  },
  ["nvim-web-devicons"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/nvim-web-devicons"
  },
  ["packer.nvim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/packer.nvim"
  },
  ["plenary.nvim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/plenary.nvim"
  },
  ["rust.vim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/rust.vim"
  },
  ["splitjoin.vim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/splitjoin.vim"
  },
  ["telescope.nvim"] = {
    config = { "require'plugins/telescope'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/telescope.nvim"
  },
  ["typescript-vim"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/typescript-vim"
  },
  ["vim-fugitive"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/vim-fugitive"
  },
  ["vim-go"] = {
    config = { "require'plugins/go'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/vim-go"
  },
  ["vim-javascript"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/vim-javascript"
  },
  ["vim-jsx-pretty"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/vim-jsx-pretty"
  },
  ["vim-surround"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/vim-surround"
  },
  ["vim-terraform"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/vim-terraform"
  },
  ["vim-tmux-navigator"] = {
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/vim-tmux-navigator"
  },
  ["vim-vue"] = {
    config = { "require'plugins/vue'" },
    loaded = true,
    path = "/home/dthongvl/.local/share/nvim/site/pack/packer/start/vim-vue"
  }
}

time([[Defining packer_plugins]], false)
-- Config for: nvim-cmp
time([[Config for nvim-cmp]], true)
require'plugins/nvim-cmp'
time([[Config for nvim-cmp]], false)
-- Config for: nvim-colorizer.lua
time([[Config for nvim-colorizer.lua]], true)
require'plugins/nvim-colorizer'
time([[Config for nvim-colorizer.lua]], false)
-- Config for: vim-vue
time([[Config for vim-vue]], true)
require'plugins/vue'
time([[Config for vim-vue]], false)
-- Config for: nvim-lspconfig
time([[Config for nvim-lspconfig]], true)
require'plugins/lspconfig'
time([[Config for nvim-lspconfig]], false)
-- Config for: nvim-tree.lua
time([[Config for nvim-tree.lua]], true)
require'plugins/nvim-tree'
time([[Config for nvim-tree.lua]], false)
-- Config for: diffview.nvim
time([[Config for diffview.nvim]], true)
require'plugins/diffview'
time([[Config for diffview.nvim]], false)
-- Config for: nvim-treesitter
time([[Config for nvim-treesitter]], true)
require'plugins/treesitter'
time([[Config for nvim-treesitter]], false)
-- Config for: fzf
time([[Config for fzf]], true)
require'plugins/fzf'
time([[Config for fzf]], false)
-- Config for: gitsigns.nvim
time([[Config for gitsigns.nvim]], true)
require'plugins/gitsigns'
time([[Config for gitsigns.nvim]], false)
-- Config for: ale
time([[Config for ale]], true)
require'plugins/ale'
time([[Config for ale]], false)
-- Config for: indent-blankline.nvim
time([[Config for indent-blankline.nvim]], true)
require'plugins/indent-blankline'
time([[Config for indent-blankline.nvim]], false)
-- Config for: lsp-status.nvim
time([[Config for lsp-status.nvim]], true)
require'plugins/lsp-status'
time([[Config for lsp-status.nvim]], false)
-- Config for: bufferline.nvim
time([[Config for bufferline.nvim]], true)
require'plugins/bufferline'
time([[Config for bufferline.nvim]], false)
-- Config for: lualine.nvim
time([[Config for lualine.nvim]], true)
require'plugins/lualine'
time([[Config for lualine.nvim]], false)
-- Config for: neogit
time([[Config for neogit]], true)
require'plugins/neogit'
time([[Config for neogit]], false)
-- Config for: nerdcommenter
time([[Config for nerdcommenter]], true)
require'plugins/nerdcommenter'
time([[Config for nerdcommenter]], false)
-- Config for: vim-go
time([[Config for vim-go]], true)
require'plugins/go'
time([[Config for vim-go]], false)
-- Config for: telescope.nvim
time([[Config for telescope.nvim]], true)
require'plugins/telescope'
time([[Config for telescope.nvim]], false)
-- Load plugins in order defined by `after`
time([[Sequenced loading]], true)
vim.cmd [[ packadd cmp-path ]]
vim.cmd [[ packadd cmp-nvim-lua ]]
vim.cmd [[ packadd cmp-buffer ]]
vim.cmd [[ packadd nvim-autopairs ]]

-- Config for: nvim-autopairs
require'plugins/autopairs'

vim.cmd [[ packadd cmp-nvim-lsp ]]
time([[Sequenced loading]], false)
if should_profile then save_profiles() end

end)

if not no_errors then
  vim.api.nvim_command('echohl ErrorMsg | echom "Error in packer_compiled: '..error_msg..'" | echom "Please check your config for correctness" | echohl None')
end
