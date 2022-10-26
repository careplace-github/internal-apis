#!/bin/bash

# Server path to script -> /opt/backend/src/config/initServer.sh

sudo apt update

sudo apt upgrade

cd /opt/backend

sudo service nginx start

sudo yarn install

sudo yarn start