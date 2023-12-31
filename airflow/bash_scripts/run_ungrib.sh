#!/bin/bash

checkNamelistWps() {
    # Check if the namelist.wps was linked properly.
    successLink=`find "$wpsDir/namelist.wps" -mmin -0.5`

    if [[ $successLink == "$wpsDir/namelist.wps" ]]; then
      linkTrue=true

      echo ""
      echo "Namelist.wps linked properly."
    else
      echo ""
      echo -e "\e[1;31m Namelist.wps was NOT linked properly. \e[0m"
      exit 1
    fi
}

checkPath() {
    if [ -d $icbcDir ]; then
        icbcPathExists=true
    fi
}

deleteOldFiles() {
    cd $wpsDir
    rm -f FILE:*
}

runUngrib() {
    ungribSuccess="Successful completion of program ungrib.exe"
    cd $wpsDir

    pwd
    echo ""
    echo $icbcDir/$modelPrefix*
    echo ""
    
    ln -sf ungrib/Variable_Tables/$myVtable Vtable
    ./link_grib.csh $icbcDir/$modelPrefix*
    ./ungrib.exe

    logUngribSuccess=`find "$wpsDir/ungrib.log" -mmin -1`
    
    if [[ $logUngribSuccess == "$wpsDir/ungrib.log" ]]; then
        if grep -ciq "$ungribSuccess" ungrib.log; then
        echo "SUCCESS COMPLETE UNGRIB"

        else
        echo -e "\e[1;31m Ungrib: There is a problem. \e[0m"
        exit 1
        
        fi
    else
        echo -e "\e[1;31m Ungrib: ungrib.log not updated. \e[0m"
        exit 1
    fi

}

saveFiles() {

    cp $wpsDir/FILE:* $ungrib_out_path

    if [ -z "$(ls -A $ungrib_out_path)" ]; then
        echo "UNGRIB_OUT IS EMPTY"
        exit 1
    else
        echo "Files copied properly."
    fi

}

run() {
    # checkNamelistWps
    checkPath
    
    if [ $icbcPathExists == true ]; then
        deleteOldFiles
        runUngrib
        saveFiles
    fi
}

main() {
    wpsDir=/mnt/sdb2/ARW_MODEL/WPS
    modelUppercase=$3

    icbcDir=/mnt/sdb2/RODADAS/Projects/CICC/$modelUppercase/$1
    ungrib_out_path=$2

    # icbcDir=/mnt/sdb2/ARW_MODEL/CICC/$1

    myVtable=Vtable.$modelUppercase

    if [ $3 == GFS ]; then
        modelPrefix=${modelUppercase,,}
    
    elif [ $3 == ECMWF ]; then 
        modelPrefix=$modelUppercase
    
    else
        echo 'Invalid icbc model'
        exit 1

    fi

    local linkTrue=false
    local icbcPathExists=false
    run
}





main $1 $2 $3


# exemplo para rodar: ./run_ungrib.sh 20110110
# exemplo para rodar: ./run_ungrib.sh 20110110_20110113