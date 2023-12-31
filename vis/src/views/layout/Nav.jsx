import './Nav.css'
import React from 'react'

const Nav = (props) => {
  return (
    <React.Fragment>
      <aside className="menu-area">
        <nav className="menu">
          <div className="res">
            <div className="form">
              <div className="row g-3 p-1 align-items-center">
              {/* <div className="row p-1 align-items-center"> */}
                {props.children}
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </React.Fragment>
  )
}


export default Nav