

function init_vim_textarea(vimTextArea){
  var canvas = document.createElement('canvas');
  canvas.width = vimTextArea.clientWidth;
  canvas.height = vimTextArea.clientHeight;
  vimTextArea.appendChild(canvas);
  canvas.tabIndex = '1';
  
  var vc = null;

  Object.defineProperty(vimTextArea, 'value', {
    get: function(){
      if (vc == null){
        return '';
      }
      else {
        var contents = vc.vim.FS.readFile('/home/web_user/text');
        return String.fromCharCode.apply(String, contents.slice(0, -1))
      }
    },
  });

  load_vim(function(vim, start){
    vim.FS_createDataFile('/home/web_user', 'text', true, true, true);
    vim.FS.writeFile('/home/web_user/text', '');
    start('/home/web_user/text', function(){
      vc = new VimCanvas(vim, canvas);
    });
  });

}
