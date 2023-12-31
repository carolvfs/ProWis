import React, { useRef, useEffect, useCallback } from 'react'
import './Hmat.css'

import atmvars_consts from '../../consts/atm-vars'
import measures from '../../consts/measures'

import * as d3 from 'd3'
import { useState } from 'react'

const Hmat = ({ atmvar, field, data, activeTime, meas, nTimes, intervalP, hmatMinMax, updateHmatMinMax, updateTime, updateInterval }) => {

  // SVG
  const margin = { top: 10, bottom: 10, left: 10, right: 10 }
  const height = 115  - margin.top - margin.bottom
  const width  = 1080 - margin.left - margin.right

  const y0       = 5

  // MEMBERS
  const xTarget  = 25

  const wallWidth  = 20//80//110
  // const wallHeight = 30//height

  // HMAT
  const xHmat     = xTarget + wallWidth + 10
  const hmatWidth = width - 50 - xHmat

  // LEGEND
  const legWidth   = 18
  const legHeight  = height - 10

  const xLeg  = hmatWidth + legWidth + xHmat + 10

  const brushStroke   = 'blue'//colors.darkBlue
  const brushStrokeT0 = 'red' //colors.red

  // SCALES
  const xScale = d3.scaleBand().padding(0).range([0, hmatWidth])
  // const yScale = d3.scaleBand().padding(0).range([height+y0, y0])
  const yScale = d3.scaleBand().padding(0).range([height, 0])

  // AXIS
  const xAxis = d3.axisTop(xScale)
    .tickSize(0)
    .tickFormat(v => `${v}h`)

  const yAxis = d3.axisLeft(yScale)
    .tickSize(0)
    .tickFormat(v => `R${v}`)

  
  // REFS
  const myRef        = useRef()
  const hmatGroup    = useRef()
  const xAxisGroup   = useRef()
  const yAxisGroup   = useRef()
  const legGroup     = useRef()
  const legAxisGroup = useRef()
  const wallGroup    = useRef()
  const brushGroup   = useRef()
  const timeGroup    = useRef()

  const linearGradient = useRef()

  const brush = useRef()

  const x0_scaled = useRef()
  const x1_scaled = useRef()

  const x0 = useRef()
  const x1 = useRef()
  
  const prevAccIdx = useRef()
  prevAccIdx.current   = 0

  const isBrushing = useRef()

  const [accIdx, setAccIdx] = useState(0)


  // BRUSH
  const callBrush = useCallback(() => {

    brushGroup.current
      .call(brush.current)
      .call(g => g.select('.overlay')
      .datum({ type: 'selection'}))

    x0_scaled.current = xScale(x0.current)
    x1_scaled.current = x1.current === nTimes ? hmatWidth : xScale(x1.current)

    brushGroup.current
          .transition().duration(500)
          .call(brush.current.move, [x0_scaled.current, x1_scaled.current])

    d3.selectAll(".hmat-brush rect.selection")
        .attr('stroke', x0_scaled.current <= 0 ? brushStrokeT0 : brushStroke)
  
  },[xScale, nTimes, hmatWidth])
  
  const setBrush = useCallback(() => {

    const _brush = d3.brushX()

    _brush.extent([[0,y0], [hmatWidth, height+y0]])
      .on('brush', brushing)
      .on('end', brushend)

    return _brush

    function brushing() {
      isBrushing.current = true
      
    }

    function brushend(event) {
      const { selection } = event

      const  upBrush = () => {

        const _x0 = xScale.domain()[idx0]
        const _x1 = idx1 === nTimes ? nTimes : xScale.domain()[idx1]
        
        x0_scaled.current = xScale(_x0)
        x1_scaled.current = _x1 === nTimes ? hmatWidth : xScale(_x1)
        
        x0.current = _x0
        x1.current = _x1
        
        d3.select(this)
          .transition().duration(1500)
          .call(brush.current.move, () => _x1 > _x0 ? [x0_scaled.current, x1_scaled.current] : null)
                
        updateInterval(_x0, _x1-1)

        isBrushing.current = false
      }

      let idx0 = activeTime
      let idx1 = activeTime + 1

      if(!event.sourceEvent) {
        if(!selection) {
          upBrush()
          
        } else return
 
      } else {
        const eachBand = xScale.step()
        idx0 = Math.round((selection[0] / eachBand ))
        idx1 = Math.round((selection[1] / eachBand ))
        upBrush()
      }

    }

  }, [y0, hmatWidth, height, xScale, activeTime, nTimes, updateInterval])

  const updateBrush = useCallback(() => {
    const ti = intervalP[0]
    const tf = intervalP[1]

    x0.current = ti
    x1.current = tf + 1

  },[intervalP])

  
  // INIT
  const init = useCallback(() => {

    hmatGroup.current    = d3.select(`#hmat-group-${atmvar}`)
    xAxisGroup.current   = d3.select(`#hmat-x-axis-group-${atmvar}`)
    yAxisGroup.current   = d3.select(`#hmat-y-axis-group-${atmvar}`)
    legGroup.current     = d3.select(`#hmat-legend-group-${atmvar}`)
    legAxisGroup.current = d3.select(`#hmat-legend-axis-group-${atmvar}`)
    wallGroup.current    = d3.select(`#hmat-wall-group-${atmvar}`)
    brushGroup.current   = d3.select(".hmat-brush-group")
    timeGroup.current    = d3.selectAll(".hmat-time-group")

    linearGradient.current = d3.select(`#hmat-linear-gradient-${atmvar}`)

    linearGradient.current.attr("x1", "0%")
        .attr("y1" , "100%")
        .attr("x2" , "0%")
        .attr("y2" , "0%")

    brush.current = setBrush()

    x0.current        = null
    x1.current        = null

    x0_scaled.current = null
    x1_scaled.current = null

    isBrushing.current = false

  }, [atmvar, setBrush])

  
  // UPDATE
  const update = useCallback(() => {

    const addColors = (offset) => {
      const lg = linearGradient.current.selectAll(`#stop-hmat-${atmvar}`)
            .data(offset)

      lg.exit().remove()

      lg.attr("offset", d => d.offset)
      .attr("stop-color", d => d.color)
      
      lg.enter().append('stop')
          .attr('id', `stop-hmat-${atmvar}`)
          .attr("offset", d => d.offset)
          .attr("stop-color", d => d.color)
    }

    const handleTimeClick = () => {
      d3.selectAll('.hmat-x-axis-group g.tick').on('click', function(e) {

        const path = e.path || (e.composedPath && e.composedPath()) // chrome || firefox

        const clickedTick = path[0].__data__
        updateTime(clickedTick)     
      })
    }

    const updateAxis = () => {
      // const pad = nTimes -1 > 72 ? 12 : 3
      const pad = nTimes -1 > 72 ? 6 : 3
      
      const xArray     = [...new Set(data.map(d => d.time))]
      const xAxisTicks = xArray.filter(d => d % pad === 0)
      xAxis.tickValues(xAxisTicks)

      const yArray = [...new Set(data.map(d => d.wfInternalId))]
      xScale.domain(xArray)
      yScale.domain(yArray)

    }

    const updateCells = () => {

      // DATA JOIN
      const cell = hmatGroup.current.selectAll(`#hmat-cell-${atmvar}`)
        .data(data)

      // EXIT
      cell.exit().remove()

      // UPDATE
      cell
          .attr('x'     , d => xScale(d.time))
          .attr('y'     , d => yScale(d.wfInternalId))
          .attr('width' , xScale.bandwidth)
          .attr('height', yScale.bandwidth)
          .attr('stroke', d => meas === measures[3][0] ? defineStroke(d) : defineColor(d))
          .attr('fill'  , d => defineColor(d))
          .attr('stroke-width', 1)

      // ENTER
      cell.enter().append('rect')
          .attr('class' , 'hmat-cell')
          .attr('id'    , `hmat-cell-${atmvar}`)
          .attr('x'     , d => xScale(d.time))
          .attr('y'     , d => yScale(d.wfInternalId))
          .attr('width' , xScale.bandwidth)
          .attr('height', yScale.bandwidth)
          .attr('fill'  , d => defineColor(d))
          .attr('stroke', d => meas === measures[3][0] ? defineStroke(d) : defineColor(d))


      function defineStroke(d) {
        return d.value[0] === 1 ? '#b3b3b3' : '#e6e6e6'
      }

      function defineColor(d) {
                
        if(atmvar !== atmvars_consts.nicks[0] || d.time === 0) {
            return color(d.value[0])
        } else {
            return color(d.value[accIdx])
        }
      }

    }

    const updateLegend = () => {

      const rectData = meas === measures[3][0] ? [] : ['myRect']

      const rect = legGroup.current.selectAll(`#hmat-legend-${atmvar}`)
        .data(rectData)

      rect.exit().remove()

      rect.attr('x', xLeg)
        .attr('y', height - legHeight)
        .attr('width', legWidth)
        .attr('height', legHeight)
        .attr("fill", `url(#hmat-linear-gradient-${atmvar})`)
        .style("stroke", 'grey')

      rect.enter().append('rect')
        .attr('class', 'hmat-leg')
        .attr('id', `hmat-legend-${atmvar}`)
        .attr('x', xLeg)
        .attr('y', height - legHeight)
        .attr('width', legWidth)
        .attr('height', legHeight)
        .attr("fill", `url(#hmat-linear-gradient-${atmvar})`)
        .style("stroke", 'grey')
        .attr('cursor', () => atmvar === atmvars_consts.nicks[0] && meas !== measures[3][0]
            ? 'pointer'
            : 'default'
        )
        .on('click', () => {

          if(atmvar === atmvars_consts.nicks[0] && meas !== measures[3][0]){
              const newAccIdx = prevAccIdx.current = prevAccIdx.current  === 2
                ? 0
                : prevAccIdx.current + 1
              
                setAccIdx(newAccIdx)
          }
      })

      const circleData = meas === measures[3][0] ? [true, false] : []
      const radius = 4

      const circle = legGroup.current.selectAll(`#hmat-prob-leg-circle-${atmvar}`)
            .data(circleData)

      circle.exit().remove()

      circle
          .attr('fill', d => color(d))

      circle.enter().append('circle')
          .attr('class', 'hmat-prob-leg-circle')
          .attr('id', `hmat-prob-leg-circle-${atmvar}`)
          .attr('cx', width - 35)
          .attr('cy', (d, i) => 10 + 20 * i)
          .attr('r', radius)
          .attr('fill', d => color(d))
          .attr('stroke', 'black')

      const label = legGroup.current.selectAll(`#hmat-prob-leg-label-${atmvar}`)
          .data(circleData)

      label.exit().remove()

      label.attr('x', width - 25)
          .attr('y', (d, i) => 10 + 20 * i + radius)
          .attr('fill', 'black')

      label.enter().append('text')
          .attr('class', 'hmat-prob-leg-label')
          .attr('id', `hmat-prob-leg-label-${atmvar}`)
          .attr('x', width - 25)
          .attr('y', (d, i) => 10 + 20 * i + 4)
          .attr('fill', 'black')
          .attr('font-size', '10px')
          .text(d => d.toString())

    }

    const updateLegendAxis = () => {
      let legY    = null
      let legAxis = null

      if(meas === measures[3][0]) {
        legY = d3.scaleLinear()
            .domain([0, 0])
            .range([0, 0])
        
        legAxis = d3.axisLeft(legY)
            .ticks(0)
            .tickSize(0)

      } else {

        legY = d3.scaleLinear()
                .domain([min, max])
                .range([height, height - legHeight])
            
        legAxis = d3.axisLeft(legY)
            .ticks(4)
            .tickSize(2)
      }

      legAxisGroup.current.call(legAxis)

    }

    const updateTimeLine = () => {

      const eachBand = xScale.step()
      
      const timeRect = timeGroup.current.selectAll(".hmat-time-rect")
        .data(['time-rect'])

      timeRect.exit().remove()

      timeRect.transition().duration(500)
        .attr('x', () => xScale(activeTime))

      timeRect.enter().append('rect')
        .attr('class', 'hmat-time-rect')
        .attr('x', () => xScale(activeTime))
        .attr('y', y0)
        .attr('width', eachBand)
        .attr('height', height)
    }

    const updateUnit = (u) => {

      const _unit = legGroup.current.selectAll(`#hmat-unit-${atmvar}`)
        .data([field])

      _unit.exit().remove()

      _unit.text(u)

      _unit.enter().append('text')
        .attr('class', 'hmat-unit')
        .attr('id', `hmat-unit-${field}`)
        .attr('x', xLeg - 4)
        .attr('y', height - legHeight - 5)
        .attr('text-anchor', 'start')
        .attr('font-size', 10)
        .text(u)

    }

    const updateWall = () => {
      // const value = 'myvalue'

      // const info = `${measures[0][1]}: ${value} ${atmvars_consts.fields[atmvar].unit}`

      const target = [
        `${atmvars_consts.fields[atmvar].shortName}`,
        // info,

      ]

      const content = wallGroup.current
            .selectAll(`#hmat-wall-content-${atmvar}`)
            .data(target)

      content.exit()
          .remove()

      content.text(d => d)
                  
      content.enter().append('text')
          .attr('class', 'hmat-wall-content')
          .attr('id', `hmat-wall-content-${atmvar}`)
          .attr('x', 5)
          .attr('y', (d, i) => 15 + i * 15)
          .attr('text-anchor', 'start')
          .attr('font-weight', (d, i) => i === 0 ? 'bold' : 'normal')
          .text(d => d)
    }

    const handleTitleClick = () => {

      d3.selectAll('.hmat-wall-content').on('click', function(e) {
        if(meas !== measures[3][0]) updateHmatMinMax(!hmatMinMax)
      })
    }

    handleTitleClick()

    let colorArr  = atmvars_consts.colorDomain[field]
    let minMaxArr = atmvars_consts.colorDomain[field]
    
    if(hmatMinMax) {
      const vArray = [...new Set(data.map(d => d.value))]
      minMaxArr = vArray.map(v => {
        const myv = atmvar !== atmvars_consts.nicks[0]
        ? v[0]
        : v[accIdx]
        return myv
      })
      
      minMaxArr.sort()
    }

    const min  = d3.min(minMaxArr, d => d)
    const max  = d3.max(minMaxArr, d => d)
    const step = (max-min)/10
 
    if(hmatMinMax) colorArr = Array(11).fill(min).map((d,i) => d + i*step)
    
    const color  = atmvars_consts.heatColor[field].domain(colorArr)
    const offset = meas === measures[3][0] ? null : atmvars_consts.offset[field]
    const unit   = meas === measures[3][0] ? null : atmvars_consts.fields[field].unit

    if(meas !== measures[3][0]) addColors(offset)

    updateLegend()
    updateLegendAxis()
    updateUnit(unit)

    updateAxis()

    handleTimeClick()
    updateCells()
    updateTimeLine()
    updateBrush()

    callBrush()

    xAxisGroup.current.call(xAxis)
    yAxisGroup.current.call(yAxis)

    updateWall()

  }, [accIdx, atmvar, data, meas, activeTime, updateTime, nTimes, width, field, hmatMinMax, updateHmatMinMax, height, legHeight, xAxis, xLeg, xScale, yAxis, yScale, callBrush, updateBrush])


  // EFFECTS
  useEffect(() => { init() }, [init])
  useEffect(() => { update() }, [update])
  useEffect(() => { prevAccIdx.current = accIdx }, [accIdx])

  return (
    <div className="hmat" ref={myRef}>
      <svg className="hmat-svg"             width={width + margin.left + margin.right} height={height + margin.top + margin.bottom}>
        <g className="hmat-svg-group"                         id={`hmat-svg-group-${atmvar}`}    transform={`translate(${margin.left}, ${margin.top})`}>
          <g className="hmat-x-axis-group"                    id={`hmat-x-axis-group-${atmvar}`} transform={`translate(${xHmat}, ${y0})`}></g>
          <g className="hmat-y-axis-group"                    id={`hmat-y-axis-group-${atmvar}`} transform={`translate(${xHmat}, ${y0})`}></g>
          <g className="hmat-group"                           id={`hmat-group-${atmvar}`}        transform={`translate(${xHmat}, ${y0})`} ></g>
          <g className="hmat-legend-group"  width={hmatWidth} id={`hmat-legend-group-${atmvar}`}>
            <defs>
              <linearGradient id={`hmat-linear-gradient-${atmvar}`}></linearGradient>
            </defs>
          </g>
          <g className="hmat-legend-axis-group"                                       id={`hmat-legend-axis-group-${atmvar}`}transform={`translate(${xLeg}, 0)`}></g>
          <g className="hmat-legend-unit-group"                                       id={`hmat-legend-unit-group-${atmvar}`} transform={`translate(${xLeg}, 0)`}></g>
          <g className="hmat-wall-group"                                              id={`hmat-wall-group-${atmvar}`}>
            {/* <rect className="hmat-wall"         width={wallWidth} height={wallHeight} id={`hmat-wall-${atmvar}`} x={0} y={0} rx={2} ></rect> */}
          </g>
          <g className={atmvar === atmvars_consts.nicks[0] ? "hmat-brush-group" : "hmat-time-group"}  transform={`translate(${xHmat}, 0)`}></g>
        </g>
      </svg>
    </div>
  )



}

export default Hmat