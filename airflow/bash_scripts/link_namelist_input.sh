deleteOldNamelist() {
    cd $wrfDir
    rm -f namelist.input
}


linkNamelist() {
  cd $wrfDir
  
  ln -sf $wfPath/namelist.input

  # Check if the namelist.input was linked properly.
  successLink=`find "$wrfDir/namelist.input" -mmin -0.5`

  if [[ $successLink == "$wrfDir/namelist.input" ]]; then
    linkTrue=true
    echo "Namelist.input linked properly."
  else
    echo -e "\e[1;31m Namelist.input was NOT linked properly. \e[0m"
    exit 1
  fi


}

wrfDir=/mnt/sdb2/ARW_MODEL/WRF/run
wfPath=$1

linkNamelist