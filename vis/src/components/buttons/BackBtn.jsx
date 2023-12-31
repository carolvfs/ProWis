import React from 'react'
import './BackBtn.css'

const BackBtn = (props) => {
    return (
      <div className={`back-btn btn btn-sm ${props.disabled}`}
      data-bs-toggle="popover" title={props.popMsg}
      onClick={() => props.action()}>
        <i className="back-btn-icon fa fa-arrow-left"></i>
        <span>{props.title}</span>
      </div>
    )
}

export default  BackBtn