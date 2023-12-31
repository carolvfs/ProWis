
import React, { useRef } from 'react'
import './SmallDdwn.css'

const SmallDdwn = ({ title, items, handleClick }) => {
  const myRef = useRef()

  const renderItems = () => {
    return items.map((itm, i) => {
      const disabled = itm[2] !== undefined ?  itm[2] : ''
      return (
        <div 
          className={`dropdown-item small-dropdown-item ${disabled}`}
          key={`small-dropdown-item -${i}`}
          onClick={() => handleClick(itm)}>
          {itm[1]}
        </div>
      )
    })
  }

  return (
    <div className="small-dropdown" ref={myRef}>
      <button className="btn dropdown-toggle small-dropdown-btn btn-sm" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
          {title}
      </button>
      <ul className="dropdown-menu small-dropdown-ul" aria-labelledby="dropdownMenuButton1">
          {renderItems()}
      </ul>
    </div>
  )
} 

export default SmallDdwn
