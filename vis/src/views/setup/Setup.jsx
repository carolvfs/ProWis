import React, { createRef } from 'react'
import './Setup.css'

import paths from '../../consts/route-paths'
import physics from '../../consts/physics'
import icbc_models from '../../consts/icbc'

// Layout
import Main from '../layout/Main'
import Nav  from '../layout/Nav'

import Manager from '../../manager/Manager'

// Components
import BackBtn       from '../../components/buttons/BackBtn'
import ForwardBtn from '../../components/buttons/ForwardBtn'

import SetupMap from '../../components/setupMap/SetupMap'
import SetupTable from '../../components/setupTable/SetupTable'

import SetupSaveBtn from '../../components/buttons/SetupSaveBtn'
import SetupUpdateBrushBtn from '../../components/buttons/SetupUpdateBrushBtn'

import PhysicsDdwn from '../../components/dropdowns/PhysicsDdwn'
import IcbcDdwn from '../../components/dropdowns/IcbcDdwn'

import RunWRFModal from '../../components/modals/RunWRFModal'


const initialState = {
  seeRunModal: false,
  allSet: false,
  saveGrid: false,
  brushing: false,

  typedCt: false,

  typedLon: '',
  typedLat: '',

  activeCt: [null, null],
  activeNw: [null, null],
  activeSe: [null, null],

  activeId: 1,
  
  active_e_we: null,
  active_e_sn: null,

  ref_x: null,
  ref_y: null,

  activeIp: null,
  activeJp: null,
  
  list: [],
  
  icbc_model: '',
  
  pbl:          '',
  cumulus:      '',
  mp_physics:   '',
  land_surface: '',
  surface_layer:'',
  
  coarse_res: '',

  disabled: false,

  start_date: '',
  end_date: '',

  wfName: '' ,


}

const backBtnTitle = 'Cancel'
const forwardBtnTitle = 'Run WRF'

export default class Setup extends React.Component {
  constructor(props) {
    super(props)
      
      this.myRef = createRef()

      this.state = { ...initialState }

      
    }

  async componentDidMount() {

    const childAttrs = await Manager.getChildAttrs()

    // Dates
    const start_date = childAttrs.dates.start_date
    const end_date   = childAttrs.dates.end_date

    // Domains
    const coarse_res = childAttrs.coarse_res
    const ref_x      = childAttrs.ref_x
    const ref_y      = childAttrs.ref_y

    const list       = childAttrs.domains

    const activeId = !Array.isArray(list) || list.length === 0
      ? 1
      : parseInt(list[list.length-1].id + 1)
    
    const disabled = activeId > 1

    // ICBC
    const icbc_model = childAttrs['icbc'] ? childAttrs['icbc'] : icbc_models[0].name
    

    // Physics
    let pbl           = physics.parameterizations['pbl'][0][0]
    let cumulus       = physics.parameterizations['cumulus'][0][0]
    let mp_physics    = physics.parameterizations['mp_physics'][0][0]
    let land_surface  = physics.parameterizations['land_surface'][0][0]
    let surface_layer = physics.parameterizations['surface_layer'][0][0]


    if(Object.keys(childAttrs.physics).length > 0) {
      mp_physics    = childAttrs.physics.mp_physics
      cumulus       = childAttrs.physics.cumulus
      pbl           = childAttrs.physics.pbl
      land_surface  = childAttrs.physics.land_surface
      surface_layer = childAttrs.physics.surface_layer

    }

    this.setState({
      start_date,
      end_date,
      coarse_res,
      ref_x,
      ref_y,
      list,
      activeId,
      disabled,
      icbc_model,
      mp_physics   ,
      cumulus      ,
      pbl          ,
      land_surface ,
      surface_layer,
    })


  }

  updateList = (list) => this.setState({ list })

  updateEndDate   = (end_date)   => this.setState({ end_date })
  updateStartDate = (start_date) => this.setState({ start_date })
  updateRes       = (coarse_res) => this.setState({ coarse_res })
  updateDomain    = (domain)     => this.setState({ domain })

  updateCt       = (activeCt) => {
    const typedLon = activeCt[0] === null ? '' : activeCt[0]
    const typedLat = activeCt[1] === null ? '' : activeCt[1]

    this.setState({ activeCt, typedLon, typedLat })
  }

  updateTypedLon = (typedLon) => { const _typedLon = typedLon === null ? '' : typedLon ; this.setState({ typedLon: _typedLon })}
  updateTypedLat = (typedLat) => { const _typedLat = typedLat === null ? '' : typedLat ; this.setState({ typedLat: _typedLat })}

  updateTypedCt  = (typedCt)  => this.setState({ typedCt })

  updateId       = (activeId) => { const disabled = activeId > 1 ;this.setState({ activeId, disabled }) }
  updateEweEsn   = (active_e_we, active_e_sn) => this.setState({ active_e_we, active_e_sn })

  updateNwSe     = (activeNw, activeSe) => this.setState({ activeNw, activeSe })

  updateBrushing = (brushing)    => this.setState({ brushing })
  updateSaveGrid = (saveGrid)    => this.setState({ saveGrid })
  updateDisabled = (disabled)    => this.setState({ disabled })

  updateRefXY     = (ref_x, ref_y)       => this.setState({ ref_x, ref_y })
  updateIJParents = (activeIp, activeJp) => this.setState({ activeIp, activeJp })

  updateIcbcModel = (icbc_model) => this.setState({ icbc_model })


  ///////// MAP

  renderMap() {
    return (
      <SetupMap
        activeCt = {this.state.activeCt}
        activeId = {this.state.activeId}
        
        list       = {this.state.list}
        coarse_res = {this.state.coarse_res}
        saveGrid   = {this.state.saveGrid}

        typedLat   = {this.state.typedLat}
        typedLon   = {this.state.typedLon}
        typedCt    = {this.state.typedCt}

        updateBrushing  = {this.updateBrushing}
        updateTypedCt   = {this.updateTypedCt}
        updateCt        = {this.updateCt}
        updateSaveGrid  = {this.updateSaveGrid}
        updateEweEsn    = {this.updateEweEsn}
        updateIJParents = {this.updateIJParents}
        updateRefXY     = {this.updateRefXY }
        updateNwSe      = {this.updateNwSe}

      />
    )
  }

  ///////// TABLE

  renderTable() {
    
    return <SetupTable
      list={this.state.list}
      updateId={this.updateId}
      updateList={this.updateList}
      updateRes={this.updateRes}
    />
  }

  ///////// PHYSICS

  updateParam = (code, process) => {
    if (process === 'pbl') {
      this.setState({ pbl: code })
    } else if(process === 'cumulus') {
      this.setState({ cumulus: code })
    } else if(process === 'mp_physics') {
      this.setState({ mp_physics: code })
    } else if(process === 'land_surface') {
      this.setState({ land_surface : code })
    } else if(process === 'surface_layer') {
      this.setState({ surface_layer: code })
    }
}
  
  renderPhysics() {
    if(this.state.pbl        === '' ||
    this.state.cumulus       === '' ||
    this.state.mp_physics    === '' ||
    this.state.land_surface  === '' ||
    this.state.surface_layer === '' ||
    this.state.icbc_model    === ''

    ) {

     return ''

    } else {
      
      return (
        <div className="physics-area">
          <label className='setup-physics-area-title'>Physics</label>
          <div className="row align-items-center">
            {this.renderPhysicsDdwn()}
          </div>
        </div>
      )

    }
    
  }

  renderPhysicsDdwn() {
    return (
      physics.physicalProcesses.map(p => {

        const procNick = p[0]
        const procName = p[1]

        return (
          <div key={p[0]} className='col align-items-center justify-content-center'>
            <label className='setup-physics-process-title'>{procName}</label>

            <PhysicsDdwn
              process      = {procNick}
              code         = {this.state[procNick]}
              items        = {physics.parameterizations[procNick]}
              updateParam  = {this.updateParam}
            />
          </div>
        )
      })
    )
  }

  ///////// MAIN

  renderMain() {
    return (
      <Main>
        <div className="setup">
          <div className="projection-area">
            {this.renderMap()}
          </div>
          <div>
            <div className="table-area">
              {this.renderTable()}
            </div>
            <hr/>
            <div className="physics-area">
              {this.renderPhysics()}
            </div>
          </div>
        </div>
      </Main>
    )
  }

  ///////// NAV

  renderBackBtn() {
    const backAction = async () => {
      await Manager.cancelWorkflowSetup()
  
      const url = paths.analyses
      window.location.replace(url)
    }

    const popRun = 'Cancel the setting and return to the analysis page.'
  
    return (
      <div className="col-auto">
        <BackBtn title={backBtnTitle} action={backAction} popMsg={popRun} disabled={''}/>
      </div>
    )
  }

  renderForwardBtn() {
    const forwardAction = () => {

      const validDateFormat = /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}_[0-9]{2}:[0-9]{2}:[0-9]{2}?$/
      
      const coarseResOk = this.state.coarse_res !== '' && this.state.coarse_res !== null && this.state.coarse_res !== undefined
      const startDateOk = validDateFormat.test(this.state.start_date)
      const endDateOk   = validDateFormat.test(this.state.end_date)
      const listOk      = this.state.list.length > 0
      
      const allSet = coarseResOk && startDateOk && endDateOk && listOk
      const seeRunModal = true
     
      this.setState({ allSet, seeRunModal }) 

    }

    const popRun = 'Start the run.'

    return (
      <div className="col-auto">
        <ForwardBtn title={forwardBtnTitle} action={forwardAction} popMsg={popRun}/>
        <RunWRFModal 
        allSet={this.state.allSet}
        updateSeeModal={(seeRunModal) => this.setState({ seeRunModal })}
        seeModal={this.state.seeRunModal}
        list={this.state.list}
        start_date={this.state.start_date}
        end_date={this.state.end_date}
        mp_physics={this.state.mp_physics}
        cumulus={this.state.cumulus}
        land_surface={this.state.land_surface}
        surface_layer={this.state.surface_layer}
        pbl={this.state.pbl}
        icbc_model={this.state.icbc_model}
        />
      </div>
    )

  }

  renderIcbc() {
    
    return (
      <div className="col-auto">
        <IcbcDdwn
          icbc = {this.state.icbc_model}
          updateIcbcModel={this.updateIcbcModel}
        />

      </div>
    )
  }

  renderInputs() {
    const popStart     = 'Run start date'
    const popEnd       = 'Run end date'
    const popCoarseRes = 'Coarse grid resolution (meters)'
    const popRefLon    = 'Longitude of the active grid center (degrees)'
    const popRefLat    = 'Latitude of the active grid center (degrees)'
    
    return (
      <>
        {/* Start Date  */}
        <div className="col-auto">
          <div className="input-group input-group-sm">
            <span className="setup-form-span-date input-group-text">Start</span>
            <input 
              type="text" 
              className="form-control setup-form-input-date" 
              data-bs-toggle="popover" title={popStart}
              aria-label="Sizing example input" 
              aria-describedby="inputGroup-sizing-sm"
              placeholder="YYYY-MM-DD_hh:mm:ss"
              value={this.state.start_date}
              onChange={e => this.setState({ start_date : e.target.value })}
              />
          </div>
        </div>
        
        {/* End Date  */}
        <div className="col-auto">
          <div className="input-group input-group-sm">
            <span className="setup-form-span-date input-group-text">End</span>
            <input 
              type="text" 
              className="form-control setup-form-input-date" 
              data-bs-toggle="popover" title={popEnd}
              aria-label="Sizing example input" 
              aria-describedby="inputGroup-sizing-sm"
              placeholder="YYYY-MM-DD_hh:mm:ss"
              value={this.state.end_date}
              onChange={e => this.setState({ end_date : e.target.value })}
              />
          </div>
        </div>

        {/* Coarse Resolution  */}
        <div className="col-auto">
          <div className="input-group input-group-sm">
            <span className="setup-form-span-coarse input-group-text">Coarse Res.</span>
            <input 
              type="text" 
              className="form-control setup-form-input-coarse" 
              data-bs-toggle="popover" title={popCoarseRes}
              aria-label="Sizing example input" 
              aria-describedby="inputGroup-sizing-sm"
              placeholder="meters"
              value={this.state.coarse_res}
              onChange={e => this.updateRes(e.target.value)}
              disabled={this.state.disabled}
              />
          </div>
        </div>

        {/* Ref Lon  */}
        <div className="col-auto">
          <div className="input-group input-group-sm">
            <span className="setup-form-span-latlon input-group-text">Ref Lon.</span>
            <input 
              type="text" 
              className="form-control setup-form-input-latlon"
              data-bs-toggle="popover" title={popRefLon}
              aria-label="Sizing example input" 
              aria-describedby="inputGroup-sizing-sm"
              placeholder="-00.000"
              value={this.state.typedLon}
              onChange={e => this.updateTypedLon(e.target.value)}
              />
          </div>
        </div>

        {/* Ref Lat  */}
        <div className="col-auto">
          <div className="input-group input-group-sm">
            <span className="setup-form-span-latlon input-group-text">Ref Lat.</span>
            <input 
              type="text" 
              className="form-control setup-form-input-latlon" 
              data-bs-toggle="popover" title={popRefLat}
              aria-label="Sizing example input" 
              aria-describedby="inputGroup-sizing-sm"
              placeholder="-00.000"
              value={this.state.typedLat}
              onChange={e => this.updateTypedLat(e.target.value)}
              />
          </div>
        </div>
      </>
    )
  }

  renderSaveBtn() {
    return (
      <div className="col-auto">
        <SetupSaveBtn           
        activeId    = {this.state.activeId}
        
        activeIp    = {this.state.activeIp}
        activeJp    = {this.state.activeJp}
        active_e_sn = {this.state.active_e_sn}
        active_e_we = {this.state.active_e_we}
  
        activeNw    = {this.state.activeNw}
        activeSe    = {this.state.activeSe}
        
        activeCt    = {this.state.activeCt}
        coarse_res  = {this.state.coarse_res}
  
        ref_x       = {this.state.ref_x}
        ref_y       = {this.state.ref_y}
        
        updateId       = {this.updateId}
        updateList     = {this.updateList}
        updateDisabled = {this.updateDisabled}
        updateSaveGrid = {this.updateSaveGrid}
        
        />
      </div>
    )
  }

  renderUpdateBtn() {
    return (
      <div className="col-auto">
          <SetupUpdateBrushBtn 
            activeCt={this.state.activeCt}
            typedLon={this.state.typedLon} 
            typedLat={this.state.typedLat}

            updateTypedCt={this.updateTypedCt}
            updateTypedLon={this.updateTypedLon}
            updateTypedLat={this.updateTypedLat}
            
            />
        </div>
    )
  }
  
  renderNav() {
    return (
        <Nav>
          {this.renderBackBtn()}
          {this.renderInputs()}
          {this.renderUpdateBtn()}
          {this.renderSaveBtn()}
          {this.renderIcbc()}
          {this.renderForwardBtn()}
        </Nav>
    )
  }

  ///////// RENDER

  render() {
    const { isFetching } = this.state

    if(isFetching) {
      return 'Loading'
    } else {
      return (
        <>
          {this.renderNav()}
          {this.renderMain()}
        </>
      )
    }
  }
}