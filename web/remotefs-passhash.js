
var crypto = require('crypto');
var read = require('read')

function hash(name, pass){
  return crypto.createHash("sha256").update(name + "$$" + pass).digest("base64");
}

read({ prompt: 'Username: ', silent: false }, function(er, name) {
  read({ prompt: 'Password: ', silent: true }, function(er, password) {
    console.log('Your passhhash is: %s', hash(name, password));
  })
})
