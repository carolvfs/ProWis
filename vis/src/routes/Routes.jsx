import React from 'react'
import { Routes, Route, useMatch } from 'react-router-dom'

import Home from '../views/home/Home'
import Analyses from '../views/analyses/Analyses'
import SetUp from '../views/setup/Setup'

import paths from '../consts/route-paths'


const analysesPath = `${paths.analyses}`
const setupPath    = `${paths.setup}`

const MyRoutes = () => {

    return (
        <Routes>
            <Route exact path='/' element={<Home/>} />
            <Route path={analysesPath} element={<Analyses data={useMatch(analysesPath)}/>} />
            <Route path={setupPath} element={<SetUp data={useMatch(setupPath)}/>} /> 
        </Routes>
    )
}

export default MyRoutes