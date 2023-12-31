import React, { useRef, useState, useEffect, useCallback } from 'react'

import paths from '../../consts/route-paths'

import Nav from '../layout/Nav'
import Main from '../layout/Main'

import Login from '../../components/dropdowns/LoginDdwn'
import ProjectTemplate from '../../components/buttons/ProjectBtn'
import NewProjectModal from '../../components/modals/NewProjectModal'

import Manager from '../../manager/Manager'

const Home = () => {

  const myRef = useRef()

  const newProjBtnIcon  = "fa fa-plus fa-3x"
  const newProjBtnTitle = "New"

  const projBtnIcon = "fa fa-file fa-3x"

  const [serverPort  , setPort]     = useState(false)
  const [projsList   , setProjList] = useState([])
  const [activeUserTp, setUserTp]   = useState([])
  const [seeModal    , setSeeModal] = useState(false)

  const updateProjectsList = useCallback( async () => {
    const _projsList = await Manager.getProjects()
    setProjList(_projsList)
  }, [])


  const checkActiveUser = useCallback(async () => {
    const _actviveUserTp = await Manager.getActiveUser()

    if (_actviveUserTp.length > 0) {
      setUserTp(_actviveUserTp)
      updateProjectsList()
    }

  }, [updateProjectsList])

  const checkServer = useCallback(() => { 
    Manager.checkServer(setPort) 
    
  }, [setPort])

  const deactivateAnyProject = useCallback( async () => {
    await Manager.setActiveProject(null)
  }, [])

  const updateActiveProject = async (projTp) => {
    await Manager.setActiveProject(projTp)
    
    const url = paths.analyses
    window.location.replace(url)
  }

  useEffect(() => { 
    checkServer()
    checkActiveUser()
    deactivateAnyProject()

  }, [checkServer, checkActiveUser, deactivateAnyProject])

  
  const renderLogin = () => {
    if(serverPort) {
      return <Login 
        activeUserTp={activeUserTp} 
        setUserTp={setUserTp} 
        updateProjectsList={updateProjectsList}

        />
    
    } else {
      return ''
    }
  }
  
  const renderMain = () => {
    return (
      <Main>
        <div className="board d-flex d-flex-column justify-content-left">
          {renderNewProjectBtn()}
          {renderProjectsBtn()}
        </div>
      </Main>
    )
  }
  
  const renderNav = () => {
    return (
      <Nav>
        <div className="col-auto">
          {renderLogin()}
        </div>
      </Nav>
    )
  }

  const renderNewProjectBtn = () => {
    if (activeUserTp.length === 0 || !serverPort) {
      return ''

    } else {

      return (
        <>
          <ProjectTemplate 
            icon={newProjBtnIcon} 
            title={newProjBtnTitle} 
            action={setSeeModal} 
            actionInput={true}
            />
          <NewProjectModal 
            seeModal={seeModal} 
            setSeeModal={setSeeModal} 
            projsList={projsList}
            updateProjectsList={updateProjectsList}
            />
        </>
      )
    }
  }

  const renderProjectsBtn = () => {
    if (activeUserTp.length === 0 || !serverPort) {
      return ''
      
    } else {
      return projsList.map(projTp => {
        const projKey = `project-btn-${projTp[0]}`

        return <ProjectTemplate 
          icon={projBtnIcon} 
          title={projTp[1]} 
          key={projKey} 
          action={updateActiveProject} 
          actionInput={projTp}
          />

      })
    }
  }
  
  return (
    <div ref={myRef}>
      {renderNav()}
      {renderMain()}
    </div>
  )
}

export default Home