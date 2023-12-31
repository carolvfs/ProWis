import React, { useRef, useEffect, useState } from 'react'
import './TimeBtn.css'

const TimeBtn = ({ activeTime, nTimes, updateTime }) => {

  const myRef = useRef()
  const popTime      = "Active time step on heat maps, line charts and heat matrices"
  const popPlusOk    = `Update the maps' time step to ${activeTime + 1}h`
  const popPlusOErr  = "It will not work since the last time is active"
  const popMinusOk   = `Update the maps' time step to ${activeTime - 1}h`
  const popMinusOErr = "It will not work since the first time is active"

  const [popPlus , setPopPlus]  = useState('')
  const [popMinus, setPopMinus] = useState('')

  const handleMinusClick = () => {
    const newTime = activeTime - 1
    if(newTime >= 0) updateTime(newTime)
  
  }

  const handlePlusClick = () => {
    const newTime = activeTime + 1
    if(newTime <= nTimes - 1) updateTime(newTime)

  }

  useEffect(() => {
    let _popPlus = ''
    let _popMinus = ''

    if (activeTime !== null) {

      _popPlus = activeTime + 1 > nTimes - 1
        ? popPlusOErr
        : popPlusOk

      _popMinus = activeTime - 1 < 0
        ? popMinusOErr
        : popMinusOk

    }

    setPopMinus(_popMinus)
    setPopPlus(_popPlus)

   }, [activeTime, nTimes, popMinusOk, popMinusOErr, popPlusOk, popPlusOErr])

  return (
    <div className='btn-group btn-group-sm analysis-time-btn-group' role='group' ref={myRef}>
      
      <button 
        type='button' 
        className='btn analysis-time-btn' 
        data-bs-toggle="popover" title={popMinus}
        onClick={() => handleMinusClick()}>-1</button>

      <div 
        className="d-inline analysis-time-label"
        data-bs-toggle="popover" title={popTime}
        >{activeTime}h
        </div> 
      
      <button 
        type='button' 
        className='btn analysis-time-btn' 
        data-bs-toggle="popover" title={popPlus}
        onClick={() => handlePlusClick()}>+1</button>
    </div>
  )

}

export default TimeBtn