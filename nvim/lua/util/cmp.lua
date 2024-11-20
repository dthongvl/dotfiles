---@class lazyvim.util.cmp
local M = {}

---@alias lazyvim.util.cmp.Action fun():boolean?
---@type table<string, lazyvim.util.cmp.Action>
M.actions = {
  -- Native Snippets
  snippet_forward = function()
    if vim.snippet.active({ direction = 1 }) then
      vim.schedule(function()
        vim.snippet.jump(1)
      end)
      return true
    end
  end,
  ai_accept = function()
    if require("codeium.virtual_text").get_current_completion_item() then
      require('util').create_undo()
      vim.api.nvim_input(require("codeium.virtual_text").accept())
      return true
    end
  end
}

---@param actions string[]
---@param fallback? string|fun()
function M.map(actions, fallback)
  return function()
    for _, name in ipairs(actions) do
      if M.actions[name] then
        local ret = M.actions[name]()
        if ret then
          return true
        end
      end
    end
    return type(fallback) == "function" and fallback() or fallback
  end
end

return M
