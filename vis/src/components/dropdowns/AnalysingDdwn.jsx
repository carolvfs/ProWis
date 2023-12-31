import React, { useRef, useState, useEffect, useCallback } from 'react'
import './SystemDdwn.css'

const AnalysingDdwn = ({ activeWfId, activeEnsId, workflows, ensembles, updateWorkflow, updateActiveEnsemble }) => {
    
    
    const initialItem = 'Select a topic to analyze'
  
    const myRef         = useRef()
    const workflowsList = useRef()
    const ensemblesList = useRef()

    const [activeItem, setItem] = useState(initialItem)


    const buildEnsLabel = (ens, isItem=false) => {
      const l = isItem
        // ? `Ensemble ${ens[0]} (${ens[1]})`
        // : `Active screen: Ensemble ${ens[0]}`
        ? `Ensemble ${ens[1]} (id ${ens[0]})`
        : `Active screen: Ensemble ${ens[1]} (id ${ens[0]})`

    return l

    }
    
    const buildWfLabel = (wf, isItem=false) => {
      const l = isItem
        ? `Run ${wf.internal_id} (${wf.wfName})`
        : `Active screen: Run ${wf.internal_id}`

      return l
    }

    const handleClean = () => {
      updateWorkflow(null)
      updateActiveEnsemble(null)

    }
    
    const handleClickWf = (wf) => { 
    
      // if(wf.id !== activeWfId) updateWorkflow(wf.id) 
      updateActiveEnsemble(null)
      updateWorkflow(wf.id)
    
    }

    const handleClickEns = (ens) => {
      updateWorkflow(null)
      updateActiveEnsemble(ens[0])
    }

    const renderCleanItem = () => {
      if(workflows.length > 0 || ensembles.length > 0) {
        return (
          <div className="dropdown-item system-dropdown-item"
            style={{color:'orange'}}
            onClick={() => handleClean()}>Clean the screen </div>
        )

      } else {
        return ''
      }
    }

    const renderDivider = () => {
      if(ensembles.length > 0) {
        return <hr className="dropdown-divider"></hr>
      
      } else {
        return ''
      }
    }

    const renderWfItems = () => {
      return workflows.map(wf => {
        const mylabel = buildWfLabel(wf, true)
        return (
          <div 
            className="dropdown-item system-dropdown-item"
            key={`analysing-wf-dropdown-item-${wf.internal_id}`}
            onClick={() => handleClickWf(wf)}>

              {mylabel}
            
          </div>
        )
      })
    }

    const renderEnsItems = () => {
      return ensembles.map(ens => { 
        const mylabel=buildEnsLabel(ens, true)
        return (
          <div 
            className="dropdown-item system-dropdown-item"
            key={`analysing-ens-dropdown-item-${ens[0]}`}
            onClick={() => handleClickEns(ens)}>

              {mylabel}
            
          </div>
        )
      })
    }

    
    useEffect(() => { workflowsList.current = workflows}, [workflows])
    useEffect(() => { ensemblesList.current = ensembles}, [ensembles])
    
    useEffect(() => {
      if(activeWfId === null && activeEnsId === null) {
        setItem(initialItem)
     
      } else if(activeWfId) {
        const wf = workflowsList.current.filter(d => d.id === activeWfId)[0]
        const item = buildWfLabel(wf)
        setItem(item)

      } else {
        const ensemble = ensemblesList.current.filter(d => d[0] === activeEnsId)[0]
        const item = buildEnsLabel(ensemble)
        setItem(item)
      }

    }, [activeWfId, activeEnsId])
    

    return (
      <div className="dropdown" ref={myRef}>
          
        <button 
          className="btn dropdown-toggle system-dropdown-btn btn-sm" 
          type="button" id="dropdownMenuButton1" 
          data-bs-toggle="dropdown" 
          aria-expanded="false"
          >
          {activeItem}
        </button>
        
        <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton">
          {renderCleanItem()}
          {renderWfItems()}
          {renderDivider()}
          {renderEnsItems()}
        </ul>
      </div>
    )
}

export default AnalysingDdwn