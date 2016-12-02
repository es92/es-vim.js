#!/bin/bash

if [ "$1" == "async" ]; then
  echo 'linking with async fs support'
  cat web/es_vim_lib.js web/async_fs_lib.js web/async_syscall_lib.js > native/vim.js/web/vim_lib.js
else
  echo 'linking without async fs support'
  cat web/es_vim_lib.js > native/vim.js/web/vim_lib.js
fi

cd native/vim.js
cp ../link.sh ./link.sh
./link.sh async

cd ../..

if [ "$1" == "async" ]; then
  F=vim-async-fs
else
  F=vim
fi

cp native/vim.js/web/$F.js web/$F.js
cp native/vim.js/web/$F.js.mem web/$F.js.mem
cp native/vim.js/web/$F.js.binary web/$F.js.binary
