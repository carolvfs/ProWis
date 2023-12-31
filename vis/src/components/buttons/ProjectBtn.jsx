import React from 'react'
import './ProjectBtn.css'


const ProjectBtn = (props) => {
    return (
      <div className='project-btn btn' onClick={() => props.action(props.actionInput)}>
        <i className={props.icon}></i><span>{props.title}</span>
      </div>
    )
}

export default ProjectBtn