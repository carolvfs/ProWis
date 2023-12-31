import React from 'react'
import './ForwardBtn.css'

const ForwardArrowBtn = (props) => {
    return (
    <div className='forward-btn btn btn-sm' 
    data-bs-toggle="popover" title={props.popMsg}
      onClick={() => props.action()}>
        <span>{props.title}</span>
        <i className="forward-btn-icon fa fa-arrow-right"></i>
      </div>
    )
}

export default  ForwardArrowBtn