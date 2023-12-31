#!/bin/bash

deleteOldFiles() {
    cd $wpsDir
    # rm ./FILE:*
    rm -f ./FILE:*
}

linkFiles() {

    ln -sf $ungrib_out_path/FILE:* $wpsDir
    # cp $ungrib_out_path/FILE:* $wpsDir

    for i in $wpsDir/FILE:*;
    do 
        copied="$i"
    done

    if [ $copied == "$wpsDir/FILE:*" ]; then
        echo 'Something is wrong.'
        exit 1
    else
        echo 'Files copied properly.'

    fi
}

wpsDir=/mnt/sdb2/ARW_MODEL/WPS
ungrib_out_path=$1

deleteOldFiles
linkFiles