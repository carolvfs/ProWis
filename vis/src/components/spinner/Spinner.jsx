import React from 'react'

const Spinner = (props) => {
  return (
      <div className="d-flex justify-content-center">
        <div className={`spinner-border text-success ${props.spinnerStt}`} role="status">
            <span className="visually-hidden">Loading...</span>
        </div>
      </div>
  )
}

export default Spinner