import React, { useState, useEffect } from 'react'
import SmallDdwn from './SmallDdwn'

const CollectionDdwn = ({ activeCollectionId, collections, updateScatter02 }) => {

    const initialCollection = 'no selection'

    const [activeItem, setItem] = useState(initialCollection)
    const [list, setList] = useState(collections)

    const handleClick = (itm) => { updateScatter02(itm[0]) }

    useEffect(() => { setList(collections) }, [collections])
    useEffect(() => { 

    const item = collections.filter(d => d[0] === activeCollectionId)
    setItem(item[0][1]) 

    }, [activeCollectionId, collections])

    return <SmallDdwn title={`Collection: ${activeItem}`} items ={list} handleClick = {handleClick} />


}

export default CollectionDdwn