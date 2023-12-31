const colors = [
    '#7570b3', 
    '#e6ab02', 
    '#66a61e', 
    '#edc949', 
    '#fb9a99', 
    '#6a3d9a', 
    '#ff7f0e',
    '#2ca02c',
    '#9467bd',
    '#bcbd22',
    '#17becf',
    '#1f78b4',
    '#a6cee3',
    '#b2df8a',
    '#fdbf6f',
    '#b15928',
    '#377eb8',
    '#4daf4a',
    '#e15759',
    '#edc949',

]

const physicalProcesses = [
    ['pbl'          , 'P. B. L.'],
    ['cumulus'      , 'Cumulus'],
    ['mp_physics'   , 'Micro-physics'],
    ['land_surface' , 'Land Surface'],
    ['surface_layer', 'Surface Layer'],
]

const parameterizations = {

    mp_physics: [
        ['1', 'Kessler'      , colors[0] ],
        ['3', 'WSM3'         , colors[1] ],
        ['5', 'Eta (Ferrier)', colors[2] ],
        ['6', 'WSM6'         , colors[16] ],
        ['7', 'Goddard'      , colors[4] ],
        ['8', 'Thompson'     , colors[5]],

    ],

    cumulus: [
        ['1', 'Kain-Fritsch' , colors[6]],
        ['2', 'BMJ'          , colors[7]],
        ['3', 'Grell-Freitas', colors[8]],
        ['5', 'Grell-3D'     , colors[9]],
        ['93', 'Grell Devenyi' , colors[10]],
    ],

    pbl: [
        ['6' , 'MYNN3' , colors[11]],
        ['1' , 'YSU'   , colors[12]],
        ['2' , 'MYJ'   , colors[13]],
        ['99', 'MRF'   , colors[14]],
        ['8' , 'BouLac', colors[15]],
    ],

    land_surface: [
        ['4', 'NoahMP'    , colors[16]],
        ['1', '5-layer TD', colors[17]],
    ],

    surface_layer: [
        ['1' , 'MM5'     , colors[18]],
        ['91', 'MM5 Old', colors[19]],
    ]
}




const physics = {




    // rasw: {
    //     name: 'R. Short W.',
    //     parameterizations: {
    //         todo1: {
    //             nickname: 'todo',
    //             code: 'todo'
    //         },
    //         todo2: {
    //             nickname: 'todo',
    //             code: ''
    //         },

    //     }
    // },

    // ralw: {
    //     name: 'R. Long W.',
    //     parameterizations: {
    //         todo1: {
    //             nickname: 'todo',
    //             code: 'todo'
    //         },
    //         todo2: {
    //             nickname: 'todo',
    //             code: ''
    //         },

    //     }
    // },

    // urb_physics: {
    //     name: 'Urban',
    //     parameterizations: {
    //         ucm: {
    //             nickname: 'U. Canopy M.',
    //             code: '1'
    //         },
    //         bep: {
    //             nickname: 'BEP',
    //             code: '2'
    //         },
    //     }
    // },
}

export default { physicalProcesses, parameterizations }
