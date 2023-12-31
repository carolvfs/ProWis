import React, { useRef } from 'react'
import './Limit.css'


const Limit = ({ atmvar, inputsP, inputs, newLimits, updateInputs, updateInputsP, updateNewLimits }) => {

  const myRef = useRef()
  const popPrec=`Enter a lower limit for ${atmvar} (First input in mm and second one in hours). After being updated, the matrices and maps will show the probability of it occurring.`
  const pop    =`Enter a lower limit for ${atmvar}. After being updated, the matrices and maps will show the probability of it occurring.`
  const popTitle = atmvar === 'prec' ? popPrec :  pop

  
  const renderPrecInput = () => {

    const updatePrecField = (event) => {
      const _newLimits = [...newLimits]
      const value   = event.target.value
      const _nick    = event.target.name
      const _inputsP = {...inputsP}

      if(_nick === 'prec') {
        _inputsP[_nick][0] = value

      } else if(_nick === 'acc') {
        const _inputsP = {...inputsP}
        _inputsP['prec'][1] = value
      }
      
      updateInputsP(_inputsP)

      if (!_newLimits.includes(_nick)) {
        _newLimits.push(_nick)
        updateNewLimits(_newLimits)
      }
    }

    if(atmvar === 'prec') {
      return (
        <>
          <input type="text" className="form-control prob-input-prec"
            name        = {atmvar}
            value       = {inputsP[atmvar][0]}
            onChange    = {e => updatePrecField(e)}
            placeholder = "limit"
            required
            />
          <input type="text" className="form-control prob-input-acc"
            name        = 'acc'
            value       = {inputsP[atmvar][1]}
            onChange    = {e => updatePrecField(e)}
            placeholder = "h"
            required
            />
          </>
    )
  } else {

    return ''
  }

  }

  const renderInput = () => {

    const updateField = (event) => {
      const _newLimits = [...newLimits]
      const _inputs = {...inputs}
      const value = event.target.value
      const _nick  = event.target.name
      _inputs[_nick] = value

      updateInputs(_inputs)

      if (!_newLimits.includes(_nick)) {
        _newLimits.push(_nick)
        updateNewLimits(_newLimits)
      }
    }

    if(atmvar !== 'prec') {
      return (
        <input type="text" className="form-control prob-input"
        name={atmvar}
        value={inputs[atmvar]}
        onChange={e => updateField(e)}
        placeholder='limit'
        required/>
      )
    } else {
      return ''
    }
  }

  return (
    <div className="col-auto prob-input-wrapper" ref={myRef}>
      <div className="input-group" >
        <span className="input-group-text prob-input-span" data-bs-toggle="popover" title={popTitle}>{atmvar}</span>
        {renderPrecInput()}
        {renderInput()}
      </div>
    </div>
  )

}

export default Limit