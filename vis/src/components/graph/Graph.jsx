import React, { useRef, useState, useEffect, useCallback } from 'react'
import './Graph.css'

import * as d3 from 'd3'

import colors from '../../consts/colors'
import paths from '../../consts/route-paths'

import physics from '../../consts/physics'
import icbc_models from '../../consts/icbc'

import RestartModal   from '../modals/RestartModal'
import DeleteModal    from '../modals/DeleteModal'
import AbortModal    from '../modals/AbortModal'
import AddMemberModal from '../modals/AddMemberModal'
import RemoveMemberModal from '../modals/RemoveMemberModal'

import QuickLookAlert from '../alerts/QuickLookAlert'

import Manager from '../../manager/Manager'

const Graph = ({ 
  data, 
  running, 
  activeEns, 
  ensembles, 
  activeWfId, 
  collections,
  activeColorby, 
  updateWorkflow,
  updateEnsembles,
  updateAllRunOverview, 
 }) => {

  //// REFS
  
  const myRef       = useRef()
  const showOpt     = useRef()
  const nextRunning = useRef()

  showOpt.current   = false

  //// CONSTS
      
  const contentHeight = 240//d3.select('.analyses-content-1')._groups[0][0].clientHeight
  const contentWidth  = 230//d3.select('.analyses-content-1')._groups[0][0].clientWidth
      
  const margin = { top: 10, bottom: 10, left: 10, right: 10 }

  const height = contentHeight - margin.bottom
  const width  = contentWidth - margin.left - margin.right
  const svg    = d3.select('.graph-svg-group')

  const r1 = 9
  const r2 = 11

  let i = 0

  const _depth = 40

  const [showOptions, setShowOptions] = useState(false)
  const [nodeBottom , setNodeBottom]  = useState('0')
  const [nodeLeft   , setNodeLeft]    = useState('0')

  const [activeNode       , setNode]                     = useState(null)
  const [seeRestartModal  , setSeeRestartModal]          = useState(false)
  const [seeDeleteModal   , setSeeDeleteModal]           = useState(false)
  const [seeAbortModal    , setSeeAbortModal]            = useState(false)
  const [seeAddMemberModal, setSeeAddMemberModal]        = useState(false)
  const [seeRemoveMemberModal, setSeeRemoveMemberModal]  = useState(false)

  const [seeQuickLookAlert, setSeeQuickLookAlert]  = useState(false)

  const createTree = () => d3.tree().size([width, height])
  const treemap = createTree()
  
  
  
  //// USE CALLBACKS 

  const updateEdges =  useCallback((root, edges) => {

    const edge = svg.selectAll('path.edge')
        .data(edges, function(d) { return d.id })

    // Enter
    const edgeEnter = edge.enter().insert('path', 'g')
      .attr('class', 'edge')
      .attr('d', () => { const o = {x: root.y0, y: root.x0}; return diagonal(o, o)})

      // Update
      const edgeUpdate = edgeEnter.merge(edge)
      edgeUpdate.attr('d', (d) => diagonal(d, d.parent))

      // Exit
      edge.exit()
      .attr('d', () => { const o = {x: root.y, y: root.x}; return diagonal(o, o)})
      .remove()

    function diagonal(s, d) {
        let path = `M ${s.x} ${s.y}
            ${d.x} ${d.y}`
    
        return path
    }
    
  }, [svg])


  const updateNodes = useCallback((root, nodes) => {
    
    const nodeColor = (d, isStroke=false) => {
      let color = colors.success

      function colorByParam() {
        const params         = physics.parameterizations[activeColorby]
        const paramsFiltered = params.filter(p => p[0] === d.data[activeColorby])
        const paramATp       = paramsFiltered[0]
        
        color = paramATp[2]
        
      }

      function colorByEnsemble() {
        const ensemble = ensembles.filter(ens => ens[0] === activeColorby)
        const isMember = ensemble[0][4].includes(d.data.id)
        
        color = isMember
            ? '#003366'
            : '#b3b3b3'
      }
        
      function colorByStatus() {
        color = d.data.status.includes('failed')
            ? colors.failed
            : d.data.status.includes('running') || d.data.status.includes('queued')
                ? colors.running
                : colors.success
      }

      function colorByIcbc() {
        const model = icbc_models.filter(m => m.name === d.data.icbc_model)[0]
        color = model.color
      }

      const processes = physics.physicalProcesses.map(proc => proc[0])

      if(isStroke && d.data.id === activeWfId) {
        color = 'orange'
        
      } else

      if(processes.includes(activeColorby)) {
        colorByParam()
        
      } else if (activeColorby === 'icbc') {
          colorByIcbc()
      
      } else if (activeColorby === 'status' || ensembles.length === 0) {
          colorByStatus()
  
      } else {
          const ensemble = ensembles.filter(ens => ens[0] === activeColorby)
          
          if(ensemble.length === 0) {
              colorByStatus()
  
          } else {
              colorByEnsemble()
          }
      }

      return color
    }

    const nodeClick = (e, d) => {
      const positionX = e.layerX
      const positionY = height - e.layerY
      
      const attrX = `${positionX}px`
      const attrY = `${positionY}px`

      setNodeBottom(attrY.toString())
      setNodeLeft(attrX.toString())
      
      setSeeQuickLookAlert(false)
      setShowOptions(true)

    }

    const nodeMouseOut = () => {
      if(!showOpt.current) {  
        setNode(null)
        setSeeQuickLookAlert(false)
      }
    }
    
    const nodeMouseOver = (e, d) => {
      if(!showOpt.current) {
        const positionX = e.layerX
        const positionY = height - e.layerY
        
        const attrX = `${positionX}px`
        const attrY = `${positionY}px`
  
        setNodeBottom(attrY.toString())
        setNodeLeft(attrX.toString()) 
        setNode(d.data)
        setSeeQuickLookAlert(true)
      }

    }

    const node = svg.selectAll('g.node')
        .data(nodes, d => d.id || (d.id = ++i))

    // Enter nodes
    const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', () => `translate(${root.y0}, ${root.x0})`)

    // Append circles
    nodeEnter.append('circle')
      .attr('class', 'node')
      .attr('fill', d => nodeColor(d))
      .attr('stroke', d => nodeColor(d, true))
      .on('click'    , (e, d) => nodeClick(e, d))
      .on('mouseover', (e, d) => nodeMouseOver(e, d))
      .on('mouseout' , ()     => nodeMouseOut())
    
      // Append labels
    nodeEnter.append('text')
        .attr('class', 'node')
        .attr('dy', '.35em')
        .attr('x', 0)
        .attr("text-anchor", 'middle')
        .text(d => d.data.internal_id)

    // Update
    const nodeUpdate = nodeEnter.merge(node)

    // Update positions
    nodeUpdate.attr("transform", function(d) {
      return `translate(${d.x}, ${d.y})`
    })

    // Update attributes
    nodeUpdate.select('circle.node')
        .attr('fill', d => nodeColor(d))
        .attr('stroke', d => nodeColor(d, true))
        .transition().duration(300)
        .attr('r', (d) => d.data === activeNode && seeQuickLookAlert ? r2 : r1)

    // Update labels
    
    nodeUpdate.select('text.node')
    .text(d => d.data.internal_id)

    // Exit nodes
    const nodeExit = node.exit()
        .remove()

    //// On exit reduce the node circles size to 0
    nodeExit.select('circle').attr('r', 1e-6)
    
    //// On exit reduce the opacity of text labels
    nodeExit.select('text').style('fill-opacity', 1e-6)

  }, [i, activeColorby, ensembles, seeQuickLookAlert, activeWfId, setNodeBottom, setNodeLeft, setShowOptions, setNode, height, svg])


  //// USE EFFECT
  useEffect(() => { nextRunning.current = running }, [running])

  useEffect(() => {

    const clickOutside = () => {
      d3.select('.analyses').on('click', function(e) {
        const nodeElementsArr = d3.selectAll('circle.node')._groups[0]
        const nodeItemElementsArr = d3.selectAll('.node-options-item')._groups[0]
  
        let show = false
  
        nodeElementsArr.forEach(n => !show ? show = n === e.target : show)
        nodeItemElementsArr.forEach(n => !show ? show = n === e.target : show)
  
        if(!show) setShowOptions(false)
      })
    }

    clickOutside()

    const root = d3.hierarchy(data, d => d.children)

    root.x0 = 0
    root.y0 = margin.top //height / 4

    const treeData = treemap(root)

    const nodes = treeData.descendants()
    const edges = treeData.descendants().slice(1)
    
    nodes.forEach(d => d.y = d.depth * _depth)

    updateNodes(root, nodes)
    updateEdges(root, edges)


  }, [data, margin.top, treemap, updateNodes, updateEdges])

 
  //// RENDERS 

  const renderModals = () => {
    const nodeId         = activeNode ? activeNode.id : null
    const nodeInternalId = activeNode ? activeNode.internal_id : null

    if(activeNode) {

        return (
          <>
            <RestartModal
              nodeId             = {nodeId} 
              nodeInternalId     = {nodeInternalId} 
    
              setNode            = {setNode}
              seeRestartModal    = {seeRestartModal} 
              setSeeRestartModal = {setSeeRestartModal}

              updateAllRunOverview = {updateAllRunOverview}
            />

            <DeleteModal
              nodeId             = {nodeId} 
              nodeInternalId     = {nodeInternalId} 
    
              setNode           = {setNode}
              seeDeleteModal    = {seeDeleteModal} 
              setSeeDeleteModal = {setSeeDeleteModal}

              updateAllRunOverview = {updateAllRunOverview}
            />

            <AbortModal
              nodeId             = {nodeId} 
              nodeInternalId     = {nodeInternalId} 
    
              setNode            = {setNode}
              seeAbortModal    = {seeAbortModal} 
              setSeeAbortModal = {setSeeAbortModal}

              updateAllRunOverview = {updateAllRunOverview}
            />
            
            <AddMemberModal
              nDoms={activeNode.nDoms}
              nodeId={activeNode.id}
              ensembles={ensembles}
              activeEns={activeEns}
              collections={collections}
              
              setNode={setNode}
              updateEnsembles={updateEnsembles}
              seeAddMemberModal={seeAddMemberModal}
              setSeeAddMemberModal={setSeeAddMemberModal}

            />

            <RemoveMemberModal
              nodeId={activeNode.id}
              activeEns={activeEns}
              ensembles={ensembles}
              collections={collections}
              seeRemoveMemberModal={seeRemoveMemberModal}
              
              setNode={setNode}
              updateEnsembles={updateEnsembles}
              setSeeRemoveMemberModal={setSeeRemoveMemberModal}
            />
          </>
        )

    }
  }
  
  const renderMouseOverModal = () => {
      if(activeNode && seeQuickLookAlert && !showOptions) {
        return (
          <QuickLookAlert
            data = {activeNode}
            nodeBottom={nodeBottom}
            nodeLeft={nodeLeft}
          />)

      } else {
        return ''
      }

  }
  
  const renderNodeOptions = () => {

    const popAnalyse   = "Analyse the results of this run."
    const popAddMember = "Include this run in an ensemble."
    const popRmMember  = "Remove this run from an ensemble."
    const popChild     = "Set up a new run starting with the settings from this one."
    const popRestart   = "Restart this run if it failed."
    const popCancel    = "Abort the run if it is in progress."
    const popDelete    = "Delete this run permanently."
    
    const itemClass = 'list-group-item list-group-item-action node-item node-options-item'

    const delLabel    = delDisabled()    ? 'Delete' : 'Delete (be careful)'
    const cancelLabel = cancelDisabled() ? 'Abort'  : 'Abort (be careful)'
    
    if (showOptions) {
      showOpt.current = true

      return (
        <div className='node-options' style={{bottom:nodeBottom, left: nodeLeft}}>
          <ul className="list-group">

            <button type="button" className={`${itemClass}`}                                      data-bs-toggle="popover" title={popAnalyse}    onClick={() => handleAnalyse()}>Analyse</button>
            <button type="button" className={`${itemClass} ${addMDisabled()}`}                    data-bs-toggle="popover" title={popAddMember}  onClick={() => handleAddMember()}>Add member</button>
            <button type="button" className={`${itemClass} ${rmMDisabled()}`}                     data-bs-toggle="popover" title={popRmMember}   onClick={() => handleRemoveMember()}>Remove member</button>
            <button type="button" className={`${itemClass} ${childDisabled()}`}                   data-bs-toggle="popover" title={popChild}      onClick={() => handleNewChild()}>New child</button>
            <button type="button" className={`${itemClass} ${restartDisabled()}`}                 data-bs-toggle="popover" title={popRestart}    onClick={() => handleRestart()}>Restart</button>
            <button type="button" className={`${itemClass} ${cancelDisabled()}  node-item-alert`} data-bs-toggle="popover" title={popCancel}     onClick={() => handleCancel()}>{cancelLabel}</button>
            <button type="button" className={`${itemClass} ${delDisabled()}     node-item-alert`} data-bs-toggle="popover" title={popDelete}     onClick={() => handleDelete()}>{delLabel}</button>

          </ul>
        </div>
      )
    } else {
      showOpt.current = false

      return ''
    }

    function handleAnalyse() {
      if(activeNode) updateWorkflow(activeNode.id)
      setShowOptions(false)

    }

    async function handleNewChild () {

      await Manager.postWorkflow(activeNode.id)
      
      const url = paths.setup
      window.location = url 
      setShowOptions(false)

    }

   function handleAddMember() {
      setSeeAddMemberModal(true)
      setShowOptions(false)
    }

    function handleRemoveMember() {
      setSeeRemoveMemberModal(true)
      setShowOptions(false)
    }

    function handleRestart() {
      setSeeRestartModal(true)
      setShowOptions(false)
    }

    function handleCancel() {
      setSeeAbortModal(true)
      setShowOptions(false)
    }

    function handleDelete() {
      setSeeDeleteModal(true)
      setShowOptions(false)
    }

    function childDisabled() {
      const disabled = activeNode && activeNode.status.includes('success') && !nextRunning.current
        ? ''
        : 'disabled'

        return disabled
    }

    function rmMDisabled() {
      const disabled = activeNode && activeNode.status.includes('success')
        ? ''
        : 'disabled'

        return disabled
    }

    function addMDisabled() {
      const disabled = activeNode && activeNode.status.includes('success')
        ? ''
        : 'disabled'

        return disabled
    }

    function restartDisabled() {
      const disabled = activeNode && activeNode.status.includes('failed') && !nextRunning.current
        ? ''
        : 'disabled'

        return disabled
    }

    function cancelDisabled() {
      if(activeNode) {
        const disabled = activeNode !== null && activeNode.status.includes('running')
          ? ''
          : activeNode.status.includes('queued')
            ?  ''
            : 'disabled'

            return disabled
      } else {
        
        return ''
        
      }

    }

    function delDisabled() {
      const disabled = activeNode && !activeNode.status.includes('running') &&  !activeNode.status.includes('queued') && activeWfId !== activeNode.id
        ? ''
        : 'disabled'

        return disabled
    }
  }

  //// RETURN
    
  return (
    <div className="graph">
      <svg className='graph-svg' width={contentWidth} height={contentHeight} ref={myRef}>
        <g className='graph-svg-group' width={width} height={height} transform={`translate(0, ${margin.top})`}></g>
      </svg>
      {renderNodeOptions()}
      {renderModals()}
      {renderMouseOverModal()}
    </div>
  )
}

export default Graph