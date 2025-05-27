local M = {}

---@alias LazyKeysLspSpec LazyKeysSpec|{has?:string|string[], cond?:fun():boolean}
---@alias LazyKeysLsp LazyKeys|{has?:string|string[], cond?:fun():boolean}

---@return LazyKeysLspSpec[]
function M.get()
  return {
    { "<leader>cl", "<cmd>LspInfo<cr>",                 desc = "Lsp Info" },
    { "<leader>cd", vim.diagnostic.open_float,          desc = "Line Diagnostics" },
    { "grd",         "<cmd>Glance definitions<cr>",      desc = "Goto Definition",     has = "definition" },
    { "grr",         "<cmd>Glance references<cr>",       desc = "References" },
    { "gri",         "<cmd>Glance implementations<cr>",  desc = "Goto Implementation" },
    { "grt",         "<cmd>Glance type_definitions<cr>", desc = "Goto Type Definition" },
    { "K", function() return vim.lsp.buf.hover() end, desc = "Hover" },
    { "<leader>cc", vim.lsp.codelens.run, desc = "Run Codelens", mode = { "n", "v" }, has = "codeLens" },
    { "<leader>cC", vim.lsp.codelens.refresh, desc = "Refresh & Display Codelens", mode = { "n" }, has = "codeLens" },
    -- { "<leader>cf", require("conform").format(),        desc = "Format Document",     has = "documentFormatting" },
    {
      "gra",
      vim.lsp.buf.code_action,
      desc = "Code Action",
      mode = { "n", "v" },
      has =
      "codeAction"
    },
    {
      "grn",
      function()
        local inc_rename = require("inc_rename")
        return ":" .. inc_rename.config.cmd_name .. " " .. vim.fn.expand("<cword>")
      end,
      expr = true,
      desc = "Rename",
      has = "rename",
    },
  }
end

---@param method string|string[]
function M.has(buffer, method)
  if type(method) == "table" then
    for _, m in ipairs(method) do
      if M.has(buffer, m) then
        return true
      end
    end
    return false
  end
  method = method:find("/") and method or "textDocument/" .. method
  local clients = require('util').lsp.get_clients({ bufnr = buffer })
  for _, client in ipairs(clients) do
    if client.supports_method(method) then
      return true
    end
  end
  return false
end

---@return LazyKeysLsp[]
function M.resolve(buffer)
  local Keys = require("lazy.core.handler.keys")
  if not Keys.resolve then
    return {}
  end
  local spec = vim.tbl_extend("force", {}, M.get())
  local opts = require('util').opts("nvim-lspconfig")
  local clients = require('util').lsp.get_clients({ bufnr = buffer })
  for _, client in ipairs(clients) do
    local maps = opts.servers[client.name] and opts.servers[client.name].keys or {}
    vim.list_extend(spec, maps)
  end
  return Keys.resolve(spec)
end

function M.on_attach(_, buffer)
  local Keys = require("lazy.core.handler.keys")
  local keymaps = M.resolve(buffer)

  for _, keys in pairs(keymaps) do
    local has = not keys.has or M.has(buffer, keys.has)
    local cond = not (keys.cond == false or ((type(keys.cond) == "function") and not keys.cond()))

    if has and cond then
      local opts = Keys.opts(keys)
      opts.cond = nil
      opts.has = nil
      opts.silent = opts.silent ~= false
      opts.buffer = buffer
      vim.keymap.set(keys.mode or "n", keys.lhs, keys.rhs, opts)
    end
  end
end

return M
