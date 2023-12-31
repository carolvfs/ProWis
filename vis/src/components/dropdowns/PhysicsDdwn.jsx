import React, { useRef, useState, useEffect } from 'react'
import './PhysicsDdwn.css'

const PhysicsDdwn = ({ process, code, items, updateParam }) => {

  const myRef = useRef()

  const [activeItem, setItem] = useState('')

  const handleClick = (i) => {
    // code, name
    updateParam(i[0], process)
    setItem(`${i[1]} (${i[0]})`)

  }

  const renderItems = () => {
    return items.map(i => {

      return(
        <div 
          className={`dropdown-item physics-item ${i[0]}`}
          key={`physics-item-${i[0]}`}
          onClick={() => handleClick(i)}>
          {`${i[1]} (${i[0]})`}
        </div>
      )
    })
  }

  useEffect(() => {

    const c = items.filter(c => c[0] === code)
    setItem(`${c[0][1]} (${c[0][0]})`)

}, [code, items])

  return (
    <div className="physics-dropdown" ref={myRef}>
        <button className="btn dropdown-toggle physics-btn" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
            {activeItem}
        </button>
        <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
            {renderItems()}
        </ul>
    </div>
)



}

export default PhysicsDdwn