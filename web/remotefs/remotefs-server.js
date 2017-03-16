var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var fs = require('fs');
var path = require('path');
var process = require('process');
var basicAuth = require('basic-auth');
var crypto = require('crypto');
var https = require('https');
var cookieParser = require('cookie-parser');

function run(){
  var configFile = process.argv[2];
  if (configFile == null)
    configFile = process.env.HOME + '/.vim-remotefs.config';
  var config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

  RemoteFS(config);

  var port = config.port || 8080;

  console.log('@' + port);
}

if (!module.parent) {
  run();
}

function RemoteFS(config){

  var port = config.port || 8080;

  var httpsKeyPath = config.https_key;
  var httpsCertPath = config.https_crt;

  var key = fs.readFileSync(httpsKeyPath, 'utf8');
  var cert = fs.readFileSync(httpsCertPath, 'utf8');

  app.use(function(req, res, next) {
    var origin = req.get('origin'); 
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if ('OPTIONS' == req.method){
      res.sendStatus(200);
    } else {
      next();
    }
  });

  app.use(cookieParser());

  function hash(name, pass){
    return crypto.createHash("sha256").update(name + "$$" + pass).digest("base64");
  }

  var auth = function (req, res, next) {
    function unauthorized(res) {
      //res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      return res.sendStatus(401);
    };

    if (req.cookies.auth != null){
      if (config.auth_tokens != null){
        if (config.auth_tokens[req.cookies.auth] != null){
          return next();
        }
      }
    }

    var user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
      return unauthorized(res);
    };

    if (user.name === config.username && hash(user.name, user.pass) === config.passhash) {
      return next();
    } else {
      return unauthorized(res);
    };
  };

  app.use(express.static(path.join(process.cwd(), '../')));
  app.use(bodyParser.json());

  app.use(auth);

  app.post('/call', function(req, res){
    var type = req.body.type;
    var name = req.body.name;
    var args = JSON.parse(req.body.args);

    var error = null;

    if (config.log)
      console.log('===============================================');
    if (name !== 'writeSync' && name !== 'readSync'){
      if (config.log)
        console.log(type, name, args);
    }
    else {
      if (config.log)
        console.log(type, name, args.length);
    }

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
        else if (name === 'readdirSync'){
          var root = args[0];
          var dir_result = fs[name].apply(fs, args);
          var stats = dir_result.map(function(fpath){
            var stat = {}
            var fpath = path.resolve(root, fpath)
            try {
              var stat_result = fs.lstatSync(fpath);
              stat.result = {}
              stat.result.result = stat_result;
              stat.result.fpath = fpath;
            } catch(e) {
              stat.error = e;
            }
            return stat;
          });
          var result = {
            dir_result: dir_result,
            stats: stats
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
        var lpath = args[0];
        var fpath = args[1];
        var result = path.relative(path.dirname(path.resolve(lpath)), fpath);
      }
    } catch(e){
      if (config.log)
        console.log(e);
      var error = e;
    }

    if (name !== 'readSync' && name !== 'readdirSync')
      if (config.log)
        console.log(result);

    res.type('text/plain');
    res.write(JSON.stringify({ result: result, error: error }));
    res.end();
  });

  var server = https.createServer({key: key, cert: cert}, app);
  server.listen(port);
}

exports.RemoteFS = RemoteFS
