
window.addEventListener('load', function(){
  var textareas = Array.prototype.slice.call(document.getElementsByTagName('vimtextarea'));
  textareas.forEach(init_vim_textarea)
});
