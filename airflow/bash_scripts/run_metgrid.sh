#!/bin/bash

runMetgrid() {

  metgridSuccess="Successful completion of metgrid"

  cd $wpsDir
  ./metgrid.exe >& log.metgrid

  logMetgridSuccess=`find "$wpsDir/log.metgrid" -mmin -0.5`

  if [[ $logMetgridSuccess == "$wpsDir/log.metgrid" ]]; then
    if grep -ciq "$metgridSuccess" log.metgrid; then
      echo "SUCCESS COMPLETE METGRID"
    else
      echo -e "\e[1;31m Metgrid: There is a problem. \e[0m"
      exit 1
    fi

  else
    echo -e "\e[1;31m Metgrid: log.metgrid not updated. \e[0m"
    exit 1

  fi

}

wpsDir=/mnt/sdb2/ARW_MODEL/WPS

runMetgrid