deleteOldNamelist() {
    cd $wpsDir
    rm -f namelist.wps
}


linkNamelist() {
  cd $wpsDir
  
  ln -sf $wfPath/namelist.wps

  # Check if the namelist.wps was linked properly.
  successLink=`find "$wpsDir/namelist.wps" -mmin -0.5`

  if [[ $successLink == "$wpsDir/namelist.wps" ]]; then
    linkTrue=true
    echo "Namelist.wps linked properly."
  else
    echo -e "\e[1;31m Namelist.wps was NOT linked properly. \e[0m"
    exit 1
  fi


}

wpsDir=/mnt/sdb2/ARW_MODEL/WPS
wfPath=$1

linkNamelist