
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  var RemoteFS = require('./remotefs/remotefs.js');
  var EM_VimJS = require('./em_vim.js');
}

// ============================================================

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

VimJS.prototype.load = function(onloaded, data_files_config, allow_exit){
  load_vim(function(vim, start){ 
    vim.addOnExit(function(){ 
      this.vim.em_vimjs.emit('exit');
    }.bind(this));
    this.vim = vim;
    this.FS = this.vim.FS;
    this.ENV = this.vim.ENV;
    onloaded(start);
  }.bind(this), null, data_files_config, allow_exit);
}

VimJS.prototype.destroy = function(){
  this.vim.noExitRuntime = false;
  this.vim.exit();
}

VimJS.prototype.load_remotefs = function(url){
  this.vim.FS.createPath('/home/web_user', 'data', true, true);
  this.vim.FS.mount(RemoteFS(url, this.vim.FS, this.vim.PATH, this.vim.ERRNO_CODES), 
               {root: '/'}, 
               '/home/web_user/data');
}

// ============================================================

function VimJS_WW(){
  this.FS = {
    createDataFile: function(){
      this.ww_bridge.emit_apply('FS_createDataFile', arguments);
    }.bind(this),
    writeFile: function(){
      this.ww_bridge.emit_apply('FS_writeFile', arguments);
    }.bind(this),
  }

  this.em_vimjs = {};

  VimJS_WW.VIMJS_PASSTHROUGH.forEach(function passthrough_em_vimjs_fn(names){
      var vimjs_name = names[0];
      var event_name = names[1];
      this.em_vimjs[vimjs_name] = function(){
        this.ww_bridge.emit_apply(event_name, arguments);
      }.bind(this);
    }.bind(this));
}

VimJS_WW.VIMJS_PASSTHROUGH = 
  [ [ 'set_props', 'set_props' ],
    [ 'on', 'em_vimjs_on' ], 
    [ 'off', 'em_vimjs_off' ], 
    [ 'gui_resize_shell', 'gui_resize_shell' ],
    [ 'handle_key', 'handle_key' ]
  ]

VimJS_WW.prototype.load = function(loaded, data_files_config, allow_exit){
  this.vim_w = new Worker("vim_ww.js");
  this.ww_bridge = WW_Bridge_Browser(this.vim_w);

  this.ww_bridge.emit('load', function(start){
    loaded(function onfsloaded(config){
      start({
        initialFile: config.initialFile,
        initialPath: config.initialPath,
        home: config.home,
        vimrc: config.vimrc,
      }, function onviminit(finish_init){
        this.keys_to_intercept_upon_keydown = this.ww_bridge.emit(
                                                    'get_keys_to_intercept_upon_keydown', 
                                                    function(keys_to_intercept_upon_keydown){
          this.em_vimjs.keys_to_intercept_upon_keydown = keys_to_intercept_upon_keydown;
          config.oninit(finish_init);
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }.bind(this), data_files_config, allow_exit);
}

VimJS_WW.prototype.destroy = function(){
  this.ww_bridge.emit('destroy');
}

VimJS_WW.prototype.load_remotefs = function(url){
  this.ww_bridge.emit('load_remotefs', url);
}

// ============================================================

function load_vim(onfsloaded, reject, data_files, allow_exit){
  if (data_files == null)
    data_files = {};
  if (allow_exit == null)
    allow_exit = false;
  if (data_files.memoryFilePath == null)
    data_files.memoryFilePath = 'vim.js.mem';
  if (data_files.binaryFilePath == null)
    data_files.binaryFilePath = 'vim.js.binary';
  new Promise(function getEmterpreterBinaryData(resolve, reject){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', data_files.binaryFilePath, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
      resolve(xhr.response);
    };
    xhr.onerror = function(){
      reject(xhr.statusText);
    };
    xhr.send(null);
  // ======================================================
  }).then(function(emterpreterBinaryData){
    var vimjs = EM_VimJS({
      emterpreterFile: emterpreterBinaryData,
      locateFile: function(f){
        if (f === 'vim.js.mem')
          return data_files.memoryFilePath;
        else
          return f;
      },
      VIMJS_ALLOW_EXIT: allow_exit,
      noInitialRun: true,
      noExitRuntime: false,
      arguments: ['/usr/local/share/vim/example.js'],
      postRun: [],
      preRun: [],
      //preRun: [ function(){
      //  vimjs["FS_createPath"]("/", "root", true, true);
      //  vimjs.ENV['USER'] = 'root';
      //  vimjs.ENV['HOME'] = '/root'; 
      //  vimjs.ENV['PWD'] = '/root';
      //  vimjs.ENV['_'] = '/bin/vim';

      //} ],
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
      }
    });

    // ======================================================

    var state = {
      vimrc: null,
      initial_file: '',
      home: null,
      initial_path: null,
      oninit: null,

      loader_ready: false,
      runtime_ready: false,
      called_main: false,
    }

    function maybe_call_main(){
      if (!state.called_main && state.loader_ready && state.runtime_ready){
        state.called_main = true;
        if (state.home != null){
          vimjs.ENV.HOME = state.home;
        }
        if (state.vimrc != null){
          vimjs.FS_createDataFile('/home/web_user', '.vimrc', true, true, true);
          vimjs.FS.writeFile('/home/web_user/.vimrc', state.vimrc);
        }
        var args = [];
        if (state.initial_path != null){
          args.unshift('cd ' + state.initial_path);
          args.unshift('-c');
        }
        if (state.initial_file != null){
          args.unshift(state.initial_file);
        }
        vimjs.callMain(args);
      }
    }

    vimjs.onRuntimeInitialized = function(){
      state.runtime_ready = true;
      maybe_call_main();
    }

    vimjs.em_vimjs = vimjs.vimjs;
    vimjs.em_vimjs.on('init_vimjs', function(finish_init){
      state.oninit(finish_init);
    });

    onfsloaded(vimjs, function(config){
      state.loader_ready = true;
      state.initial_file = config.initialFile;
      state.home = config.home;
      state.initial_path = config.initialPath;
      state.vimrc = config.vimrc;
      state.oninit = config.oninit;
      maybe_call_main();
    });
  });
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
    VimJS: VimJS,
    VimJS_WW: VimJS_WW,
    load_vim: load_vim
  };
}
