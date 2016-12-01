#!/bin/bash

cd native

./test.sh

cd ..
cp native/vim.js/web/vim.js web/vim.js
