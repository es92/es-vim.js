#!/bin/bash

cp web/es_vim_lib.js native/vim.js/web/es_vim_lib.js

rm -rf native/vim.js/web/usr
cp -r web/usr native/vim.js/web/usr

cd native/vim.js
cp ../link.sh ./link.sh
./link.sh

cd ../..

cp native/vim.js/web/vim.js web/em_vim.js
cp native/vim.js/web/vim.js.mem web/vim.js.mem
cp native/vim.js/web/vim.js.binary web/vim.js.binary
