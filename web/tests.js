

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
