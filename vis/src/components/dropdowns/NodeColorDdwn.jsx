import React, { useRef, useState, useEffect } from 'react'

import SmallDdwn from './SmallDdwn'

import physics from '../../consts/physics'
import nodeColorItems from '../../consts/node-colors'

const NodeColorDdwn = ({ active, updateItem, ensembles }) => {

  const defaultItems = nodeColorItems.map( d => d)
  const physicItems  = physics.physicalProcesses.map(p => p)
  
  const initialItems = useRef()
  
  initialItems.current = defaultItems.concat(physicItems)

  const [activeItem, setItem] = useState(active)
  const [list      , setList] = useState(initialItems.current)

  const myList = useRef()
  
  const handleClick = (itm) => { updateItem(itm[0]) }

  useEffect(() => { 
    const newList = [ ...initialItems.current ]

    ensembles.forEach(ens => {
        const ensName = ens[1]
        const ensCollectionInternalId = ens[3]
        
        const arr = [ens[0], `${ensName} (C${ensCollectionInternalId})`]
        newList.push(arr)
    })

    setList(newList)

  }, [ensembles, setList])

  useEffect(() => { myList.current = list }, [list])

  useEffect(() => {
    
    const item = myList.current.filter(d => d[0] === active)
    setItem(item[0][1]) 

  }, [active])

  return <SmallDdwn title={`Color by: ${activeItem}`} items ={list} handleClick = {handleClick} />



}

export default NodeColorDdwn