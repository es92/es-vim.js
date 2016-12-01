#!/bin/bash

cp web/es_vim_lib.js native/vim.js/web/es_vim_lib.js
cd native/vim.js
cp ../link.sh ./link.sh
./link.sh

cd ../..

cp native/vim.js/web/vim.js web/vim.js
cp native/vim.js/web/vim.js.mem web/vim.js.mem
cp native/vim.js/web/vim.js.binary web/vim.js.binary
