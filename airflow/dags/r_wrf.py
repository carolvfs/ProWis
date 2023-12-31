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

dag_name = "r_wrf"
args = {
    'owner': 'carolvfs',
    'start_date': datetime.now(timezone.utc)# datetime(2021, 7, 1),            
}

mainPath = '/mnt/sdb2/Doutorado/System/airflow'
bashPath = f'{mainPath}/bash_scripts'

end_date     = '\'{{ dag_run.conf["end_date"] if dag_run else "" }}\''
start_date   = '\'{{ dag_run.conf["start_date"] if dag_run else "" }}\''
metPath      = '\'{{ dag_run.conf["metPath"] if dag_run else "" }}\''
wfPath       = '\'{{ dag_run.conf["wfPath"] if dag_run else "" }}\''
domains      = '\'{{ dag_run.conf["domains"] if dag_run else "" }}\''
f_start_date = '\'{{ dag_run.conf["f_start_date"] if dag_run else "" }}\''

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


update_namelist_input >> link_namelist_input >> run_real >> run_wrf


if __name__ == "__main__":
    dag.cli()

# # Meetup de Introdução ao Airflow - #1 AmapáDev
# https://www.youtube.com/watch?v=Dik5-_NYAA0&list=LL&index=2&t=2490s

# https://airflow.apache.org/docs/apache-airflow/stable/howto/operator/bash.html
