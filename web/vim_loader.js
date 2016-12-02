


function load_vim(resolve, reject){
  new Promise(function getEmterpreterBinaryData(resolve, reject){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'vim.js.binary', true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
      resolve(xhr.response);
    };
    xhr.onerror = function(){
      reject(xhr.statusText);
    };
    xhr.send(null);
  }).then(function(emterpreterBinaryData){

    var onload = null;

    var fs_ready = false;
    var runtime_ready = false;
    var called_main = false;
    var file = null;
    var vimrc = null;

    function maybeCallMain(){
      if (!called_main && fs_ready && runtime_ready){
        called_main = true;
        if (vimrc != null){
          vimjs.FS_createDataFile('/home/web_user', '.vimrc', true, true, true);
          vimjs.FS.writeFile('/home/web_user/.vimrc', vimrc);
        }
        if (file != null)
          vimjs.callMain([file]);
        else
          vimjs.callMain();
      }
    }

    var vimjs = VimJS({
      emterpreterFile: emterpreterBinaryData,
      noInitialRun: true,
      noExitRuntime: true,
      arguments: ['/usr/local/share/vim/example.js'],
      set_vimjs: function(em_vimjs){
        vimjs.em_vimjs = em_vimjs
        onload(vimjs);
      },
      postRun: [],
      print: function() { 
        if (console.group !== undefined) {
          console.group.apply(console, arguments); 
          console.groupEnd();
        } else {
          // IE
          console.log(arguments);
        }
      },
      printErr: function() { 
        if (console.group !== undefined) {
          console.group.apply(console, arguments); 
          console.groupEnd();
        } else {
          // IE
          console.log(arguments);
        }
      },
    });

    vimjs.onRuntimeInitialized = function(){
      runtime_ready = true;
      maybeCallMain();
    }

    resolve(vimjs, function load(config){
      onload = config.onload;
      file = config.initialFile;
      vimrc = config.vimrc;
      fs_ready = true;
      maybeCallMain();
    });
  });
}
