import React, { useRef, useState, useEffect, useCallback } from 'react'
import './SystemDdwn.css'

import measures from '../../consts/measures'
import analysis from '../../consts/analisis'

const MeasureDdwn = ({ activeMeas, updateMeas, analysing }) => {
 
    const myRef       = useRef()
    const wfTitle  = 'Active Measure'
    const ensTitle = 'Active Measure Hmats'

    const [activeItem, setItem]       = useState(null)
    const [list      ]       = useState(measures)
    const [isEnsemble, setIsEnsemble] = useState(null)
    const [activeTitle, setTitle]     = useState(wfTitle)

    const buildLabel = useCallback((m) => `${activeTitle}: ${m}`, [activeTitle])

    const handleClick = (meas) => updateMeas(meas[0])

    const renderItems = () => {
        return list.map(meas => {
          const disabled = !isEnsemble && meas[0] === measures[3][0]
            ? 'disabled'
            : ''

          return (
            <div 
              className={`dropdown-item system-dropdown-item ${disabled}`}
              key={`meas-dropdown-item-${meas[0]}`}
              onClick={() => handleClick(meas)}>
  
                {meas[1]}
              
            </div>
          )
        })
    }

    useEffect(() => { 

      if(analysing === analysis[2]) {         
        setIsEnsemble(true)
        setTitle(ensTitle)

      } else {
        setIsEnsemble(false)
        setTitle(wfTitle)
      }

      const measArr = measures.filter(m => m[0] === activeMeas)
      const item = buildLabel(measArr[0][1])

      setItem(item)
        

    }, [activeMeas, analysing, buildLabel])

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

export default MeasureDdwn