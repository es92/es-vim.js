


function VimCanvas(vim, canvas, config){
  var s = {
    vim: vim,
    canvas: canvas,
    font_node: null,
    font: null,
    char_width: null,
    char_height: null,
    fg_color: null,
    bg_color: null,
    sg_color: null,
    resize: resize,
  }

  if (config == null)
    config = {}

  var font_node = document.createElement('span');
  font_node.style.display = 'inline-block';
  font_node.style.position = 'absolute';
  font_node.style.left = '0';
  font_node.style.top = '0';
  font_node.style.zIndex = '-10000';
  font_node.style.visibility = 'hidden';
  font_node.style.padding = '0';
  document.body.appendChild(font_node);

  var pix_ratio = window.devicePixelRatio != null ? window.devicePixelRatio : 1;

  s.font_node = font_node;

  window.vim = vim;

  // ===============================================================
  //  API
  // ===============================================================

  canvas.width = canvas.clientWidth * pix_ratio;
  canvas.height = canvas.clientHeight * pix_ratio;

  canvas.contentEditable = true;

  var page = canvas.getContext('2d');
  page.setTransform(pix_ratio, 0, 0, pix_ratio, 0, 0);

  function resize(w, h){
    _resize(w, h);
    vim.em_vimjs.resize_to_size();
  }

  function _vim_resize(w, h){
    if (w > canvas.clientWidth || h > canvas.clientHeight){
      _resize(w, h);
    }
    else if (canvas.clientWidth - w > s.char_width || canvas.clientHeight - h > s.char_height){
      _resize(w, h);
    }
  }

  function sample_avg_color(img_data){
    var N = 50;
    var rgbSum = [0, 0, 0]
    for (var i = 0; i < N; i++){
      var idx = Math.floor(Math.random()*img_data.data.length/4)
      var rgb = img_data.data.slice(idx*4, idx*4+3);
      rgbSum[0] += rgb[0];
      rgbSum[1] += rgb[1];
      rgbSum[2] += rgb[2];
    }
    var r = rgbSum[0] / N;
    var g = rgbSum[1] / N;
    var b = rgbSum[2] / N;
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  function _resize(w, h){
    var img_data = page.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = w * pix_ratio;
    canvas.height = h * pix_ratio;

    page.setTransform(pix_ratio, 0, 0, pix_ratio, 0, 0);

    page.fillStyle = sample_avg_color(img_data);
    page.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    page.putImageData(img_data, 0, 0);
  }

  // ===============================================================
  //  config related
  // ===============================================================

  function resize_to_size(){
    resize(canvas.clientWidth, canvas.clientHeight);
  }

  function check_resize(){
    if (canvas.clientWidth !== s.last_width || s.last_height !== canvas.client_height){
      resize_to_size();
    }

    s.last_width = canvas.clientWidth;
    s.last_height = canvas.clientHeight;
  }

  function add_mutation_resize_check(elem){
    (new MutationObserver(function(mutations){
        if(mutations.length > 0) { 
          check_resize(); 
        }
    })).observe(elem, { attributes : true, attributeFilter : ['style'] });
  }

  if (!config.fix_size){
    window.addEventListener('resize', check_resize);
    var elem = canvas;
    do {
      add_mutation_resize_check(elem);
      elem = elem.parentNode;
    } while (elem != null);
  }
  
  // ===============================================================
  //  key events
  // ===============================================================
  
  canvas.addEventListener('keydown', function(e){
    var handle_keydown = e.keyCode in vim.em_vimjs.keys_to_intercept_upon_keydown;
    handle_keydown = handle_keydown || (e.ctrlKey && e.key !== 'Control');

    if (e.keyCode === 32){
      vim.em_vimjs.handle_key(e.charCode, e.keyCode, e.shiftKey, e.ctrlKey, e.altKey, e.metaKey);
      e.preventDefault();
    }
    if (e.key === 'Tab'){
      e.preventDefault();
    }
    if (handle_keydown){
      vim.em_vimjs.handle_key(e.charCode, e.keyCode, e.shiftKey, e.ctrlKey, e.altKey, e.metaKey);
    }
    if ((!config.keepDefaultKeys) && e.ctrlKey){
      e.preventDefault();
    }
  });

  canvas.addEventListener('keypress', function(e){
    if (e.charCode !== 32){
      vim.em_vimjs.handle_key(e.charCode, e.keyCode, e.shiftKey, e.ctrlKey, e.altKey, e.metaKey);
    }
  });

  // ===============================================================
  //  vim.js api implementation
  // ===============================================================

  vim.em_vimjs.set_props({
    window_width: canvas.clientWidth,
    window_height: canvas.clientHeight,
    char_width: s.char_width,
    char_height: s.char_height
  });

  vim.em_vimjs.on('exit', function(cb){
    //TODO do cleanup
  });

  vim.em_vimjs.on('get_window_width', function(cb){
    cb(canvas.clientWidth);
  });

  vim.em_vimjs.on('get_window_height', function(cb){
    cb(canvas.clientHeight);
  });

  vim.em_vimjs.on('get_char_width', function(cb){
    cb(s.char_width);
  });

  vim.em_vimjs.on('get_char_height', function(cb){
    cb(s.char_height + 1);
  });

  vim.em_vimjs.on('set_bg_color', function(color){
    s.bg_color = color;
  });

  vim.em_vimjs.on('set_fg_color', function(color){
    s.fg_color = color;
  });

  vim.em_vimjs.on('set_sg_color', function(color){
    s.sg_color = color;
  });

  vim.em_vimjs.on('resize', function(w, h){
    _vim_resize(w, h);
  });

  // ===============================================================
  //  canvas methods
  // ===============================================================

  vim.em_vimjs.on('draw_part_cursor', function(row, col, width, height){
    page.fillStyle = s.fg_color;
    var cw = s.char_width;
    var ch = s.char_height;
    page.fillRect(col * cw, (row + 1) * ch - height+1, width, height-1);
  });

  function scaled_draw_image(x, y, w, h, dx, dy, dw, dh){
    var data = page.getImageData(x*pix_ratio, y*pix_ratio, w*pix_ratio, h*pix_ratio);
    page.putImageData(data, dx*pix_ratio, dy*pix_ratio, 0, 0, dw*pix_ratio, dh*pix_ratio);
  }
 
  vim.em_vimjs.on('insert_lines', function(num_lines, row1, row2, col1, col2){
    var cw = s.char_width;
    var ch = s.char_height;
    var x = col1 * cw;
    var w = (col2 - col1 + 1) * cw;
    var h = (row2 - row1 - num_lines + 1) * ch;

    scaled_draw_image(x, row1 * ch, w, h,
                      x, (row1 + num_lines) * ch, w, h);
  });

  vim.em_vimjs.on('delete_lines', function(num_lines, row1, row2, col1, col2){
    var cw = s.char_width;
    var ch = s.char_height;
    var x = col1 * cw;
    var y = (row1 + num_lines) * ch;
    var w = (col2 - col1 + 1) * cw;
    var h = (row2 + 1) * ch - y;

    scaled_draw_image(x, y, w, h,
                      x, row1 * ch, w, h);
  });

  vim.em_vimjs.on('clear_all', function(color){
    page.fillStyle = s.bg_color;
    page.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  });

  vim.em_vimjs.on('set_font', function(font){
    s.font = font;
    s.font_node.style.font = font;
    font_node.innerHTML = 'm';
    s.char_height = s.font_node.clientHeight;
    s.char_width = s.font_node.clientWidth;
  });

  vim.em_vimjs.on('clear_block', clear_block);
    
  function clear_block(row1, col1, row2, col2){
    page.fillStyle = s.bg_color;
    var cw = s.char_width;
    var ch = s.char_height;
    page.fillRect(col1 * cw,
                 row1 * ch,
                 (col2-col1+1) * cw,
                 (row2-row1+1) * ch);
  }

  vim.em_vimjs.on('draw_string', function(str, bold, underline, undercurl, row, col, len, flags){

    page.font = s.font;
    page.textBaseline = 'bottom';

    page.fillStyle = s.fg_color;

    var x = col * s.char_width;
    var y = (row + 1) * s.char_height;
    var w = len * s.char_width;
    page.fillText(str, x, y, w);
  });

  // ===============================================================

  return s;
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = VimCanvas;
}
