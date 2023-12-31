import React, { useRef, useState } from 'react'
import { useEffect } from 'react'
import './Alert.css'

const SbAlert = ({ data, sliceBottom, sliceLeft, activeMeas }) => {

    const myRef = useRef()

    const [time , setTime]  = useState('')
    const [day  , setDay]  = useState('')
    const [acc  , setAcc]    = useState('')
    const [value, setValue] = useState('')
    const [meas , setMeas]  = useState('')

    useEffect(() => {
        const nameArr = data.name.split('-')

        const _acc    = parseInt(nameArr[0].split('h'))
        const t       = parseInt(nameArr[1])

        const _time = t * _acc
        const _day = Math.ceil(_time / 24) 
        const _value = data.v !== null ? `${data.v.toFixed(2)}mm` : 'blank'

        const _meas = activeMeas === 'avg'
            ? "Average grid points: "
            :  activeMeas === 'max'
                ? "Highest value among the grid points: "
                : "Grid point value: "
        
        setDay(_day)
        setTime(_time)
        setAcc(_acc)
        setValue(_value)
        setMeas(_meas)


    }, [data, activeMeas])

    if (time === 0 || acc === 0) {
        return ''

    } else {
        return (
            <div className="alert system-alert" ref={myRef} role="alert" width={'100px'} style={{bottom:sliceBottom, left: sliceLeft}}>
                <p style={{fontSize: '12px', lineHeight:1.0 }}>
                <b>Time step:</b> {time}h (Day {day})
                </p>
                <p style={{fontSize: '12px', lineHeight:1.0 }}>
                   Rainfall accumulated over {acc}h.
                </p>
                <p style={{fontSize: '12px', lineHeight:1.0 }}>
                <b>{meas}</b>{value}
                </p>
            </div>
        )

    }

}

export default SbAlert