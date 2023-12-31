import React, {  useRef } from 'react'
import './SetupSaveBtn.css'

import { Modal } from 'bootstrap/dist/js/bootstrap.js'

import Manager from '../../manager/Manager'
import wps from '../../consts/wps'

const SetupSaveBtn = ({ 
  activeId,

  activeIp,
  activeJp,
  active_e_sn,
  active_e_we,
  activeNw,
  activeSe,
  activeCt,
  coarse_res,

  ref_x,
  ref_y,

  updateId,
  updateList,
  updateDisabled,
  updateSaveGrid,
  
 }) => {
  
  const myRef = useRef()

  const msg = 'There are some blank fields.'

  let title = 'Empty fields'

  const btnTitle = 'Record Domain'
  const icon     = 'fa fa-database'
  const popSave  = 'Save the domain you have set on the map.'
  

  const handleClick = async () => {

    if(
      activeNw.includes(null)  || 
      activeSe.includes(null) ||
      activeCt.includes(null)  ||
      coarse_res === '' ){

      showModal()
    
    } else {

      const domain = {}

      if(activeId === 1) {
        domain.res       = coarse_res
        domain.parent_id = 1
        domain.ref_x     = ref_x
        domain.ref_y     = ref_y

        updateDisabled(true)

      } else {
        domain.res =  coarse_res / Math.pow(wps.parent_grid_ratio, activeId-1)
        domain.parent_id = activeId - 1

      }
        
      domain.id      = activeId
      domain.ref_lon = activeCt[0]
      domain.ref_lat = activeCt[1]

      domain.nw_lon  = activeNw[0]
      domain.nw_lat  = activeNw[1]

      domain.se_lon  = activeSe[0]
      domain.se_lat  = activeSe[1]

      domain.e_we = active_e_we
      domain.e_sn = active_e_sn

      domain.i_parent = activeIp
      domain.j_parent = activeJp

      // Post
      await Manager.postDomain(domain)
      const list = await Manager.getDomains()
      updateList(list)

      // Next
      activeId+= 1
      updateId(activeId)
      updateSaveGrid(true)
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

  return(
    <>
    <button 
        className="col-auto btn btn-sm setup-save-btn"
        data-bs-toggle="popover" title={popSave}
        onClick={() => handleClick()}>
          <i className={`setup-save-btn-icon ${icon}`}></i>
          {btnTitle}
    </button>
    
    <div className="modal fade" ref={myRef} tabIndex="-1">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="setup-save-btn-label">{title}</h5>
          </div>
          <div className="modal-body">
            <label className="setup-save-btn-label">{msg}</label>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn setup-save-btn-ok btn-sm" onClick={() => hideModal()}>Ok</button>
          </div>
        </div>
      </div>
    </div>
  </>
  )
}

export default SetupSaveBtn
