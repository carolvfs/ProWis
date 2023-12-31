import React, { useRef, useState, useEffect } from 'react'
import './Modal.css'

import { Modal } from 'bootstrap/dist/js/bootstrap.js'

import Manager from '../../manager/Manager'

const AddMemberModal = ({ 
  nDoms, 
  nodeId, 
  ensembles, 
  activeEns, 
  collections, 

  setNode, 
  updateEnsembles, 
  seeAddMemberModal, 
  setSeeAddMemberModal
 }) => {

    const myRef = useRef()

    const initalInstruction = 'Which ensemble would you like to add this member to?\n'
    const newEnsMsg         = 'If you want to create a new ensemble, enter a name for it (no blanks) and select the grid:'
    
    const [ensId       , setEnsId]       = useState(null)
    const [newEnsName  , setNewEnsName]  = useState('')
    const [newGridId   , setNewGridId]   = useState(null)
    const [instruction , setInstruction] = useState('')
    const [list        , setList]        = useState([])

   
    const grids = Array.from({length: nDoms}, (_, i) => i + 1)

    const handleClose = () => {
      setNode(null)
      setSeeAddMemberModal(false)
  
      hideModal()

    }

    const handleOk = async () => {
      if(ensId !== null || (newEnsName !== '' && newGridId !== null)) {
          await Manager.postMember('post', nodeId, ensId, newEnsName, newGridId)
          updateEnsembles()
          hideModal()
          // await updateEnsembles()
          // await interm.checkAirflow(updateTree)
          
      }

      setNode(null)
      setSeeAddMemberModal(false)
  
      hideModal()

    }

    const handleType = (event) => {
        setNewEnsName(event.target.value)
        setEnsId(null)
    }

    const filterEnsembles = (_collections, _ensembles, _nodeId) => {
        let avEns = []
    
        const wfCollectionsIds = _collections.filter(c => c[3].includes(_nodeId)).map(c => c[0])
        avEns = _ensembles.filter(e => wfCollectionsIds.includes(e[2]))

        return avEns
    
    }

    const renderEnsembles = () => {
      if(list.length > 0) {

        return (
          <>
            {list.map(ens => {    
              const _ensId   = ens[0]
              const _ensName = ens[1]
              const isMember =  ens[4].includes(nodeId)
              const collectionName = collections.filter(c => c[0] === ens[2])[0][1]
              
              const _disabled = _ensId === activeEns || isMember
              
              const warning = _disabled 
              ? isMember
              ? '--- It is a member.'
              : '--- Deactivate this ensemble first.'
              : ''
              
              // const _label = `${_ensId} ${_ensName} (Collection ${_ensCollection}) ${warning}`
              const _label = `${_ensName} (${collectionName}) ${warning}`
              
              return (
                <div className="form-check" key={`addTo-ensItems-${_ensId}`}>
                  <input 
                    className="form-check-input system-modal-radio" 
                    name='ensembles' 
                    type="radio" 
                    checked={_disabled ? false : _ensId === ensId}
                    onChange={() => {setEnsId(_ensId); setNewGridId(null); setNewEnsName('')}}
                    disabled={_disabled}
                    />
                  <label className="form-check-label system-modal-label">
                    {_label}
                  </label>
                </div>
              )
            })}

            <hr/>
          </>
        )
      } else {
        return ''
      }

    }

    const renderNewEnsemble = () => {
        return(
            <>
              <p className='system-modal-form'>{newEnsMsg}</p>
                <form autoComplete="off">
                  <input type='text' 
                    className='form-control system-modal-form-input'
                    name='ensInput'
                    value={newEnsName}
                    onChange={e => handleType(e)}
                  />
                </form>
      
                {grids.map(gId => { 
                  return (
                    <div className="form-check form-check-inline system-modal-form" key={`addTo-gridItems-${gId}`}>
                      <input 
                        className="form-check-input system-modal-radio" 
                        name='grid' 
                        type="radio" 
                        id="grid1"
                        checked={gId === newGridId}
                        onChange={() => {setNewGridId(gId); setEnsId(null)}}
                        />
                      <label className="form-check-label system-modal-form" >Grid {gId}</label>
                    </div>
                  )
                })}
            </>
          )

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
        ? initalInstruction
        : ''

      setInstruction(_intruction)
      setList(_list)

    }, [collections, ensembles, nodeId])

    useEffect(() => { if(seeAddMemberModal) showModal()}, [seeAddMemberModal])

    return (
        <div className="modal fade" ref={myRef} tabIndex="-1">
        <div className="modal-dialog" role="document">
            <div className="modal-content">
            <div className="modal-header system-modal-header">
                <h5 className="modal-title system-modal-title">Add member</h5>
                <button 
                  type="button" 
                  className="btn-close system-modal-close" 
                  data-bs-dismiss="modal" 
                  aria-label="Close"
                  onClick={() =>  handleClose()}
                  ></button>
            </div>
            <div className="modal-body system-modal-body">
                <label className="col-form-label system-modal-label">{instruction}</label>
                {renderEnsembles()}
                {renderNewEnsemble()}
            </div>
            <div className="modal-footer">
                <button type="button" className="btn system-modal-ok" onClick={() => handleOk()}>OK</button>
            </div>
            </div>
        </div>
      </div>
    )

    
}
  
export default AddMemberModal