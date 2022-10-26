#!/bin/bash

sudo apt update

sudo apt upgrade

curl -o- -L https://yarnpkg.com/install.sh | bash

source ~/.bashrc

sudo yarn install

