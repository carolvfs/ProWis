import React, { useRef, useState, useEffect } from 'react'
import './Modal.css'

import { Modal } from 'bootstrap/dist/js/bootstrap.js'

import Manager from '../../manager/Manager'


const AbortModal = ({ nodeId, nodeInternalId, setNode, seeAbortModal, setSeeAbortModal, updateAllRunOverview }) => {

  const myRef = useRef()
  
  const [nId, setNId]       = useState(null)
  const [nIntId, setNIntId] = useState(null)

  const modalTitle = 'Abort Run'
  const modalMsg   = `Are you sure you want to abort the workflow ${nIntId}?`


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

  const handleClose = () => {
    setNode(null)
    setSeeAbortModal(false)

    hideModal()
  }
  
  const handleOk = async () => {
    setNode(null)
    setSeeAbortModal(false)
    hideModal()
    
    await Manager.abortAirflow(nId)
    Manager.checkAirflow(updateAllRunOverview)

  }

  useEffect(() => { setNId(nodeId) }, [nodeId])
  useEffect(() => { setNIntId(nodeInternalId) }, [nodeInternalId])

  useEffect(() => { if(seeAbortModal) showModal()}, [seeAbortModal])

  return (
      <div className='modal fade' ref={myRef} aria-hidden="true" tabIndex='-1'>
      <div className='modal-dialog' role='document'>
        <div className='modal-content'>
          <div className='modal-header system-modal-header'>
          <h5 className="modal-title system-modal-title">{modalTitle}</h5>
          <button 
              type="button" 
              className="btn-close system-modal-close" 
              data-bs-dismiss="modal" 
              aria-label="Close"
              onClick={() =>  handleClose()}
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

export default AbortModal