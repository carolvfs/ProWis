import React from 'react'
import './Analyses.css'

import paths from '../../consts/route-paths'
import nodeColorItems from '../../consts/node-colors'
import measures from '../../consts/measures'

import Main from '../layout/Main'
import Nav  from '../layout/Nav'

import Manager from '../../manager/Manager'

import BackBtn         from '../../components/buttons/BackBtn'
import StartBtn        from '../../components/buttons/StartBtn'
import TimeBtn         from '../../components/buttons/TimeBtn'
import UpdateLimitsBtn from '../../components/buttons/UpdateLimitsBtn'

import MapDdwn        from '../../components/dropdowns/MapDdwn'
import GridDdwn       from '../../components/dropdowns/GridDdwn'
import MeasureDdwn    from '../../components/dropdowns/MeasureDdwn'
import NodeColorDdwn  from '../../components/dropdowns/NodeColorDdwn'
import AnalysingDdwn  from '../../components/dropdowns/AnalysingDdwn'
import CollectionDdwn from '../../components/dropdowns/CollectionDdwn'
import MeasureMapDdwn from '../../components/dropdowns/MeasureMapDdwn'

import Hmat     from '../../components/hmat/Hmat'
import Hmap     from '../../components/hmap/Hmap'
import Limit    from '../../components/limit/Limit'
import Graph    from '../../components/graph/Graph'
import Legend   from '../../components/legend/Legend'
import Tseries  from '../../components/tseries/Tseries'
import Scatter  from '../../components/scatter/Scatter'
import Sunburst from '../../components/sunburst/Sunburst'

import SunburstModal from '../../components/modals/SunburstActive'

import Spinner from '../../components/spinner/Spinner'

import atmvars_consts from '../../consts/atm-vars'

const analysis = ['blank', 'workflow', 'ensemble']
const updatingMsg  = 'Updating...'
const backBtnTitle = 'Projects'
const mapsArr      = [0, 1, 2]
const spinnerState = ['', 'visually-hidden']

const initialState = {
  // Rendered
  rendered: false,

  // Analysing
  analysing: analysis[0],

  // Server
  portOk: true,

  // Running
  running: false,

  // GRAPH
  tree         : null,
  updatingGraph: true,
  activeColorBy: nodeColorItems[0][0],
  
  // SCATTER
  collections: [],
  scatter: [],
  activeCollectionId: null,

  // MAPS
  mapAtmvar: [],
  mapTime  : [],
  mapTstep : [],
  hmap     : [],
  
  // WORKFLOW
  activeWfId : null,
  activeDomIdx: null,
  nDoms      : 0,
  workflows  : [],
  tseries    : {},
  sunburst   : {},

  sbTime : null,
  sbStep: null,

  sbIsActive: null,

  activeGridPt: null,

  tseriesMinMax: false,
  hmatMinMax   : false,

  // ENSEMBLES
  activeEnsId: null,
  ensembles  : [],
  members    : [],
  hmat       : {},
  interval   : [1, 1], // [ti, activeTime]
  intervalP  : [1, 1], // [ti, activeTime]
  gridInfo       : [],
  ensGridPts : [],
  mouseoverMember: null,
  inputs: {
    tmp  : '30' ,
    moist: '100' ,
    hdiv : '30.0',
    conv : '30.0',
    kidx : '27' ,
    omg  : '5.0',
  },

  inputsP: { prec: ['40', '1'] },
  newLimits: [],

  // MEASURE:
  activeMeas: null,
  activeMapsView: null, 

  // TIME
  activeTime  : null,
  activeTstep : null,
  firstTime   : 0,
  lastTime    : 0,
  nTimes      : 0,

  // Updating
  updatingWf      : false,
  updatingSb      : spinnerState[1],
  updatingHmap    : spinnerState[1],
  updatingHmat    : spinnerState[1],
  updatingTseries : spinnerState[1],
}


const initialInputsP = { prec: ['80', '24'] }

export default class Analyses extends React.Component {
  constructor(props) {
    super(props)
    this.state = { ...initialState }
  }

  componentDidMount() {
    Manager.checkAirflow(this.updateAllRunOverview)
    this.updateEnsembles()

  }

  ////////// WRAP UP TREE COLLECTIONS AND SCATTER01
  updateAllRunOverview = (workflows, collections, activeCollectionId, scatter) => {
    
    this.updateTree(workflows)
    this.updateCollections(collections)
    this.updateScatter01(activeCollectionId, scatter)

  }

  ////////// ANALYSIS
  renderAnalasingDdwn() {
    if (this.state.workflows.length === 0) {
      return ''

    } else {
      return (
        <div className="col-auto">
          <AnalysingDdwn 
            activeWfId={this.state.activeWfId}
            activeEnsId={this.state.activeEnsId}
            workflows={this.state.workflows} 
            ensembles={this.state.ensembles}
            updateWorkflow={this.updateWorkflow}
            updateActiveEnsemble={this.updateActiveEnsemble}
            />
        </div>
      )
    }
  }


  ////////// ATMVAR
  updateAtmvar = async (mapIdx, atmvar) => {

    const hmap = [...this.state.hmap]
    const mapAtmvar = [...this.state.mapAtmvar]
    mapAtmvar[mapIdx] = atmvar

    let ti = this.state.activeTime
    let tf = this.state.activeTime

    // Workflow
    if(this.state.analysing === analysis[1]) {
      if(atmvar === atmvars_consts.nicks[0]) {
        if(this.state.sbIsActive) {

          ti = this.state.sbTime - this.state.sbStep + 1
          tf = this.state.sbTime

        } else {

          ti = 1
          tf = this.state.activeTime
        }
      } 
  
      hmap[mapIdx] = await Manager.getHmap(this.state.activeDomIdx, atmvar, ti, tf)
      
      // Ensemble
    } else if(this.state.analysing === analysis[2]) {
      let limit = null

      if(atmvar === atmvars_consts.nicks[0]) {
        ti = this.state.intervalP[0]
        tf = this.state.intervalP[1]

        limit = this.state.inputsP[atmvar]

      } else {
        limit = this.state.inputs[atmvar]
      }

      if(this.state.activeMapsView === measures[3][0]) {
        hmap[mapIdx] = await Manager.getEnsHmapProb(atmvar, limit, ti, tf)
      
      } else {

        const isMember = typeof this.state.activeMapsView === 'object' && this.state.activeMapsView !== null
          ? true
          : false

        const amv = isMember
            ? this.state.activeMapsView.wfId
            : this.state.activeMapsView

        hmap[mapIdx] = await Manager.getEnsHmap(amv, atmvar, ti, tf, isMember)
      }
    } 
    
    this.setState({ mapAtmvar, hmap })

  }

  renderAtmvarDdwn() {
    if(this.state.analysing === analysis[0] || this.state.mapAtmvar.length === 0) {
      return ''
    
    } else {
      return mapsArr.map(i => {
        return <div className="col-auto" key={`col-map-ddwn-${i}`}>
          <MapDdwn
            mapIdx={i}
            activeAtmvar={this.state.mapAtmvar[i]}
            updateAtmvar={this.updateAtmvar}
          />
        </div>
      })
    }

  }

  ////////// ENSEMBLE
  
  updateActiveEnsemble = async (activeEnsId) => {
    const resp      = await Manager.setEnsemble(activeEnsId)
    const analysing = activeEnsId === null ? analysis[0] : analysis[2]
    
    const hmat  = {}
    let   hmap  = []
    
    let nTimes       = null
    let lastTime     = null
    let activeDomIdx = null
    let mapTime      = []
    let mapAtmvar    = []
    let activeTime   = null
    let activeMeas   = null
    let activeMapsView = null
    let members      = []
    const sbIsActive = null
    const hmatMinMax = false
    const tseriesMinMax = false
    
    const mouseoverMember = null
    
    let gridInfo     = []
    let ensGridPts   = []
    let activeGridPt = null
    
    const intervalP = [...initialState.intervalP]
    const inputs = {
      tmp  : '30' ,
      moist: '100' ,
      hdiv : '30.0',
      conv : '30.0',
      kidx : '27' ,
      omg  : '5.0',
    }
    const inputsP   = { prec: ['40', '1'] }
    
    if(analysing === analysis[2] && resp.length > 0) {
      
      activeMeas     = measures[0][0]
      activeMapsView = measures[0][0]
      
      gridInfo     = resp[0]
      nTimes       = resp[1]
      ensGridPts   = resp[2]
      activeDomIdx = resp[0][0]
      lastTime     = nTimes - 1
      activeTime   = 1

      activeGridPt = activeMeas === measures[2][0] ? 1 : null
            
      // // update Hmat
      const respHmat = await Manager.getHmat(activeMeas, atmvars_consts.nicks, activeGridPt)
      atmvars_consts.nicks.forEach(atmv => hmat[atmv] = respHmat[atmv])

      const membersMap = [...new Map(hmat[Object.keys(hmat)[0]].map(d => [d.wfId, d.wfInternalId]))]
      
      members = membersMap.map(d => {
        return {
          wfId         : d[0],
          wfInternalId : d[1],
        }
      })

      const isMember = false
           
      for(let mIdx = 0; mIdx < mapsArr.length; mIdx++) {
          
        mapTime[mIdx]   = activeTime
        mapAtmvar[mIdx] = atmvars_consts.nicks[mIdx] ? atmvars_consts.nicks[mIdx] : atmvars_consts.nicks[0]         

        const ti = mapAtmvar[mIdx] === atmvars_consts.nicks[0] ? 1 : activeTime
        const tf = activeTime

        hmap[mIdx] = await Manager.getEnsHmap(activeMapsView, mapAtmvar[mIdx], ti, tf, isMember)
      }

    }

    this.setState({
      hmat,
      hmap,
      inputs,
      inputsP,
      mapTime,
      gridInfo,
      analysing,
      intervalP,
      hmatMinMax,
      tseriesMinMax,
      mapAtmvar,
      members,
      lastTime,
      sbIsActive,
      activeMeas,
      activeMapsView,
      activeTime,
      activeEnsId,
      activeGridPt,
      activeDomIdx,
      mouseoverMember,
      nTimes, ensGridPts,
    })

  }
  
  updateEnsembles  = async () => {
    const ensembles = await Manager.getEnsembles()

    this.setState({ ensembles })
  }

  ////////// GRAPH
  updateColorBy = (activeColorBy) => this.setState({ activeColorBy })
  
  updateTree = (workflows) => {

    let running = false
  
    this.setState({ updatingGraph: true })
    
    if(workflows !== null && Array.isArray(workflows) && workflows.length > 0) {
      let tree = null

      if (workflows.length === 1) {
        tree = {
          id           :  workflows[0].id, 
          internal_id  :  workflows[0].internal_id,
          parent_id    :  workflows[0].parent_id, 
          
          nDoms        :  workflows[0].nDoms,
          collections  :  workflows[0].collections,
          start_date   :  workflows[0].start_date,
          end_date     :  workflows[0].end_date,
          wfName       :  workflows[0].wfName,
          status       :  workflows[0].status,
          children     :  [], 
          run_hours    :  workflows[0].run_hours,
          icbc_model   :  workflows[0].icbc_model,
          
          pbl          :  workflows[0].pbl,
          mp_physics   :  workflows[0].mp_physics,
          cumulus      :  workflows[0].cumulus,
          surface_layer:  workflows[0].surface_layer,
          land_surface :  workflows[0].land_surface,
        }

        if(workflows[0].status === 'running' || workflows[0].status === 'queued') {
          running = true
        }

      } else {

        const objs  = []

        workflows.forEach((wf, i) => {
          if(!running) {
            if(wf.status === 'running' || wf.status === 'queued') {
              running = true
            }
          }

          objs.push({
            id           : wf.id, 
            internal_id  : wf.internal_id,
            parent_id    : wf.parent_id, 
            
            nDoms        : wf.nDoms,
            collections  : wf.collections,
            start_date   : wf.start_date,
            end_date     : wf.end_date,
            wfName       : wf.wfName,
            status       : wf.status,
            children     : [], 
            run_hours    : wf.run_hours,
            icbc_model   : wf.icbc_model,
            
            pbl          : wf.pbl,
            mp_physics   : wf.mp_physics,
            cumulus      : wf.cumulus,
            surface_layer: wf.surface_layer,
            land_surface : wf.land_surface,

          })
        })
        
        const root = [...objs]

        for (let i = 0; i < root.length; i++) {
          const node = {...root[i]}
          // console.log(node)
          const parent_index = root.findIndex(x => x.id === node.parent_id)
          // console.log(parent_index)
          root[parent_index].children.push(node)
          root.splice(i,1)

          if(root.length > 1) i -= 1
          
        }

        tree = root[0]
      }

      this.setState({ tree })

    } else {
      
      this.setState({ tree: null })
    }
   
    this.setState({ updatingGraph: false, running, workflows })
  }

  renderGraph() {
    if (this.state.tree === null || this.state.tree === undefined) {
      if(this.state.updatingGraph) {
        return  updatingMsg

      } else {

        return <StartBtn />
      }
    } else {

      return (
          <>
            <NodeColorDdwn 
              active={this.state.activeColorBy} 
              updateItem={this.updateColorBy} 
              ensembles={this.state.ensembles}/>

            <Graph 
              data={this.state.tree} 
              running={this.state.running}
              activeColorby={this.state.activeColorBy}

              activeWfId={this.state.activeWfId}
              updateWorkflow={this.updateWorkflow}
              
              // Ensembles
              activeEns={this.state.activeEnsId}
              ensembles={this.state.ensembles}
              collections={this.state.collections}
              updateEnsembles={this.updateEnsembles}

              
              // Restart // Delete // Cancel
              updateAllRunOverview = {this.updateAllRunOverview}
              
              />
          </>
      )
    }
  }

  ////////// GRID
  updateGrid = async (activeDomIdx) => {

    const hmap = []

    this.setState({ updatingTseries: spinnerState[0], updatingSb: spinnerState[0] })

    const activeGridPt = this.state.activeMeas === measures[2][0] ? 1 : null
    
    const tseries  = await Manager.getTseries(activeDomIdx , this.state.activeMeas, activeGridPt)
    const sunburst = await Manager.getSunburst(activeDomIdx, this.state.activeMeas, activeGridPt)

    for(let mIdx = 0; mIdx < mapsArr.length; mIdx++) {

      let ti = null
      let tf = null

      if(this.state.mapAtmvar[mIdx] === atmvars_consts.nicks[0]) {
        if(this.state.sbIsActive) {
          ti = this.state.sbTime - this.state.sbStep + 1
          tf = this.state.sbTime

        } else {
          ti = 1
          tf = this.state.activeTime
        }
        
      } else {
        ti = this.state.mapAtmvar[mIdx] === atmvars_consts.nicks[0] ? 1 : this.state.activeTime
        tf = this.state.activeTime

      }

      hmap[mIdx] = await Manager.getHmap(activeDomIdx, this.state.mapAtmvar[mIdx], ti, tf)
    }
    
    this.setState({ sunburst, tseries, hmap, activeDomIdx, activeGridPt, updatingTseries: spinnerState[1], updatingSb: spinnerState[1] })
    
  }

  renderGridDdwn() {
    if(this.state.analysing === analysis[1]) {
      return (
        <div className="col-auto">
          <GridDdwn activeDomIdx={this.state.activeDomIdx} nDoms={this.state.nDoms} updateGrid={this.updateGrid}/>
        </div>
      )
    }
  }

  ////////// HMAP
  uṕdateGridPt = async (activeGridPt) => {

    this.setState({ updatingHmat : spinnerState[0] })

    if(this.state.analysing === analysis[1]) {
 
      const tseries  = await Manager.getTseries(this.state.activeDomIdx , this.state.activeMeas, activeGridPt)
      const sunburst = await Manager.getSunburst(this.state.activeDomIdx, this.state.activeMeas, activeGridPt)
      
      this.setState({ tseries, sunburst, activeGridPt })

    } else if(this.state.analysing === analysis[2]) {

      const hmat = {}
      const respHmat = await Manager.getHmat(this.state.activeMeas, atmvars_consts.nicks, activeGridPt)
      atmvars_consts.nicks.forEach(atmv => hmat[atmv] = respHmat[atmv])

      this.setState({ activeGridPt, hmat, updatingHmat : spinnerState[1] })

    }
  }
 
  renderHmaps() {
    const  buildTitle = (field, atmvar) => {
      let title = `${atmvars_consts.fields[field].name} - t${this.state.activeTime}h `
  
      if(field === measures[3][0]) {
        if(atmvar === atmvars_consts.nicks[0]) {  
          title = `${atmvars_consts.fields[atmvar].shortName} P(>= ${this.state.inputsP[atmvar][0]}mm/${this.state.inputsP[atmvar][1]}h) - t${this.state.intervalP[0]}h -> t${this.state.intervalP[1]}h  `
        
        } else {
          title = `${atmvars_consts.fields[atmvar].shortName} P(>= ${this.state.inputs[atmvar]}${atmvars_consts.fields[atmvar].unit}) - t${this.state.activeTime}h`
        }
        
      } else  if(field === atmvars_consts.nicks[0]) {
        if(this.state.analysing === analysis[1]) {
          if(this.state.sbIsActive) {
            title = `${atmvars_consts.fields[field].name} - t${this.state.sbTime}h (acc. ${this.state.sbStep}h)`
    
          } else {
            title = `${atmvars_consts.fields[field].name} - t${this.state.activeTime}h (acc. ${this.state.activeTime}h)`
          }
        } else if (this.state.analysing === analysis[2]) {
          title = `${atmvars_consts.fields[field].name} - t${this.state.intervalP[1]}h (acc. ${this.state.intervalP[1] - this.state.intervalP[0] + 1}h)`
        }
      }
  
      return title
    }

    if(this.state.analysing === analysis[0] || this.state.hmap.length === 0) {
      return ''

    
    } else if (this.state.analysing === analysis[1]) {

      return mapsArr.map(m => {
        const field = this.state.activeMeas === measures[3][0] ? measures[3][0] : this.state.mapAtmvar[m]
        const title = buildTitle(field, this.state.mapAtmvar[m])
        const gridPts = this.state.activeMeas === measures[2][0] ? this.state.hmap[m][2] : []
        const minMax  = this.state.tseriesMinMax//this.state.hmatMinMax//this.state.tseriesMinMax

        return (
          <div className='container analyses-hmap-container' key={`hmap-${m}-wrapper`}>
            <div className="row analyses-hmap-title" key={`hmap-${m}-title`}>
              <div className="col">
                {title}
              </div>
              <div className="col">
                <Legend 
                  hmatMinMax={minMax}
                  data={this.state.hmap[m][1]}
                  direction='h' 
                  field={field} 
                  id={`hmap-${m}`} 
                  key={`hmap-legend-${m}`}
                  />
              </div>
            </div>
            <div className="row" key={`hmap-row-${m}`}>
              <Hmap 
                key={`hmap-${m}`}
                data={this.state.hmap[m][1]}
                field={field}
                mapIdx={m} 
                domIdx={this.state.activeDomIdx}
                gridPts={gridPts}
                gridInfo={this.state.hmap[m][0]}
                hmatMinMax={minMax}
                activeGridPt={this.state.activeGridPt}
                updateGridPt={this.uṕdateGridPt}
                />
            </div>
          </div>
        )
      })
    } else {
      const arr = this.state.activeMeas === measures[2][0]
        ? mapsArr//[mapsArr[0]]
        : mapsArr

      return arr.map(m => {
        const field   = this.state.activeMapsView === measures[3][0] ? measures[3][0] : this.state.mapAtmvar[m]
        const title   = this.state.activeMapsView === measures[2][0] ? '' : buildTitle(field, this.state.mapAtmvar[m])
        const gridPts = this.state.activeMeas     === measures[2][0] ? this.state.hmap[m][2] : []
        const hmatMinMax = this.state.activeMapsView === measures[3][0] ? false : this.state.hmatMinMax
        // const data = this.state.activeMapsView === measures[2][0] ? new Array(this.state.hmap[m][1].length).fill(0) : this.state.hmap[m][1]
        
        return (
          <div className='container analyses-hmap-container' key={`hmap-${m}-wrapper`}>
            <div className="row analyses-hmap-title" key={`hmap-${m}-title`}>
              <div className="col">
                {title}
              </div>
              <div className="col">
                <Legend 
                hmatMinMax={hmatMinMax}
                data={this.state.hmap[m][1]}
                direction='h' 
                field={field} 
                id={`hmap-${m}`} 
                meas={this.state.activeMapsView} 
                key={`hmap-legend-${m}`}
                />
              </div>
            </div>
            <div className="row" key={`hmap-row-${m}`}>
              <Hmap 
                key={`hmap-${m}`}
                data={this.state.hmap[m][1]}
                field={field}
                domIdx={this.state.activeDomIdx}
                mapIdx={m} 
                gridPts={gridPts}
                gridInfo={this.state.hmap[m][0]}
                hmatMinMax={this.state.hmatMinMax}
                activeGridPt={this.state.activeGridPt}
                updateGridPt={this.uṕdateGridPt}
                />
            </div>
          </div>
        )
      })
    }
  }

  ////////// HMAT
  updateInterval = async (ti, tf) => {

    if(tf-ti > 0) this.setState({ updatingHmap : spinnerState[0] })
    
    const intervalP = [ti, tf]
    const hmap = [...this.state.hmap]

    // const mIdx = this.state.mapAtmvar.indexOf(atmvars_consts.nicks[0])
    const mIdcs = this.state.mapAtmvar.map((e, i) => e === atmvars_consts.nicks[0] ? i : '').filter(String)
    
    if(mIdcs.length > 0) {

      if(this.state.activeMapsView === measures[3][0]) {
        const limit = this.state.inputsP[atmvars_consts.nicks[0]]
        for (let _i = 0; _i < mIdcs.length; _i++) {
          const mIdx = mIdcs[_i]
          hmap[mIdx] = await Manager.getEnsHmapProb(atmvars_consts.nicks[0], limit, ti, tf)

        }
      
      } else {
        const isMember = typeof this.state.activeMapsView === 'object' && this.state.activeMapsView !== null
          ? true
          : false

        const amv = isMember
          ? this.state.activeMapsView.wfId
          : this.state.activeMapsView

        for (let _i = 0; _i < mIdcs.length; _i++) {
          const mIdx = mIdcs[_i]
          
          hmap[mIdx] = await Manager.getEnsHmap(amv, atmvars_consts.nicks[0], ti, tf, isMember)

        }

      }

      this.setState({ intervalP, hmap, updatingHmap : spinnerState[1] })

    } else {

      this.setState({ intervalP })
    }
   
  }

  updateHmatMinMax = (hmatMinMax) => this.setState({ hmatMinMax })

  renderHmat() {
    if(this.state.analysing === analysis[0] || Object.keys(this.state.hmat).length === 0) {
      return ''

    } else {
      
      return atmvars_consts.nicks.map(nick => {
        const field = this.state.activeMeas === measures[3][0] ? this.state.activeMeas : nick
        
        return (
          < Hmat
            key={`hmat-${nick}`}
            field={field}
            atmvar={nick}
            activeTime={this.state.activeTime}
            nTimes={this.state.nTimes}
            data={this.state.hmat[nick]}
            meas={this.state.activeMeas}

            hmatMinMax={this.state.hmatMinMax}
            updateHmatMinMax={this.updateHmatMinMax}

            interval  = {this.state.interval}
            intervalP = {this.state.intervalP}

            updateTime    ={this.updateTime}
            updateInterval={this.updateInterval}

          />
        )
      })
    }
  }

  ////////// LIMITS
  updateInputs    = (inputs)    => this.setState({ inputs })
  updateInputsP   = (inputsP)   => this.setState({ inputsP })
  updateNewLimits = (newLimits) => this.setState({ newLimits })

  renderLimits() {
    if(this.state.analysing !== analysis[2]) {
      return ''

    } else if (this.state.activeMeas === measures[3][0] || this.state.activeMapsView === measures[3][0]) {
      return atmvars_consts.nicks.map(nick => {
        return (
          <Limit
            key={`limit-${nick}`}
            atmvar={nick} 
            inputsP={this.state.inputsP} 
            inputs={this.state.inputs} 
            newLimits={this.state.newLimits}

            updateNewLimits={this.updateNewLimits}
            updateInputs={this.updateInputs}
            updateInputsP={this.updateInputsP}
          
          />
        )
      })
    }
  }

  renderUpdateLimitsBtn() {
    const _initialInputsP = { prec: ['40', '1'] }
    const _initialInputs  = {
      tmp  : '30' ,
      moist: '100' ,
      hdiv : '30.0',
      conv : '30.0',
      kidx : '27' ,
      omg  : '5.0',
    }

    if(!this.state.analysing === analysis[2]) {
      return ''
    
    } else if(this.state.activeMeas === measures[3][0] || this.state.activeMapsView === measures[3][0]) {
      return (
        <UpdateLimitsBtn 
        hmat={this.state.hmat}
        hmap={this.state.hmap}
        meas={this.state.activeMeas}
        initialInputsP={_initialInputsP}
        initialInputs={_initialInputs}
        inputsP={this.state.inputsP} 
        inputs={this.state.inputs} 
        time={this.state.activeTime}
        intervalP={this.state.intervalP}
        newLimits={this.state.newLimits}
        
        mapAtmvar={this.state.mapAtmvar}
        updateHmat={(hmat) => this.setState({ hmat })}
        updateHmap={(hmap) => this.setState({ hmap })}
        updateNewLimits={this.updateNewLimits}
        updateInputs={this.updateInputs}
        updateInputsP={this.updateInputsP}

        lastTime   = {this.state.lastTime}
        spinnerArr = {spinnerState}
        updateSpinner={(spinnerStt) => this.setState({ updatingHmat: spinnerStt, updatingHmap:spinnerStt })}

        />
        
      )
    }
  }

  ////////// MEASURE
  updateMeas = async (activeMeas) => {

    const activeGridPt = activeMeas === measures[2][0] ? 1 : null
    
    if(this.state.analysing === analysis[1]) {

      this.setState({ updatingTseries: spinnerState[0], updatingSb: spinnerState[0] })

      const tseries  = await Manager.getTseries(this.state.activeDomIdx, activeMeas, activeGridPt)
      const sunburst = await Manager.getSunburst(this.state.activeDomIdx, activeMeas, activeGridPt)
  
      this.setState({ tseries, sunburst, activeMeas, activeGridPt, updatingTseries: spinnerState[1], updatingSb: spinnerState[1] })

    } else if (this.state.analysing === analysis[2]) {

      this.setState({ updatingHmat: spinnerState[0] })

      const hmat   = {}
      let respHmat = []

      if(activeMeas === measures[3][0]) {
        respHmat = await Manager.getHmatProb(activeMeas, atmvars_consts.nicks, this.state.inputsP, this.state.inputs)
      
      } else {
        respHmat = await Manager.getHmat(activeMeas, atmvars_consts.nicks, activeGridPt)
      
      }

      atmvars_consts.nicks.forEach(atmv => hmat[atmv] = respHmat[atmv])
      const hmatMinMax   = activeMeas === measures[3][0] ? false : this.state.hmatMinMax

      this.setState({ hmatMinMax, activeMeas, activeGridPt, hmat, updatingHmat: spinnerState[1] })
      
    }

  }

  updateMapsView = async (activeMapsView, isMember=false) => {
    let   hmap  = []
    let hmatMinMax = this.state.hmatMinMax

    this.setState({ updatingHmap : spinnerState[0] })

    if(activeMapsView === measures[3][0]) {
      hmatMinMax = false

      for(let mIdx = 0; mIdx < mapsArr.length; mIdx++) {
        const atmvar = this.state.mapAtmvar[mIdx]
        const limit = atmvar === atmvars_consts.nicks[0] ? this.state.inputsP[atmvar] : this.state.inputs[atmvar]
        
        const ti = atmvar === atmvars_consts.nicks[0] ? this.state.intervalP[0] : this.state.activeTime
        const tf = atmvar === atmvars_consts.nicks[0] ? this.state.intervalP[1] : this.state.activeTime
        
        hmap[mIdx] = await Manager.getEnsHmapProb(atmvar, limit, ti, tf, isMember)

      }
      
    } else {

      for(let mIdx = 0; mIdx < mapsArr.length; mIdx++) {
        const atmvar = this.state.mapAtmvar[mIdx]
        const ti = atmvar === atmvars_consts.nicks[0] ? this.state.intervalP[0] : this.state.activeTime
        const tf = atmvar === atmvars_consts.nicks[0] ? this.state.intervalP[1] : this.state.activeTime

        const amv = isMember ? activeMapsView.wfId : activeMapsView
        
        hmap[mIdx] = await Manager.getEnsHmap(amv, atmvar, ti, tf, isMember)
      }
    }      
      this.setState({ hmatMinMax, activeMapsView, hmap, updatingHmap : spinnerState[1] })
  }

  renderMeasureDdwn() {
    if(this.state.analysing === analysis[0] || this.state.activeMeas === null) {
      return ''
    
    } else {
      return <div className="col-auto">
        <MeasureDdwn 
          activeMeas={this.state.activeMeas} 
          updateMeas={this.updateMeas}
          analysing={this.state.analysing}
        />
      </div>
    }

  }

  renderMeasureMapsDdwn() {
    if(this.state.analysing === analysis[2]) {
      return <div className="col-auto">
        <MeasureMapDdwn
          members={this.state.members}
          activeMapsView={this.state.activeMapsView}
          updateMapsView={this.updateMapsView}
        />
        </div>

    } else {

      return ''
    }
  }

  ////////// RUNNING
  updateRunning = (running) => this.setState({ running })

  
  ////////// SCATTER
  updateCollections = (collections) => this.setState({ collections })

  updateScatter01 = (activeCollectionId, scatter) => {this.setState({ activeCollectionId, scatter })}
  
  updateScatter02 = async (activeCollectionId) => {    

    const scatter = await Manager.getScatter(activeCollectionId)

    this.setState({ activeCollectionId, scatter })
  }

  renderScatter() {
    if(this.state.scatter.length === 0) {
      // return 'No Scatter plot yet'
      return ''
    
    } else {
      return (
        <>
          <Scatter 
            data={this.state.scatter}
            activeColorBy={this.state.activeColorBy}
            ensembles={this.state.ensembles}
            />
          <CollectionDdwn 
            collections        = {this.state.collections}
            updateScatter02    ={this.updateScatter02}
            activeCollectionId ={this.state.activeCollectionId}
            />
        </>
      )
    }
  }

  ////////// SUNBURST
  updateSbTime = async (sbTime=null, sbStep=null) => {

    if(sbTime === null && sbStep === null) {

      if(this.state.sbIsActive === true) {
        this.setState({ sbIsActive : false, sbTime, sbStep })

      } else {
        this.setState({ sbTime, sbStep })

      }
    
    } else {

      // const mIdx = this.state.mapAtmvar.indexOf(atmvars_consts.nicks[0])
      const mIdcs = this.state.mapAtmvar.map((e, i) => e === atmvars_consts.nicks[0] ? i : '').filter(String)

      if(mIdcs.length > 0) {
        const hmap = [...this.state.hmap]

        const ti = sbTime - sbStep + 1
        const tf = sbTime

        for (let _i = 0; _i < mIdcs.length; _i++) {
          const mIdx = mIdcs[_i]
          hmap[mIdx] = await Manager.getHmap(this.state.activeDomIdx, atmvars_consts.nicks[0], ti, tf)
        }

        this.setState({ sbIsActive : true, sbTime, sbStep, hmap })
      
      } else {

        this.setState({ sbIsActive : true, sbTime, sbStep })
      }
    
    }
  }

  updateSbStep = async (sbStep) => {
    // const mIdx = this.state.mapAtmvar.indexOf(atmvars_consts.nicks[0])
    const mIdcs = this.state.mapAtmvar.map((e, i) => e === atmvars_consts.nicks[0] ? i : '').filter(String)


    if(mIdcs.length > 0) {

      const hmap = [...this.state.hmap]

      const ti = this.state.sbTime - sbStep + 1
      const tf = this.state.sbTime

      for (let _i = 0; _i < mIdcs.length; _i++) {
        const mIdx = mIdcs[_i]
        hmap[mIdx] = await Manager.getHmap(this.state.activeDomIdx, atmvars_consts.nicks[0], ti, tf)
      }

    
      this.setState({ sbStep, hmap })
    
    } else {

      this.setState({ sbStep })
    }
  }
  
  renderSunburst() {
    if(this.state.analysing === analysis[0] || Object.keys(this.state.sunburst).length === 0) {
      return ''
   
    } else {
      const active = this.state.sbIsActive ? "It is in use" : "Not in use"
      return (
        <div className="container">
          <div className="row analyses-sb-title d-inline">
              Precipitation Overview <b>({active})</b>
          </div>
          <div className="row analyses-sb-legend">
            <Legend
            hmatMinMax={false}
            data={[]}
            direction='h' 
            field={atmvars_consts.nicks[0]} 
            id={`sb-${0}`}/
            >
          </div>
          <div className="row analyses-sb-row">
            <Sunburst
              data={this.state.sunburst}
              nTimes={this.state.nTimes}
              lastTime={this.state.lastTime}
              sbIsActive={this.state.sbIsActive}
              sbTime={this.state.sbTime}
              sbStep={this.state.sbStep}
              activeWfId={this.state.activeWfId}
              activeMeas={this.state.activeMeas}
              updateSbTime={this.updateSbTime}
              updateSbStep={this.updateSbStep}
            />
          </div>
        </div>
      )
    }
    
  }

  renderSbModal() {
    return <SunburstModal sbIsActive={this.state.sbIsActive}/>
  }

  ////////// TIME
  updateTime = (activeTime) => {
    const hmap    = [...this.state.hmap]
    const mapTime = [...this.state.mapTime]

    let ti = null
    const tf = activeTime
    
    if(this.state.analysing === analysis[1]) {
      updateWfViewTime.bind(this)()
      
    } else if(this.state.analysing === analysis[2]) {
      updateEnsViewTime.bind(this)()

    }

    async function updateWfViewTime() {
      const sbIsActive = false
      const sbTime     = null
      const sbStep     = null

      for(let mIdx = 0; mIdx < mapsArr.length; mIdx++) {
            
        mapTime[mIdx] = activeTime 
  
        ti = this.state.mapAtmvar[mIdx] === atmvars_consts.nicks[0] ? 1 : activeTime
  
        hmap[mIdx] = await Manager.getHmap(this.state.activeDomIdx, this.state.mapAtmvar[mIdx], ti, tf)
      }
  
      if (this.state.sbIsActive === true) {
        this.setState({ activeTime, mapTime, hmap, sbIsActive, sbTime, sbStep })
  
      } else {
  
        this.setState({ activeTime, mapTime, hmap })
      }

    }

    async function updateEnsViewTime() {

      const intervalP = [activeTime, activeTime]
            
      if(this.state.activeMapsView === measures[3][0]) {

        for(let mIdx = 0; mIdx < mapsArr.length; mIdx++) {
            
          mapTime[mIdx] = activeTime
          const atmvar = this.state.mapAtmvar[mIdx]

          ti = activeTime

          const limit = atmvar === atmvars_consts.nicks[0] ? this.state.inputsP[atmvar] : this.state.inputs[atmvar]
          hmap[mIdx] = await Manager.getEnsHmapProb(atmvar, limit, ti, tf)

        }
      
      } else {
        const isMember = typeof this.state.activeMapsView === 'object' && this.state.activeMapsView !== null
          ? true
          : false

        const amv = isMember
            ? this.state.activeMapsView.wfId
            : this.state.activeMapsView

        ti = activeTime

        for(let mIdx = 0; mIdx < mapsArr.length; mIdx++) {

          mapTime[mIdx] = activeTime
          
          hmap[mIdx]    = await Manager.getEnsHmap(amv, this.state.mapAtmvar[mIdx], ti, tf, isMember)
        }

      }

      this.setState({ activeTime, mapTime, hmap, intervalP })

    }
  }

  renderTime() {
    if(this.state.analysing === analysis[0]) {
      return ''
    
    } else {
      return (
        <div className="col-auto">
          <TimeBtn
          activeTime={this.state.activeTime} 
          nTimes={this.state.nTimes} 
          updateTime={this.updateTime}
          
          />
        </div>
        
      )
    }
  }

  ////////// TSERIES
  updateTseriesMinMax = (tseriesMinMax) => this.setState({ tseriesMinMax })
  
  renderTseries() {
    if(this.state.analysing === analysis[0] || Object.keys(this.state.tseries).length === 0) {
      return 'No Time serie yet'
      
    } else {

      return atmvars_consts.nicks.map(atmvar => {
        const data = this.state.tseries[atmvar]
        return <Tseries 
          key={`tseries-${atmvar}`}
          
          data={data} 
          atmvar={atmvar}
          meas={this.state.activeMeas}
          nTimes={this.state.nTimes}
          activeTime={this.state.activeTime}
          tseriesMinMax={this.state.tseriesMinMax}
          updateTseriesMinMax={this.updateTseriesMinMax}
          updateTime={this.updateTime}

          sbTime={this.state.sbTime}
          sbStep={this.state.sbStep}
          sbIsActive={this.state.sbIsActive}
        />
      })
    }
  }

  ////////// WORKFLOW  
  updateWorkflow = async (activeWfId) => {
    const resp   = await Manager.setWorkflow(activeWfId)

    let hmap         = []
    let tseries      = {}
    let sunburst     = {}

    let sbTime      = null
    let sbStep      = null

    let nDoms        = 0
    let nTimes       = null
    let lastTime     = null
    let mapAtmvar    = []
    let mapTime      = []
    let analysing    = analysis[0]
    let activeTime   = null
    let activeGridPt = null
    let activeMeas   = null
    let activeDomIdx = null
    let activeMapsView = null
    const members      = []
    
    const sbIsActive = null

    const hmatMinMax = false
    const tseriesMinMax = false


    if(activeWfId && resp.length > 0) {

      this.setState({ updatingSb: spinnerState[0], updatingHmap: spinnerState[0], updatingTseries: spinnerState[0]})

      nDoms         = resp[0]
      nTimes        = resp[1] !== null ? resp[1] + 1 : resp[1]
      lastTime      = resp[2]

      if (nDoms > 0 && lastTime > 1) {
        analysing     = analysis[1]
        activeDomIdx  = 0
        activeTime    = 1
        activeMeas    = !this.state.activeMeas || this.state.activeMeas === measures[3][0]
          ? measures[0][0]
          : this.state.activeMeas

        activeGridPt = activeMeas === measures[2][0] ? 1 : null
        
        tseries  = await Manager.getTseries(activeDomIdx, activeMeas, activeGridPt)
        sunburst = await Manager.getSunburst(activeDomIdx, activeMeas, activeGridPt)

        mapAtmvar = [atmvars_consts.nicks[0], atmvars_consts.nicks[1], atmvars_consts.nicks[2]]

        for(let mIdx = 0; mIdx < mapsArr.length; mIdx++) {
          
          mapTime[mIdx]   = activeTime
          mapAtmvar[mIdx] = atmvars_consts.nicks[mIdx] ? atmvars_consts.nicks[mIdx] : atmvars_consts.nicks[0]         

          const ti = mapAtmvar[mIdx] === atmvars_consts.nicks[0] ? 1 : activeTime
          const tf = activeTime

          hmap[mIdx] = await Manager.getHmap(activeDomIdx, mapAtmvar[mIdx], ti, tf)
        }
                
      }
    
    }
    
    this.setState({ 
      activeWfId, 
      activeTime, 
      activeMeas,
      activeDomIdx, 
      activeGridPt,
      activeMapsView,

      hmatMinMax,
      tseriesMinMax,

      analysing, 
      
      hmap,
      tseries,
      sunburst,
      
      nDoms, 
      nTimes, 
      lastTime,
      mapAtmvar,
      
      members,
      
      sbTime,
      sbStep,
      sbIsActive,
      updatingSb: spinnerState[1], updatingHmap: spinnerState[1], updatingTseries: spinnerState[1],
    })

  }


  //////////////////////////////////////////////////////////////////////

  ////////// NAV
  renderBackBtn() {
    const backBtnAction = () => {
      const url = paths.home
      window.location.replace(url)
    }

    const popHome  = 'Return to the projects page.'
    const disabled = this.state.running ? 'disabled' : '' 

    return (
      <div className="col-auto">
        <BackBtn title={backBtnTitle} action={backBtnAction} popMsg={popHome} disabled={disabled}/>
      </div>
    )
  }  
  
  renderNav() {
    return (
      <Nav>
        {this.renderBackBtn()}
        {this.renderAnalasingDdwn()}
        {this.renderGridDdwn()}
        {this.renderMeasureDdwn()}
        {this.renderMeasureMapsDdwn()}
        {this.renderTime()}
        {this.renderAtmvarDdwn()}
      </Nav>
    )
  }

  ////////// MAIN

  renderTemporalOverview() {
    if(this.state.analysing === analysis[0]) {
      return ''

    } else if (this.state.analysing === analysis[1]) {
      return (
        <>
        <Spinner spinnerStt={this.state.updatingTseries}/>
        {this.renderTseries()}
        </>
      )  

    } else {
      return (
        <>
        <Spinner spinnerStt={this.state.updatingHmat}/>
        {this.renderHmat()}
          <div className='container'>
            <div className="row analysis-prob-inputs-row">
              {this.renderLimits()}
              {this.renderUpdateLimitsBtn()}
            </div>
          </div>
        </>
      )
    }
  }

  
  renderMain() {
    
    const sct0 = performance.now()
    const scatter  = this.renderScatter()
    const sct1 = performance.now()

    const sct = sct1 - sct0

    const temp0 = performance.now()
    const tempview = this.renderTemporalOverview()
    const temp1 = performance.now()
    const temp = temp1 - temp0

    const hmaps0 = performance.now()
    const hmaps    = this.renderHmaps()
    const hmaps1 = performance.now()
    const hmapT = hmaps1 - hmaps0

    const sb0 = performance.now()
    const sb       = this.renderSunburst()
    const sb1 = performance.now()
    const sbT = sb1 - sb0

    const graph0 = performance.now()
    const graph    = this.renderGraph()
    const graph1 = performance.now()

    const gt = graph1 - graph0

    if(sct > 0)   console.log(`Scatter: ${sct} ms`)
    if(temp > 0)  console.log(`Temp   : ${temp} ms`)
    if(hmapT > 0) console.log(`Hmaps  : ${hmapT} ms`)
    if(sbT > 0)   console.log(`Sb     : ${sbT} ms`)
    if(gt > 0)    console.log(`Graph  : ${gt} ms`)


    return (
      <Main>
        <div className="analyses">
          <div className="analyses-content-2">
            {scatter}
          </div>
          <div className="analyses-content-3">
            {tempview}
          </div>
          <div className="analyses-content-4">
            <Spinner spinnerStt={this.state.updatingHmap}/>
            {hmaps}
          </div>
          <div className="analyses-content-5">
            {sb}
          </div>
          <div className="analyses-content-1">
            {graph}
          </div>
        </div>
      </Main>
    )
  }

  ////////// RENDER

  render() {
    return (
      <>
        {this.renderNav() }
        {this.renderMain()}
      </>
    )
  }
}