
function RemoteFS(url, FS, PATH, ERRNO_CODES){

  var cached_calls = {}
  var CACHE_INVALID_S = 3;
  var CACHE_INVALID_ON_ERROR = false;

  var cachedFns = [
    'lstatSync',
    'readdirSync',
    'readlinkSync',
  ]

  var N = 0

  function cacheable(type, name){
    return cachedFns.indexOf(name) !== -1 || type === 'resolve_link_path';
  }

  function check_cache(key, type, name, args){
    if (key in cached_calls){
      if (Date.now() - cached_calls[key].time > 1000*CACHE_INVALID_S){
        delete cached_calls[key];
      } else {
        return cached_calls[key].result;
      }
    }
  }

  function net_call(type, name, args){
    if (cacheable(type, name)){
      var key = JSON.stringify([ type, name, Array.prototype.slice.call(args) ]);
      var result = check_cache(key, type, name, Array.prototype.slice.call(args));
      if (result != null)
        return result;
    }
    //console.log(N, type, name, args);
    N++;

    var req = new XMLHttpRequest();
    req.withCredentials = true;
    req.open("POST", url,  false);
    req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    var data = { type: type, name: name, args: JSON.stringify(Array.prototype.slice.call(args)) }
    req.send(JSON.stringify(data));
    var res = JSON.parse(req.responseText);

    if (res.error == null){
      if (cacheable(type, name)){
        cached_calls[key] = {
          time: Date.now(),
          result: res.result,
        };
      }
      else {
        cached_calls = {};
      }
      return res.result;
    }
    else {
      if (CACHE_INVALID_ON_ERROR)
        cached_calls = {};
      throw res.error;
    }
  }

  function preemptive_readdirSync(){
    var key = JSON.stringify([ 'fs', 'readdirSync', Array.prototype.slice.call(arguments) ]);
    var results = check_cache(key);
    if (results == null){
      var results = net_call('fs', 'readdirSync', arguments);
      results.stats.forEach(function(stat){
        if (stat.error == null){
          var key = JSON.stringify([ 'fs', 
                                     'lstatSync', 
                                     Array.prototype.slice.call([ stat.result.fpath ]) ]);
          cached_calls[key] = {
            time: Date.now(),
            result: stat.result.result,
          };
        }
      });
      return results.dir_result.slice();
    }
    else {
      return results.dir_result.slice()
    }
  }

  function platform(){
    return net_call('platform', '', []);
  }

  function resolve_link_path(root, path){
    return net_call('resolve_link_path', '', [ root, path ]);
  }

  var fs = {}
  var fns = [
    'lstatSync',
    'chmodSync',
    'utimesSync',
    'truncateSync',
    'mkdirSync',
    'writeFileSync',
    'renameSync',
    'unlinkSync',
    'rmdirSync',
    'readdirSync',
    'symlinkSync',
    'readlinkSync',
    'openSync',
    'closeSync',
    'readSync',
    'writeSync',
    'fstatSync',
  ]

  fns.forEach(function(name){
    fs[name] = function(){
      return net_call('fs', name, arguments);
    }
  });

  fs.readdirSync = preemptive_readdirSync;

  var NODEFS = {
    isWindows: false,
    staticInit: function() {
      NODEFS.isWindows = !!platform().match(/^win/);
    },
    mount: function (mount) {
      return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
    },
    createNode: function (parent, name, mode, dev) {
      if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
        throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
      }
      var node = FS.createNode(parent, name, mode);
      node.node_ops = NODEFS.node_ops;
      node.stream_ops = NODEFS.stream_ops;
      return node;
    },
    getMode: function (path) {
      var stat;
      try {
        stat = fs.lstatSync(path);
        if (NODEFS.isWindows) {
          // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so
          // propagate write bits to execute bits.
          stat.mode = stat.mode | ((stat.mode & 146) >> 1);
        }
      } catch (e) {
        if (!e.code) throw e;
        throw new FS.ErrnoError(ERRNO_CODES[e.code]);
      }
      return stat.mode;
    },
    realPath: function (node) {
      var parts = [];
      while (node.parent !== node) {
        parts.push(node.name);
        node = node.parent;
      }
      parts.push(node.mount.opts.root);
      parts.reverse();
      return PATH.join.apply(null, parts);
    },
    // This maps the integer permission modes from http://linux.die.net/man/3/open
    // to node.js-specific file open permission strings at http://nodejs.org/api/fs.html#fs_fs_open_path_flags_mode_callback
    flagsToPermissionStringMap: {
      0/*O_RDONLY*/: 'r',
      1/*O_WRONLY*/: 'r+',
      2/*O_RDWR*/: 'r+',
      64/*O_CREAT*/: 'r',
      65/*O_WRONLY|O_CREAT*/: 'r+',
      66/*O_RDWR|O_CREAT*/: 'r+',
      129/*O_WRONLY|O_EXCL*/: 'rx+',
      193/*O_WRONLY|O_CREAT|O_EXCL*/: 'rx+',
      514/*O_RDWR|O_TRUNC*/: 'w+',
      577/*O_WRONLY|O_CREAT|O_TRUNC*/: 'w',
      578/*O_CREAT|O_RDWR|O_TRUNC*/: 'w+',
      705/*O_WRONLY|O_CREAT|O_EXCL|O_TRUNC*/: 'wx',
      706/*O_RDWR|O_CREAT|O_EXCL|O_TRUNC*/: 'wx+',
      1024/*O_APPEND*/: 'a',
      1025/*O_WRONLY|O_APPEND*/: 'a',
      1026/*O_RDWR|O_APPEND*/: 'a+',
      1089/*O_WRONLY|O_CREAT|O_APPEND*/: 'a',
      1090/*O_RDWR|O_CREAT|O_APPEND*/: 'a+',
      1153/*O_WRONLY|O_EXCL|O_APPEND*/: 'ax',
      1154/*O_RDWR|O_EXCL|O_APPEND*/: 'ax+',
      1217/*O_WRONLY|O_CREAT|O_EXCL|O_APPEND*/: 'ax',
      1218/*O_RDWR|O_CREAT|O_EXCL|O_APPEND*/: 'ax+',
      4096/*O_RDONLY|O_DSYNC*/: 'rs',
      4098/*O_RDWR|O_DSYNC*/: 'rs+'
    },
    flagsToPermissionString: function(flags) {
      flags &= ~0100000 /*O_LARGEFILE*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
      flags &= ~02000000 /*O_CLOEXEC*/; // Some applications may pass it; it makes no sense for a single process.
      if (flags in NODEFS.flagsToPermissionStringMap) {
        return NODEFS.flagsToPermissionStringMap[flags];
      } else {
        throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
      }
    },
    node_ops: {
      getattr: function(node) {
        var path = NODEFS.realPath(node);
        var stat;
        try {
          stat = fs.lstatSync(path);
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
        // See http://support.microsoft.com/kb/140365
        if (NODEFS.isWindows && !stat.blksize) {
          stat.blksize = 4096;
        }
        if (NODEFS.isWindows && !stat.blocks) {
          stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
        }
        return {
          dev: stat.dev,
          ino: stat.ino,
          mode: stat.mode,
          nlink: stat.nlink,
          uid: stat.uid,
          gid: stat.gid,
          rdev: stat.rdev,
          size: stat.size,
          atime: new Date(stat.atime),
          mtime: new Date(stat.mtime),
          ctime: new Date(stat.ctime),
          blksize: stat.blksize,
          blocks: stat.blocks
        };
      },
      setattr: function(node, attr) {
        var path = NODEFS.realPath(node);
        try {
          if (attr.mode !== undefined) {
            fs.chmodSync(path, attr.mode);
            // update the common node structure mode as well
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            var date = new Date(attr.timestamp);
            fs.utimesSync(path, date, date);
          }
          if (attr.size !== undefined) {
            fs.truncateSync(path, attr.size);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
      },
      lookup: function (parent, name) {
        var path = PATH.join2(NODEFS.realPath(parent), name);
        var mode = NODEFS.getMode(path);
        return NODEFS.createNode(parent, name, mode);
      },
      mknod: function (parent, name, mode, dev) {
        var node = NODEFS.createNode(parent, name, mode, dev);
        // create the backing node for this in the fs root as well
        var path = NODEFS.realPath(node);
        try {
          if (FS.isDir(node.mode)) {
            fs.mkdirSync(path, node.mode);
          } else {
            fs.writeFileSync(path, '', { mode: node.mode });
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return node;
      },
      rename: function (oldNode, newDir, newName) {
        var oldPath = NODEFS.realPath(oldNode);
        var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
        try {
          fs.renameSync(oldPath, newPath);
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
      },
      unlink: function(parent, name) {
        var path = PATH.join2(NODEFS.realPath(parent), name);
        try {
          fs.unlinkSync(path);
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
      },
      rmdir: function(parent, name) {
        var path = PATH.join2(NODEFS.realPath(parent), name);
        try {
          fs.rmdirSync(path);
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
      },
      readdir: function(node) {
        var path = NODEFS.realPath(node);
        try {
          return fs.readdirSync(path);
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
      },
      symlink: function(parent, newName, oldPath) {
        var newPath = PATH.join2(NODEFS.realPath(parent), newName);
        try {
          fs.symlinkSync(oldPath, newPath);
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
      },
      readlink: function(node) {
        var linkPath = NODEFS.realPath(node);
        try {
          var filePath = fs.readlinkSync(linkPath);
          var path = resolve_link_path(linkPath, filePath);
          return path;
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
      },
    },
    stream_ops: {
      open: function (stream) {
        var path = NODEFS.realPath(stream.node);
        try {
          if (FS.isFile(stream.node.mode)) {
            stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
      },
      close: function (stream) {
        try {
          if (FS.isFile(stream.node.mode) && stream.nfd) {
            fs.closeSync(stream.nfd);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
      },
      read: function (stream, buffer, offset, length, position) {
        if (length === 0) return 0; // node errors on 0 length reads
        // FIXME this is terrible.
        var res;
        try {
          res = fs.readSync(stream.nfd, null, 0, length, position);
          nbuffer = res.nbuffer;
          res = res.res;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        if (res > 0) {
          for (var i = 0; i < res; i++) {
            buffer[offset + i] = nbuffer[i];
          }
        }
        return res;
      },
      write: function (stream, buffer, offset, length, position) {
        var data = buffer.subarray(offset, offset + length);

        var arrdata = [];
        for (var i = 0; i < data.length; i++){
          arrdata[i] = data[i];
        }

        var res;
        try {
          res = fs.writeSync(stream.nfd, arrdata, 0, length, position);
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return res;
      },
      llseek: function (stream, offset, whence) {
        var position = offset;
        if (whence === 1) {  // SEEK_CUR.
          position += stream.position;
        } else if (whence === 2) {  // SEEK_END.
          if (FS.isFile(stream.node.mode)) {
            try {
              var stat = fs.fstatSync(stream.nfd);
              position += stat.size;
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES[e.code]);
            }
          }
        }

        if (position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }

        return position;
      }
    }
  }
  NODEFS.staticInit();
  return NODEFS;
}

module.exports = RemoteFS;
