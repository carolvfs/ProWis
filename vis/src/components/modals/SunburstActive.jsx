import React, { useRef, useState, useEffect } from 'react'
import './Modal.css'

import { Modal } from 'bootstrap/dist/js/bootstrap.js'

const SunburstActive = ({ sbIsActive }) => {
  

  const myRef     = useRef()
  const activeMsg = useRef()
  
  const modalTitle = "Sunburst Alert"

  const msgActive   = "The precipitation map will represent the active and accumulated time on the sunburst, not the one shown on the navigation bar."
  const msgDisabled = "The precipitation map follows the time selected in the navigation bar."
  
  
  const [modalMsg, setMsg] = useState('')

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

  const handleCancel = () => {

    setMsg('')
    hideModal()
  }
  
  const handleOk = async () => {
    
    setMsg('')
    // setSeeSbModal(false)
    
    hideModal()
  }

  useEffect(() => { activeMsg.current = modalMsg }, [modalMsg])
  
  useEffect(() => { 
    if(sbIsActive === true) {
      setMsg(msgActive)
      showModal()
      
    } else if (sbIsActive === false) {
      setMsg(msgDisabled)
      showModal()
    }
    
  }, [msgActive, msgDisabled, sbIsActive])
  

  // useEffect(() => { if(setSeeSbModal) showModal()}, [setSeeSbModal])

  return (
      <div className='modal fade' ref={myRef} aria-hidden="true" tabIndex='-1'>
      <div className='modal-dialog modal-lg' role='document'>
        <div className='modal-content'>
          <div className='modal-header system-modal-header'>
          <h5 className="modal-title system-modal-title">{modalTitle}</h5>
          <button 
              type="button" 
              className="btn-close system-modal-close" 
              data-bs-dismiss="modal" 
              aria-label="Close"
              onClick={() =>  handleCancel()}
              ></button>

          </div>
          <div className='modal-body system-modal--body '>
            <form className='needs-validation' noValidate>
              <div className='form-row'>
                <div className='form-col'>
                <div className='col-form-label system-modal-label' htmlFor='recipient-name'>{modalMsg}</div>
                </div>
              </div>
            </form>
          </div>

          <div className='modal-footer'>
            <button type='button' className='btn system-modal-ok btn-sm' onClick={() => handleOk()}>Ok</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SunburstActive