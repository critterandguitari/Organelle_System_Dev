#!/bin/bash

# install zip and unzip
pacman -U --noconfirm ./install/unzip-6.0-12-armv7h.pkg.tar.xz  
pacman -U --noconfirm ./install/zip-3.0-7-armv7h.pkg.tar.xz

# install cherry py
pip2 install --no-index --find-links=./install/cherrypy-install cherrypy
