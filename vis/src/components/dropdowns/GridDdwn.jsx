import React, { useRef, useState, useEffect, useCallback } from 'react'
import './SystemDdwn.css'

const GridDdwn = ({ activeDomIdx, nDoms, updateGrid }) => {
    
    
    const initialDomIdx = 'blank'
  
    const myRef       = useRef()

    const [activeItem, setItem] = useState(null)
    const [list      , setList] = useState([])

    
    const buildLabel = (domIdx, isItem=false) => {
        const l = isItem
            ? `Grid ${domIdx + 1}`
            : `Active Grid: ${domIdx + 1}`

        return l
    }

    const handleClick = (domIdx) => updateGrid(domIdx)

    const renderItems = () => {
      return list.map(domIdx => {
        const mylabel = buildLabel(domIdx, true)
        return (
          <div 
            className="dropdown-item system-dropdown-item"
            key={`grid-dropdown-item-${domIdx}`}
            onClick={() => handleClick(domIdx)}>

              {mylabel}
            
          </div>
        )
      })
    }
     
    useEffect(() => {
        const range = (start, end) => Array(end).fill(start).map((x, y) => x + y)

        const domains = nDoms > 0
            ? range(0, nDoms)
            : []

        setList(domains)
            
    }, [nDoms])

    useEffect(() => {
        const domIdx = activeDomIdx === null
            ? initialDomIdx
            : activeDomIdx

        const item = buildLabel(domIdx)
        setItem(item)

    }, [activeDomIdx])
    

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
          {renderItems()}
        </ul>
      </div>
    )
}

export default GridDdwn