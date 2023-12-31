import React, { useRef } from 'react'
import './Alert.css'

import physics from '../../consts/physics'
import colors from '../../consts/colors'

const QuickLook = ({ data, nodeBottom, nodeLeft }) => {

    const myRef = useRef()

    const statusColor = data.status.includes('success')
        ? colors.success 
        : data.status.includes('failed') 
            ? colors.failed
            : colors.running

    const fSize='12px'
    const coll = data.collections.length > 0 ? data.collections.sort().toString() : 'blank'

    let start_date = ''
    let start_hour = ''
    let end_date   = ''
    let end_hour   = ''
    let run_hours  = ''

    if(data.start_date) {
      const _date = data.start_date.split("_")[0].split("-")

      const y = parseInt(_date[0])
      const m = parseInt(_date[1]) - 1
      const d = parseInt(_date[2])

      start_date = new Date(y, m, d).toDateString()
      start_hour = `${data.start_date.split("_")[1]} UTC`
    }

    if(data.end_date) {
      const _date = data.end_date.split("_")[0].split("-")

      const y = parseInt(_date[0])
      const m = parseInt(_date[1]) - 1
      const d = parseInt(_date[2])

      end_date = `\xa0\xa0${new Date(y, m, d).toDateString()}`
      end_hour = `${data.end_date.split("_")[1]} UTC`
    }

    if(data.run_hours) run_hours = `${data.run_hours}h`
    

    const renderParams = () => {
      return physics.physicalProcesses.map(processArr => {
        const processKey = processArr[0]
        const paramsArr  = physics.parameterizations[processKey]
        const paramsArrFiltered = paramsArr.filter(pArr => pArr[0] === data[processKey])

        if(paramsArrFiltered.length > 0) {

          const param = paramsArrFiltered[0][1]
          const processTitle = processArr[1]

          return <p key={`quick-look-${processKey}`} style={{fontSize:fSize, lineHeight:0.7}}>
                  <b>{`${processTitle}`}</b>: {`${param} (${data[processKey]})`}
                </p>
        
      } else {
          
          return ''
        }


      })
    }

    
    return (
      <div className="alert system-alert" ref={myRef} role="alert" style={{bottom:nodeBottom, left: nodeLeft}}>
        <h5>{data.wfName}</h5>
        <hr/>
        <p style={{color:statusColor, fontSize:fSize}}><b>Status</b>: {data.status}</p>

        <hr/>
        
        <p style={{fontSize:fSize, lineHeight:0.5}}><b>Start date</b>: {start_date} {start_hour}</p>
        <p style={{fontSize:fSize, lineHeight:0.5}}><b>End date</b>:   {end_date} {end_hour}</p>
        <p style={{fontSize:fSize, lineHeight:0.5}}><b>Run hours</b>:   {run_hours}</p>
        
        <hr/>

        <p style={{fontSize:fSize}}><b>ICBC</b>:   {data.icbc_model}</p>

        <hr/>

        <p style={{fontSize:fSize}}><b>Collections Id</b>:   {coll}</p>

        <hr/>

        {renderParams()}

      </div>
    )

}

export default QuickLook