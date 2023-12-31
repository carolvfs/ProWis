setNLevels() {
    grepOut=$(ncdump -h $metgridFile | grep 'num_metgrid_levels =')
    nLevels="$(echo $grepOut | cut -d' ' -f3)"

    echo $metgridFile
    echo $grepOut
    echo $nLevels
}

updateNamelist() {
    oldRow=$(grep 'num_metgrid_levels' $namelistPath)
    # newRow="$(echo $oldRow | cut -d'=' -f1)"

    sed -i "s/$oldRow/num_metgrid_levels                  = "$nLevels",/g" $namelistPath

    # if [ -z "$oldRow" ]
    # then
    #     echo "\$oldRow is empty"
    # else
    #     echo "\$oldRow is NOT empty"
    # fi

}


wfPath=$1
domainPath=$2
start_date=$3

metgridFile=$domainPath/met_em.d01."$start_date".nc

namelistPath=$wfPath/namelist.input

setNLevels
updateNamelist