import React, { useRef, useState, useEffect, useCallback } from 'react'
import './Hmap.css'

import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import brasil_rj from '../../assets/brasil_rj.json'

import atmvars_consts from '../../consts/atm-vars'

const Hmap = ({ data, gridInfo, gridPts, activeGridPt, field, domIdx, mapIdx, hmatMinMax, updateGridPt }) => {

    const contentWidth = 450
    const contentHeight = 240

    const margin = { top: 10, bottom: 10, left: 10, right: 10 }
    
    const width = contentWidth - margin.left - margin.right
    const height = contentHeight - margin.top - margin.bottom

    const hmapWidth = width - 50

    const myRef = useRef()

    const svg      = useRef()
    const mapGroup = useRef()
    const ptsGroup = useRef()
    const pinGroup = useRef()
    const tjGroup  = useRef()
    const idx      = useRef()
    
    const tjson = topojson.mesh(brasil_rj, brasil_rj.objects.brasil_rj)

    const tjStroke0  = 0.8
    const pinStroke0 = 1
    const pinScale1  = 3
    const pinScale2  = 4
    const ptRadiusD1 = 1.5
    const ptRadiusD2 = 1
    const ptRadiusD3 = 0.5

    const [tjStroke, setTjStroke] = useState(tjStroke0)
    const [ptRadius, setPtRadius] = useState(0)
    const [zoomK   , setZoomK]    = useState(1)

    const init = useCallback(() => {

      svg.current      = d3.select(`#hmap-svg-group-${idx.current}`)
      mapGroup.current = d3.select(`#hmap-group-${idx.current}`)
      ptsGroup.current = d3.select(`#hmap-pts-group-${idx.current}`)
      pinGroup.current = d3.select(`#hmap-pin-group-${idx.current}`)
      tjGroup.current  = d3.select(`#hmap-tjson-group-${idx.current}`)


    }, [])

    const setZoom = useCallback(() => {
      const _zoom = d3.zoom()
      .scaleExtent([1, 90])
      .on('zoom', zoomed)

      return _zoom

      function zoomed(event) {
        const { transform } = event
        mapGroup.current.attr('transform', transform)
        tjGroup.current.attr('transform' , transform)
        ptsGroup.current.attr('transform', transform)
        pinGroup.current.attr('transform', transform)

        svg.current.selectAll(`hmap-tjson-group-${idx.current}`).style("stroke-width", `${tjStroke0 / transform.k}px`)
        // svg.current.selectAll('rect.selection').style("stroke-width", 0.8 / transform.k + "px")
        pinGroup.current.style('stroke-width', `${pinStroke0 / transform.k}px`)
        setTjStroke(`${tjStroke0 / transform.k}px`)
        setZoomK(transform.k)
      }

    }, [tjStroke0, pinStroke0])
    
    const update = useCallback(() => {

      const processData = () => {
        const processedData = contours(data).map(invert)
        return processedData
  
        function invert(d) {
            var p = {
                type: "Polygon",
                coordinates: d3.merge(d.coordinates.map(polygon => {
                    return polygon.map(ring => {
                        return ring.map(point => {
                            return [
                              contourLng(point[0]),
                              contourLat(point[1])
                            ]
                        }).reverse()
                    })
                }))
            }
            p.value = d.value
            return p
        }
      }
      
      const updateContours = () => {
        const m    = gridInfo[7] // nRows     
        const n    = gridInfo[8] // nCols

        const contours = d3.contours()
            .size([n, m])

        return contours
      }
      
      const updateProjection = () => {
        const latCenter = parseFloat(gridInfo[3])
        const lonCenter = parseFloat(gridInfo[6])
  
        const scale = calculateProjectionScale()
  
        const projection = d3.geoMercator()
            .scale(scale)
            .center([lonCenter, latCenter])
            .translate([width / 2, 100])
            .precision(0.1)
  
        return projection
  
        function calculateProjectionScale() {
            const refDist  = 80 // km
            const refScale = 12000
  
            const ref = refDist * refScale
  
            const gridDistance = parseInt(gridInfo[9]) / 1000
            const nPts = gridInfo[7] > gridInfo[8]
                ? gridInfo[7] : gridInfo[8]
  
            const distKm = (nPts - 1) * gridDistance
  
            const scl = ref / distKm
  
            return scl
        }
      }

      const updateTopojson = () => {

        const nLat = parseFloat(gridInfo[1])
        const sLat = parseFloat(gridInfo[2])
        const wLon = parseFloat(gridInfo[4])
        const eLon = parseFloat(gridInfo[5])
  
        const topLeft     = projection([wLon,nLat])
        const bottomRight = projection([eLon,sLat])
  
        createDefs()
        appendPath()
        // appendEdge()
  
        function createDefs() {
          d3.select(`#hmap-${mapIdx}-clip-tjson`).remove()
  
          const defs = tjGroup.current.append('defs')
          
          defs.append('clipPath')
              .attr('id', `hmap-${mapIdx}-clip-tjson`)
              .call(appendRect)
  
              function appendRect(selection) {
     
                selection.append('rect')
                    .attr('class', 'rectClip')
                    .attr('x', topLeft[0])
                    .attr('y', topLeft[1])
                    .attr('width', bottomRight[0]-topLeft[0])
                    .attr('height', bottomRight[1]-topLeft[1])
            }
  
        }
  
        function appendPath() {
          d3.select(`.hmap-${idx.current}-tjson`).remove()

          tjGroup.current.append('path')
            .datum(tjson)
            .attr('class', `hmap-${idx.current}-tjson`)
            .attr('d', path)
            .attr('clip-path', `url(#hmap-${idx.current}-clip-tjson)`)
            .attr('pointer-events', 'none')      
            .style('fill', 'none')
            .style('stroke', 'rgb(61, 60, 60)')
            .style('stroke-width', tjStroke)

        }
  
        // function appendEdge() {
        //   const _width  = bottomRight[0] -topLeft[0]
        //   const _height = bottomRight[1] -topLeft[1]
          
        //   d3.select(`.hmap-tjson-edge`).remove()
    
        //   tjGroup.current.append('rect')
        //       .attr('class', `hmap-tjson-edge`)
        //       .attr('x', topLeft[0])
        //       .attr('y', topLeft[1])
        //       .attr('width', _width)
        //       .attr('height', _height)
        //       .attr('fill', 'none')
        //       .attr('stroke', 'black')
        // }
      }

      const updateScales = () => {
        const m    = gridInfo[7] // nRows
        const n    = gridInfo[8] // nCols

        const contourLat = d3.scaleLinear()
            .domain([0, m])
            .range([gridInfo[1], gridInfo[2]]) // latN --> latS

        const contourLng = d3.scaleLinear()
            .domain([0, n])
            .range([gridInfo[4], gridInfo[5]]) // lonW --> lonE

        return { contourLng, contourLat }
      }

      const updateHeatMap = () => {
        // DATA JOIN
        let hmap = mapGroup.current.selectAll('path.contours')
            .data(pData)

        // EXIT
        hmap.exit()
            .remove()

        //UPDATE
        hmap.attr('d', path)
            // .attr('clip-path', `url(#hmap-clip-${domIdx})`)
            .attr('fill', d => color(d.value))

        // ENTER
        const hmapEnter = hmap.enter().append('path')
            .attr('class', 'contours')
            .attr('id', `contours-${field}`)
            .attr('d', path)
            .attr('fill', d => color(d.value))
            
        // MERGE
        hmap = hmapEnter.merge(hmap)

      }

      const updatePoints = () => {
        const pts = ptsGroup.current.selectAll(".hmap-pts")
              .data(gridPts)
  
        pts.exit().remove()
  
        pts.attr('cx', d  => projection([d.lon, d.lat])[0])
            .attr('cy', d => projection([d.lon, d.lat])[1])
            .attr('r', () => {
              const newR = zoomK < 5
                ? pinScale1*ptRadius 
                : pinScale2*ptRadius
              return newR

            })
            .attr('fill', 'black')
  
        pts.enter().append('circle')
            .attr('class', "hmap-pts")
            .attr('cx', d => projection([d.lon, d.lat])[0])
            .attr('cy', d => projection([d.lon, d.lat])[1])
            .attr('r', () => {
              
              const newR = zoomK < 5
                ? pinScale1*ptRadius 
                : pinScale2*ptRadius
              return newR

            })

            .attr('fill', 'black')
            .attr('cursor', 'pointer')
            .attr('fill-opacity', 0.2)
            .on('click', function(e, d) {
                updateGridPt(d.pt, domIdx)
            })
          
          const myPt = gridPts.filter(p => p.pt === activeGridPt)

          const pin = pinGroup.current.selectAll(".hmap-pin")
            .data(myPt)

          pin.exit().remove()

          pin
            .attr('cx', d => projection([d.lon, d.lat])[0])
            .attr('cy', d => projection([d.lon, d.lat])[1])
            .attr('r', () => {
              const newR = zoomK < 5
                ? 2*pinScale1*ptRadius 
                : 2*pinScale2*ptRadius
              return newR
  
            })

          pin.enter().append('circle')
            .attr('class', 'hmap-pin')
           .attr('id', `hmap-pin-${mapIdx}`)
           .attr('cx', d => projection([d.lon, d.lat])[0])
           .attr('cy', d => projection([d.lon, d.lat])[1])
           .attr('r', () => {
            const newR = zoomK < 5
              ? 2*ptRadius 
              : 8*ptRadius
            return newR

          })


          // pin.attr('d', "M0,0l-8.8-17.7C-12.1-24.3-7.4-32,0-32h0c7.4,0,12.1,7.7,8.8,14.3L0,0z")
          //   .attr('transform', d => `translate(${projection([d.lon,d.lat])})`)


          // pin.enter().append('path')
          //   .attr('class', 'hmap-pin')
          //   .attr('id', `hmap-pin-${mapIdx}`)
          //   .attr('d', "M0,0l-8.8-17.7C-12.1-24.3-7.4-32,0-32h0c7.4,0,12.1,7.7,8.8,14.3L0,0z")
          //   .attr('transform', d => `translate(${projection([d.lon,d.lat])})`)


      }
      
      
      const zoom = setZoom()
      zoom.translateExtent([[0, 0], [width, height]])
      svg.current.call(zoom)
      
      const projection = updateProjection()
      const path       = d3.geoPath().projection(projection)
      const contours   = updateContours().thresholds(atmvars_consts.thresholds[field])
      const { contourLng, contourLat } = updateScales()
      
      const pData = processData()
      
      const minValue = d3.min(data)
      const maxValue = d3.max(data)
      const step     = (maxValue-minValue)/10

      const newArr = Array(11).fill(minValue).map((d,i) => d + i*step)

      const colorArr = hmatMinMax ?  newArr : atmvars_consts.colorDomain[field]

      const color = atmvars_consts.heatColor[field].domain(colorArr)
      
      updateHeatMap()
      updateTopojson()
      updatePoints()

    }, [data, gridInfo, field, domIdx, ptRadius, zoomK, hmatMinMax, mapIdx, updateGridPt, height, tjStroke, tjson, width, gridPts, activeGridPt, setZoom])

        
    useEffect(() => { const newR = domIdx === 0 ? ptRadiusD1/zoomK : domIdx === 1 ? ptRadiusD2/zoomK : ptRadiusD3/zoomK ; setPtRadius(newR)}, [domIdx, zoomK])
    useEffect(() => { idx.current = mapIdx }, [mapIdx])
    useEffect(() => { init() }, [init])
    useEffect(() => { update() }, [update])

    return (
        <div className="hmap" ref={myRef}>
          <svg className="hmap-svg"           id={`hmap-svg-${mapIdx}`}         width={width} height={height}>
            <g className="hmap-svg-group"     id={`hmap-svg-group-${mapIdx}`}   transform={`translate(0, ${margin.top})`}>
              <g className="hmap-group"       id={`hmap-group-${mapIdx}`}     width={hmapWidth}></g>
              <g className="hmap-pts-group"   id={`hmap-pts-group-${mapIdx}`} width={hmapWidth}></g>
              <g className="hmap-pin-group"   id={`hmap-pin-group-${mapIdx}`} width={hmapWidth}></g>
              <g className="hmap-tjson-group" id={`hmap-tjson-group-${mapIdx}`}></g>
            </g>
          </svg>
        </div>
      )

}

export default Hmap