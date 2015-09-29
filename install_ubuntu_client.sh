#!/bin/bash
# Script to install the OpenBazaar Client
# run as sudo 

#install packages
apt-get update

packages=(nodejs npm)

for package in "${packages[@]}"
do
    apt-get install $package -y
done


#create a symlink to use node instead of nodejs
ln -s "$(which nodejs)" /usr/bin/node

npm install

while true; do
    read -p "Do you wish to start the client?" yn
    case $yn in
        [Yy]* ) npm start; break;;
        [Nn]* ) exit;;
        * ) echo "Please answer [Y]es or [N]o.";;
    esac
done


