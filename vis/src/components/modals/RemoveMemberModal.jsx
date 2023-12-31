import React, { useRef, useState, useEffect } from 'react'
import './Modal.css'

import { Modal } from 'bootstrap/dist/js/bootstrap.js'

import Manager from '../../manager/Manager'

const RemoveMemberModal = ({ 
  nodeId, 
  activeEns, 
  ensembles, 
  collections, 
  seeRemoveMemberModal, 

  setNode, 
  updateEnsembles, 
  setSeeRemoveMemberModal, 
}) => {

  const myRef = useRef()

  const initialInstruction = 'From which ensemble would you like to remove this member?\n'
  const errorInstruction   = 'This run does not belong to any ensemble.\n'
  
  const [ensId      , setEnsId]       = useState(null)
  const [list       , setList]        = useState([])
  const [instruction, setInstruction] = useState(null)

  const filterEnsembles = () => {
    const avEns = ensembles.filter(e => e[4].includes(nodeId))
    return avEns
  }
  
  const handleClose = () => {

    setNode(null)
    setSeeRemoveMemberModal(false)
    hideModal()
  }

  const handleOk = async () => {
    if(ensId !== null) {
      await Manager.deleteMember(nodeId, ensId)
      
      updateEnsembles()
      // await updateEnsembles()
      // await interm.checkAirflow(updateTree)
    }

    setNode(null)
    setSeeRemoveMemberModal(false)
    hideModal()
  }
  
  const renderEnsembles = () => {
    if(list.length > 0) {

      return (
        list.map(ens => {
          const _ensId    = ens[0]
          const _disabled = _ensId === activeEns
          
          const _ensName = ens[1]
          const collectionName = collections.filter(c => c[0] === ens[2])[0][1]
          
          const warning = _disabled ? '[Deactivate this ensemble first.]' : ''
          const _label  = `${_ensName} (${collectionName}) ${warning}`

          return (
            <div className="form-check" key={`addTo-ensItems-${_ensId}`}>
              <input 
                className="form-check-input system-modal-radio" 
                name='ensembles' 
                type="radio" 
                id="flexCheckDefault"
                checked={_disabled ? false : _ensId === ensId}
                onChange={() => setEnsId(_ensId)}
                disabled={_disabled}
                
                />
              <label className="form-check-label system-modal-label">
                {_label}
              </label>
            </div>
          )
        })
      )
    } else {
      return ''
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

  useEffect(() => { 
    const _list = filterEnsembles(collections, ensembles, nodeId)
    const _intruction = _list.length > 0
      ? initialInstruction
      : errorInstruction

    setInstruction(_intruction)
    setList(_list)

  }, [collections, ensembles, nodeId])

  useEffect(() => { if(seeRemoveMemberModal) showModal()}, [seeRemoveMemberModal])

  return (
    <div className="modal fade" ref={myRef} tabIndex="-1">
      <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header system-modal-header">
                <h5 className="modal-title system-modal-title">Remove member</h5>
                <button 
                  type="button" 
                  className="btn-close system-modal-close" 
                  data-bs-dismiss="modal" 
                  aria-label="Close"
                  onClick={() =>  handleClose()}
                  ></button>
            </div>
            <div className="modal-body">
                <label className="system-modal-label">{instruction}</label>
                {renderEnsembles()}
            </div>
            <div className="modal-footer">
                <button type="button" className="btn system-modal-ok" onClick={() => handleOk()}>Ok</button>
            </div>
        </div>
      </div>
    </div>
  )
}

export default RemoveMemberModal