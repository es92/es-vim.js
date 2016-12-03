

# Vim.js : JavaScript port of Vim

## Using the Library

The library is split in two components
- [web/em_vim.js](web/em_vim.js) and either [web/vim_loader.js](web/vim_loader.js) or [web/vim_ww_loader.js](web/vim_ww_loader.js) for the backend
- [web/vim_canvas_ui.js](web/vim_canvas_ui.js) for the frontend

See [web/vim.html](web/vim.html) for an example

## Development

see [TODO](/TODO) for planned changes

To modify the native code and core library you will need:
- emscripten (working with 1.36.0), cproto, likely others
- to clone [coolwangu's port of vim](https://github.com/coolwanglu/vim.js/) to native/clean-vim.js
- you may need to comment out lines in src/os_web.c relating to `<sys/acl.h>`
```
    -# ifdef HAVE_SYS_ACL_H
    -#  include <sys/acl.h>
    -# endif
```
- **read [native/config.sh](native/config.sh) before building, it temporarily moves the emcc binary, make sure this is ok with your setup**
- run/see [clean-rebuild-all.sh](/clean-rebuild-all.sh), [rebuild-js.sh](rebuild-js.sh), and [rebuild-native.sh](rebuild-native.sh)


### Thanks

Based on and adapted from a [port by coolwangu](https://github.com/coolwanglu/vim.js/)
