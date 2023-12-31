from datetime import datetime, timedelta, timezone

from airflow import DAG
from airflow.operators.bash import BashOperator
# from airflow.operators.bash_operator import BashOperator

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

dag_name = "um_r_wrf"
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

dag = DAG(
    dag_id=dag_name,
    default_args=args,
    schedule_interval=None, # '* * * * *' = 1 min // '@daily' // '@once' // None
)

with dag:

    link_namelist_wps = BashOperator(
        task_id='Link_Namelist_WPS',
        bash_command=_link_namelist_wps,
        dag=dag
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

    update_namelist_input = BashOperator(
        task_id='Update_Namelist_Input',
        bash_command=_update_namelist_input,
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


link_namelist_wps >> run_ungrib >> run_metgrid >> update_namelist_input >> link_namelist_input >> run_real >> run_wrf

if __name__ == "__main__":
    dag.cli()

# # Meetup de Introdução ao Airflow - #1 AmapáDev
# https://www.youtube.com/watch?v=Dik5-_NYAA0&list=LL&index=2&t=2490s

# https://airflow.apache.org/docs/apache-airflow/stable/howto/operator/bash.html
