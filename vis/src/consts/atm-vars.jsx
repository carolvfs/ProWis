import { scaleLinear } from 'd3'

const nicks = ['prec', 'kidx', 'hdiv', 'omg', 'conv', 'moist', 'tmp']

const colorPallete = {
    prec    : [['#f2f2f2', '#2c7bb6', '#00a6ca', '#00ccbc', '#90eb9d', '#ffff8c', '#f9d057', '#f29e2e', '#e76818', '#d7191c', '#800000']],
    omg     : [['#f7fbff', '#e3eef9', '#cfe1f2', '#b5d4e9', '#93c3df', '#6daed5', '#4b97c9', '#2f7ebc', '#1864aa', '#0a4a90', '#08306b']],
    // omg    : [['#f2f2f2', '#2c7bb6', '#00a6ca', '#00ccbc', '#90eb9d', '#ffff8c', '#f9d057', '#f29e2e', '#e76818', '#d7191c', '#800000']],
    tmp     : [['#ffffe5', '#fff8c4', '#feeaa1', '#fed676', '#feba4a', '#fb992c', '#ee7918', '#d85b0a', '#b74304', '#8f3204', '#662506']],
    moist   : [['#ffffd9', '#e2f4ce', '#c6e8c2', '#a9ddb7', '#7ec6ba', '#53aebc', '#2897bf', '#2079a5', '#185a8c', '#103c72', '#081d58']],
    // hdiv    : [['#f2f2f2', '#2c7bb6', '#00a6ca', '#00ccbc', '#90eb9d', '#ffff8c', '#f9d057', '#f29e2e', '#e76818', '#d7191c', '#800000']],
    hdiv    : [['#f7fbff', '#e3eef9', '#cfe1f2', '#b5d4e9', '#93c3df', '#6daed5', '#4b97c9', '#2f7ebc', '#1864aa', '#0a4a90', '#08306b']],
    // conv    : [['#f2f2f2', '#2c7bb6', '#00a6ca', '#00ccbc', '#90eb9d', '#ffff8c', '#f9d057', '#f29e2e', '#e76818', '#d7191c', '#800000']],
    conv    : [['#f7fbff', '#e3eef9', '#cfe1f2', '#b5d4e9', '#93c3df', '#6daed5', '#4b97c9', '#2f7ebc', '#1864aa', '#0a4a90', '#08306b']],
    kidx    : [['#ffffe5', '#fff8c4', '#feeaa1', '#fed676', '#feba4a', '#fb992c', '#ee7918', '#d85b0a', '#b74304', '#8f3204', '#662506']],
    prob    : [['#ffffff', '#E8F6F3', '#D0ECE7', '#A2D9CE', '#73C6B6', '#45B39D', '#16A085', '#138D75', '#117A65', '#0E6655', '#0B5345']]

}

const heatColor = Object.keys(colorPallete).reduce((o, key) => ({ ...o, [key]: scaleLinear().range(colorPallete[key][0])}), {})

const offset   = Object.keys(colorPallete).reduce((o, key) => ({ ...o, [key]: [
    {offset: "0%"  , color: colorPallete[key][0][0]},
    {offset: "10%" , color: colorPallete[key][0][1]},
    {offset: "20%" , color: colorPallete[key][0][2]},
    {offset: "30%" , color: colorPallete[key][0][3]},
    {offset: "40%" , color: colorPallete[key][0][4]},
    {offset: "50%" , color: colorPallete[key][0][5]},
    {offset: "60%" , color: colorPallete[key][0][6]},
    {offset: "70%" , color: colorPallete[key][0][7]},
    {offset: "80%" , color: colorPallete[key][0][8]},
    {offset: "90%" , color: colorPallete[key][0][9]},
    {offset: "100%", color: colorPallete[key][0][10]}
]}), {})

const thresholds = {
    prec  : Array(51).fill(0).map((x, y) => x + y*10),
    tmp   : Array(51).fill(0).map((x, y) => x + y*2),
    moist : Array(21).fill(0).map((x, y) => x + y*10),
    hdiv  : Array(51).fill(0).map((x, y) => x + y*10),
    conv  : Array(51).fill(0).map((x, y) => x + y*10),
    kidx  : Array(11).fill(0).map((x, y) => x + y*4),
    omg   : Array(51).fill(0).map((x, y) => x + y*1),
    prob  : Array(11).fill(0).map((x, y) => x + y*0.1),
}

const fields = {
    prec  : { nick: 'prec' , name: 'Precipitation'          , shortName: 'Precip.'    , unit: 'mm'     , ticks: 4, lineColor: '#0099cc' },
    hdiv  : { nick: 'hdiv' , name: 'Divergence at 300hPa'   , shortName: 'Div.300hPa' , unit: 'x10⁻⁵/s', ticks: 4, lineColor: '#e15759' },
    omg   : { nick: 'w'    , name: 'W at 500hPa'            , shortName: 'W500hPa'    , unit: 'm/s'    , ticks: 4, lineColor: '#9467bd' },
    tmp   : { nick: 'tmp'  , name: 'Temperature at 2m'      , shortName: 'Temp.2m'    , unit: '°C'     , ticks: 4, lineColor: '#edc949' },
    conv  : { nick: 'conv' , name: 'Convergence at 850hPa'  , shortName: 'Conv.850hPa', unit: 'x10⁻⁵/s', ticks: 4, lineColor: '#76b7b2' },
    kidx  : { nick: 'kidx' , name: 'K-Index'                , shortName: 'K-Idx'      , unit: '°C'     , ticks: 4, lineColor: '#f28e2c' },
    moist : { nick: 'moist', name: 'Rel. Humidity at 850hPa', shortName: 'R.H.850hPa' , unit: '%'      , ticks: 4, lineColor: '#4e79a7' },
    prob  : { nick: 'prob' , name: 'Probability'            , shortName: 'Prob.'      , unit: '%'      , ticks: 3, lineColor: '#0099cc' },
}


const colorDomain = {
    prec : Array(11).fill(0).map((x, y) => x + y*10),
    tmp  : Array(11).fill(0).map((x, y) => x + y*4),
    moist: Array(11).fill(0).map((x, y) => x + y*10),
    hdiv : Array(11).fill(0).map((x, y) => x + y*5),
    conv : Array(11).fill(0).map((x, y) => x + y*5),
    kidx : Array(11).fill(0).map((x, y) => x + y*4),
    omg  : Array(11).fill(0).map((x, y) => x + y*1),
    prob : Array(11).fill(0).map((x, y) => x + y*0.1),
}

const ranges = {
    prec  : [0, Math.max(...colorDomain.prec)],
    tmp   : [0, Math.max(...colorDomain.tmp)] ,
    hdiv  : [0, Math.max(...colorDomain.hdiv)] ,
    conv  : [0, Math.max(...colorDomain.conv)] ,
    omg   : [0, Math.max(...colorDomain.omg)],
    kidx  : [0, Math.max(...colorDomain.kidx)] ,
    moist : [0, Math.max(...colorDomain.moist)],
}


const atmvars_consts = {
    nicks,
    ranges,
    fields,
    heatColor,
    offset,
    thresholds,
    colorDomain,

}

export default atmvars_consts