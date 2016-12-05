
// FIXME this works for emscripten but is it bad?
self.window = self;

importScripts('commonjs_shim.js');
importScripts('vim_loader.js');
importScripts('ww_bridge.js');
importScripts('em_vim.js');

var vimjs = null

var ww_bridge = WW_Bridge_Worker();

ww_bridge.on('load', function(loaded){
  load_vim(function(_vimjs, start){
    vimjs = _vimjs;
    loaded(function(config, oninit){
      start({
        initialFile: config.initialFile,
        initialPath: config.initialPath,
        home: config.home,
        vimrc: config.vimrc,
        oninit: function(finish_init){
          oninit(finish_init);
        },
      });
    });
  });
});

ww_bridge.on('get_keys_to_intercept_upon_keydown', function(cb){
  cb(vimjs.em_vimjs.keys_to_intercept_upon_keydown);
});

ww_bridge.on('FS_createDataFile', function(){
  vimjs.FS.createDataFile.apply(null, arguments)
});

ww_bridge.on('FS_writeFile', function(){
  vimjs.FS.writeFile.apply(null, arguments)
});

VimJS_WW.VIMJS_PASSTHROUGH.forEach(function passthrough_em_vimjs_fn(names){
    var event_name = names[1];
    var vimjs_name = names[0];
    ww_bridge.on(event_name, function(){
      vimjs.em_vimjs[vimjs_name].apply(null, arguments);
    });
  });

ww_bridge.on('load_remotefs', function(url){
  importScripts('remotefs/remotefs.js');

  vimjs.FS.createPath('/home/web_user', 'data', true, true);
  vimjs.FS.mount(RemoteFS(url, vimjs.FS, vimjs.PATH, vimjs.ERRNO_CODES), 
               {root: '/'}, 
               '/home/web_user/data');
});
