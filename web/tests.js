

function resize_test(){
  var test = 1;
  if (test == 0){
    window.vc.canvas.style.width = 400;
    window.vc.canvas.style.height = 400;
  }
  else if (test == 1){
    var p = document.getElementById('canvas-parent');
    p.style.width = '400px';
  }
}
//setTimeout(resize_test, 1000);


function vim_input_string(vc, str){

  function run(){
    var c = str.charCodeAt(0);
    str = str.slice(1);
    vc.vim.em_vimjs.handle_key(c, c);

    if (str.length > 0)
      setTimeout(run, 10);
  }
  setTimeout(run, 1000);
}


function check_vim_textarea_contents(){
  var textarea = document.getElementsByTagName('vimtextarea')[0];
  console.log(textarea.value);

}
