
checkNamelistWps() {
    # Check if the namelist.wps was linked properly.
    successLink=`find "$wpsDir/namelist.wps" -mmin -0.5`

    if [[ $successLink == "$wpsDir/namelist.wps" ]]; then
      linkTrue=true
      echo "Namelist.wps linked properly."
    else
      echo -e "\e[1;31m Namelist.wps was NOT linked properly. \e[0m"
    fi
}

runGeogrid() {
    geogridSuccess="Successful completion of geogrid"

    cd $wpsDir
    echo ""
    echo -e "Starting GEOGRID."
    echo ""
    ./geogrid.exe >& log.geogrid

    # Check if the Geogrid complete successfully
    logGeogridSuccess=`find "$wpsDir/log.geogrid" -mmin -1`

    if [[ $logGeogridSuccess == "$wpsDir/log.geogrid" ]]; then
      if grep -ciq "$geogridSuccess" log.geogrid; then
        echo ""
        echo "SUCCESS COMPLETE GEOGRID"

      else
        echo ""
        echo -e "\e[1;31m Geogrid: There is a problem. \e[0m"
        exit 1
      fi
    else
      echo ""
      echo -e "\e[1;31m Geogrid: log.geogrid not updated. \e[0m"
      exit 1
    fi
}

run() {
    checkNamelistWps

    if [ $linkTrue == true ]; then
        runGeogrid
    fi
}

main() {
    local linkTrue=false
    run
}

wpsDir=/mnt/sdb2/ARW_MODEL/WPS

main