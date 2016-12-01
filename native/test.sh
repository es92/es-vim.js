#!/bin/bash
set -e

rm -rf vim.js/

cp -r clean-vim.js vim.js

cp config.sh vim.js/config.sh
cp make.sh vim.js/make.sh
cp link.sh vim.js/link.sh

cd vim.js

make clean
cd src
make clean
cd ..


./config.sh
make proto
emmake make -j8
./link.sh
