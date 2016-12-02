var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var fs = require('fs');
var path = require('path');
var process = require('process');

var port = process.argv[2] || 8080;
var dir = process.cwd();
app.use(express.static(dir));
app.use(bodyParser.json());
app.listen(port);

app.post('/call', function(req, res){
  var type = req.body.type;
  var name = req.body.name;
  var args = JSON.parse(req.body.args);

  var error = null;

  console.log('===============================================');
  if (name !== 'writeSync' && name !== 'readSync')
    console.log(type, name, args);
  else
    console.log(type, name, args.length);

  try {
    if (type === 'fs'){
      if (name === 'utimesSync'){
        args[1] = Math.floor(new Date(args[1]).getTime()/1000.);
        args[2] = Math.floor(new Date(args[2]).getTime()/1000.);
      }
      if (name === 'writeSync'){
        args[1] = new Buffer(args[1]);
      }
      if (name === 'readSync'){
        var buf = new Buffer(args[3])
        args[1] = buf;
        var fsres = fs[name].apply(fs, args);
        var bufout = []
        for (var i = 0; i < fsres; i++) {
          bufout[i] = buf[i];
        }
        var result = {
          res: fsres,
          nbuffer: bufout,
        }
      }
      else {
        var result = fs[name].apply(fs, args);
      }
    }
    else if (type === 'platform'){
      var result = process.platform;
    }
    else if (type === 'resolve_link_path'){
      var root = args[0];
      var mpath = args[1];
      var result = path.relative(path.resolve(root), mpath);
    }
  } catch(e){
    console.log(e);
    var error = e;
  }

  if (name !== 'readSync')
    console.log(result);

  res.type('text/plain');
  res.write(JSON.stringify({ result: result, error: error }));
  res.end();
});



console.log('@' + port + ': ' + dir);
