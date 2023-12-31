import React, { useRef, useState, useEffect, useCallback } from 'react'
import './SetupMap.css'

import * as d3 from 'd3'
import * as topojson_client from 'topojson-client'
import brasil_rj from '../../assets/brasil_rj.json'
import wind_rose from '../../assets/wind_rose.png'
import wps from '../../consts/wps'


const SetupMap = ({ 
  
  activeCt,
  activeId,
        
  list,
  coarse_res,
  saveGrid,

  typedLon,
  typedLat,
  typedCt,


  updateCt,
  updateTypedCt,
  updateSaveGrid,
  updateEweEsn,
  updateRefXY,
  updateIJParents,
  updateNwSe,


}) => {

  ///////// STATE
  const [domStrokeW, setDomStrokeW] = useState('2px')

  ///////// REFS

  const myRef = useRef()

  const svg      = useRef()
  const mapGroup = useRef()
  const domGroup = useRef()
  const wrGroup  = useRef()

  const centerPt = useRef()

  const brush = useRef()

  const coarseRes     = useRef()
  const myActiveId    = useRef()
  const myActiveCt    = useRef()
  
  const activeTl = useRef()
  const activeBr = useRef()

  const centerLonLat = useRef()

  const nw = useRef()
  const se = useRef()

  const scales = useRef()

  const xGroup = useRef()
  const yGroup = useRef()
  
  const xScale = useRef()
  const yScale = useRef()

  ///////// CONSTS

  const contentWidth = 800
  const contentHeight = 800

  const margin = { top: 20, bottom: 10, left: 10, right: 10 }

  const width = contentWidth - margin.left - margin.right
  const height = contentHeight - margin.top - margin.bottom

  const tjsonPaddingX = 550
  const tjsonPaddingY = 100

  const tjson = topojson_client.feature(brasil_rj, brasil_rj.objects.brasil_rj)

  const projection = d3.geoMercator()
    .scale(1000)
    .translate([width+tjsonPaddingX, tjsonPaddingY])

  const path = d3.geoPath().projection(projection)
  
  const ctPtFill = 'orange'
  const ctPtStrk = 'black'
  
  ///////// USE CALLBACKS

  const adjustNesting = useCallback((tl, br) => {

    const ip = Math.round(xScale.current.invert(tl[0]), 0)
    const jp = Math.round(yScale.current.invert(br[1]), 0)

    const is = Math.round(xScale.current.invert(br[0]), 0)
    const js = Math.round(yScale.current.invert(tl[1]), 0)

    const e_we = (is - ip) * wps.parent_grid_ratio + 1
    const e_sn = (js - jp) * wps.parent_grid_ratio + 1

    const _tl = [xScale.current(ip), yScale.current(js)]
    const _br = [xScale.current(is), yScale.current(jp)]

    updateEweEsn(e_we, e_sn)
    updateIJParents(ip, jp)

    mapGroup.current
            .call(brush.current)
            .call(brush.current.move, [_tl, _br])

  }, [updateEweEsn, updateIJParents])
  
  const init = useCallback(() => {

    svg.current      = d3.select('.setup-map-svg-group')
    mapGroup.current = d3.select('.setup-map-group')
    domGroup.current = d3.select('.setup-domain-group')
    wrGroup.current  = d3.select('.wind-rose-group')

    centerPt.current = d3.select('.setup-map-center-point')

    centerPt.current
      .attr('cx', null)
      .attr('cy', null)
      .attr('fill', 'none')
      .attr('stroke', 'none')

    xGroup.current = d3.select('.setup-x-scale')
    yGroup.current = d3.select('.setup-y-scale')

    const wr = wrGroup.current.selectAll('.wind-rose')
      .data([wind_rose])

    wr.exit().remove()

    wr
      .attr('xlink:href', d => d)
      .attr('y', height-770)
    
    wr.enter().append('image')
      .attr('class', 'wind-rose')
        .attr('xlink:href', d => d)
        .attr('width', 90)
        .attr('height', 90)
        .attr('x', width-120)
        .attr('y', height-770)

  
  }, [height, width])

  const drawDomains = useCallback(() => {

    const dom = domGroup.current
      .selectAll('.domain')
      .data(list)

      dom.exit().remove()

      dom
        .attr('x', d => computeX(d))
        .attr('y', d => computeY(d))
        .attr('width', d => computeWidth(d))
        .attr('height', d => computeHeight(d))
        .attr('stroke-width', domStrokeW)
        // .attr('stroke', d => d.id === ldId ? 'none' : '#000000')
        .attr('stroke', '#000000')

      dom.enter().append('rect')
        .attr('class', 'domain')
        .attr('x', d => computeX(d))
        .attr('y', d => computeY(d))
        .attr('width', d => computeWidth(d))
        .attr('height', d => computeHeight(d))
        .attr('fill', 'none')
        .attr('stroke', '#000000')
        .attr('stroke-width', domStrokeW)

      function computeX(d) {
        return projection([d.nw_lon, d.nw_lat])[0]

      }

      function computeY(d) {
        return projection([d.nw_lon, d.nw_lat])[1]
      }

      function computeWidth(d) {
        return projection([d.se_lon, d.se_lat])[0] - projection([d.nw_lon, d.nw_lat])[0]
      }

      function computeHeight(d) {
        return projection([d.se_lon, d.se_lat])[1] - projection([d.nw_lon, d.nw_lat])[1]
      }


  }, [projection, list, domStrokeW])

  const setCoarseDomain = useCallback((tl, br) => {

    const bl = [tl[0], br[1]] // let         
    
    // delta_x in radians
    const width_rad  = d3.geoDistance(projection.invert(bl), projection.invert(br))
    
    // delta_y in radians
    const height_rad = d3.geoDistance(projection.invert(bl), projection.invert(tl))
    
    // e_we = Math.trunc(width_rad / coarseRes.current)  + 1 // returns the integer portion of a number.
    // e_sn = Math.trunc(height_rad / coarseRes.current) + 1// returns the integer portion of a number.
    
    const e_we = Math.round(width_rad / coarseRes.current)  + 1 // returns the integer portion of a number.
    const e_sn = Math.round(height_rad / coarseRes.current) + 1// returns the integer portion of a number.
    const ct_lat = parseFloat(centerLonLat.current[1])
    
    const ct_t_lat = ct_lat + coarseRes.current * ((e_sn-1)/2) * (180 / Math.PI) // center-top
    const ct_b_lat = ct_lat - coarseRes.current * ((e_sn-1)/2) * (180 / Math.PI) // center-bottom
    
    const ct_lon = parseFloat(centerLonLat.current[0])
    
    const ct_r_lon = ct_lon + coarseRes.current * ((e_we-1)/2) * (180 / Math.PI) / Math.cos(ct_lat * Math.PI/180) // center-right
    const ct_l_lon = ct_lon - coarseRes.current * ((e_we-1)/2) * (180 / Math.PI) / Math.cos(ct_lat * Math.PI/180) // center-left
    
    const new_br_lonlat = [ct_r_lon, ct_b_lat]
    const new_tl_lonlat = [ct_l_lon, ct_t_lat]
    
    const new_br = projection(new_br_lonlat)
    const new_tl = projection(new_tl_lonlat)
      
    const ref_x = e_we / 2
    const ref_y = e_sn / 2
 
    updateRefXY(ref_x, ref_y)
    updateIJParents(1, 1)
    
    updateEweEsn(e_we, e_sn)

    mapGroup.current
        .call(brush.current)
        .call(brush.current.move, [new_tl, new_br])

  }, [projection, updateRefXY, updateIJParents, updateEweEsn])
 
  const setBrush = useCallback(() => {
    
    const _brush = d3.brush()
      .on('brush', brushing)
      .on('end', brushend)

    return _brush

    function brushing(event) {
      const { selection } = event

      if(selection) {
        
        // update center

        const tl = selection[0]
        const br = selection[1]

        activeTl.current = tl
        activeBr.current = br

        const delta_x = br[0] - tl[0]
        const delta_y = br[1] - tl[1]

        const xc = tl[0] + delta_x/2
        const yc = tl[1] + delta_y/2

        centerLonLat.current[0] = parseFloat(projection.invert([xc, yc])[0].toFixed(4))
        centerLonLat.current[1] = parseFloat(projection.invert([xc, yc])[1].toFixed(4))
        
        const tlLonLat = projection.invert(tl)
        
        nw.current[0] = parseFloat(tlLonLat[0].toFixed(4))
        nw.current[1] = parseFloat(tlLonLat[1].toFixed(4))
        
        const brLonLat = projection.invert(br)
        
        se.current[0] = parseFloat(brLonLat[0].toFixed(4))
        se.current[1] = parseFloat(brLonLat[1].toFixed(4))

        centerPt.current
            .attr('cx', xc)
            .attr('cy', yc)
            .attr('fill', ctPtFill)
            .attr('stroke', ctPtStrk)

        updateCt(centerLonLat.current)
        updateNwSe(nw.current, se.current)

      } else {
        
        centerPt.current
              .attr('cx', null)
              .attr('cy', null)
              .attr('fill', 'none')
              .attr('stroke', 'none')
            
        centerLonLat.current[0] = null
        centerLonLat.current[1] = null

        nw.current[0] = null
        nw.current[1] = null

        se.current[0] = null
        se.current[1] = null
        
        activeTl.current = [null, null]
        activeBr.current = [null, null]
        
        updateCt(centerLonLat.current)
        updateNwSe(nw.current, se.current)
        updateRefXY(null, null)
        updateEweEsn(null, null)

      }

    }

    function brushend(event) {
      const { selection, sourceEvent } = event

      if (!sourceEvent) return
      
      if (!selection) {
        resetVars()

      } else {
        const tl = selection[0]
        const br = selection[1]

        updateCt(centerLonLat.current)
        updateNwSe(nw.current, se.current)

        if(myActiveId.current === 1) {
          
          if(coarseRes.current) {
            setCoarseDomain(tl, br)
            
          } else {

            centerLonLat.current[0] = null
            centerLonLat.current[1] = null

            nw.current[0] = null
            nw.current[1] = null

            se.current[0] = null
            se.current[1] = null

            activeTl.current = [null, null]
            activeBr.current = [null, null]
            
            updateCt(centerLonLat.current)
            updateNwSe(nw.current, se.current)
            updateRefXY(null, null)
            updateEweEsn(null, null)
            updateRefXY(null, null)

            mapGroup.current
                .call(_brush)
                .call(_brush.move, null)
          }

        } else {

          adjustNesting(tl, br)
        }

        // console.log(projection.invert(tl), projection.invert(br))
      }


      function resetVars() {
        centerPt.current
              .attr('cx', null)
              .attr('cy', null)
              .attr('fill', 'none')
              .attr('stroke', 'none')


        centerLonLat.current[0] = null
        centerLonLat.current[1] = null

        nw.current[0] = null
        se.current[1] = null
        
        activeTl.current = [null, null]
        activeBr.current = [null, null]

        updateCt(centerLonLat.current)
        updateNwSe(nw.current, se.current)
        updateRefXY(null, null)
        updateEweEsn(null, null)
      }

    }

  }, [projection, updateCt, updateNwSe, updateRefXY, updateEweEsn, setCoarseDomain, adjustNesting])

  const setScales = useCallback(() => {

    scales.current = list.map(d => createScales(d))

    const scale = scales.current.at(-1)

    if(scale){
      xScale.current = scale.x
      yScale.current = scale.y
    }

    function createScales(d) {
      
      const initI  = projection([d.nw_lon, d.nw_lat])[0]
      const finalI = projection([d.se_lon, d.se_lat])[0]

      const initJ  = projection([d.nw_lon, d.nw_lat])[1]
      const finalJ = projection([d.se_lon, d.se_lat])[1]

      const xRange = [initI, finalI]
      const yRange = [initJ, finalJ]

      const x = d3.scaleLinear()
      const y = d3.scaleLinear()

      xGroup.current.attr("transform", `translate(0, ${initJ})`)
      yGroup.current.attr("transform", `translate(${initI}, 0)`)

      x.domain([1, d.e_we]).range(xRange)
      y.domain([d.e_sn, 1]).range(yRange)

      return { x, y }
    }


  }, [projection, list])

  const setZoom = useCallback(() => {
    const _zoom = d3.zoom()
      .scaleExtent([1, 70])
     .on('zoom', zoomed)

     return _zoom

    function zoomed(event) {
        const { transform } = event

        mapGroup.current.attr('transform', transform)
        domGroup.current.attr('transform', transform)
        centerPt.current.attr('transform', transform)

        // vis.gridGroup.attr('transform', transform)

        svg.current.selectAll('.setup-tjon').style("stroke-width", 0.8 / transform.k + "px")
        svg.current.selectAll('rect.selection').style("stroke-width", 0.8 / transform.k + "px")
        svg.current.selectAll('.setup-map-center-point').attr("r", 3 / transform.k + "px")
        svg.current.selectAll('.setup-map-center-point').style("stroke-width", 0.8 / transform.k + "px")
        svg.current.selectAll('.domain').style("stroke-width", 2.0 / transform.k + "px")
        svg.current.selectAll('.target-text').style("font-size", 12 / transform.k + "px")
        svg.current.selectAll('.scale').style("stroke-width", 0.8 / transform.k + "px")
        svg.current.selectAll('.scale').style("font-size", 12 / transform.k + "px")

        setDomStrokeW(`${2.0 / transform.k}px`)
    }

  }, [])

  const update = useCallback(() => {

    // MAP ZOOM BRUSH
    mapGroup.current.selectAll('.setup-tjon')
      .data(tjson.features)
      .enter().append('path')
      .attr('class', 'setup-tjon')
      .attr('d', path)

    const zoom = setZoom()
    brush.current = setBrush()

    mapGroup.current.call(zoom).on('mousedown.zoom', null)
    mapGroup.current.call(brush.current)


  }, [path, tjson.features, setZoom, setBrush])

  const updateBrush = useCallback(() => {
    if(saveGrid) {

      mapGroup.current
        .call(brush.current)
        .call(brush.current.move, null)

      updateSaveGrid(false)

    } else if(typedCt) {

      const delta_x = projection(myActiveCt.current)[0] - projection([typedLon, typedLat])[0]
      const delta_y = projection(myActiveCt.current)[1] - projection([typedLon, typedLat])[1]

      const newTopLeft     = [ activeTl.current[0] - delta_x, activeTl.current[1] - delta_y ]
      const newBottomRight = [ activeBr.current[0] - delta_x, activeBr.current[1] - delta_y ]
      
      mapGroup.current
        .call(brush.current)
        .call(brush.current.move, [newTopLeft, newBottomRight])

      if(myActiveId.current !== 1) {
        adjustNesting(newTopLeft, newBottomRight)
      }
      
      updateTypedCt(false)
    }
    
  }, [projection, saveGrid, typedCt, typedLon, typedLat, updateTypedCt, updateSaveGrid, adjustNesting])

  
  ///////// USE EFFECTS

  useEffect(() => { if (centerLonLat.current === undefined) centerLonLat.current =  [null, null] },[])
  useEffect(() => { if (nw.current === undefined) nw.current =  [null, null] },[])
  useEffect(() => { if (se.current === undefined) se.current =  [null, null] },[])
  
  useEffect(() => { coarseRes.current  = parseFloat(coarse_res)  / (wps.earth_radius * 1000) }, [coarse_res])
  useEffect(() => { myActiveId.current = activeId  }, [activeId])
  useEffect(() => { myActiveCt.current = activeCt  }, [activeCt])

  useEffect(() => { if (activeTl.current === undefined) activeTl.current = [null, null]  }, [])
  useEffect(() => { if (activeBr.current === undefined) activeBr.current = [null, null]  }, [])
  useEffect(() => { if (scales.current   === undefined) scales.current = []  }, [])

  useEffect(() => { init() }, [init])
  
  useEffect(() => { update() }, [update])
  
  useEffect(() => { updateBrush() }, [updateBrush])

  useEffect(() => { 
    drawDomains()
    setScales()
  
  }, [drawDomains, setScales])

    return (
      <div className="setup-map" ref={myRef}>
        <svg className='setup-map-svg' width={contentWidth} height={contentHeight}>
          <g className='setup-map-svg-group' width={width} height={height} transform={`translate(0, ${margin.top})`}>
            <g className="setup-map-svg-group-wrapper">
              <g className="setup-map-group"></g>
                <circle className='setup-map-center-point' r={3}></circle>
                <g className='setup-x-scale'></g>
                <g className='setup-y-scale'></g>
            </g>
            <g className="setup-domain-group"></g>
            <g className='wind-rose-group'></g>
            
          </g>
        </svg>
      </div>
    )

}

export default SetupMap