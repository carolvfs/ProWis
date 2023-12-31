import React, { useRef, useEffect, useCallback } from 'react'
import './Scatter.css'

import * as d3 from 'd3'

import colors from '../../consts/colors'
import physics from '../../consts/physics'
import icbc_models from '../../consts/icbc'

const Scatter = ( { data, activeColorBy, ensembles } ) => {

    const myRef = useRef()

    const margin = { top: 10, bottom: 10, left: 10, right: 10 }

    const contentHeight = 150//d3.select('.analyses-content-2')._groups[0][0].clientHeight
    const contentWidth  = 230//d3.select('.analyses-content-2')._groups[0][0].clientWidth

    const width  = contentWidth - margin.left - margin.right
    const height = contentHeight - margin.top - margin.bottom

    const r1 = 7//9
    const fontSize = 8

    const svg      = d3.select('.scatter-svg-group')
    const scatterG = d3.select('.scatter-group')
    const xAxisG   = d3.select('.scatter-x-axis')
    const yAxisG   = d3.select('.scatter-y-axis')

    const x = d3.scaleLinear()
            .range([0, width])

    const y = d3.scaleLinear()
        .range([height, 0])

    const zoom = d3.zoom()
        .scaleExtent([1, 30])
        .extent([[0, 0], [width, height]])

    const update = useCallback(() => {
        const circleColor = (d) => {
            let color = colors.success

            function colorByParam() {
              const params         = physics.parameterizations[activeColorBy]
              const paramsFiltered = params.filter(p => p[0] === d[activeColorBy])
              const paramATp       = paramsFiltered[0]
              
              color = paramATp[2]
              
            }
      
            function colorByEnsemble() {
              const ensemble = ensembles.filter(ens => ens[0] === activeColorBy)
              const isMember = ensemble[0][4].includes(d.id)
              
              color = isMember
                  ? '#003366'
                  : '#b3b3b3'
            }
              
            function colorByStatus() {
              color = d.status.includes('failed')
                  ? colors.failed
                  : d.status.includes('running') || d.status.includes('queued')
                      ? colors.running
                      : colors.success
            }
      
            function colorByIcbc() {
              const model = icbc_models.filter(m => m.name === d.icbc_model)[0]
              color = model.color
            }
      
            const processes = physics.physicalProcesses.map(proc => proc[0])
    
      
            if(processes.includes(activeColorBy)) {
              colorByParam()
              
            } else if (activeColorBy === 'icbc') {
                colorByIcbc()
            
            } else if (activeColorBy === 'status' || ensembles.length === 0) {
                colorByStatus()
        
            } else {
                const ensemble = ensembles.filter(ens => ens[0] === activeColorBy)
                
                if(ensemble.length === 0) {
                    colorByStatus()
        
                } else {
                    colorByEnsemble()
                }
            }
      
            return color
        }

        const xMax = d3.max(data, d => d.x)
        const yMax = d3.max(data, d => d.y)
        
        const xMin = d3.min(data, d => d.x > 0 ? 0 : d.x)
        const yMin = d3.min(data, d => d.y > 0 ? 0 : d.y)

        x.domain([xMin, xMax])
        y.domain([yMin, yMax])
            
        const xAxis = d3.axisBottom(x)
            .ticks(0)

        const yAxis = d3.axisLeft(y)
            .ticks(0)

            
        xAxisG.call(xAxis)
        yAxisG.call(yAxis)

        ///////////////////////////////////////////////////

        zoom.on('zoom', zoomed)

        function zoomed(event) {
            const { transform } = event

            scatterG.attr('transform', transform)

            const new_x = transform.rescaleX(x)
            const new_y = transform.rescaleY(y)

            xAxisG.call(xAxis.scale(new_x))
            yAxisG.call(yAxis.scale(new_y))

            const radius = r1 / transform.k
            
            svg.selectAll('.scatter-data')
                .attr('r', radius + "px")
                .attr('stroke-width', 1 / transform.k + "px")

            svg.selectAll('.scatter-id')
                .attr('font-size', fontSize / transform.k + "px")
                .attr('x', d => x(d.x))
                .attr('y', d => y(d.y) + radius/2)
        }

        ///////////////////////////////////////////////////

        const scatter = scatterG.selectAll('.scatter-data')
            .data(data)

        scatter.exit().remove()

        scatter
            .attr('cx', d => x(d.x))
            .attr('cy', d => y(d.y))
            .attr('fill', d => circleColor(d))
            .attr('stroke', d => circleColor(d, true))
            .attr('r', r1)

        scatter.enter().append('circle')
            .attr('class', 'scatter-data')
            .attr('cx', d => x(d.x))
            .attr('cy', d => y(d.y))
            .attr('r', r1)
            // .on('mouseover', (event, d) => updateMouseoverMember(d.id))
            // .on('mouseout', (event, d) => updateMouseoverMember(null))
            .attr('fill', d => circleColor(d))
            .attr('stroke', d => circleColor(d, true))

        const scatterId = scatterG.selectAll('.scatter-id')
            .data(data)

        scatterId.exit().remove()

        scatterId
            .attr('x', d => x(d.x))
            .attr('y', d => y(d.y) + r1/2)
            .text(d => d.internal_id)

        scatterId.enter().append('text')
            .attr('class', 'scatter-id')
            .attr('x', d => x(d.x))
            .attr('y', d => y(d.y) + r1/2)
            .attr('font-size', 10)
            .text(d => d.internal_id)

        svg.call(zoom)


    }, [data, activeColorBy, ensembles, scatterG, svg, x, xAxisG, y, yAxisG, zoom])
    
    
    useEffect(() => {
        update()
    }, [update])



    return (
        <svg className='scatter-svg' width={contentWidth} height={contentHeight} ref={myRef}>
            <g className='scatter-svg-group' width={width} height={height} transform={`translate(${margin.left}, ${margin.top})`}>
                <g className='scatter-x-axis' transform={`translate(0, ${height})`}></g>
                <g className='scatter-y-axis'></g>
                <g className='scatter-group'></g>
            </g>
        </svg>
    )

}

export default Scatter