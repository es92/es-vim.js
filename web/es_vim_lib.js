/* es_vim_lib.js: connect DOM and user inputs to Vim.js
 *
 * Modified from vim_lib.js:
 *
 * Copyright (c) 2013,2014 Lu Wang <coolwanglu@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*
 * $vimjs holds the common states and functions
 * vimjs_* functions are exposed to C
 */

var LibraryVIM = {
  $vimjs__deps: ['mktemp'],
  $vimjs: {
    // functions 
    gui_web_handle_key: null,
    input_available: null,

    special_keys: [],
    special_keys_namemap: {},
    color_map: {},

    dbg: true,
    _callbacks: {},
    _nextCallbackId: 0,
    on: function(name, fn){
      if (vimjs._callbacks[name] == null)
        vimjs._callbacks[name] = {};
      var callbackId = vimjs._nextCallbackId;
      vimjs._callbacks[name][callbackId] = fn;
      vimjs._nextCallbackId++;
      return vimjs._nextCallbackId;
    },
    off: function(name, id){
      delete vimjs._callbacks[name][id];
    },
    emit_apply: function(name, args){
      var args = Array.prototype.slice.call(args);
      args.unshift(name)
      vimjs.emit.apply(null, args);
    },
    emit: function(name){
      var args = Array.prototype.slice.call(arguments).slice(1);
      if (name in vimjs._callbacks){
        for (var id in vimjs._callbacks[name]){
          vimjs._callbacks[name][id].apply(null, args);
        }
      }
      else {
        console.log('dropped', name, args);
      }
    },

    // =================================================================

    // functions that are not exposed to C
    handle_key: function(charCode, keyCode, shift, ctrl, alt, meta) {
      // macros defined in keymap.h
      var modifiers = 0;
      // shift already affects charCode
      if(charCode && shift) modifiers |= 0x02;
      if(ctrl) modifiers |= 0x04;
      if(alt) modifiers |= 0x08;
      if(meta) modifiers |= 0x10;

      var handled = false;
      if(charCode == 0) {
        var special = vimjs.special_keys[keyCode];
        if(special !== undefined) {
          vimjs.gui_web_handle_key(charCode || keyCode, modifiers, special.charCodeAt(0), special.charCodeAt(1));
          handled = true;
        }
      }

      if(!handled)
        vimjs.gui_web_handle_key(charCode || keyCode, modifiers, 0, 0);

    },

    get_color_string: function(color) {
      var bgr = [];
      for(var i = 0; i < 3; ++i) {
        bgr.push(color & 0xff);
        color >>= 8;
      }
      return 'rgb('+bgr[2]+','+bgr[1]+','+bgr[0]+')';
    },

    // dirty works, called before the program starts
    //pre_run: function () {
    //  // setup directories & environment
    //  ENV['USER'] = 'root';
    //  ENV['HOME'] = '/root'; 
    //  ENV['PWD'] = '/root';
    //  ENV['_'] = '/bin/vim';

    //  Module["FS_createPath"]("/", "root", true, true);
    //  FS.currentPath = '/root';
    //},
    
    // load file from different locations VIMJS_FOLD_START

    load_nothing: function (cb, buf) {
      {{{ makeSetValue('buf', 0, 0, 'i8') }}};
      setTimeout(cb, 1);
    },

    // save data to a temp file and return it to Vim
    load_data: function (cb, buf, data_array) {
      writeArrayToMemory(intArrayFromString('/tmp/vimjs-XXXXXX'), buf);
      _mktemp(buf);
      FS.writeFile(Pointer_stringify(buf), data_array, { encoding: 'binary' });
      setTimeout(cb, 1);
    },

    __dummy__: null
  },

  // =================================================================

  vimjs_init__deps: ['vimjs_init_font'],
  vimjs_init: function () {
    vimjs.gui_web_handle_key = Module['cwrap']('gui_web_handle_key', null, ['number', 'number', 'number', 'number']);
    vimjs.input_available = Module['cwrap']('input_available', 'number', []);
    vimjs.gui_resize_shell = Module['cwrap']('gui_resize_shell', null, [ 'number', 'number' ]);

    Module['set_vimjs'](vimjs);

    _vimjs_init_font('');

    vimjs.special_keys = [];
    vimjs.special_keys_namemap = {};
    /* for closure compiler */
    var KeyEvent = window.KeyEvent;
    /* for Chrome */
    /* http://stackoverflow.com/questions/1465374/javascript-event-keycode-constants/1465409#1465409 */
    if (typeof KeyEvent == "undefined") {
        var KeyEvent = {
            DOM_VK_CANCEL: 3,
            DOM_VK_HELP: 6,
            DOM_VK_BACK_SPACE: 8,
            DOM_VK_TAB: 9,
            DOM_VK_CLEAR: 12,
            DOM_VK_RETURN: 13,
            DOM_VK_ENTER: 14,
            DOM_VK_SHIFT: 16,
            DOM_VK_CONTROL: 17,
            DOM_VK_ALT: 18,
            DOM_VK_PAUSE: 19,
            DOM_VK_CAPS_LOCK: 20,
            DOM_VK_ESCAPE: 27,
            DOM_VK_SPACE: 32,
            DOM_VK_PAGE_UP: 33,
            DOM_VK_PAGE_DOWN: 34,
            DOM_VK_END: 35,
            DOM_VK_HOME: 36,
            DOM_VK_LEFT: 37,
            DOM_VK_UP: 38,
            DOM_VK_RIGHT: 39,
            DOM_VK_DOWN: 40,
            DOM_VK_PRINTSCREEN: 44,
            DOM_VK_INSERT: 45,
            DOM_VK_DELETE: 46,
            DOM_VK_0: 48,
            DOM_VK_1: 49,
            DOM_VK_2: 50,
            DOM_VK_3: 51,
            DOM_VK_4: 52,
            DOM_VK_5: 53,
            DOM_VK_6: 54,
            DOM_VK_7: 55,
            DOM_VK_8: 56,
            DOM_VK_9: 57,
            DOM_VK_SEMICOLON: 59,
            DOM_VK_EQUALS: 61,
            DOM_VK_A: 65,
            DOM_VK_B: 66,
            DOM_VK_C: 67,
            DOM_VK_D: 68,
            DOM_VK_E: 69,
            DOM_VK_F: 70,
            DOM_VK_G: 71,
            DOM_VK_H: 72,
            DOM_VK_I: 73,
            DOM_VK_J: 74,
            DOM_VK_K: 75,
            DOM_VK_L: 76,
            DOM_VK_M: 77,
            DOM_VK_N: 78,
            DOM_VK_O: 79,
            DOM_VK_P: 80,
            DOM_VK_Q: 81,
            DOM_VK_R: 82,
            DOM_VK_S: 83,
            DOM_VK_T: 84,
            DOM_VK_U: 85,
            DOM_VK_V: 86,
            DOM_VK_W: 87,
            DOM_VK_X: 88,
            DOM_VK_Y: 89,
            DOM_VK_Z: 90,
            DOM_VK_CONTEXT_MENU: 93,
            DOM_VK_NUMPAD0: 96,
            DOM_VK_NUMPAD1: 97,
            DOM_VK_NUMPAD2: 98,
            DOM_VK_NUMPAD3: 99,
            DOM_VK_NUMPAD4: 100,
            DOM_VK_NUMPAD5: 101,
            DOM_VK_NUMPAD6: 102,
            DOM_VK_NUMPAD7: 103,
            DOM_VK_NUMPAD8: 104,
            DOM_VK_NUMPAD9: 105,
            DOM_VK_MULTIPLY: 106,
            DOM_VK_ADD: 107,
            DOM_VK_SEPARATOR: 108,
            DOM_VK_SUBTRACT: 109,
            DOM_VK_DECIMAL: 110,
            DOM_VK_DIVIDE: 111,
            DOM_VK_F1: 112,
            DOM_VK_F2: 113,
            DOM_VK_F3: 114,
            DOM_VK_F4: 115,
            DOM_VK_F5: 116,
            DOM_VK_F6: 117,
            DOM_VK_F7: 118,
            DOM_VK_F8: 119,
            DOM_VK_F9: 120,
            DOM_VK_F10: 121,
            DOM_VK_F11: 122,
            DOM_VK_F12: 123,
            DOM_VK_F13: 124,
            DOM_VK_F14: 125,
            DOM_VK_F15: 126,
            DOM_VK_F16: 127,
            DOM_VK_F17: 128,
            DOM_VK_F18: 129,
            DOM_VK_F19: 130,
            DOM_VK_F20: 131,
            DOM_VK_F21: 132,
            DOM_VK_F22: 133,
            DOM_VK_F23: 134,
            DOM_VK_F24: 135,
            DOM_VK_NUM_LOCK: 144,
            DOM_VK_SCROLL_LOCK: 145,
            DOM_VK_COMMA: 188,
            DOM_VK_PERIOD: 190,
            DOM_VK_SLASH: 191,
            DOM_VK_BACK_QUOTE: 192,
            DOM_VK_OPEN_BRACKET: 219,
            DOM_VK_BACK_SLASH: 220,
            DOM_VK_CLOSE_BRACKET: 221,
            DOM_VK_QUOTE: 222,
            DOM_VK_META: 224
        };
    }
    [
      [KeyEvent.DOM_VK_UP,  'ku'],
      [KeyEvent.DOM_VK_DOWN,  'kd'],
      [KeyEvent.DOM_VK_LEFT,  'kl'],
      [KeyEvent.DOM_VK_RIGHT, 'kr'],
      [KeyEvent.DOM_VK_F1,  'k1'],
      [KeyEvent.DOM_VK_F2,  'k2'],
      [KeyEvent.DOM_VK_F3,  'k3'],
      [KeyEvent.DOM_VK_F4,  'k4'],
      [KeyEvent.DOM_VK_F5,  'k5'],
      [KeyEvent.DOM_VK_F6,  'k6'],
      [KeyEvent.DOM_VK_F7,  'k7'],
      [KeyEvent.DOM_VK_F8,  'k8'],
      [KeyEvent.DOM_VK_F9,  'k9'],
      [KeyEvent.DOM_VK_F10,   'k;'],
      [KeyEvent.DOM_VK_F11,   'F1'],
      [KeyEvent.DOM_VK_F12,   'F2'],
      [KeyEvent.DOM_VK_F13,   'F3'],
      [KeyEvent.DOM_VK_F14,   'F4'],
      [KeyEvent.DOM_VK_F15,   'F5'],
      [KeyEvent.DOM_VK_F16,   'F6'],
      [KeyEvent.DOM_VK_F17,   'F7'],
      [KeyEvent.DOM_VK_F18,   'F8'],
      [KeyEvent.DOM_VK_F19,   'F9'],
      [KeyEvent.DOM_VK_F20,   'FA'],
      [KeyEvent.DOM_VK_F21,   'FB'],
      [KeyEvent.DOM_VK_F22,   'FC'],
      [KeyEvent.DOM_VK_F23,   'FD'],
      [KeyEvent.DOM_VK_F24,   'FE'],
      [KeyEvent.DOM_VK_PAUSE,  'FB'], // equal to F21, see gui_gtk_x11.c
      [KeyEvent.DOM_VK_HELP,   '%1'],
      [KeyEvent.DOM_VK_BACK_SPACE, 'kb'],
      [KeyEvent.DOM_VK_INSERT, 'kI'],
      [KeyEvent.DOM_VK_DELETE, 'kD'],
      [KeyEvent.DOM_VK_CLEAR,  'kC'],
      [KeyEvent.DOM_VK_HOME,   'kh'],
      [KeyEvent.DOM_VK_END,  '@7'],
      [KeyEvent.DOM_VK_PAGE_UP,   'kP'],
      [KeyEvent.DOM_VK_PAGE_DOWN, 'kN'],
      [KeyEvent.DOM_VK_PRINT,  '%9'],
    ].forEach(function(p) {
      vimjs.special_keys[p[0]] = p[1];
      vimjs.special_keys_namemap[p[1]] = p[0];
    });

    var keys_to_intercept_upon_keydown = {};
    [ KeyEvent.DOM_VK_ESCAPE, // CF
      KeyEvent.DOM_VK_TAB, // C
      KeyEvent.DOM_VK_BACK_SPACE, // C 
      KeyEvent.DOM_VK_UP, // C
      KeyEvent.DOM_VK_DOWN, // C
      KeyEvent.DOM_VK_LEFT, // C
      KeyEvent.DOM_VK_RIGHT, // C
      KeyEvent.DOM_VK_DELETE, // C
      KeyEvent.DOM_VK_PAGE_UP, // C
      KeyEvent.DOM_VK_PAGE_DOWN, // C
    ].forEach(function(k) {
      keys_to_intercept_upon_keydown[k] = 1;
    });
  },
  
  vimjs_prepare_exit: function() {
    if(!!Module['VIMJS_ALLOW_EXIT']) {
      // This is likely to be set by async jobs
      // hack it to exit normally
      Module['noExitRuntime'] = false;
      return 1;
    } else {
      return 0;
    }
  },

  vimjs_beep: function() {
    vimjs.emit_apply('beep', arguments)
  },

  vimjs_flash__deps: ['emscripten_async_resume'],
  vimjs_flash: function(msec) {
    vimjs.emit_apply('invert')
    setTimeout(function() {
      vimjs.emit_apply('invert')
      asm['setAsync']();
      _emscripten_async_resume();
    }, msec);
  },

  vimjs_get_window_width: function() {
    return vimjs.emit_apply('get_window_width', arguments)
  },

  vimjs_get_window_height: function() {
    return vimjs.emit_apply('get_window_height', arguments)
  },

  vimjs_resize: function(width, height) {
    vimjs.emit_apply('resize', arguments)
  },

  vimjs_draw_string: function(row, col, s, len, flags) {
    // TODO: use macros for flag constants
    if(!(flags & 0x01)) {
      vimjs.emit_apply('clear_block', [ row, col, row, col + len - 1 ])
    }
    var bold = flags & 0x02;
    var s = Pointer_stringify(s, len);
    vimjs.emit_apply('draw_string', [s, bold, row, col, len, flags ]);
  },

  vimjs_clear_block: function(row1, col1, row2, col2) {
    vimjs.emit_apply('clear_block', arguments)
  },   

  vimjs_clear_all: function() {
    vimjs.emit_apply('clear_all', arguments)
  },

  vimjs_delete_lines: function(num_lines, row1, row2, col1, col2) {
    vimjs.emit_apply('delete_lines', arguments)
    vimjs.emit('clear_block', row1, col1, row1 + num_lines - 1, col2)
  },

  vimjs_insert_lines: function(num_lines, row1, row2, col1, col2) {
    vimjs.emit_apply('insert_lines', arguments)
    vimjs.emit('clear_block', row1, col1, row1 + num_lines - 1, col2)
  },

  vimjs_draw_hollow_cursor: function(row, col) {
    vimjs.emit_apply('draw_hollow_cursor', arguments)
  },

  vimjs_draw_part_cursor: function(row, col, width, height) {
    vimjs.emit_apply('draw_part_cursor', arguments)
  },

  vimjs_invert_rectangle: function(row, col, row_count, col_count) {
    vimjs.emit_apply('invert_rectangle', arguments)
  },

  vimjs_init_font: function(font) {
    if(typeof font !== 'string')
      font = Pointer_stringify(font);
    if(!font)
      font = '12px monospace';
    vimjs.emit('set_font', font);
  },

  vimjs_set_font: function(font) {
    vimjs.emit('set_font', Pointer_stringify(font));
  },

  vimjs_check_font: function(font) {
    font = Pointer_stringify(font);
    return vimjs.emit('check_font', font);
  },

  vimjs_get_char_width: function() {
    return vimjs.char_width;
  },
  vimjs_get_char_height: function() {
    return vimjs.char_height;
  },

  vimjs_is_valid_color: function(colorp) {
    var color = Pointer_stringify(colorp);
    return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color)
      || (color.toLowerCase() in vimjs.color_map);
  },
  vimjs_get_rgb: function (string) {
    string = Pointer_stringify(string);
    string = string.toLowerCase();
    // https://github.com/harthur/color-string
    // MIT License
    var abbr = /^#([a-fA-F0-9]{3})$/;
    var hex = /^#([a-fA-F0-9]{6})$/;

    var rgb = [0, 0, 0];
    var match = string.match(abbr);
    if (match) {
      match = match[1];
      for (var i = 0; i < rgb.length; i++) {
        rgb[i] = parseInt(match[i] + match[i], 16);
      }
    } else if (match = string.match(hex)) {
      match = match[1];
      for (var i = 0; i < rgb.length; i++) {
        rgb[i] = parseInt(match.slice(i * 2, i * 2 + 2), 16);
      }
    } else {
      var builtin_rgb = vimjs.color_map[string];
      if(builtin_rgb)
        rgb = builtin_rgb;
    }
    var ret = 0;
    for (var i = 0; i < rgb.length; i++) {
      ret = (ret << 8) + rgb[i];
    }
    return ret;
  },
  vimjs_set_fg_color: function(color) {
    color = vimjs.get_color_string(color)
    vimjs.emit('set_fg_color', color);
  },
  vimjs_set_bg_color: function(color) {
    color = vimjs.get_color_string(color)
    vimjs.emit('set_bg_color', color);
  },
  vimjs_set_sp_color: function(color) {
    color = vimjs.get_color_string(color)
    vimjs.emit('set_sg_color', color);
  },

  vimjs_print_stacktrace: function() {
    vimjs.emit_apply('print_stacktrace', arguments);
  },

  vimjs_call_shell: function(cmd, options) {
    cmd = Pointer_stringify(cmd);
    vimjs.emit('call_shell', cmd, options)
  }, 

  vimjs_browse__dep: ['$vimjs', 'emscripten_async_resume'],
  vimjs_browse: function(buf, buf_size, saving, default_name, init_dir) {
    asm['setAsync']();
    default_name = Pointer_stringify(default_name);
    vimjs.emit('browse', _emscripten_async_resume, buf, buf_size, saving, default_name, init_dir)
  },

  vimjs_haskey: function(name) {
    name = Pointer_stringify(name, 2);
    return (name in vimjs.special_keys_namemap);
  },

  vimjs_dummy__: null 
};
autoAddDeps(LibraryVIM, '$vimjs');
mergeInto(LibraryManager.library, LibraryVIM);
