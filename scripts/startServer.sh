#!/bin/bash

sudo apt update

sudo apt upgrade

processes=$(sudo lsof -i:3000 -t | wc -l)
i=1

while [ $i -le $processes ] ; do
    pid=$(sudo lsof -i:3000 -t | sed -n ${i}p)
    sudo kill -9 $pid
    i=$((i+1))
done

cd /opt/backend

sudo yarn install

sudo service nginx start

sudo yarn start