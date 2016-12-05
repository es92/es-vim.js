
function WW_Bridge_Browser(worker){
  var bridge = new WW_Bridge_Helper({
    send: function(data){
      worker.postMessage(data)
    }
  });
  worker.onmessage = function(e){
    bridge.recv(e.data);
  }
  return bridge;
}

// =======================================

function WW_Bridge_Worker(){
  var bridge = new WW_Bridge_Helper({
    send: function(data){
      self.postMessage(data)
    }
  });
  self.onmessage = function(e){
    bridge.recv(e.data);
  }
  self.onmessagey, bridge.recv
  return bridge;
}

// =======================================

function WW_Bridge_Helper(config){
  this.next_callback_id = 0;
  this.callbacks = {}
  this.next_fn_callback_id = 0;
  this.fn_callbacks = {};
  this.send = config.send;
}

WW_Bridge_Helper.prototype.encode = function(type, name, args){
  var special_args = [];
  var special_args = args.map(function(arg){
    if (typeof arg === 'function'){
      var callbackId = this.next_fn_callback_id;
      this.next_fn_callback_id += 1;
      this.fn_callbacks[callbackId] = arg;
      return {
        'type': 'function',
        'id': callbackId
      }
    }
  }.bind(this));
  args = args.map(function(arg){
    if (typeof arg === 'function')
      return null;
    else
      return arg;
  });
  return [ type, name, args, special_args ];
}

WW_Bridge_Helper.prototype.decode = function(data){
  var type = data[0];
  var name = data[1];
  var args = data[2];
  var special_args = data[3];

  for (var i = 0; i < args.length; i++){
    var special_arg = special_args[i];
    (function(special_arg){
      if (special_arg != null){
        if (special_arg.type === 'function'){
          var id = special_arg.id;
          args[i] = function(){
            var args = Array.prototype.slice.call(arguments);
            this.send(this.encode('fn_call', special_arg.id, args));
          }.bind(this);
        }
      }
    }.bind(this))(special_arg);
  }
  return [ type, name, args ];
}

WW_Bridge_Helper.prototype.recv = function(data){
  var r = this.decode(data);
  var type = r[0];
  if (type === 'call'){
    var name = r[1];
    var args = r[2];
    if (name in this.callbacks){
      for (var id in this.callbacks[name]){
        this.callbacks[name][id].apply(null, args);
      }
    }
    else {
      console.log('ww dropped', name, args);
    }
  }
  else if (type === 'fn_call'){
    var id = r[1];
    var args = r[2];
    this.fn_callbacks[id].apply(null, args);
  }
};

WW_Bridge_Helper.prototype.emit = function(){
  var args = Array.prototype.slice.call(arguments).slice(1);
  var name = arguments[0];
  this.emit_apply(name, args);
}

WW_Bridge_Helper.prototype.emit_apply = function(name, args){
  var args = Array.prototype.slice.call(args);
  this.send(this.encode('call', name, args));
}

WW_Bridge_Helper.prototype.on = function(name, fn){
  if (this.callbacks[name] == null)
    this.callbacks[name] = {};
  var callbackId = this.next_callback_id;
  this.callbacks[name][callbackId] = fn;
  this.next_callback_id++;
  return this.next_callback_id;
}

WW_Bridge_Helper.prototype.off = function(name, id){
  delete this.callbacks[name][id];
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
     WW_Bridge_Browser: WW_Bridge_Browser,
     WW_Bridge_Worker: WW_Bridge_Worker,
     WW_Bridge_Helper: WW_Bridge_Helper,
  }
}
