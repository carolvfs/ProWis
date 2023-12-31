import React, { useRef, useState, useEffect, useCallback } from 'react'
import './Sunburst.css'

import SbAlert from '../alerts/SunburstAlert'
import circularBrush from './CircularBrush'

import * as d3 from 'd3'

import atmvars_consts from '../../consts/atm-vars'

const Sunburst = ({ data, nTimes, lastTime, sbTime, sbStep, sbIsActive, activeMeas, updateSbTime, updateSbStep }) => {

  const boarderW = 250
  const boarderH = 260

  const margin = { top: 10, bottom: 10, left: 10, right: 10 }
  const height = boarderH - margin.top - margin.bottom
  const width  = boarderW - margin.left - margin.right

  const x0 = boarderW/2 - margin.left - margin.right
  const y0 = boarderH/2 - margin.top - margin.bottom

  const radius = 130
 
  const myRef = useRef()
  
  const sbGroup    = useRef()
  const brushGroup = useRef()

  const brush   = useRef() 
  
  const t0 = 0
  const t1 = useRef() 

  const brush_t0 = useRef() 
  const brush_t1 = useRef() 

  const clicked    = useRef()
  const brushReset = useRef()
  const isBrushing = useRef()

  const mySbTime = useRef()
  const mySbStep = useRef()

  const partition = d3.partition().size([2 * Math.PI, radius])

  const [sliceBottom , setSliceBottom] = useState(null)
  const [sliceLeft   , setSliceLeft]   = useState(null)
  const [seeSbAlert  , setSeeSbAlert]  = useState(false)
  const [activeSlice , setSlice]       = useState(false)


  // RESET BRUSH
  const resetBrush = useCallback(() => {
    brushReset.current = true
    brushGroup.current.call(brush.current.reset)
    isBrushing.current = false

  },[])
  
  
  // BRUSH
  const setBrush = useCallback(() => {

    const _brush = circularBrush()

    const innerR = radius - 28
    const outerR = innerR + 10

    _brush
      .innerRadius(innerR)
      .outerRadius(outerR)
      .on('brushstart', brushstart)
      .on('brushend'  , brushend)
      .on('brush'     , brushing)

    return _brush

    function brushstart() {
      brushReset.current = false
      clicked.current = false

      setSlice(null)
      setSeeSbAlert(false)

    }

    function brushing() {
      isBrushing.current = true
      d3.selectAll(".sb-path")
        .style('stroke-opacity', d => select(d))
    }

    function brushend() {

      if(!clicked.current) {
        if(brushReset.current) {
          brushReset.current = false

        } else {
          const time = brush_t1.current > lastTime 
          ? lastTime
          : Number.isNaN(brush_t1.current)  || brush_t1.current === undefined
              ? 1
              : brush_t1.current
          
          const tryInterval = time - brush_t0.current + 1

          let interval = tryInterval < 0 
              ? time 
              : Number.isNaN(tryInterval) || tryInterval === undefined
                  ? 1
                  : tryInterval
          
          if (!clicked.current) {
            if(time === mySbTime.current) {
                updateSbStep(interval)

            } else {
                updateSbTime(time, interval)
            }
          }
        }

      } else {
        console.log('clicked and reset')
      }
    }

    function select(d) {
      const e = brush.current.extent()

      let _select = false

      const left  = e[0]
      const right = e[1]

      if(left < right) {
        _select = d.data.t[0] >= left && d.data.t[1] <= right
        
      } else {
          _select = d.data.t[0] >= left || d.data.t[1] <= right
      }

      if(d.data.name.includes('1h') && _select) {
        brush_t0.current = parseInt(Math.ceil(left)  + 1)
        brush_t1.current = parseInt(Math.ceil(right) - 1)
      }

      return 1

    }

  },[lastTime, updateSbTime, updateSbStep])

  
  // INIT
  const init = useCallback(() => {
    sbGroup.current    = d3.select(".sunburst-group")
    brushGroup.current = d3.select(".s-circularbrush")
    
    clicked.current    = false
    brushReset.current = false
    isBrushing.current = false

    brush_t0.current = 1
    brush_t1.current = 1

  },[])


  // ARC
  const setArc = useCallback(() => {
    const arc = d3.arc()
      .startAngle( function (d) { return d.x0 })
      .endAngle(   function (d) { return d.x1 })
      .innerRadius(function (d) { return d.y0 -30 })
      .outerRadius(function (d) { return d.y1 -30 })

    return arc
  },[])


  // SLICE
  const updateSlice = useCallback((root, arc, color) => {
      
    const sliceClick = (e, d) => {
      const _slice = d.data
      const split = _slice.name.split('h-')
      const value = _slice.v

      
      if(split[0] !== `${lastTime}h` && value !== null) {

        clicked.current    = true
        isBrushing.current = false

        resetBrush()

        clicked.current = false

        const time = parseInt(split[0]) * parseInt(split[1])
        const step = parseInt(split[0])

        updateSbTime(time, step)
        
      }

    }
    
    const sliceMouseOut = () => {
      setSlice(null)
      setSeeSbAlert(false)
    }

    const sliceMouseOver = (e, d) => {
      
      if(!isBrushing.current) {
        const positionX = e.layerX + 10
        const positionY =  - e.layerY + 100

        const attrX = `${positionX}px`
        const attrY = `${positionY}px`
  
        setSliceBottom(attrY.toString())
        setSliceLeft(attrX.toString()) 
        setSlice(d.data)
        setSeeSbAlert(true)
      }
    }

    const buildSlice = () => {

    const _slice = sbGroup.current.selectAll(".sb-path")
          .data(partition(root).descendants())

    _slice.exit().remove()

    _slice
        .attr('d', arc)
        .attr('fill'  , d => d.data.v === null ? 'grey' : color(d.data.v))
        .attr('stroke', d => d.data.v === null || d.data.v > 40 ? '#fff' :  'grey')

    _slice.enter().append('path')
        .attr('class', 'sb-path')
        .attr('display', d => d.depth ? null : 'none')
        .attr('d', arc)
        .attr('stroke' , d => d.data.v === null || d.data.v > 40 ? '#fff' :  'grey')
        .attr('fill'   , d => d.data.v === null ? 'grey' :  color(d.data.v))
        .on('click'    , (e, d) => sliceClick(e, d))
        .on('mouseover', (e, d) => sliceMouseOver(e, d))
        .on('mouseout' , ()     => sliceMouseOut())
    
        return _slice

    }

    const slice = buildSlice()

    return slice

    
  },[lastTime, partition, resetBrush, updateSbTime])

  
  
  const updatePointer = useCallback((slice, arc, step) => {

    let data = []
    let x    = null
    let y    = null

    if(mySbTime.current !== null && step !== null) {

      const myStep = isBrushing.current 
        ? 1
        : step
      
      const activeName = `${myStep}h-${mySbTime.current/myStep}`
      
      
      let nodes = slice._enter[0][0]
        ? slice._enter[0]//[0].__data__
        : slice._groups[0]
          ? slice._groups[0]
          : null
      
      for(let i = 0; i < nodes.length; i++) {
        const nodeData = nodes[i].__data__
        
        if(nodeData.data.name === activeName) {
          
          x = arc.centroid(nodeData)[0]
          y = arc.centroid(nodeData)[1]
          
          break
        }
      }
      
      data = typeof(x) === 'number' && typeof(y) === 'number' ? [activeName] : []
    }
        
    const activeNode = sbGroup.current.selectAll(".sb-activeNode")
        .data(data)

    activeNode.exit()
        .remove()

    activeNode
        .transition().duration(500)
        .attr('cx', x)
        .attr('cy', y)

    activeNode.enter()
        .append('circle')
        .attr('class', 'sb-activeNode')
        .attr('r', 2)
        .attr('cx', x)
        .attr('cy', y)


  },[])


  // UPDATE
  const update = useCallback(() => {

    mySbTime.current = sbTime
    t1.current       = nTimes

    const root = d3.hierarchy(data)
    root.sum(d => d.size)
    const arc = setArc()


    // Slice
    const atmvar      = atmvars_consts.nicks[0]
    const colorDomain = atmvars_consts.colorDomain[atmvar]
    const heatColor   = atmvars_consts.heatColor[atmvar]
    const color       = heatColor.domain(colorDomain)
    const slice       = updateSlice(root, arc, color)

    updatePointer(slice, arc, sbStep)

  }, [data, sbTime, sbStep, nTimes, setBrush, setArc, updateSlice])

  
  useEffect(() => { init() }, [init])
  useEffect(() => {
    brush.current = setBrush()
    brush.current.range([t0, t1.current])
    brushGroup.current.call(brush.current)
  }, [setBrush])

  useEffect(() => { update() }, [update])
  useEffect(() => { if(!sbIsActive) resetBrush() }, [sbIsActive, resetBrush])

  const renderToggle = () => {
    if(activeSlice && seeSbAlert) {
      return (
        <SbAlert
          data={activeSlice}
          sliceBottom={sliceBottom}
          sliceLeft={sliceLeft}
          activeMeas={activeMeas}
        />
      )
    }
  }


  return (
    <div className="sunburst" ref={myRef}>
      <svg className="sunburst-svg" width={width} height={height}>
        <g className="sunburst-svg-group" transform={`translate(${margin.left}, ${margin.top})`}>
          <g className="sunburst-group" transform={ `translate(${x0}, ${y0})`}></g>
          {/* <g className="sunburst-brush-group" transform={ `translate(${x0}, ${y0})`}></g> */}
          <g className="s-circularbrush" transform={ `translate(${x0}, ${y0})`}></g>
        </g>
      </svg>
      {renderToggle()}
    </div>
        
    )

}

export default Sunburst