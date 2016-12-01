#!/bin/bash

CPPFLAGS="-Os -DFEAT_GUI_WEB" \
CPP="gcc -E" \
emmake make -j8

