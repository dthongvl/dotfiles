return {
  {
    dir = '~/workspace/git-line-trace',
    dependencies = {
      'MunifTanjim/nui.nvim',
    },
    config = function()
      require('git-line-trace').setup()
    end
  }
}
