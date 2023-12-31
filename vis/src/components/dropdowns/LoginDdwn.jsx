import React, { useRef, useState, useEffect, useCallback } from 'react'
import './LoginDdwn.css'

import { Modal } from 'bootstrap/dist/js/bootstrap.js'

import Manager from '../../manager/Manager'

const Login = ({ activeUserTp, setUserTp, updateProjectsList }) => {

  const myRef = useRef()

  const initialLabel    = "Login"
  const initialModalMsg = "Type the new user's name (no blanks or special characters)."
  const modalErrorMsg   = "This is an invalid name. Type the new user's name (no blanks or special characters)."

  const icon       = "loginIcon fa fa-user"

  const modalTitle   = "Add new user"
  const modalOk      = "Ok"
  const modalItemTxt = "+ Add new user"

  const [userLabel  , setUserLabel]    = useState(initialLabel)
  const [usersList  , setUsersList]    = useState([])
  const [newUserName, setNewUserName]  = useState('')
  const [modalMsg   , setModalMsg]     = useState(initialModalMsg)

  const updateUsersList = useCallback( async () => {
    const _usersList = await Manager.getUsers()
    setUsersList(_usersList)
  }, [])
  
  useEffect(() => { updateUsersList() }, [updateUsersList])

  useEffect(() => {
    if(activeUserTp.length === 0) {
      setUserLabel(initialLabel)
    
    } else {
      setUserLabel(activeUserTp[1])
    }

  }, [activeUserTp])

  
  const handleClick = async (userTp) => {
    if(activeUserTp !== userTp) {
      
      await Manager.setActiveUser(userTp)
      
      setUserTp(userTp)
      updateProjectsList()
    }
  }
  
  const handleModalOk = async () => {
    if(newUserName === '' || newUserName.indexOf(' ') >= 0) {
      setModalMsg(modalErrorMsg)
    
    } else {
      
      const ok = await Manager.postUser(newUserName)
      
      if (ok) {
        updateUsersList()
        hideModal()
        setModalMsg(initialModalMsg)
        setNewUserName('')
        updateProjectsList()

      } else {
        setModalMsg(modalErrorMsg)
      }
    }
  }
  
  const handleType = (event) => {
    setNewUserName(event.target.value)
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

////////////////////////////////////////////////
  
  const renderDropdown = () => {
    return (
      <div className="dropdown" ref={myRef}>
          
          <button className="btn loginBtn dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
            <i className={icon} aria-hidden="true"></i>
            {userLabel}
          </button>
          
          <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton">
            {renderUsersItems()}
            <hr className="dropdown-divider"></hr>
            {renderNewUserItem()}
          </ul>
      </div>
    )
  }

  const renderModal = () => {
    return (
      <>
      <div className="modal fade" ref={myRef} tabIndex="-1">
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            
            <div className="modal-header">
              <h5 className="loginTitle">{modalTitle}</h5>
              <button 
                type="button" 
                className="btn-close loginClose" 
                data-bs-dismiss="modal" 
                aria-label="Close"
                onClick={() => { setModalMsg(initialModalMsg); setNewUserName('') }}
                />
            </div>

            <div className="modal-body">
              <form autoComplete="off">
                <div className="form-row">
                  <div className="form-col">
                    <div className="col-form-label login-modal-label" htmlFor="recipient-name">
                      {modalMsg}
                    </div>
                    
                    <input type="text" 
                      className="form-control loginInput"
                      id="recipient-name"
                      name="loginInput"
                      value={ newUserName }
                      onChange={e => handleType(e)}
                      />

                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn loginUpdateBtn"
                onClick={ () => handleModalOk()}
                >
                  {modalOk}
                </button>
            </div>
          </div>
        </div>
      </div>
      </>
    )
  }

  const renderNewUserItem = () => {
    return (
        <div 
          className="dropdown-item loginItem"
          style={{fontSize:'small'}}
          onClick={() => showModal()}>
          {modalItemTxt}
        </div>
    )
  }

  const renderUsersItems = () => {
    return usersList.map(userTp => {
      const userId = userTp[0]
      const userName = userTp[1]

      return (
        <div 
          className={`dropdown-item loginItem`}
          style={{color: '#145252'}}
          key={`login dropdown-item-${userId}`}
          onClick={() => handleClick(userTp)}>

            {userName}
          
        </div>
      )
    })
  }

  return (
    <>
      {renderDropdown()}
      {renderModal()}
    </>
  )
}

export default Login