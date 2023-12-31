import React, { useRef, useState, useEffect } from 'react'
import './SystemDdwn.css'

import icbc_models from '../../consts/icbc'

const IcbcDdwn = ({ icbc, updateIcbcModel }) => {

  // const popIcbc       = 'Coarse grid resolution (meters)'

  const myRef = useRef()

  const [activeItem, setItem] = useState('')

  const handleClick = (n) => {
    updateIcbcModel(n)
    setItem(n)

  }

  const renderItems = () => {
    return icbc_models.map(i => {

      return(
        <div 
          className={`dropdown-item system-dropdown-item icbc-item ${i.name}`}
          key={`icbc-item-${i.name}`}
          onClick={() => handleClick(i.name)}>
          {i.name}
        </div>
      )
    })
  }

  useEffect(() => {

    if(icbc) {
      setItem(icbc)
    
    } else {
      setItem(icbc_models[0].name)
    }

}, [icbc])

  return (
    <div className="system-dropdown" ref={myRef}>
        <button 
          className="btn dropdown-toggle system-dropdown-btn" 
          type="button" id="dropdownMenuButton1"
          data-bs-toggle="dropdown" 
          aria-expanded="false">
            ICBC: {activeItem}
        </button>
        <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
            {renderItems()}
        </ul>
    </div>
)



}

export default IcbcDdwn