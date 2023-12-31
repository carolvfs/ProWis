#!/bin/csh

checkPath() {
    if find -- "$icbcDir" -prune -type d -empty | grep -q '^'; then
        echo "$icbcDir is an empty directory"
        icbcDirTrue=true
    else
        echo "$icbcDir is not empty."
        exit 1
    fi

}

defineDates() {
    et s = "one,two,three"
    set words = `echo $s:q | sed 's/,/ /g'`
    foreach word ($words:q)
        echo $word:q
    end
}

defineDates2() {
    splitDate=(${1//_/ })
    
    start_date=${splitDate[0]}
    end_date=${splitDate[1]}

    let run_hours=($(date +%s -d $end_date)-$(date +%s -d $start_date))/3600
    year=${start_date:0:4}
    month=${start_date:4:2}
    day=${start_date:6:2}

    filelist=()

    # file=$year/$year$month$day/gfs.0p25.$year$month$day"00.f000.grib2"


    for i in `seq 0 3 $run_hours`; do
        hour=`printf "%03i\n" $i`

        file=$year/$year$month$day/gfs.0p25.$year$month$day"00.f$hour.grib2"
        # echo $file
        filelist+=($file)
        
            # for value in "${filelist[@]}"
            # do
            #     echo $value
            # done
        
        len=${#filelist[@]}

        if [ $len -eq 3 ]
        then
            # echo $len
            for value in "${filelist[@]}"
            do
                echo $value
            done
            filelist=()

        fi
        echo ''

    done

    # for value in "${filelist[@]}"
    # do
    #     echo $value
    # done
}


downloadIcbc() {
    splitDate=(${1//_/ })
    
    start_date=${splitDate[0]}
    end_date=${splitDate[1]}

    let run_hours=($(date +%s -d $end_date)-$(date +%s -d $start_date))/3600
    year=${start_date:0:4}
    month=${start_date:4:2}
    day=${start_date:6:2}

    # RELATORIOGFSFTP=$LOCAL/relatorio.gfs.0p25.${year}${month}${day}.log
    cd $icbcDir

    for i in `seq 0 3 $run_hours`; do
        hour=`printf "%03i\n" $i`
        wget -O "gfs.t00z.pgrb2.0p25.f$hour" -nc "https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod/gfs.$year$month$day/00/atmos/gfs.t00z.pgrb2.0p25.f$hour"

    done
}

run() {
    checkPath
    
    if [ $icbcDirTrue == true ]; then
        downloadIcbc $1
    fi
}

main() {
    local icbcDirTrue=false
    run $1
}

icbcDir=/run/media/carolina/MyHD/RODADAS/Projects/CICC/$1

defineDates $1
# main $1