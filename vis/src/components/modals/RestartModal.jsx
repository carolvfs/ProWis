import React, { useRef, useState, useEffect } from 'react'
import './Modal.css'

import { Modal } from 'bootstrap/dist/js/bootstrap.js'

import Manager from '../../manager/Manager'


const RestartModal = ({ nodeId, nodeInternalId, setNode, seeRestartModal, setSeeRestartModal, updateAllRunOverview }) => {

  const myRef = useRef()
  
  const [nId, setNId]       = useState(null)
  const [nIntId, setNIntId] = useState(null)

  const modalTitle = 'Restart Run'
  const modalMsg   = `Are you sure you want to restart the workflow ${nIntId}?`


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

    setNode(null)
    setSeeRestartModal(false)

    hideModal()
  }
  
  const handleOk = async () => {
    
    setNode(null)
    setSeeRestartModal(false)
    hideModal()
    
    await Manager.restartWorkflow(nId)
    Manager.checkAirflow(updateAllRunOverview)

  }

  useEffect(() => { setNId(nodeId) }, [nodeId])
  useEffect(() => { setNIntId(nodeInternalId) }, [nodeInternalId])

  useEffect(() => { if(seeRestartModal) showModal()}, [seeRestartModal])

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

export default RestartModal