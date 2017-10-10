#!/bin/bash

oscsend localhost 4001 /oled/aux/line/1 s " "
oscsend localhost 4001 /oled/aux/line/2 s "Installing..."
oscsend localhost 4001 /oled/aux/line/3 s " "
oscsend localhost 4001 /oled/aux/line/4 s " "
oscsend localhost 4001 /oled/aux/line/5 s " "

# set to aux screen, signals screen update
oscsend localhost 4001 /oled/setscreen i 1

/root/scripts/remount-rw.sh

cd /usbdrive/System/Install-Software

# install stuff for AP mode, web stuff, avahi
echo 'installing pacman packages'
oscsend localhost 4001 /oled/aux/line/3 s "Pacman Packages"
pacman -U --needed --noconfirm ./pkg/*.pkg.tar.xz

# install cherry py and pyliblo
echo 'upgrading pip'
oscsend localhost 4001 /oled/aux/line/3 s "PIP"
pip2 install --upgrade --no-index --find-links=./python pip # gotta upgrade pip otherwise pyliblo doesn't install
echo 'installing cherrypy'
oscsend localhost 4001 /oled/aux/line/3 s "Cherry Py"
pip2 install --no-index --find-links=./python cherrypy
echo 'installing pyliblo'
oscsend localhost 4001 /oled/aux/line/3 s "Py Liblo"
pip2 install --no-index --find-links=./python pyliblo

echo 'configuring'
oscsend localhost 4001 /oled/aux/line/3 s "Configuring"

# config for avahi
cp -f ./etc/nsswitch.conf /etc/nsswitch.conf

# enable avahi
systemctl start avahi-daemon
systemctl enable avahi-daemon

oscsend localhost 4001 /oled/aux/line/2 s "Done"
oscsend localhost 4001 /oled/aux/line/3 s " "

sync

/root/scripts/remount-ro.sh

echo 'done'
