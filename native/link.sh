#!/bin/bash

pushd web
cp ../src/vim vim.bc
cp es_vim_lib.js usr/local/share/vim/example.js

OPT_ASYNCIFY="-s ASYNCIFY=1 \
    -s EXPORTED_FUNCTIONS=\"['_main', '_input_available', '_gui_web_handle_key']\" \
    -s ASYNCIFY_FUNCTIONS=\"['emscripten_sleep', 'vimjs_flash', 'vimjs_browse']\" "

OPT_EMTERPRETER="-s EMTERPRETIFY=1 -s EMTERPRETIFY_ASYNC=1"


# Use vim.js as filename to generate vim.js.mem
emcc vim.bc \
    -o vim.js \
    -Oz \
    $OPT_EMTERPRETER \
    -s EXPORTED_FUNCTIONS="['_main', '_input_available', '_gui_web_handle_key', '_gui_resize_shell']" \
    -s ASYNCIFY_FUNCTIONS="['emscripten_sleep', 'vimjs_flash', 'vimjs_browse']" \
    -s 'EMTERPRETIFY_FILE="vim.js.binary"' \
    -s EXPORT_NAME='"EM_VimJS"' \
    -s MODULARIZE=1 \
    -s EXTRA_EXPORTED_RUNTIME_METHODS='["FS"]' \
    --memory-init-file 1 \
    --js-library es_vim_lib.js \
    --embed-file usr \

popd
