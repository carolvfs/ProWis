
-- -- Table Program

insert into "program" ("id", "name", "version") values 
    (1, 'Geogrid', '4.3'),
    (2, 'Ungrib', '4.3'),
    (3, 'Metgrid', '4.3'),
    (4, 'Real'   , '4.3'),
    (5, 'WRF'    , '4.3')
;

-- Table Relation

insert into "relation" ("id", "name") values
    (1, 'geogrid_in'),
    (2, 'ungrib_in'),
    (3, 'metgrid_in'),
    (4, 'real_in'),
    (5, 'wrf_in'),
    (6, 'wrf_out'),
    (7, 'conf')
;

-- Table Attribute Type

insert into "attribute_type" ("id", "name") values

    (1, 'date'),
    (2, 'string'),
    (3, 'integer'),
    (4, 'float')
;

-- Table Attribute

insert into "attribute" ("id", "name", "type_id", "relation_id", "size") values   
    
    -- Ungrib Input
    (default,  'start_date'     , 1,  2, 19),
    (default,  'end_date'       , 1,  2, 19),
    (default,  'run_hours'      , 4,  2,  5),
    (default,  'ungrib_out_path', 2,  2, 100),
    (default,  'icbc_model'     , 2,  2, 10),

    
    -- Geogrid Input
    (default,  'coarse_res'      , 3,  1, 5),
    (default,  'ref_lon_1'       , 4,  1, 5),
    (default,  'ref_lat_1'       , 4,  1, 5),
    (default,  'ref_x'           , 4,  1, 4),
    (default,  'ref_y'           , 4,  1, 4),
    (default, 'e_we_1'          , 4,  1, 3),
    (default, 'e_we_2'          , 4,  1, 3),
    (default, 'e_we_3'          , 4, 1, 3),
    (default, 'e_sn_1'          , 4, 1, 3),
    (default, 'e_sn_2'          , 4, 1, 3),
    (default, 'e_sn_3'          , 4, 1, 3),
    
    (default, 'grid_id_1', 3, 1, 1),
    (default, 'grid_id_2', 3, 1, 1),
    (default, 'grid_id_3', 3, 1, 1),
    
    (default, 'i_parent_1', 3, 1, 3),
    (default, 'i_parent_2', 3, 1, 3),
    (default, 'i_parent_3', 3, 1, 3),
    (default, 'j_parent_1', 3, 1, 3),
    (default, 'j_parent_2', 3, 1, 3),
    (default, 'j_parent_3', 3, 1, 3),
    (default, 'parent_id_1', 4,  1, 1),
    (default, 'parent_id_2', 4,  1, 1),
    (default, 'parent_id_3', 4,  1, 1),
    (default, 'geogrid_out_path' , 2, 1, 100),

    -- Metgrid Input
    (default, 'metgrid_out_path', 4, 3, 100),

    -- Real Input
    (default, 'mp_physics'   , 3, 4, 3),
    (default, 'cumulus'      , 3, 4, 3),
    (default, 'pbl'          , 3, 4, 3),
    (default, 'land_surface' , 3, 4, 3),
    (default, 'surface_layer', 3, 4, 3),

    -- WRF Input
    (default, 'wrf_out_path', 4, 5, 100),

    -- Conf
    (default, 'nw_lat_1', 4, 7, 15),
    (default, 'nw_lat_2', 4, 7, 15),
    (default, 'nw_lat_3', 4, 7, 15),

    (default, 'nw_lon_1', 4, 7, 15),
    (default, 'nw_lon_2', 4, 7, 15),
    (default, 'nw_lon_3', 4, 7, 15),

    (default, 'se_lat_1', 4, 7, 15),
    (default, 'se_lat_2', 4, 7, 15),
    (default, 'se_lat_3', 4, 7, 15),
    
    (default, 'se_lon_1', 4, 7, 15),
    (default, 'se_lon_2', 4, 7, 15),
    (default, 'se_lon_3', 4, 7, 15),

    -- (default, 'br_1', 4, 7, 17),
    -- (default, 'br_2', 4, 7, 17),
    -- (default, 'br_3', 4, 7, 17),

    -- (default, 'tl_1', 4, 7, 17),
    -- (default, 'tl_2', 4, 7, 17),
    -- (default, 'tl_3', 4, 7, 17),

    -- (default, 'bl_i_1', 4, 7, 17),
    -- (default, 'bl_i_2', 4, 7, 17),
    -- (default, 'bl_i_3', 4, 7, 17),

    -- (default, 'br_i_1', 4, 7, 17),
    -- (default, 'br_i_2', 4, 7, 17),
    -- (default, 'br_i_3', 4, 7, 17),

    -- (default, 'bl_j_1', 4, 7, 17),
    -- (default, 'bl_j_2', 4, 7, 17),
    -- (default, 'bl_j_3', 4, 7, 17),

    -- (default, 'tl_j_1', 4, 7, 17),
    -- (default, 'tl_j_2', 4, 7, 17),
    -- (default, 'tl_j_3', 4, 7, 17),

    (default, 'ref_lon_2', 4,  7, 5),
    (default, 'ref_lat_2', 4,  7, 5),
    (default, 'ref_lon_3', 4,  7, 5),
    (default, 'ref_lat_3', 4,  7, 5),
    
    (default, 'res_2', 3, 7, 5),
    (default, 'res_3', 3, 7, 5),

    -- WRF OUTPUT
    (default, 'dom_1', 3, 6, 5), -- dom_id_1
    (default, 'dom_2', 3, 6, 5), -- dom_id_2
    (default, 'dom_3', 3, 6, 5)  -- dom_id_3

;

-- -- -- Table File Type  
-- insert into "file_type" ("id", "name") values
--     (1, 'netcdf')
-- ;

-- -- -- Table Extractor

-- insert into "extractor" ("id", "name", "file_type_id") values
--     (1, 'wrf_output', 1)
-- ;

-- Grid
insert into "grid" ("id", "name") values
    (1, 'Grid 1'),
    (2, 'Grid 2'),
    (3, 'Grid 3')
;

insert into "atmospheric_variable" ("id", "name", "nickname") values
    (1 , 'Precipitation'           , 'prec' ),
    (2 , 'Temperature_2m'          , 'tmp'  ),
    (3 , 'Divergence_300hPa'       , 'hdiv' ),
    (4 , 'Convergence_850hPa'      , 'conv' ),
    (5 , 'Omega_500hPa'            , 'omg'  ),
    (6 , 'Relative_Moisture_850hPa', 'moist'),
    (7 , 'K-Index'                 , 'kidx' )
;

-- Aggregation Measure
insert into "measure_aggregation" ("id", "name", "nickname") values
    (1, 'Average'  , 'avg'),
    (2, 'Maximum'  , 'max'),
    (3, 'StandDev.', 'sd' )
;
