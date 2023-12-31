#!/bin/bash

runWRF() {
  # wrfSuccess="$endDate wrf: SUCCESS COMPLETE WRF"
  wrfSuccess="SUCCESS COMPLETE WRF"


    cd $wrfDir
    echo "Starting WRF."
    ulimit -s unlimited
    #ulimit -Sn
    ulimit -s
    mpirun -np 8 ./wrf.exe

    # Check if the WRF complete successfully
    # if ! grep -ciq "$wrfSuccess" rsl.error.0000; then
    if ! grep -Fq "$wrfSuccess" rsl.error.0000; then
      echo -e "\e[1;31m WRF didn't complete. \e[0m"
      exit 1

    else
      runWRFTrue=true
      echo "SUCCESS COMPLETE WRF"
    fi
}

saveOutput() {
  correctRun=`find "$wrfDir/rsl.error.0000" -mmin -2`
  # wrfSuccess="$endDate wrf: SUCCESS COMPLETE WRF"
  wrfSuccess="SUCCESS COMPLETE WRF"

  if [ $correctRun != "$wrfDir/rsl.error.0000" ]; then
    echo "rsl.error.0000 was NOT modified in the last 2 minutes."
    exit 1

  # elif ! grep -ciq "$wrfSuccess" "$wrfDir/rsl.error.0000"; then
  elif ! grep -Fq "$wrfSuccess" "$wrfDir/rsl.error.0000"; then
    echo -e "\e[1;31m WRF didn't complete . \e[0m"
    echo ""
    echo "Last 10 lines of thr rsl.error.0000 file:"
    echo ""
    tail -10 rsl.error.0000
    exit 1

  else
    cd $outputDir

    # Check if the output file already exists.
    if test -f "wrfout_d0$1_$f_startDate"; then

      echo -e "\e[1;31m wrfout_d0$1 ALREADY EXISTS! \e[0m"

    else
      # Save the output file".
      cp $wrfDir/wrfout_d0$1_$startDate $outputDir

      # Check if the output file was saved.
      if test -f "wrfout_d0$1_$startDate"; then
        echo "wrfout_d0$1_$startDate was saved in the $outputDir directory."

        # Rename file
        mv "wrfout_d0$1_$startDate" "wrfout_d0$1_$f_startDate"
        
        # Check if the output file was renamed.
        if test -f "wrfout_d0$1_$f_startDate"; then
          echo "wrfout_d0$1_$f_startDate was renamed in the $outputDir directory."
        
        else
          echo -e "\e[1;31m wrfout_d0$1_$startDate was NOT renamed. \e[0m"
        
        fi

      else
        echo -e "\e[1;31m wrfout_d0$1_$startDate was NOT saved. \e[0m"
        exit 1
      fi
    fi
  fi

}

run() {
    # Check if the output file already exists.
    if test -f $outputDir/wrfout_d01_$f_startDate || test -f $outputDir/wrfout_d02_$f_startDate || test -f $outputDir/wrfout_d03_$f_startDate; then
      echo -e "\e[1;31m Some of wrfout_$startDate files ALREADY EXISTS! Nothing to do. \e[0m"

    else
      runWRF

      # if [ $runWRFTrue == true ]; then
      #   for files in $domArray
      #   do
      #     saveOutput $files
      #   done

      #   echo -e "\e[1;32m WRF Complete!\e[0m"
      # fi
    fi
}

main() {
    #local linkTrue=false
    local runWRFTrue=false

    local outputDir=$1
    local startDate=$2
    local endDate=$3
    
    local f_startDate=$4

    run
}


wrfDir=/mnt/sdb2/ARW_MODEL/WRF/run

domains=$5 #(1 2 3)
domArray="${domains[@]}"

main $1 $2 $3 $4

# exemplo para rodar: ./run_wrf.sh '/mnt/sdb2/RODADAS/Projects/carolvfs/Project_1/Workflow_15' 2011-01-10_00:00:00 2011-01-12_00:00:00 2011-01-10_00_00_00 '1 2 3'
