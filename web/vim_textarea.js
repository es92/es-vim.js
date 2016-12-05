

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  var init_vim_textarea = require('./vim_textarea_lib.js');
}

window.addEventListener('load', function(){
  var textareas = Array.prototype.slice.call(document.getElementsByTagName('vimtextarea'));
  textareas.forEach(init_vim_textarea)
});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {}
}
