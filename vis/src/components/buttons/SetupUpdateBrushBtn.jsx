import React, {  useRef } from 'react'
import './SetupUpdateBrushBtn.css'

import { Modal } from 'bootstrap/dist/js/bootstrap.js'

const SetupUpdateBrushBtn = ({ activeCt, typedLat, typedLon, updateTypedCt, updateTypedLat, updateTypedLon }) => {

  const btnTitle = 'Update Position'
  const icon = 'fa fa-pencil'
  const popUpCt      = "Update the selected area position if you have typed the center's latitude and longitude."
  
  const myRef = useRef()

  const ref_lon = /^-?\d+\.?\d*$/.test(typedLon) // retorna true se so houver numeros, decimais, negativo ou positivo e nao vazio
        ? parseFloat(typedLon)
        : NaN

  const ref_lat =  /^-?\d+\.?\d*$/.test(typedLat) // retorna true se so houver numeros
        ? parseFloat(typedLat)
        : NaN

  const invalidLonLat = Number.isNaN(ref_lon) || Number.isNaN(ref_lat)
  const invalidBrush  = activeCt.includes(null)

  const handleClick = () => {
    if(invalidBrush || invalidLonLat) {
      showModal()

      updateTypedLon('')
      updateTypedLat('')
      
    } else if(activeCt[0] !== typedLon || activeCt[1] !== typedLat) {

      updateTypedLon(ref_lon)
      updateTypedLat(ref_lat)

      updateTypedCt(true)
    }
  }

  const hideModal = () => {
    const modalEle = myRef.current
    const bsModal= Modal.getInstance(modalEle)
    bsModal.hide()
  }

  const showModal = () => {
    const modalEle = myRef.current
    const bsModal = new Modal(modalEle, {
        backdrop: 'static',
        keyboard: false
    })
    bsModal.show()
  }

  const msg = 'You need to: (1) select a region on the map first; or (2) type valid longitude and latitude values.'

  return(
    <>
    <button 
        className="btn btn-sm m-1 setup-update-btn"
        data-bs-toggle="popover" title={popUpCt}
        onClick={() => handleClick()}>
          <i className={`setup-save-btn-icon ${icon}`}></i>
          {btnTitle}
    </button>

    <div className="modal fade" ref={myRef} tabIndex="-1">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
          <h5 className="setup-update-label">Empty fields</h5>
        </div>
        <div className="modal-body">
          <label className="setup-update-label">{msg}</label>
        </div>
          <div className="modal-footer">
            <button type="button" className="btn setup-update-OkBtn btn-sm" onClick={() => hideModal()}>Ok</button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default SetupUpdateBrushBtn
