#!/bin/bash

# Server path to script -> /opt/backend/src/config/initServer.sh

apt update

apt upgrade

cd /opt/backend

yarn install

yarn start