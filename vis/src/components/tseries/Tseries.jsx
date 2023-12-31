import React, { useRef, useEffect, useCallback } from 'react'
import './Tseries.css'

import * as d3 from 'd3'

import atmvars_consts from '../../consts/atm-vars'

const Tseries = ({ data, activeTime, atmvar, meas, nTimes, updateTime, sbTime, sbStep, sbIsActive, tseriesMinMax, updateTseriesMinMax }) => {
  const margin   = { top: 10, bottom: 20, left: 20, right: 10 }
  const height   = 110 - margin.top - margin.bottom
  
  // const width    = 710 - margin.left - margin.right
  const width    = 1080 - margin.left - margin.right
  const tsGWidth = width - 50//200

  const xTseries = margin.left
  // const xLeg =  tsGWidth + 30

    const myRef = useRef()

    const svg  = useRef()
    const tsG  = useRef()
    const legG = useRef()
    const tlG  = useRef()

    const xScale = useRef()
    const yScale = useRef()

    const xAxisG = useRef()
    const yAxisG = useRef()
        
    const myNTimes = useRef()
    const myAtmvar = useRef()
    const myMeas   = useRef()

    const mySbTime = useRef()
    const mySbStep = useRef()

    myAtmvar.current = atmvar

    xScale.current = d3.scaleLinear()
      .range([0, tsGWidth])

    yScale.current = d3.scaleLinear()
      .range([height, 0])
    
    const xAxis = d3.axisBottom(xScale.current)
      .tickSize(2)
      .tickFormat(v => `${v}h`)
    
    const yAxis = d3.axisLeft(yScale.current)
      .ticks(4)
      // .ticks([])
      .tickSize(2)
      .tickFormat(v => v > 1 || v === 0 ? v : v.toFixed(1))

    const line = d3.line()
      .x(d => xScale.current(d.t))
      .y(d => yScale.current(d.v))
      .curve(d3.curveMonotoneX)

    const area = d3.area()
      .x(d => xScale.current(d.t))
      .y0(d => yScale.current(d.v))
      .y1(yScale.current(0))
      .curve(d3.curveMonotoneX)
  
    
    const init = useCallback(() => {

      svg.current    = d3.select(`#tseries-svg-group-${myAtmvar.current}`)
      xAxisG.current = d3.select(`#tseries-x-axis-${myAtmvar.current}`)
      yAxisG.current = d3.select(`#tseries-y-axis-${myAtmvar.current}`)
      tsG.current    = d3.select(`#tseries-group-${myAtmvar.current}`)
      legG.current   = d3.select(`#tseries-leg-group-${myAtmvar.current}`)
      tlG.current    = d3.select(`#tseries-timeLine-group-${myAtmvar.current}`)

     
    },[])

    const updateChart = useCallback(() => {

      const handleTimeClick = () => {
        d3.selectAll('.tseries-x-axis g.tick').on('click', function(e) {

	        const path = e.path || (e.composedPath && e.composedPath()) // chrome || firefox

          const clickedTick = path[0].__data__
          updateTime(clickedTick)     
        })
      }

      const handleYAxisClick = () => {

        d3.selectAll('.tseries-title').on('click', function(e) {     
          updateTseriesMinMax(!tseriesMinMax)
        })
      }

      handleTimeClick()
      handleYAxisClick()
            
      const xMin = 0
      const xMax = myNTimes.current - 1

      xScale.current.domain([xMin, xMax])
      
      const xAxisTicks = [...Array(xMax + 1).keys()].filter(d => d % 3 === 0 && d !== 0)
      xAxis.tickValues(xAxisTicks)

      const yMin = tseriesMinMax
            ? d3.min(data, d => d.v)
            : atmvars_consts.ranges[myAtmvar.current][0]
        
      const yMax = tseriesMinMax
          ? d3.max(data, d => d.v)
          : atmvars_consts.ranges[myAtmvar.current][1]

      
      // const yMin = myMeas.current === 'max' || myMeas.current === 'grid_pt'
      //       ? 0
      //       : atmvars_consts.ranges[myAtmvar.current][0]
        
      // const yMax = myMeas.current === 'max' || myMeas.current === 'grid_pt'
      //     ? d3.max(data, d => d.v)
      //     : d3.max(data, d => d.v) //atmvars_consts.ranges[myAtmvar.current][1]

      yScale.current.domain([yMin, yMax])

      xAxisG.current.call(xAxis)
      yAxisG.current.call(yAxis)

      const dataNest = Array.from(
        d3.group(data, d => d.atmvar),
        ([key, value]) => ({key, value})
      )

      // Line Chart
      const tseries = tsG.current.selectAll(`.tseries-path`)
        .data(dataNest)
  
      tseries.exit().remove()

      tseries
          .transition().duration(500)
          .attr('d', d => d.key === atmvars_consts.nicks[0] ? area(d.value) : line(d.value))          
        
      tseries
          .enter().append('path')
          .attr('class', 'tseries-path')
          .attr('id'    , d => `tseries-path-${d.key}`)
          .transition().duration(500)
          .attr('d'     , d => d.key === atmvars_consts.nicks[0] ? area(d.value) : line(d.value))
          .attr('stroke', d => atmvars_consts.fields[d.key].lineColor)


      // Time Line
      const obj_t0 = {}

      obj_t0['name']       = 'x0y0'
      obj_t0['t']          = activeTime
      obj_t0['v'] = yMin

      const obj_t1 = {}

      obj_t1['name'] = 'x1y1'
      obj_t1['t']    = activeTime
      obj_t1['v']    = yMax       

      const arr = dataNest[0].key === atmvars_consts.nicks[0] && sbIsActive
       ? []
       : [{ value: [obj_t0, obj_t1] }]


      const tl = tlG.current.selectAll('.tseries-timeLine')
        .data(arr)

      tl.exit().remove()

      tl.transition().duration(500)
          .attr('d', d => line(d.value))

      tl.enter().append('path')
          .attr('class', 'tseries-timeLine')
          .attr('d', d => line(d.value))

      // Rect
      const rectData = dataNest[0].key === atmvars_consts.nicks[0] && sbIsActive
        ? [{ x: mySbTime.current - mySbStep.current, y: yMax , w: mySbStep.current , h: 0}]
        : dataNest[0].key === atmvars_consts.nicks[0]
          ? [{ x: 0, y: yMax , w: activeTime , h: 0}]
          : []

      const rect = tlG.current.selectAll(".timeInterval")
        .data(rectData)

      rect.exit().remove()

      rect
        .transition().duration(500)
        .attr('x'   , d => xScale.current(d.x))
        .attr('width' , d => xScale.current(d.w))

      rect.enter().append('rect')
        .attr('class' , "timeInterval")
        .attr('x'     , d => xScale.current(d.x))
        .attr('y'     , d => yScale.current(d.y))
        .attr('width' , d => xScale.current(d.w))
        .attr('height', d => yScale.current(d.h))

    }, [activeTime, data, line, area, xAxis, yAxis, sbIsActive, tseriesMinMax, updateTseriesMinMax, updateTime])

    
    const updateTitle = useCallback(() => {

      const title = svg.current.selectAll(`#tseries-${atmvar}-title`)
        .data([atmvar])

        title.exit().remove()

        title.attr('x', () => xTseries + tsGWidth/30)
          .attr('y', height-15)
          .text(d => {
            const tt = d === atmvars_consts.nicks[0]
              ? `Acc. ${atmvars_consts.fields[d].shortName} (${atmvars_consts.fields[d].unit})`
              :`${atmvars_consts.fields[d].shortName} (${atmvars_consts.fields[d].unit})`

            return tt
          })

        title.enter().append('text')
          .attr('class', `tseries-title`)
          .attr('id', `tseries-${atmvar}-title`)
          .attr('x', () => xTseries + tsGWidth/3)
          .attr('y', height-15)
          .text(d => {
            const tt = d === atmvars_consts.nicks[0]
              ? `Acc. ${atmvars_consts.fields[d].shortName} (${atmvars_consts.fields[d].unit})`
              :`${atmvars_consts.fields[d].shortName} (${atmvars_consts.fields[d].unit})`

            return tt
          })

    }, [atmvar, height, tsGWidth, xTseries])


    useEffect(() => { myNTimes.current = nTimes }, [nTimes])
    useEffect(() => { myMeas.current   = meas }  , [meas])
    useEffect(() => { mySbTime.current = sbTime }, [sbTime])
    useEffect(() => { mySbStep.current = sbStep }, [sbStep])

    useEffect(() => { init() }, [init])
    useEffect(() => { updateChart() }, [updateChart])

    useEffect(() => { updateTitle() }, [updateTitle])

  return (
    <div className="tseries" ref={myRef}>
      <svg className="tseries-svg" style={{ width: width + margin.left + margin.right, height: height + margin.top + margin.bottom }}>
          <g className="tseries-svg-group"        id={`tseries-svg-group-${myAtmvar.current}`}         transform={`translate(${margin.left}, ${margin.top})`}>
            <g className="tseries-x-axis"         id={`tseries-x-axis-${myAtmvar.current}`}         transform={`translate(${xTseries}, ${height})`}></g>
            <g className="tseries-y-axis"         id={`tseries-y-axis-${myAtmvar.current}`}         transform={`translate(${xTseries}, 0)`}></g>
            <g className="tseries-group"          id={`tseries-group-${myAtmvar.current}`}          transform={`translate(${xTseries}, 0)`} style={{ width: tsGWidth }} ></g>
            <g className="tseries-timeLine-group" id={`tseries-timeLine-group-${myAtmvar.current}`} transform={`translate(${xTseries}, 0)`}></g>
          </g>
      </svg>
    </div>
  )

}

export default Tseries