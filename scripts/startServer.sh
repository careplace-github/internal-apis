#!/bin/bash

processes=$(sudo lsof -i:8080 -t | wc -l)

if [ $processes -gt 0 ] ; then
    i=1

    while [ $i -le $processes ] ; do
        pid=$(sudo lsof -i:8080 -t | sed -n ${i}p)
        sudo kill -9 $pid
        i=$((i+1))
    done

fi

sudo service nginx reload

sudo service nginx start

sudo yarn start