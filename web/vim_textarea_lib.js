

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

  var vimjs = new VimJS();

  vimjs.load(function(start){
    vimjs.FS.createDataFile('/home/web_user', 'text', true, true, true);
    vimjs.FS.writeFile('/home/web_user/text', '');
    var canvas = document.getElementsByTagName('canvas')[0];
    rc = new VimCanvas(vimjs, canvas);
    start({
      initialFile: '/home/web_user/text', 
      oninit: function(finishInit){ 
        finishInit()
      }
    });
  });
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = init_vim_textarea;
}
