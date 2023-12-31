checkNamelistInput() {
  # Check if the namelist.wps was linked properly.
  successLink=`find "$wrfDir/namelist.input" -mmin -10.0`

  if [[ $successLink == "$wrfDir/namelist.input" ]]; then
    linkTrue=true
    echo "Namelist.input linked properly."

  else
    echo -e "\e[1;31m Namelist.input was NOT linked properly. \e[0m"
    exit 1
  fi
}

createLinks(){
  cd $wrfDir
  ln -sf $domainDir/met_em* .
}

deleteOldFiles() {
  cd $wrfDir
  rm -f ./met_em*
}

runReal() {
  realSuccess="$endDate real_em: SUCCESS COMPLETE REAL_EM INIT"
  successLink=`find "$wrfDir/namelist.input" -mmin -10`

  if [[ $successLink != "$wrfDir/namelist.input" ]]; then
    echo -e "\e[1;31m Real won't run: the namelist.input wasn't copied properly. \e[0m"
    exit 1
  else
    cd $wrfDir
    echo -e "Starting REAL."
    mpirun -np 1 ./real.exe

    # Check if the Real complete successfully
    if grep -ciq "$realSuccess" rsl.error.0000; then
      runRealTrue=true
      echo "SUCCESS COMPLETE REAL"
    else
      echo -e "\e[1;31m Real: There is a problem. \e[0m"
      echo ""
      echo "Last 10 lines of thr rsl.error.0000 file:"
      echo ""
      tail -10 rsl.error.0000
      exit 1
    fi
  fi
}

run() {
    checkNamelistInput

    if [ $linkTrue == true ]; then
        deleteOldFiles
        createLinks
        runReal
    fi
}

main() {
    local domainDir=$1
    local linkTrue=false
    
    run
}

wrfDir=/mnt/sdb2/ARW_MODEL/WRF/run
main $1