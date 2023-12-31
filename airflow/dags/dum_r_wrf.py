from datetime import datetime, timezone

from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator

import sys, os
import requests

#######################################################
##################### Description #####################
#                                                     #
# DAG that handles cases with alterations in:         #
#                                                     #
# domains --- icbc --- parameterizations              #
# domains --- icbc                                    #
#                                                     #
# This is the typical workflow of a run.              #
#                                                     #
#######################################################

dag_name = "dum_r_wrf"
args = {
    'owner': 'carolvfs',
    'start_date': datetime.now(timezone.utc)# datetime(2021, 7, 1),            
}

mainPath = '/mnt/sdb2/Doutorado/System/airflow'
bashPath = f'{mainPath}/bash_scripts'

end_date     = '\'{{ dag_run.conf["end_date"] if dag_run else "" }}\''
start_date   = '\'{{ dag_run.conf["start_date"] if dag_run else "" }}\''
metPath      = '\'{{ dag_run.conf["metPath"] if dag_run else "" }}\''
ungribPath   = '\'{{ dag_run.conf["ungribPath"] if dag_run else "" }}\''
wfPath       = '\'{{ dag_run.conf["wfPath"] if dag_run else "" }}\''
domains      = '\'{{ dag_run.conf["domains"] if dag_run else "" }}\''
icbc_date    = '\'{{ dag_run.conf["icbc_date"] if dag_run else "" }}\''
icbc_model   = '\'{{ dag_run.conf["icbc_model"] if dag_run else "" }}\''
f_start_date = '\'{{ dag_run.conf["f_start_date"] if dag_run else "" }}\''

_link_namelist_wps   = f'{bashPath}/link_namelist_wps.sh {wfPath}'
_run_ungrib          = f'{bashPath}/run_ungrib.sh {icbc_date} {ungribPath} {icbc_model}'
_run_metgrid         = f'{bashPath}/run_metgrid.sh '

_update_namelist_input = f'{bashPath}/update_namelist_input.sh {wfPath} {metPath} {start_date}'
_link_namelist_input   = f'{bashPath}/link_namelist_input.sh {wfPath}'
_run_real              = f'{bashPath}/run_real.sh {metPath} '
_run_wrf               = f'{bashPath}/run_wrf.sh {wfPath} {start_date} {end_date} {f_start_date} {domains}'


def downloadIcbc(**kwargs):
    def check_file_status(filepath, filesize):
        sys.stdout.write('\r')
        sys.stdout.flush()
        size = int(os.stat(filepath).st_size)
        percent_complete = (size/filesize)*100
        sys.stdout.write('%.3f %s' % (percent_complete, '% Completed'))
        sys.stdout.flush()
    
    def download():
        for file in filelist:
            filename=dspath+file
            file_base = os.path.basename(file)

            print('Downloading',file_base)
            
            req = requests.get(filename, cookies = ret.cookies, allow_redirects=True, stream=True)
            filesize = int(req.headers['Content-length'])

            final_file = '{0}/{1}'.format(datePath, file_base)
            
            with open(final_file, 'wb') as outfile:
                chunk_size=1048576
                for chunk in req.iter_content(chunk_size=chunk_size):
                    outfile.write(chunk)
                    if chunk_size < filesize:
                        check_file_status(final_file, filesize)
            
            check_file_status(final_file, filesize)
            print()

    model = kwargs['icbc_model']

    if model == 'GFS':
        today = datetime.now(timezone.utc)
        today = today.strftime("%Y%m%d")

        icbcPath='/mnt/sdb2/RODADAS/Projects/CICC'
        date=kwargs['icbc_date']
        datePath = '/{0}/{1}/{2}'.format(icbcPath, model, date)

        splitDate = date.split('_')
        start_date = splitDate[0]
        end_date = splitDate[1]

        year=start_date[0:4]

        time1 = datetime.strptime(start_date, '%Y%m%d')
        time2 = datetime.strptime(end_date, '%Y%m%d')
        diff = time2 - time1
        run_hours = int(diff.total_seconds()/3600)

        filelist = []
        last_hour =  "{:03d}".format(run_hours)

        if today == start_date:
            dspath = f"https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod/gfs.{start_date}/00/atmos"
            
            for h in range(0, run_hours+1, 3):
                hour =  "{:03d}".format(h)
                file = f"gfs.t00z.pgrb2.0p25.f{hour}"
                file_base = os.path.basename(file)

                filename = f"{dspath}/{file}"

                print('Downloading',file_base)

                req = requests.get(filename)

                final_file = '{0}/{1}'.format(datePath, file_base)

                open(final_file, 'wb').write(req.content)

        else:
    
            pswd='Rda022021'
            email='carolvfs@gmail.com'

            url = 'https://rda.ucar.edu/cgi-bin/login'

            values = {'email' : email, 'passwd' : pswd, 'action' : 'login'}

            # Authenticate
            ret = requests.post(url,data=values)

            if ret.status_code != 200:
                print('Bad Authentication')
                print(ret.text)
                exit(1)

            dspath = 'https://rda.ucar.edu/data/ds084.1/'

            last_file = f'{year}/{start_date}/gfs.0p25.{start_date}00.f{last_hour}.grib2'

            filelist = []

            for h in range(0, run_hours+1, 3):
                hour =  "{:03d}".format(h)
                file = f'{year}/{start_date}/gfs.0p25.{start_date}00.f{hour}.grib2'

                filelist.append(file)

                if len(filelist) == 3 or last_file in filelist:
                    download()
                    filelist = []


dag = DAG(
    dag_id=dag_name,
    default_args=args,
    schedule_interval=None, # '* * * * *' = 1 min // '@daily' // '@once' // None
)

with dag:

    update_namelist_input = BashOperator(
        task_id='Update_Namelist_Input',
        bash_command=_update_namelist_input,
        dag=dag
    )

    link_namelist_wps = BashOperator(
        task_id='Link_Namelist_WPS',
        bash_command=_link_namelist_wps,
        dag=dag
    )

    download_icbc = PythonOperator(
        task_id='Download_ICBC',
        python_callable=downloadIcbc,
        provide_context=True,
        op_kwargs={ 'icbc_date': icbc_date[1:-1], 'icbc_model': icbc_model[1:-1] },
        dag=dag,

    )

    run_ungrib = BashOperator(
        task_id='Ungrib',
        bash_command=_run_ungrib,
        dag=dag
    )

    run_metgrid = BashOperator(
        task_id='Metgrid',
        bash_command=_run_metgrid,
        dag=dag
    )

    link_namelist_input = BashOperator(
        task_id='Link_Namelist_Input',
        bash_command=_link_namelist_input,
        dag=dag
    )

    run_real = BashOperator(
        task_id='Real',
        bash_command=_run_real,
        dag=dag
    )

    run_wrf = BashOperator(
        task_id='WRF',
        bash_command=_run_wrf,
        dag=dag
    )


link_namelist_wps >> download_icbc >> run_ungrib >> run_metgrid >> update_namelist_input >> link_namelist_input >> run_real >> run_wrf


# # Meetup de Introdução ao Airflow - #1 AmapáDev
# https://www.youtube.com/watch?v=Dik5-_NYAA0&list=LL&index=2&t=2490s

# https://airflow.apache.org/docs/apache-airflow/stable/howto/operator/bash.html
