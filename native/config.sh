#!/bin/bash

emcc_path=$(which emcc)
orig_emcc=$(which emcc).orig

function cleanup {
  mv $orig_emcc $emcc_path
}

trap cleanup EXIT

mv $emcc_path  $orig_emcc

ln -s $(which gcc) $emcc_path

emcc --version

# something wrong with emcc + cproto, use gcc as CPP instead
CPPFLAGS="-Os -DFEAT_GUI_WEB" \
CPP="gcc -E" \
emconfigure ./configure \
    --enable-gui=web \
    --with-features=small \
    --disable-selinux \
    --disable-xsmp \
    --disable-xsmp-interact \
    --disable-luainterp \
    --disable-mzschemeinterp \
    --disable-perlinterp \
    --disable-pythoninterp \
    --disable-python3interp \
    --disable-tclinterp \
    --disable-rubyinterp \
    --disable-cscope \
    --disable-workshop \
    --disable-netbeans \
    --disable-sniff \
    --disable-multibyte \
    --disable-hangulinput \
    --disable-xim \
    --disable-fontset \
    --disable-gtk2-check \
    --disable-gnome-check \
    --disable-motif-check \
    --disable-athena-check \
    --disable-nextaw-check \
    --disable-carbon-check \
    --disable-gtktest \
    --disable-largefile \
    --disable-acl \
    --disable-gpm \
    --disable-sysmouse \
    --disable-nls \
    --with-modified-by="Lu Wang" \
    --with-compiledby="Lu Wang" \

mv $orig_emcc $emcc_path
