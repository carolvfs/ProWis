import React from 'react'
import Manager from '../../manager/Manager'
import paths from '../../consts/route-paths'
import './StartBtn.css'

const StartBtn = () => {
    const handleClick = async () => {
        await Manager.postWorkflow(null)

        const url = paths.setup
        window.location.replace(url)

    }

    return (
        <div className='mt-2'>
            <button 
                type="button" 
                className="btn btn-sm btn-outline-secondary start-btn"
                onClick={() => handleClick()}
                >
                   Set up your first run
            </button>
        </div>
    )
}

export default StartBtn