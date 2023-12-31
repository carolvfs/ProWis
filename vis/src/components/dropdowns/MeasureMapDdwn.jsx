import React, { useRef, useState, useEffect, useCallback } from 'react'
import './SystemDdwn.css'

import measures from '../../consts/measures'

const MeasureMapDdwn = ({ activeMapsView, members, updateMapsView }) => {
 
    const myRef       = useRef()
    const title    = 'Active Measure Hmaps'
    const measList = measures.filter(m => m[0] !== measures[2][0])

    const [activeItem, setItem]         = useState(null)

    const buildLabel = useCallback((m) => `${title}: ${m}`, [])

    const handleMemberClick = (itm) => updateMapsView(itm, true)
    const handleMeasClick   = (itm) => updateMapsView(itm[0])

    const renderMeasItems = () => {
      return measList.map(m => {
        return (
          <div 
            className={`dropdown-item system-dropdown-item`}
            key={`ens-hmap-dropdown-item-${m[0]}`}
            onClick={() => handleMeasClick(m)}>

              {m[1]}
            
          </div>
        )

      })
    }
    
    const renderMembersItems = () => {
        return members.map(m => {
          const itemLabel = `R${m.wfInternalId}`
          
          return (
            <div 
              className={`dropdown-item system-dropdown-item`}
              key={`ens-hmap-dropdown-item-${m.wfInternalId}`}
              onClick={() => handleMemberClick(m)}>
  
                {itemLabel}
              
            </div>
          )
        })
    }

    useEffect(() => {

      const myMeas = measures.filter(m => m[0] === activeMapsView)

      const item = myMeas.length > 0
        ? buildLabel(myMeas[0][1])
        : buildLabel(`R${activeMapsView.wfInternalId}`)

      setItem(item)
        

    }, [activeMapsView, members, buildLabel])

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
            {renderMeasItems()}
            <hr className="dropdown-divider"></hr>
            {renderMembersItems()}
          </ul>
        </div>
      )


}

export default MeasureMapDdwn