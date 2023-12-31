mydatabase = 'mydb'
# mydatabase = 'video_db'

mainPath = '/mnt/sdb2/RODADAS/Projects'

# oldPath = '/mnt/sdb2/RODADAS/Projects'

icbcPath = f'{mainPath}/CICC'
wpsPath = '/mnt/sdb2/ARW_MODEL/WPS'
wrfPath = '/mnt/sdb2/ARW_MODEL/WRF/run'

defaultNamelistWpsPath   = '../namelists/default_namelist.wps'
defaultNamelistInputPath = '../namelists/default_namelist.input'


geogrid_out_folder = 'GEOGRID_OUT'
ungrib_out_folder  = 'UNGRIB_OUT'
metgrid_out_folder = 'METGRID_OUT'

nicks = ['prec', 'tmp', 'moist', 'hdiv', 'conv', 'kidx', 'omg']

icbc_models = ['GFS', 'ECMWF']

icbc_models_prefix = {
    'GFS'  : 'gfs',
    'ECMWF': 'ECMWF',
}
icbc_models_ext = {
    'GFS'  : '.grib2',
    'ECMWF': '_south_america.grb',
}

prefixWrfout = 'wrfout_d0'
prefixWrfrst = 'wrfrst_d0'


########## Namelists ##########
systemMaxDoms = 3


### Both
interval_seconds           = 10800
parent_grid_ratio          = 3


### Namelist.wps

# Geogrid
nWpsConst = {
    # Share
    'wrf_core'        : f"'ARW'",
    'interval_seconds': interval_seconds,
    'io_form_geogrid' : 2,
    'debug_level'     : 0,

    # Geogrid
    'geog_data_res'        : [f"'30s'"],
    'map_proj'             : f"'mercator'",
    'truelat2'             : 0,
    'geog_data_path'       : f"'../Build_WRF/WPS_GEOG'",
    'opt_geogrid_tbl_path' : f"'./geogrid'",

    # Ungrib
    'out_format': f"'WPS'",
    'prefix'    : f"'FILE'",

    # Metgrid
    'fg_name'             : f"'FILE'",
    'io_form_metgrid'     : 2,
    'opt_metgrid_tbl_path': f"'./metgrid'"
}

### Namelist.input

nInputConsts = {
    # Time control
    'run_days'           : 0,
    'run_minutes'        : 0,
    'run_seconds'        : 0,
    'interval_seconds'   : interval_seconds,
    'input_from_file'    : ['.true.'],
    'history_interval'   : ['60']    ,
    'frames_per_outfile' : ['1000'],

    'restart'          : '.false',
    'restart_interval' : 7200,
    'io_form_history'  : 2,
    'io_form_restart'  : 2,
    'io_form_input'    : 2,
    'io_form_boundary' : 2,


    # Domains
    'time_step_fract_num' : 0,
    'time_step_fract_den' : 1,

    'e_vert'                  : ['45'],
    'dzstretch_s'             : 1.1,
    'p_top_requested'         : 5000,
    'num_metgrid_levels'      : 34,
    'num_metgrid_soil_levels' : 4,
    #
    'feedback'                : 1,
    'smooth_option'           : 0,


    # Physics
    'physics_suite'      : f"'CONUS'",
    'ra_lw_physics'      : ['1'],
    'ra_sw_physics'      : ['1'],
    'radt'               : ['30'],
    'bldt'               : ['0'],
    'cudt'               : ['5'],
    'sf_urban_physics'   : ['0'],

    'icloud'             : '1',
    'num_land_cat'       : '21',
    'sf_urban_physics'   : ['0'],
    'fractional_seaice'  : '1',

    # Dynamics
    'hybrid_opt'       : 2,
    'w_damping'        : 0,
    'diff_opt'         : ['2'] ,
    'km_opt'           : ['4'],
    'diff_6th_opt'     : ['0'],
    'diff_6th_factor'  : ['0.12'],
    'base_temp'        : '290.',
    'damp_opt'         : 3,
    'zdamp'            : ['5000.'],
    'dampcoef'         : ['0.2'],
    'khdif'            : ['0'],
    'kvdif'            : ['0'],
    'non_hydrostatic'  : ['.true.'],
    'moist_adv_opt'    : ['1']       ,
    'scalar_adv_opt'   : ['1']       ,
    'gwd_opt'          : ['1', '0', '0'],
    'epssm'            : ['0.2'],


    # Bdy Control
    'spec_bdy_width' : 5,
    'specified' : '.true',
    # specified : ['.true.', '.false.', '.false.'],
    # nested    : ['.false', '.true.', '.true.'],

    'nio_tasks_per_group' : 0,
    'nio_groups' : 1,
}