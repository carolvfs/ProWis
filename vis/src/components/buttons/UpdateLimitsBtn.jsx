import React, {  useRef } from 'react'
import './UpdateLimitsBtn.css'

import { Modal } from 'bootstrap/dist/js/bootstrap.js'

import Manager from '../../manager/Manager'

import atmvars_consts from '../../consts/atm-vars'


const UpdateLimits = ({ 
  meas, 
  hmat, 
  hmap,
  initialInputsP,
  initialInputs,
  inputsP, 
  inputs, 
  time, 
  intervalP, 
  newLimits, 
  mapAtmvar, 
  lastTime,
  spinnerArr, 
  updateHmat, 
  updateHmap,
  updateNewLimits, 
  updateInputs,
  updateInputsP,
  updateSpinner, }) => {
  
  const myRef = useRef()
  const popTitle = "Update the matrices and maps considering the lower limits typed alongside."
  const modalTitle = "Typos"
  const modalMsg   = "Some field has a problem. Confirm that you did not leave any fields blank or misspelled."

  const checkInputs = () => {
    let ok = true

    const precLim = inputsP.prec[0]
    const precAcc = inputsP.prec[1]

    if(precLim === '' || precLim === null || precLim === undefined || precLim <= 0 ||
      precAcc === '' || precAcc === null || precAcc === undefined || precAcc > lastTime || precAcc <= 0) {
        ok = false

    } else {
      Object.keys(inputs).forEach(nick => {
        if(inputs[nick] === '' || inputs[nick] === null || inputs[nick] === undefined || inputs[nick] < 0) {
          ok = false
        }
      })
    }

    return ok
  }
  
  const handleClick = async () => {
    
    const ok = checkInputs()

    let precLim = ok ? inputsP : initialInputsP
    let lims    = ok ? inputs  : initialInputs
    
    updateSpinner(spinnerArr[0])

    const _hmat = {...hmat}
    const _hmap = [...hmap]

    const _newLimits = [...newLimits]
    console.log(precLim)
    console.log(lims)

    const idx = _newLimits.indexOf('acc')
    if(idx !== -1) _newLimits.splice(idx, 1)

    for(let i=0; i < _newLimits.length; i++) {
      const atmvar = _newLimits[i]

      if(atmvar === atmvars_consts.nicks[0]) {
        const resp = await Manager.getHmatProb(meas, [atmvar], precLim)
        _hmat[atmvar] = resp[atmvar]

      } else {
        const resp = await Manager.getHmatProb(meas, [atmvar], null, lims)
        _hmat[atmvar] = resp[atmvar]
      }
      
      const mIdx = mapAtmvar.indexOf(atmvar)

      if(mIdx > -1) {
        let ti = time
        let tf = time

        let limit = lims[atmvar]

        if(atmvar === atmvars_consts.nicks[0]) {
          ti = intervalP[0]
          tf = intervalP[1]
          limit = precLim[atmvar]
        }

        _hmap[mIdx] = await Manager.getEnsHmapProb(atmvar, limit, ti, tf)
      }
    }

    updateHmat(_hmat)
    updateHmap(_hmap)
    updateSpinner(spinnerArr[1])
    updateNewLimits([])

    if(!ok) {
      updateInputsP(initialInputsP)
      updateInputs(initialInputs)
      showModal()
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
    <div className="col-auto">
      <button 
          className="btn prob-update-btn"
          data-bs-toggle="popover" title={popTitle}
          onClick={() => handleClick()}>
            Update Limits
      </button>

      <div className="modal fade" ref={myRef} tabIndex="-1">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="prob-update-modal-btn-label">{modalTitle}</h5>
          </div>
          <div className="modal-body">
            <label className="prob-update-modal-btn-label">{modalMsg}</label>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn prob-update-modal-btn-ok btn-sm" onClick={() => hideModal()}>Ok</button>
          </div>
        </div>
      </div>
    </div>

  </div>
  )
}

export default UpdateLimits
