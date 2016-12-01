


function VimCanvas(vim, canvas){
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
  }

  var font_node = document.createElement('span');
  font_node.style.display = 'inline-block';
  font_node.style.position = 'absolute';
  font_node.style.left = '0';
  font_node.style.top = '0';
  font_node.style.zIndex = '-10000';
  font_node.style.visibility = 'hidden';
  font_node.style.padding = '0';
  document.body.appendChild(font_node);

  s.font_node = font_node;

  var page = canvas.getContext('2d');

  // ===============================================================
  
  canvas.addEventListener('keydown', function(e){
    var handle_keydown = e.keyCode in vim.em_vimjs.keys_to_intercept_upon_keydown;
    handle_keydown = handle_keydown || (e.ctrlKey && e.key !== 'Control');
    if (e.key === 'Tab'){
      e.preventDefault();
    }
    if (handle_keydown){
      vim.em_vimjs.handle_key(e.charCode, e.keyCode, e.shiftKey, e.ctrlKey, e.altKey, e.metaKey);
    }
  });

  canvas.addEventListener('keypress', function(e){
    vim.em_vimjs.handle_key(e.charCode, e.keyCode, e.shiftKey, e.ctrlKey, e.altKey, e.metaKey);
  });

  // ===============================================================
  //
  vim.em_vimjs.on('draw_part_cursor', function(row, col, width, height){
    page.fillStyle = s.fg_color;
    var cw = s.char_width;
    var ch = s.char_height;
    page.fillRect(col * cw, (row + 1) * ch - height, width, height);
  });

  vim.em_vimjs.on('get_window_width', function(){
    return canvas.width;
  });

  vim.em_vimjs.on('get_window_height', function(){
    return canvas.height;
  });

  vim.em_vimjs.on('get_char_width', function(){
    return s.char_width;
  });

  vim.em_vimjs.on('get_char_height', function(){
    return s.char_height + 1;
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
    canvas.width = w;
    canvas.height = h;
  });

  // ===============================================================
  //
  vim.em_vimjs.on('insert_lines', function(num_lines, row1, row2, col1, col2){
    var cw = s.char_width;
    var ch = s.char_height;
    var x = col1 * cw;
    var w = (col2 - col1 + 1) * cw;
    var h = (row2 - row1 - num_lines + 1) * ch;
    page.drawImage(canvas, 
                  x, row1 * ch, w, h,
                  x, (row1 + num_lines) * ch, w, h);
  });

  vim.em_vimjs.on('delete_lines', function(num_lines, row1, row2, col1, col2){
    var cw = s.char_width;
    var ch = s.char_height;
    var x = col1 * cw;
    var y = (row1 + num_lines) * ch;
    var w = (col2 - col1 + 1) * cw;
    var h = (row2 + 1) * ch - y;
    page.drawImage(canvas, 
                  x, y, w, h,
                  x, row1 * ch, w, h);

  });

  vim.em_vimjs.on('clear_all', function(color){
    page.fillStyle = s.bg_color;
    page.fillRect(0, 0, canvas.width, canvas.height);
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

  return s;
}
