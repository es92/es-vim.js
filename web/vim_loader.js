

var VimJS = function(){
  this.em_vimjs = {};
  var passthrough = [ 'gui_resize_shell', 'handle_key', 'on', 'off', 'set_props' ];
  passthrough.forEach(function(name){
    this.em_vimjs[name] = function(){
      this.vim.em_vimjs[name].apply(this.vim.em_vimjs, arguments);
    }.bind(this)
  }.bind(this));
  Object.defineProperty(this.em_vimjs, 'keys_to_intercept_upon_keydown', {
    get: function(){
      return this.vim.em_vimjs.keys_to_intercept_upon_keydown;
    }.bind(this)
  });
}

VimJS.prototype.load = function(onloaded){
  load_vim(function(vim, start){ 
    this.vim = vim;
    this.FS = this.vim.FS;
    onloaded(start);
  }.bind(this));
}

VimJS.prototype.load_remotefs = function(url){
  this.vim.FS.createPath('/home/web_user', 'data', true, true);
  this.vim.FS.mount(RemoteFS(url, this.vim.FS, this.vim.em_vimjs.PATH, this.vim.em_vimjs.ERRNO_CODES), 
               {root: '/'}, 
               '/home/web_user/data');
}

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

    var onstarted = null;

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

    var vimjs = EM_VimJS({
      emterpreterFile: emterpreterBinaryData,
      noInitialRun: true,
      noExitRuntime: true,
      arguments: ['/usr/local/share/vim/example.js'],
      set_vimjs: function(em_vimjs){
        vimjs.em_vimjs = em_vimjs
        onstarted(vimjs);
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
      onstarted = config.onstarted;
      file = config.initialFile;
      vimrc = config.vimrc;
      fs_ready = true;
      maybeCallMain();
    });
  });
}
