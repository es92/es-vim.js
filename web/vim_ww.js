
// FIXME this works for emscripten but is it bad?
self.window = self;

importScripts('em_vim.js');
importScripts('vim_loader.js');

var vimjs = null
var vimjs_start = null

onmessage = function(e){
  if (e.data[0] === 'call'){
    var args = e.data[2];
    fns[e.data[1]].apply(null, args);
  }
}


var nextFnCallbackId = 0;
var fn_callbacks = {}


function register_all_events(){
  var fns = [ 'beep', 'invert', 'get_window_width', 'get_window_height', 'resize', 'clear_block', 'draw_string', 'clear_block', 'clear_all', 'delete_lines', 'clear_block', 'insert_lines', 'clear_block', 'draw_hollow_cursor', 'draw_part_cursor', 'invert_rectangle', 'set_font', 'set_font', 'check_font', 'get_char_width', 'get_char_height', 'set_fg_color', 'set_bg_color', 'set_sg_color', 'print_stacktrace', 'call_shell', 'browse' ];

  fns.forEach(function(fn){
    vimjs.em_vimjs.on(fn, function(){
      var args = Array.prototype.slice.call(arguments);
      args.unshift(fn);
      var special_args = args.map(function(arg){
        if (typeof arg === 'function'){
          var callbackId = nextFnCallbackId
          nextFnCallbackId += 1;
          fn_callbacks[callbackId] = arg;
          return {
            'type': 'function',
            'id': callbackId
          }
        }
      });
      args = args.map(function(arg){
        if (typeof arg === 'function')
          return null;
        else
          return arg;
      });
      postMessage([ 'emit', args, special_args ]);
    });
  });
}

var fns = {
  load: function(){
    load_vim(function(_vimjs, start){
      vimjs = _vimjs;
      vimjs_start = start;
      postMessage([ 'loaded' ]);
    });
  },
  start: function(initialPath, vimrc){
    vimjs_start({
      initialFile: initialPath,
      vimrc: vimrc,
      onstarted: function(){
        register_all_events();
        postMessage([ 'started', [ vimjs.em_vimjs.keys_to_intercept_upon_keydown ] ]);
      }
    });
  },
  FS_createDataFile: function(){
    vimjs.FS.createDataFile.apply(vimjs.FS, arguments);
  },
  FS_writeFile: function(){
    vimjs.FS.writeFile.apply(vimjs.FS, arguments);
  },
  _fn_callback: function(id, args){
    fn_callbacks[id].apply(null, args);
  },
  load_remotefs: function(url){
    importScripts('remotefs/remotefs.js');

    vimjs.FS.createPath('/home/web_user', 'data', true, true);
    vimjs.FS.mount(RemoteFS(url, vimjs.FS, vimjs.em_vimjs.PATH, vimjs.em_vimjs.ERRNO_CODES), 
                 {root: '/'}, 
                 '/home/web_user/data');
  }
}

var passthrough = [ 'gui_resize_shell', 'handle_key', 'set_props' ];

passthrough.forEach(function(name){
  fns[name] = function(){
    vimjs.em_vimjs[name].apply(vimjs.em_vimjs, arguments);
  }
}.bind(this));
