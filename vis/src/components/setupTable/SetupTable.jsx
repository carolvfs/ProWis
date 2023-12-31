import React, { useRef } from 'react'
import './SetupTable.css'

import { Modal } from 'bootstrap/dist/js/bootstrap.js'

import Manager from '../../manager/Manager'

const SetupTable = (props) => {

  const myRef = {
    dom1: useRef(),
    dom2: useRef(),
    dom3: useRef(),
  }

  const handleClick = async (domRef, domId, nDoms) => {
    if (domId < nDoms) {
      showModal(domRef)
      
    } else {

      await Manager.deleteDomain(domId)

      const list = await Manager.getDomains()
      const activeId = list.length + 1
      
      props.updateList(list)
      props.updateId(activeId)

      if(activeId === 1) {
        props.updateRes('')
      }
    }
  }

  const hideModal = (domRef) => {
    const modalEle = domRef.current
    const bsModal= Modal.getInstance(modalEle)
    bsModal.hide()
  }

  const showModal = (domRef) => {
    const modalEle = domRef.current
    const bsModal = new Modal(modalEle, {
        backdrop: 'static',
        keyboard: false
    })
    bsModal.show()
  }

  const renderTable = () => {
    return (
      <>
        <table className="table mt-2">
          <thead>
            <tr>
              <th>Id</th>
              <th>Parent Id</th>
              <th>Resolution</th>
              <th>Ref Lon</th>
              <th>Ref Lat</th>
              <th>e_we</th>
              <th>e_sn</th>

              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
              {renderRows()}
          </tbody>
        </table>
      </>
    )
  }

  const renderRows = () => {     
    return props.list.map((domain, i, list) => {
      return (
        <tr key={domain.id}>
          <td>{domain.id}</td>
          <td>{domain.parent_id}</td>
          <td>{domain.res} m</td>
          <td>{domain.ref_lon}°</td>
          <td>{domain.ref_lat}°</td>
          <td>{domain.e_we}</td>
          <td>{domain.e_sn}</td>
          <td>
            {renderTrash(domain.id, list.length)}
          </td>
        </tr>
      )
    })
  }

  const renderTrash = (domId, nDoms) => {
    const msg = 'This domain has children. Delete them first.'
    const domRef = myRef[`dom${domId}`]

    return(
      <>
        <button className="btn btn-sm btn-danger m-1 trash"
          onClick={() => handleClick(domRef, domId, nDoms)}>
          <i className="fa fa-trash"></i>
        </button>
        <div className="modal fade" ref={domRef} tabIndex="-1">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
              <h5 className="trashLabel">Parent Domain</h5>
            </div>
            <div className="modal-body">
              <label className="trashLabel">
                {msg}
              </label>
            </div>
              <div className="modal-footer">
                <button type="button" className="btn trashOkBtn" onClick={() => hideModal(domRef)}>Ok</button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return renderTable()

}

export default SetupTable