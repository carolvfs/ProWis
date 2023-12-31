import './Main.css'
import React from 'react'

const Main = (props) => {
    return (
    <React.Fragment>
        <main className="content container-fluid">
            <div className="p-2 mt-2">
                {props.children}
            </div>
        </main>
    </React.Fragment>
    )}

export default Main