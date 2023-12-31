import os
import shutil
import pymonetdb as db
import datetime as dt
from bin.consts import parent_grid_ratio, nWpsConst, nInputConsts
 
class Namelists_Editor(object):
    def __init__(self) -> None:

        self.__attrs       = {}

        self.__nWps = {
            # Share
            'wrf_core'                    : nWpsConst['wrf_core'],
            'max_dom'                     : None,
            'start_date'                  : None,
            'end_date'                    : None,
            'interval_seconds'            : nWpsConst['interval_seconds'],
            'io_form_geogrid'             : nWpsConst['io_form_geogrid'],
            'opt_output_from_geogrid_path': None,
            'debug_level'                 : nWpsConst['debug_level'],
            
            # Geogrid
            'parent_id'            : None,
            'parent_grid_ratio'    : None,
            'i_parent_start'       : None,
            'j_parent_start'       : None,
            'e_we'                 : None,
            'e_sn'                 : None,
            'geog_data_res'        : None,
            'dx'                   : None,
            'dy'                   : None,
            'map_proj'             : nWpsConst['map_proj'],
            'ref_lat'              : None,
            'ref_lon'              : None,
            'truelat1'             : None,
            'truelat2'             : nWpsConst['truelat2'],
            'stand_lon'            : None,
            'geog_data_path'       : nWpsConst['geog_data_path'],
            'opt_geogrid_tbl_path' : nWpsConst['opt_geogrid_tbl_path'],
            'ref_x'                : None,
            'ref_y'                : None,

            # Ungrib
            'out_format' : nWpsConst['out_format'],
            'prefix'     : nWpsConst['prefix'],

            # Metgrid
            'fg_name'                      : nWpsConst['fg_name'],
            'io_form_metgrid'              : nWpsConst['io_form_metgrid'],
            'opt_output_from_metgrid_path' : None,
            'opt_metgrid_tbl_path'         : nWpsConst['opt_metgrid_tbl_path']

        }

        self.__nInput = {
            # Time Control
            'run_days'          : nInputConsts['run_days'],
            'run_hours'         : None,
            'run_minutes'       : nInputConsts['run_minutes'],
            'run_seconds'       : nInputConsts['run_seconds'],
            'start_year'        : None,
            'start_month'       : None,
            'start_day'         : None,
            'start_hour'        : None,
            'end_year'          : None,
            'end_month'         : None,
            'end_day'           : None,
            'end_hour'          : None,
            'interval_seconds'  : nInputConsts['interval_seconds'],
            'input_from_file'   : None,
            'history_interval'  : None,
            'frames_per_outfile': None,
            'restart'           : nInputConsts['restart'],
            'restart_interval'  : nInputConsts['restart_interval'],
            'io_form_history'   : nInputConsts['io_form_history'],
            'io_form_restart'   : nInputConsts['io_form_restart'],
            'io_form_input'     : nInputConsts['io_form_input'],
            'io_form_boundary'  : nInputConsts['io_form_boundary'],

            # Domains
            'time_step'               : None,
            'time_step_fract_num'     : nInputConsts['time_step_fract_num'],
            'time_step_fract_den'     : nInputConsts['time_step_fract_den'],
            'max_dom'                 : None,
            'e_we'                    : None,
            'e_sn'                    : None,
            'e_vert'                  : None,
            'dzstretch_s'             : nInputConsts['dzstretch_s'],
            'p_top_requested'         : nInputConsts['p_top_requested'],
            'num_metgrid_levels'      : nInputConsts['num_metgrid_levels'],
            'num_metgrid_soil_levels' : nInputConsts['num_metgrid_soil_levels'],
            'dx'                      : None,
            'dy'                      : None,
            'grid_id'                 : None,
            'parent_id'               : None,
            'i_parent_start'          : None,
            'j_parent_start'          : None,
            'parent_grid_ratio'       : None,
            'parent_time_step_ratio'  : None,
            'feedback'                : nInputConsts['feedback'],
            'smooth_option'           : nInputConsts['smooth_option'],

            # Physics
            'physics_suite'           : nInputConsts['physics_suite'],
            'mp_physics'              : None,
            'cu_physics'              : None,
            'ra_lw_physics'           : None,
            'ra_sw_physics'           : None,
            'bl_pbl_physics'          : None,
            'sf_sfclay_physics'       : None,
            'sf_surface_physics'      : None,
            'radt'                    : None,
            'bldt'                    : None,
            'cudt'                    : None,
            'icloud'                  : nInputConsts['icloud'],
            'num_land_cat'            : nInputConsts['num_land_cat'],
            'sf_urban_physics'        : None,
            'fractional_seaice'       : nInputConsts['fractional_seaice'],

            # Dynamics
            'hybrid_opt'              : nInputConsts['hybrid_opt'],
            'w_damping'               : nInputConsts['w_damping'],
            'diff_opt'                : None,
            'km_opt'                  : None,
            'diff_6th_opt'            : None,
            'diff_6th_factor'         : None,
            'base_temp'               : nInputConsts['base_temp'],
            'damp_opt'                : nInputConsts['damp_opt'],
            'zdamp'                   : None,
            'dampcoef'                : None,
            'khdif'                   : None,
            'kvdif'                   : None,
            'non_hydrostatic'         : None,
            'moist_adv_opt'           : None,
            'scalar_adv_opt'          : None,
            'gwd_opt'                 : None,

            # B Control
            'spec_bdy_width'          : nInputConsts['spec_bdy_width'],
            'specified'               : nInputConsts['specified'],
            
            # Namelist Quilt
            'nio_tasks_per_group'     : nInputConsts['nio_tasks_per_group'],
            'nio_groups'              : nInputConsts['nio_groups'],


        }
          
    def setAttrs(self, attrs):
        self.__attrs = attrs

        for k, v in attrs.items():
            print(k,v)
                    
    def __computeTimeControl(self):
        output = {}

        start_date_split = self.__attrs['start_date'].split('_')

        start_dt   = start_date_split[0]
        start_time = start_date_split[1]

        start_year   = start_dt.split('-')[0]
        start_month  = start_dt.split('-')[1]
        start_day    = start_dt.split('-')[2]

        start_hour   = start_time.split(':')[0]
        start_minute = start_time.split(':')[1]
        start_second = start_time.split(':')[2]

        end_date_split = self.__attrs['end_date'].split('_')

        end_dt   = end_date_split[0]
        end_time = end_date_split[1]

        end_year   = end_dt.split('-')[0]
        end_month  = end_dt.split('-')[1]
        end_day    = end_dt.split('-')[2]

        end_hour   = end_time.split(':')[0]
        end_minute = end_time.split(':')[1]
        end_second = end_time.split(':')[2]

        start_datetime = dt.datetime(int(start_year), int(start_month), int(start_day), int(start_hour), int(start_minute), int(start_second))
        end_datetime   = dt.datetime(int(end_year), int(end_month), int(end_day), int(end_hour), int(end_minute), int(end_second))

        delta = end_datetime - start_datetime

        delta_seconds = delta.total_seconds()
        delta_minutes = delta_seconds / 60
        delta_hours   = delta_seconds / 3600

        time = int(delta_seconds)
        key  = 'run_seconds'

        if delta_hours.is_integer():
            time = int(delta_hours)
            key = 'run_hours'
            self.__runHours = time

        elif delta_minutes.is_integer():
            time = int(delta_minutes)
            key = 'run_minutes'

        output['start_year']   = str(start_year)
        output['start_month']  = str(start_month)
        output['start_day']    = str(start_day)
        output['start_hour']   = str(start_hour)
        output['start_minute'] = str(start_minute)
        output['start_second'] = str(start_second)

        output['end_year']   = str(end_year)
        output['end_month']  = str(end_month)
        output['end_day']    = str(end_day)
        output['end_hour']   = str(end_hour)
        output['end_minute'] = str(end_minute)
        output['end_second'] = str(end_second)

        output[key] = time

        return output
      
    def computeDynamicValues(self):

        start_date_arr        = [f"'{self.__attrs['start_date']}'"] * self.__attrs['max_dom']
        end_date_arr          = [f"'{self.__attrs['end_date']}'"]     * self.__attrs['max_dom']
        
        parent_id_arr         = []
        i_parent_arr          = []
        j_parent_arr          = []
        e_we_arr              = []
        e_sn_arr              = []

        nNestedDoms = self.__attrs['max_dom'] - 1
        parent_grid_ratio_arr = ['1'] + [str(parent_grid_ratio)] * nNestedDoms
        geog_data_res_arr     = nWpsConst['geog_data_res']       * self.__attrs['max_dom']

        for i in range(1, self.__attrs['max_dom'] + 1):
            pId     = str(self.__attrs[f'parent_id_{i}'])
            iP      = str(self.__attrs[f'i_parent_{i}'])
            jP      = str(self.__attrs[f'j_parent_{i}'])
            eWe     = str(self.__attrs[f'e_we_{i}'])
            eSn     = str(self.__attrs[f'e_sn_{i}'])

            parent_id_arr.append(pId)
            i_parent_arr.append(iP)
            j_parent_arr.append(jP)
            e_we_arr.append(eWe)
            e_sn_arr.append(eSn)

        time_control =  self.__computeTimeControl()
        
        start_year_arr         = [time_control['start_year']]         * self.__attrs['max_dom']
        start_month_arr        = [time_control['start_month']]        * self.__attrs['max_dom']
        start_day_arr          = [time_control['start_day']]          * self.__attrs['max_dom']
        start_hour_arr         = [time_control['start_hour']]         * self.__attrs['max_dom']
        
        end_year_arr           = [time_control['end_year']]           * self.__attrs['max_dom']
        end_month_arr          = [time_control['end_month']]          * self.__attrs['max_dom']
        end_day_arr            = [time_control['end_day']]            * self.__attrs['max_dom']
        end_hour_arr           = [time_control['end_hour']]           * self.__attrs['max_dom']

        input_from_file_arr    = nInputConsts['input_from_file']      * self.__attrs['max_dom']
        history_interval_arr   = nInputConsts['history_interval']     * self.__attrs['max_dom']
        frames_per_outfile_arr = nInputConsts['frames_per_outfile']   * self.__attrs['max_dom']

        e_vert_arr             = nInputConsts['e_vert']               * self.__attrs['max_dom']

        grid_id_arr            = [str(i) for i in range(1, self.__attrs['max_dom'] + 1)]

        mp_physics_arr         = [self.__attrs['mp_physics']]           *  self.__attrs['max_dom']
        cumulus_arr            = [self.__attrs['cumulus']]              *  self.__attrs['max_dom']
        pbl_arr                = [self.__attrs['pbl']]                  *  self.__attrs['max_dom']
        land_surface_arr       = [self.__attrs['land_surface']]         *  self.__attrs['max_dom']
        surface_layer_arr      = [self.__attrs['surface_layer']]        *  self.__attrs['max_dom']

        ra_lw_physics_arr      = nInputConsts['ra_lw_physics']        *  self.__attrs['max_dom']
        ra_sw_physics_arr      = nInputConsts['ra_sw_physics']        *  self.__attrs['max_dom']

        radt_arr               = nInputConsts['radt']                 *  self.__attrs['max_dom']
        bldt_arr               = nInputConsts['bldt']                 *  self.__attrs['max_dom']
        cudt_arr               = nInputConsts['cudt']                 *  self.__attrs['max_dom']

        sf_urban_physics_arr   = nInputConsts['sf_urban_physics']     *  self.__attrs['max_dom']

        
        diff_opt_arr           = nInputConsts['diff_opt']             * self.__attrs['max_dom']
        km_opt_arr             = nInputConsts['km_opt']               * self.__attrs['max_dom']
        diff_6th_opt_arr       = nInputConsts['diff_6th_opt']         * self.__attrs['max_dom']
        diff_6th_factor_arr    = nInputConsts['diff_6th_factor']      * self.__attrs['max_dom']
        zdamp_arr              = nInputConsts['zdamp']                * self.__attrs['max_dom']
        dampcoef_arr           = nInputConsts['dampcoef']             * self.__attrs['max_dom']
        khdif_arr              = nInputConsts['khdif']                * self.__attrs['max_dom']
        kvdif_arr              = nInputConsts['kvdif']                * self.__attrs['max_dom']
        non_hydrostatic_arr    = nInputConsts['non_hydrostatic']      * self.__attrs['max_dom']
        moist_adv_opt_arr      = nInputConsts['moist_adv_opt']        * self.__attrs['max_dom']
        scalar_adv_opt_arr     = nInputConsts['scalar_adv_opt']       * self.__attrs['max_dom']
        
        gwd_opt_arr            = [nInputConsts['gwd_opt'][i] for i in range(self.__attrs['max_dom'])]

        # Share
        self.__nWps['max_dom']                      = self.__attrs['max_dom']
        self.__nWps['start_date']                   = ',     '.join(start_date_arr)
        self.__nWps['end_date']                     = ',     '.join(end_date_arr)
        self.__nWps['opt_output_from_geogrid_path'] = f"'{self.__attrs['geogrid_out_path']}'"

        # Geogrid
        self.__nWps['parent_id']                    = ',     '.join(parent_id_arr)
        self.__nWps['parent_grid_ratio']            = ',     '.join(parent_grid_ratio_arr)
        self.__nWps['i_parent_start']               = ',     '.join(i_parent_arr)
        self.__nWps['j_parent_start']               = ',     '.join(j_parent_arr)
        self.__nWps['e_we']                         = ',     '.join(e_we_arr)
        self.__nWps['e_sn']                         = ',     '.join(e_sn_arr)
        self.__nWps['geog_data_res']                = ',     '.join(geog_data_res_arr)

        self.__nWps['dx']                           = self.__attrs['coarse_res']
        self.__nWps['dy']                           = self.__attrs['coarse_res']

        self.__nWps['ref_lat']                      = self.__attrs['ref_lat_1']
        self.__nWps['ref_lon']                      = self.__attrs['ref_lon_1']
        self.__nWps['truelat1']                     = self.__attrs['ref_lat_1']
        self.__nWps['stand_lon']                    = self.__attrs['ref_lon_1']

        self.__nWps['ref_x']                        = self.__attrs['ref_x']
        self.__nWps['ref_y']                        = self.__attrs['ref_y']

        # Metgrid
        self.__nWps['opt_output_from_metgrid_path'] = f"'{self.__attrs['metgrid_out_path']}'"


        # Time Control
        self.__nInput['run_hours']              = time_control['run_hours']
        self.__nInput['start_year']             = ',     '.join(start_year_arr)
        self.__nInput['start_month']            = ',     '.join(start_month_arr)
        self.__nInput['start_day']              = ',     '.join(start_day_arr)
        self.__nInput['start_hour']             = ',     '.join(start_hour_arr)

        self.__nInput['end_year']               = ',     '.join(end_year_arr)
        self.__nInput['end_month']              = ',     '.join(end_month_arr)
        self.__nInput['end_day']                = ',     '.join(end_day_arr)
        self.__nInput['end_hour']               = ',     '.join(end_hour_arr)

        self.__nInput['input_from_file']        = ',     '.join(input_from_file_arr)
        self.__nInput['history_interval']       = ',     '.join(history_interval_arr)
        self.__nInput['frames_per_outfile']     = ',     '.join(frames_per_outfile_arr)

        # Domains
        self.__nInput['time_step']              = int(int(self.__attrs['coarse_res']) * 6 / 1000)
        self.__nInput['max_dom']                = self.__attrs['max_dom']

        self.__nInput['e_we']                   = self.__nWps['e_we']
        self.__nInput['e_sn']                   = self.__nWps['e_sn']
        self.__nInput['e_vert']                 = ',     '.join(e_vert_arr)

        self.__nInput['dx']                     = self.__attrs['coarse_res']
        self.__nInput['dy']                     = self.__attrs['coarse_res']

        self.__nInput['parent_id']              = self.__nWps['parent_id']
        self.__nInput['grid_id']                = ',     '.join(grid_id_arr)

        self.__nInput['i_parent_start']         = self.__nWps['i_parent_start']
        self.__nInput['j_parent_start']         = self.__nWps['j_parent_start']

        self.__nInput['parent_grid_ratio']      = self.__nWps['parent_grid_ratio']
        self.__nInput['parent_time_step_ratio'] = self.__nWps['parent_grid_ratio']

        # Physics
        self.__nInput['mp_physics']             = ',     '.join(mp_physics_arr)
        self.__nInput['cu_physics']             = ',     '.join(cumulus_arr)
        self.__nInput['bl_pbl_physics']         = ',     '.join(pbl_arr)
        self.__nInput['sf_surface_physics']     = ',     '.join(land_surface_arr)
        self.__nInput['sf_sfclay_physics']      = ',     '.join(surface_layer_arr)
        self.__nInput['ra_lw_physics']          = ',     '.join(ra_lw_physics_arr)
        self.__nInput['ra_sw_physics']          = ',     '.join(ra_sw_physics_arr)
        self.__nInput['ra_lw_physics']          = ',     '.join(ra_lw_physics_arr)
        self.__nInput['radt']                   = ',     '.join(radt_arr)
        self.__nInput['bldt']                   = ',     '.join(bldt_arr)
        self.__nInput['cudt']                   = ',     '.join(cudt_arr)
        self.__nInput['sf_urban_physics']       = ',     '.join(sf_urban_physics_arr)

        # Dynamics
        self.__nInput['diff_opt']               = ',     '.join(diff_opt_arr)       
        self.__nInput['km_opt']                 = ',     '.join(km_opt_arr)         
        self.__nInput['diff_6th_opt']           = ',     '.join(diff_6th_opt_arr)   
        self.__nInput['diff_6th_factor']        = ',     '.join(diff_6th_factor_arr)
        self.__nInput['zdamp']                  = ',     '.join(zdamp_arr)          
        self.__nInput['dampcoef']               = ',     '.join(dampcoef_arr)       
        self.__nInput['khdif']                  = ',     '.join(khdif_arr)          
        self.__nInput['kvdif']                  = ',     '.join(kvdif_arr)          
        self.__nInput['non_hydrostatic']        = ',     '.join(non_hydrostatic_arr)
        self.__nInput['moist_adv_opt']          = ',     '.join(moist_adv_opt_arr)  
        self.__nInput['scalar_adv_opt']         = ',     '.join(scalar_adv_opt_arr) 
        self.__nInput['gwd_opt']                = ',     '.join(gwd_opt_arr)        
        
    def createNamelistInput(self, dstPath):
        with open(f'{dstPath}/namelist.input', 'w', newline='') as nInput:
            content = """
&time_control
run_days                            = {run_days},
run_hours                           = {run_hours},
run_minutes                         = {run_minutes},
run_seconds                         = {run_seconds},
start_year                          = {start_year},
start_month                         = {start_month},
start_day                           = {start_day},
start_hour                          = {start_hour},
end_year                            = {end_year},
end_month                           = {end_month},
end_day                             = {end_day},
end_hour                            = {end_hour},
interval_seconds                    = {interval_seconds}
input_from_file                     = {input_from_file},
history_interval                    = {history_interval},
frames_per_outfile                  = {frames_per_outfile},
restart                             = {restart},
restart_interval                    = {restart_interval},
io_form_history                     = {io_form_history}
io_form_restart                     = {io_form_restart}
io_form_input                       = {io_form_input}
io_form_boundary                    = {io_form_boundary}
/

&domains
time_step                           = {time_step},
time_step_fract_num                 = {time_step_fract_num},
time_step_fract_den                 = {time_step_fract_den},
max_dom                             = {max_dom},
e_we                                = {e_we},
e_sn                                = {e_sn},
e_vert                              = {e_vert},
dzstretch_s                         = {dzstretch_s},
p_top_requested                     = {p_top_requested},
num_metgrid_levels                  = {num_metgrid_levels},
num_metgrid_soil_levels             = {num_metgrid_soil_levels},
dx                                  = {dx},
dy                                  = {dy},
grid_id                             = {grid_id},
parent_id                           = {parent_id},
i_parent_start                      = {i_parent_start},
j_parent_start                      = {j_parent_start},
parent_grid_ratio                   = {parent_grid_ratio},
parent_time_step_ratio              = {parent_time_step_ratio},
feedback                            = {feedback},
smooth_option                       = {smooth_option}
/

&physics
physics_suite                       = {physics_suite}
mp_physics                          = {mp_physics},
cu_physics                          = {cu_physics},
ra_lw_physics                       = {ra_lw_physics},
ra_sw_physics                       = {ra_sw_physics},
bl_pbl_physics                      = {bl_pbl_physics},
sf_sfclay_physics                   = {sf_sfclay_physics},
sf_surface_physics                  = {sf_surface_physics},
radt                                = {radt},
bldt                                = {bldt},
cudt                                = {cudt},
icloud                              = {icloud},
num_land_cat                        = {num_land_cat},
sf_urban_physics                    = {sf_urban_physics},
fractional_seaice                   = {fractional_seaice},
/

&fdda
/

&dynamics
hybrid_opt                          = {hybrid_opt} 
w_damping                           = {w_damping},
diff_opt                            = {diff_opt},
km_opt                              = {km_opt},
diff_6th_opt                        = {diff_6th_opt},
diff_6th_factor                     = {diff_6th_factor},
base_temp                           = {base_temp}
damp_opt                            = {damp_opt},
zdamp                               = {zdamp},
dampcoef                            = {dampcoef},
khdif                               = {khdif},
kvdif                               = {kvdif},
non_hydrostatic                     = {non_hydrostatic},
moist_adv_opt                       = {moist_adv_opt},
scalar_adv_opt                      = {scalar_adv_opt},
gwd_opt                             = {gwd_opt},
/

&bdy_control
spec_bdy_width                      = {spec_bdy_width},
specified                           = {specified}
/

&grib2
/

&namelist_quilt
nio_tasks_per_group = {nio_tasks_per_group},
nio_groups = {nio_groups},
/
            
""".format(**self.__nInput)

            nInput.writelines(content)
  
    def createNamelistWps(self, dstPath):
        with open(f'{dstPath}/namelist.wps', 'w', newline='') as nWps:

            content = """
&share
wrf_core = {wrf_core},
max_dom = {max_dom},
start_date = {start_date},
end_date   = {end_date},
interval_seconds = {interval_seconds},
io_form_geogrid = {io_form_geogrid},
opt_output_from_geogrid_path={opt_output_from_geogrid_path},
debug_level = {debug_level},
/

&geogrid
parent_id         = {parent_id},
parent_grid_ratio = {parent_grid_ratio},
i_parent_start    = {i_parent_start},
j_parent_start    = {j_parent_start},
e_we              = {e_we},
e_sn              = {e_sn},
geog_data_res     = {geog_data_res},
dx = {dx},
dy = {dy},
map_proj  = {map_proj},
ref_lat   = {ref_lat},
ref_lon   = {ref_lon},
truelat1  = {truelat1},
truelat2  = {truelat2},
stand_lon = {stand_lon},
geog_data_path = {geog_data_path},
opt_geogrid_tbl_path = {opt_geogrid_tbl_path},
ref_x = {ref_x},
ref_y = {ref_y},
/

&ungrib
out_format = {out_format},
prefix = {prefix},
/

&metgrid
fg_name = {fg_name},
io_form_metgrid = {io_form_metgrid},
opt_output_from_metgrid_path = {opt_output_from_metgrid_path},
opt_metgrid_tbl_path = {opt_metgrid_tbl_path}
/

            
""".format(**self.__nWps)

            nWps.writelines(content)

    def reset(self):
        self.__attrs       = {}

         # Share
        self.__nWps['max_dom']                      = None
        self.__nWps['start_date']                   = None
        self.__nWps['end_date']                     = None
        self.__nWps['opt_output_from_geogrid_path'] = None

        # Geogrid
        self.__nWps['parent_id']                    = None
        self.__nWps['parent_grid_ratio']            = None
        self.__nWps['i_parent_start']               = None
        self.__nWps['j_parent_start']               = None
        self.__nWps['e_we']                         = None
        self.__nWps['e_sn']                         = None
        self.__nWps['geog_data_res']                = None

        self.__nWps['dx']                           = None
        self.__nWps['dy']                           = None

        self.__nWps['ref_lat']                      = None
        self.__nWps['ref_lon']                      = None
        self.__nWps['truelat1']                     = None
        self.__nWps['stand_lon']                    = None

        self.__nWps['ref_x']                        = None
        self.__nWps['ref_y']                        = None

        # Metgrid
        self.__nWps['opt_output_from_metgrid_path'] = None

        # Time Control
        self.__nInput['run_hours']                  = None
        self.__nInput['start_year']                 = None
        self.__nInput['start_month']                = None
        self.__nInput['start_day']                  = None
        self.__nInput['start_hour']                 = None

        self.__nInput['end_year']                   = None
        self.__nInput['end_month']                  = None
        self.__nInput['end_day']                    = None
        self.__nInput['end_hour']                   = None

        self.__nInput['input_from_file']            = None
        self.__nInput['history_interval']           = None
        self.__nInput['frames_per_outfile']         = None

        # Domains
        self.__nInput['time_step']                  = None
        self.__nInput['max_dom']                    = None

        self.__nInput['e_we']                       = None
        self.__nInput['e_sn']                       = None
        self.__nInput['e_vert']                     = None

        self.__nInput['dx']                         = None
        self.__nInput['dy']                         = None

        self.__nInput['parent_id']                  = None
        self.__nInput['grid_id']                    = None

        self.__nInput['i_parent_start']             = None
        self.__nInput['j_parent_start']             = None

        self.__nInput['parent_grid_ratio']          = None
        self.__nInput['parent_time_step_ratio']     = None

        # Physics
        self.__nInput['mp_physics']                 = None
        self.__nInput['cu_physics']                 = None
        self.__nInput['bl_pbl_physics']             = None
        self.__nInput['sf_surface_physics']         = None
        self.__nInput['sf_sfclay_physics']          = None
        self.__nInput['ra_lw_physics']              = None
        self.__nInput['ra_sw_physics']              = None
        self.__nInput['ra_lw_physics']              = None
        self.__nInput['radt']                       = None
        self.__nInput['bldt']                       = None
        self.__nInput['cudt']                       = None
        self.__nInput['sf_urban_physics']           = None

        # Dynamics
        self.__nInput['diff_opt_arr       ']        = None
        self.__nInput['km_opt_arr         ']        = None
        self.__nInput['diff_6th_opt_arr   ']        = None
        self.__nInput['diff_6th_factor_arr']        = None
        self.__nInput['zdamp_arr          ']        = None
        self.__nInput['dampcoef_arr       ']        = None
        self.__nInput['khdif_arr          ']        = None
        self.__nInput['kvdif_arr          ']        = None
        self.__nInput['non_hydrostatic_arr']        = None
        self.__nInput['moist_adv_opt_arr  ']        = None
        self.__nInput['scalar_adv_opt_arr ']        = None
        self.__nInput['gwd_opt_arr        ']        = None

       