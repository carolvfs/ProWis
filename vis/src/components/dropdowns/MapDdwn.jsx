import React, { useRef, useState, useEffect, useCallback } from 'react'
import './SystemDdwn.css'

import atmvars_consts from '../../consts/atm-vars'

const MapDdwn = ({ mapIdx, activeAtmvar, updateAtmvar }) => {

  const myRef = useRef()

  const [activeItem, setItem] = useState(null)

  const handleClick = (n) => updateAtmvar(mapIdx, n)

  const renderItems = () => {
    return atmvars_consts.nicks.map(nick => {
      return (
        <div 
          className="dropdown-item system-dropdown-item"
          key={`map-dropdown-item-${nick}`}
          onClick={() => handleClick(nick)}>

            {atmvars_consts.fields[nick].name}
          
        </div>
      )
    })
  }

  useEffect(() => { 
    const item = atmvars_consts.fields[activeAtmvar].shortName
    setItem(item)

  }, [activeAtmvar])

  return (
    <div className="dropdown" ref={myRef}>
          
      <button 
        className="btn dropdown-toggle system-dropdown-btn btn-sm" 
        type="button" id="dropdownMenuButton1" 
        data-bs-toggle="dropdown" 
        aria-expanded="false"
        >
        {`Map ${mapIdx+1}:\xa0\xa0${activeItem}`}

      </button>
      
      <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton">
        {renderItems()}
      </ul>
    </div>
  )
}

export default MapDdwn
