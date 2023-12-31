import React, { useRef, useState } from 'react'
import './NewProjectModal.css'

import { Modal } from 'bootstrap/dist/js/bootstrap.js'
import { useEffect } from 'react'
import Intermediary from '../../manager/Manager'

const NewProjectModal = ({ seeModal, setSeeModal, projsList, updateProjectsList }) => {

    const modalTitle = "Adding Project"
    const defaultMsg = 'Enter the project title (no special characters or blanks)'
    const errorMsg   = 'This title already exists. Please type another one (no special characters or blanks)'


    const myRef = useRef()

    const [projTitle, setProjTitle] = useState('')
    const [modalMsg, setModalMsg] = useState(defaultMsg)

    const handlePost = async () => {
      const exists = titleExists()

      if(!exists) {
        await Intermediary.postProject(projTitle)
        
        updateProjectsList()
        
        hideModal()
        
        setSeeModal(false)
        setModalMsg(defaultMsg)
        setProjTitle('')
      
      } else {
        setModalMsg(errorMsg)

      }

    }
    
    const handleType = (event) => setProjTitle(event.target.value)

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

    const titleExists = () => {
      const projects = projsList.filter(p => p[1] === projTitle)
      const verdict = projects.length === 0 ? false : true
  
      return verdict
    }

    useEffect(() => {
      if(seeModal) showModal()

    }, [seeModal])

    return (
      <div className="modal fade" ref={myRef} id="newProjModal" aria-hidden="true" aria-labelledby="newProjToggle" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header newProjHeader">
              <h5 className="modal-title" id="newProjToggle">{modalTitle}</h5>
              <button 
                type="button" 
                className="btn-close newProjClose" 
                data-bs-dismiss="modal" 
                aria-label="Close"
                onClick={() => { setSeeModal(false); setModalMsg(defaultMsg); setProjTitle('') }}
                ></button>
            </div>
            <div className="modal-body newProjBody">
              {modalMsg}
              <form autoComplete="off">
                <input type='text' 
                  className='form-control newProjInput' 
                  id='recipient-name'
                  name='projInput'
                  value={projTitle}
                  onChange={e => handleType(e)}
                  required />
              </form>
            </div>
            <div className="modal-footer">
              <button 
                className="btn newProjPost"
                // data-bs-dismiss={hideModal}
                onClick={() => handlePost()}
                >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    )
}

export default NewProjectModal

