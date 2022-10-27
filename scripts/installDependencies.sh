#!/bin/bash

sudo apt update

curl -o- -L https://yarnpkg.com/install.sh | bash

sudo apt upgrade

source ~/.bashrc

sudo chmod 775 startServer.sh

sudo chmod +x startServer.sh

cd ~/

sudo yarn install



