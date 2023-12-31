import React, { useRef, useState, useEffect } from 'react'
import './RunWRFModal.css'

import { Modal } from 'bootstrap/dist/js/bootstrap.js'

import paths from '../../consts/route-paths'

import Manager from '../../manager/Manager'

import physics from '../../consts/physics'

const RunWRFModal = ({ 
  allSet, 
  seeModal, 
  updateSeeModal,

  list,

  start_date,
  end_date,
  icbc_model,
  pbl, 
  cumulus, 
  mp_physics, 
  land_surface, 
  surface_layer

 }) => {

    const modalTitle = "Wrap Up"
    const defaultMsg = 'Enter the workflow name (no blanks).'
    const errorMsg1   = 'There are some blank fields or typing erros.'
    const errorMsg2   = 'This name already exists or it is invalid. Please try again (no blanks)'

    const myRef = useRef()

    const [wfName, setWfName]        = useState('')
    const [modalMsg, setModalMsg]    = useState(null)
    const [allowInput, setAllowInput]= useState(false)

    const exists = async () => {
      const workflows = await Manager.getWorkflows()

      const filtered = workflows.filter(wf => wf[1] === wfName)     
      const exists = filtered.length > 0 || wfName === ''

      return exists
    }

    const handleCancel = () => { 
      
      updateSeeModal(false)
      setWfName('')
      setModalMsg(null)
      hideModal()
    }
    
    const handleOk = async () => {
      if (!allowInput) {
        setWfName('')
        setModalMsg(null)
        updateSeeModal(false)
        hideModal()

      } else {
        const invalidName = await exists()
        
        if(invalidName) {
          setModalMsg(errorMsg2)
      
        } else {

            await handlePost()

            const url = paths.analyses
            window.location.replace(url)
            
            setWfName('')
            setModalMsg(null)
            setAllowInput(false)

            updateSeeModal(false)
            hideModal()

        }
      }

        
    }
    
    const handlePost = async () => {

      await Manager.completeWorkflowSetup(
        wfName, 
        start_date, 
        end_date, 
        icbc_model,
        pbl, 
        cumulus, 
        mp_physics, 
        land_surface, 
        surface_layer
      )

      // const url = paths.analyses
      // window.location.replace(url)

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
      if(seeModal) {

        if(!allSet) {
          setAllowInput(false)
          setModalMsg(errorMsg1)
          
        } else {
          setAllowInput(true)
          setModalMsg(defaultMsg)
        }

        showModal()
      }


    }, [seeModal, allSet])

    const renderInput = () => {
      if(!allowInput) {
        return ''
      } else {
        return (
          <input 
          type='text' 
          className='form-control setup-run-modal-input' 
          value={wfName}
          onChange={e =>  setWfName(e.target.value)}
          required />
        )
      }
    }

    const renderSummary = () => {
      if(!allowInput) {
        return ''

      } else {
        const mp = physics.parameterizations['mp_physics'].filter(   arr => arr[0].toString() === mp_physics)
        const cm = physics.parameterizations['cumulus'].filter(      arr => arr[0].toString() === cumulus)
        const ls = physics.parameterizations['land_surface'].filter( arr => arr[0].toString() === land_surface)
        const sl = physics.parameterizations['surface_layer'].filter(arr => arr[0].toString() === surface_layer)
        const pb = physics.parameterizations['pbl'].filter(          arr => arr[0].toString() === pbl)

        return (
          <>
            <table className="table setup-run-modal-summary">
                <thead>
                  <tr>
                    <th>Parent Id</th>
                    <th>Res.</th>
                    <th>Ref Lon</th>
                    <th>Ref Lat</th>
                    <th>e_we</th>
                    <th>e_sn</th>
                  </tr>
                </thead>
                <tbody>
                    {list.map((domain) => {
                        return (
                          <tr key={domain.id}>
                            <td>{domain.parent_id}</td>
                            <td>{domain.res} m</td>
                            <td>{domain.ref_lon}°</td>
                            <td>{domain.ref_lat}°</td>
                            <td>{domain.e_we}</td>
                            <td>{domain.e_sn}</td>
                          </tr>
                        )
                      })}
                </tbody>
            </table>

            <br></br>

            <table className="table setup-run-modal-summary">
                <thead>
                  <tr>
                    <th>Start date</th>
                    <th>End data</th>
                    <th>ICBC</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                      <td>{start_date}</td>
                      <td>{end_date}</td>
                      <td>{icbc_model}</td>
                    </tr>
                </tbody>
            </table>

            <br></br>

            <table className="table setup-run-modal-summary">
                <thead>
                  <tr>
                    <th>PBL</th>
                    <th>Cumulus</th>
                    <th>Mp-physics</th>
                    <th>S. Layer</th>
                    <th>Land S.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                      <td>{`${pb[0][1]} (${pbl})`}</td>
                      <td>{`${cm[0][1]} (${cumulus})`}</td>
                      <td>{`${mp[0][1]} (${mp_physics})`}</td>
                      <td>{`${ls[0][1]} (${land_surface})`}</td>
                      <td>{`${sl[0][1]} (${surface_layer})`}</td>
                    </tr>
                </tbody>
            </table>
          </>
        )
      }
    }

    return (
        <div className='modal fade' ref={myRef} aria-hidden="true" tabIndex='-1'>
        <div className='modal-dialog modal-lg' role='document'>
          <div className='modal-content'>
            <div className='modal-header setup-run-modal-header'>
            <h5 className="modal-title setup-run-modal-title">{modalTitle}</h5>
            <button 
                type="button" 
                className="btn-close setup-run-modal-close" 
                data-bs-dismiss="modal" 
                aria-label="Close"
                onClick={() =>  handleCancel()}
                ></button>

            </div>
            <div className='modal-body setup-run-modal-body '>
              <form autoComplete="off" className='needs-validation' noValidate>
                <div className='form-row'>
                  <div className='form-col'>
                  {renderSummary()}
                  <hr/>
                  <div className='col-form-label setup-run-modal-label' htmlFor='recipient-name'>{modalMsg}</div>
                  {renderInput()}
                  </div>
                </div>
              </form>
            </div>

            <div className='modal-footer'>
              <button type='button' className='btn setup-run-modal-ok btn-sm' onClick={() => handleOk()}>Ok</button>
            </div>
          </div>
        </div>
      </div>
    )
}

export default  RunWRFModal