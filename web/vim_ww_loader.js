
function VimJS_WW(){
  this.w_callbacks = {};

  this.FS = {
    createDataFile: function(){
      this._call('FS_createDataFile', arguments);
    }.bind(this),
    writeFile: function(){
      this._call('FS_writeFile', arguments);
    }.bind(this),
  }

  this.vim_callbacks = {};
  this._nextCallbackId = 0;

  var passthrough = [ 'gui_resize_shell', 'handle_key', 'set_props' ];
  
  this.em_vimjs = {
    off: function(name, id){
      delete this.vim_callbacks[name][id];
    }.bind(this),
    on: function(name, fn){
      if (this.vim_callbacks[name] == null)
        this.vim_callbacks[name] = {};
      var callbackId = this._nextCallbackId;
      this.vim_callbacks[name][callbackId] = fn;
      this._nextCallbackId++;
      return this._nextCallbackId;
    }.bind(this),
  }

  passthrough.forEach(function(name){
    this.em_vimjs[name] = function(){
      this._call(name, arguments);
    }.bind(this)
  }.bind(this));

  this.w_callbacks.emit = function(name, args){
    var args = Array.prototype.slice.call(arguments).slice(1);
    var outs = [];
    if (name in this.vim_callbacks){
      for (var id in this.vim_callbacks[name]){
        var out = this.vim_callbacks[name][id].apply(null, args);
        outs.push(out);
      }
      return outs[0];
    }
    else {
      console.log('dropped', name, args);
    }
  }.bind(this)
}

VimJS_WW.prototype.load = function(loaded){
  this.vim_w = new Worker("vim_ww.js");
  this._call('load', [])

  this.w_callbacks['loaded'] = loaded;

  this.vim_w.onmessage = this._onmessage.bind(this);
}

VimJS_WW.prototype.load_remotefs = function(url){
  this._call('load_remotefs', [ url ]);
}

VimJS_WW.prototype._call = function(fn, args){
  this.vim_w.postMessage([ 'call', fn, Array.prototype.slice.call(args) ]);
}

VimJS_WW.prototype._onmessage = function(e){
  if (e.data[0] === 'loaded'){
    this.w_callbacks['loaded'](function(data){
      this.w_callbacks['started'] = function(keys_to_intercept_upon_keydown){
        this.em_vimjs.keys_to_intercept_upon_keydown = keys_to_intercept_upon_keydown;
        data.onstarted(); 
      }.bind(this)
      this._call('start', [ data.initialPath, data.vimrc ]);
    }.bind(this));
  }
  else {
    var name = e.data[0];
    var args = e.data[1];
    var specialArgs = e.data[2];
    if (args != null && specialArgs != null){
      for (var i = 0; i < args.length; i++){
        var specialArg = specialArgs[i];
        if (specialArg != null){
          if (specialArg.type === 'function'){
            var id = specialArg.id;
            args[i] = function(){
              var args = Array.prototype.slice.call(arguments);
              this._call('_fn_callback', [ specialArg.id, args ]);
            }.bind(this);
          }
        }
      }
    }
    this.w_callbacks[name].apply(null, args);
  }
}
