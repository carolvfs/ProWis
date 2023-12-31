import React, { useRef, useState, useEffect, useCallback } from 'react'
import './Legend.css'
import * as d3 from 'd3'

import atmvars_consts from '../../consts/atm-vars'
import measures from '../../consts/measures'

const Legend = ({ direction, field, id, meas, data, hmatMinMax }) => {
    const margin = { top: 10, bottom: 10, left: 10, right: 10 }

    const width   = direction === 'v' ? 20                               : 230 - margin.left - margin.right
    const height  = direction === 'v' ? 150 - margin.top - margin.bottom : 50  - margin.top - margin.bottom

    const x0 = margin.left
    const y0 = margin.top + 4


    const width_leg   = direction === 'v' ? 12  : 155
    const height_leg  = direction === 'v' ? 100 : height/3
    
    const padding_unit = 5    
    
    const x0_leg = 0
    const y0_leg = 0
    
    const y0_unit = (height - height_leg)/3
    const x0_unit = width_leg + padding_unit
    
    const myRef          = useRef()
    const svg            = useRef()
    const yScale         = useRef()
    const xScale         = useRef()
    const linearGradient = useRef()
    const axisGroup      = useRef()

    const [legId, setLegId] = useState(id)


    const init = useCallback(() => {
      svg.current            = d3.select(`#legend-svg-group-${legId}`)
      axisGroup.current      = d3.select(`#legend-axis-group-${legId}`)
      linearGradient.current = d3.select(`#linear-gradient-${legId}`)

      yScale.current = d3.scaleLinear().range([height_leg+y0, y0])
      xScale.current = d3.scaleLinear().range([0, width_leg])

      let y1 = null
      let x2 = null
      
      if(direction === 'v') {
        yScale.current = d3.scaleLinear().range([height_leg+y0, y0])
        y1 = "100%"
        x2 = "0%"
        
        
      } else {
        xScale.current = d3.scaleLinear().range([0, width_leg])
        y1 = "0%"
        x2 = "100%"
        
      }

      linearGradient.current.attr("x1", "0%")
        .attr("y1" , y1)
        .attr("x2" , x2)
        .attr("y2" , "0%")

    }, [legId, direction, width_leg, height_leg, y0])


    const update = useCallback(() => {
      const addColors = () => {

        const data = field ? atmvars_consts.offset[field] : []
        
        const color = linearGradient.current.selectAll(`#stop-${legId}`)
              .data(data)
  
          color.exit().remove()
  
          color.attr('offset', d => d.offset)
              .attr('stop-color', d => d.color)
  
          color.enter().append("stop")
              .attr('id', `stop-${legId}`)
              .attr("offset", d => d.offset)
              .attr("stop-color", d => d.color)
      }
      
      const updateAxis = () => {
        const minMaxArr = hmatMinMax ? data : atmvars_consts.colorDomain[field]
        const min = d3.min(minMaxArr, d => d)
        const max = d3.max(minMaxArr, d => d)

        let axis = null

        if(direction === 'v') {
          yScale.current.domain([min, max])

          axis = d3.axisLeft(yScale.current)
              .ticks(atmvars_consts.fields[field].ticks)
              .tickSize(2)

        } else {
          xScale.current.domain([min, max])

          axis = d3.axisTop(xScale.current)
              .ticks(atmvars_consts.fields[field].ticks)
              .tickSize(2)
              .tickFormat(v => field === 'prob' ? v*100 : v)
        }

        if(meas !== measures[2][0]) axisGroup.current.call(axis)
      }

      const updateLegend = () => {
        const rectData = meas === measures[2][0] ? [] : ['myRect']

        const rect = svg.current.selectAll(`#legend-rect-${legId}`)
          .data(rectData)

        rect.exit().remove()

        rect.attr('x', x0_leg)
          .attr('y', y0_leg)
          .attr('width', width_leg)
          .attr('height', height_leg)
          .attr('fill', `url(#linear-gradient-${legId})`)
          .style("stroke", 'grey')

        rect.enter().append('rect')
          .attr('class', 'legend-rect')
          .attr('id', `legend-rect-${legId}`)
          .attr('x', x0_leg)
          .attr('y', y0_leg)
          .attr('width', width_leg)
          .attr('height', height_leg)
          .attr('fill', `url(#linear-gradient-${legId})`)
          .style("stroke", 'grey')

      }

      const updateUnit = () => {
        const unitData = meas === measures[2][0] ? [] : ['myRect']

        const _unit = svg.current.selectAll(`#legend-unit-${legId}`)
          .data(unitData)

        _unit.exit().remove()

        _unit.text(`${atmvars_consts.fields[field].unit}`)

        _unit.enter().append('text')
          .attr('class', 'legend-unit')
          .attr('id', `legend-unit-${legId}`)
          .attr('x', x0_unit)
          .attr('y', y0_unit)
          .attr('text-anchor', 'start')
          .attr('font-size', 10)
          .text(`${atmvars_consts.fields[field].unit}`)

      }

      if(meas === measures[2][0]) {
        axisGroup.current.remove()
      
      } else {

        updateAxis()
      }

      addColors()
      updateLegend()
      updateUnit()

    }, [legId, field, meas, direction, data, hmatMinMax, height_leg, width_leg, x0_unit, y0_unit])



    useEffect(() => { setLegId(id) }, [id])
    useEffect(() => { init() }, [init])
    useEffect(() => { update() }, [update])

    return (
      <div className="legend"                id={`legend-${legId}`} ref={myRef}>
        <svg className="legend-svg"          id={`legend-svg-${legId}`} width={width} height={height}>
          <g className="legend-svg-group"    id={`legend-svg-group-${legId}`} transform={`translate (${x0}, ${y0})`}>
            <g className="legend-axis-group" id={`legend-axis-group-${legId}`}></g>
            <defs>
              <linearGradient id={`linear-gradient-${legId}`}></linearGradient>
            </defs>
          </g>
        </svg>
      </div>
    )


}

export default Legend