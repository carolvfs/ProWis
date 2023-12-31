import axios from 'axios'
import io from "socket.io-client"
import paths from '../consts/route-paths'

class Manager {
    constructor() {
        this.socket = io.connect(`${paths.baseUrl}`)
    }

    // Server
    checkServer(setPort) {
        this.socket.on('success_conn', resp => {
        const port = resp.data === 'connected'
        setPort(port)
        // console.log(resp.data, resp.data === 'connected')
        })
        
    }
    
    // Airflow
    async abortAirflow(wfId) {
        const method = 'post'
        const url = `${paths.baseUrl}/workflow`

        const data = { abortAirflow: wfId }

        await axios[method](url, data)
    }
    
    checkAirflow(updateAllRunOverview) {
        this.socket.on('success_conn', resp => console.log(resp.data))
        
        this.socket.emit('airflowPing')

        this.socket.on('airflowPong', async resp => {
            const workflows          = await resp.workflows
            const collections        = await resp.collections
            const activeCollectionId = await resp.activeCollectionId
            const scatter            = await resp.scatter
            // const ww = [workflows[7]]
            updateAllRunOverview(workflows, collections, activeCollectionId, scatter)

        })
    }

    async restartWorkflow(wfId) {
        const method = 'post'
        const url = `${paths.baseUrl}/workflow`

        const data = { restartAirflow: wfId }

        await axios[method](url, data)
    }

    // Ensemble
    async deleteMember(wfId, ensId) {
        const method = 'post'
        const url = `${paths.baseUrl}/member`

        const data = { 
            wfId   ,
            ensId  ,
            meth: 'delete',
        }
        
        await axios[method](url, data)
    }

    async getEnsembles() {
        const method = 'get'
        const url = `${paths.baseUrl}/ensemble`

        const resp = await axios[method](url)

        return resp.data
    }

    async getEnsHmap(meas, atmvar, ti, tf, isMember=false) {
        const method = 'post'
        const url = `${paths.baseUrl}/ensHmap`

        const data = { meas, atmvar, ti, tf, limit:null , isMember}
        const resp = await axios[method](url, data)

        return resp.data
    }

    async getEnsHmapProb(atmvar, limit, ti, tf, isMember=false) {
        const method = 'post'
        const url = `${paths.baseUrl}/ensHmap`

        const data = { meas: 'prob', atmvar, ti, tf, limit, isMember }
        const resp = await axios[method](url, data)

        return resp.data

    }

    async getHmat(meas, atmvars, gPt=null) {
        const method = 'post'
        const url = `${paths.baseUrl}/hmat`

        const data = { meas, atmvars, gPt, limitP: {}, limits: {} }
        const resp = await axios[method](url, data)

        return resp.data

    }

    async getHmatProb(meas, atmvars, limitP={}, limits={}, gPt=null) {
        const method = 'post'
        const url = `${paths.baseUrl}/hmat`

        const data = { meas, atmvars, limitP, limits, gPt }
        const resp = await axios[method](url, data)

        return resp.data

    }

    async postMember(meth, wfId, ensId=null, ensName=null, gridId=null) {
        const method = 'post'
        const url = `${paths.baseUrl}/member`

        const data = { 
            wfId   ,
            ensId  ,
            ensName,
            gridId ,
            meth   ,
        }
        
        await axios[method](url, data)
    }

    async setEnsemble(ensId) {
        const method = 'post'
        const url = `${paths.baseUrl}/ensemble`
        const data = { ensId }

        const resp = await axios[method](url, data)

        return resp.data
    }

    // Workflow Setup
        
    async cancelWorkflowSetup() {
        const method = 'post'
        const url = `${paths.baseUrl}/setup`
        const data = {}
        
        await axios[method](url, data)
    }

    async getChildAttrs() {
        const method = 'get'
        const url = `${paths.baseUrl}/setup`

        const data = { params: { myparam: 'child' }}

        const resp = await axios[method](url, data)

        const obj = resp.data

        return obj
    }

    async completeWorkflowSetup(wfName, start_date, end_date, icbc_model, pbl, cumulus, mp_physics, land_surface, surface_layer) {
        const method = 'post'
        const url    = `${paths.baseUrl}/setup`

        const data = { 
            wfName, 
            start_date,
            end_date,
            icbc_model,
            pbl,
            cumulus,
            mp_physics,
            land_surface,
            surface_layer
        }

        await axios[method](url, data)
    }

    async deleteDomain(domId) {
        const method = 'post'
        const url = `${paths.baseUrl}/setup`
        const data = { domId }

        await axios[method](url, data)
    }

    async editWorkflow(wfId) {
        const method = 'post'
        const url = `${paths.baseUrl}/workflow`

        const data = { wfId, edit: true }

        await axios[method](url, data)

    }

    async getDomains() {
        const method = 'get'
        const url = `${paths.baseUrl}/setup`

        const data = { params: { myparam: 'domain' }}

        const resp = await axios[method](url, data)

        const domainsObj = resp.data

        const domains = []
        let verdict = null

        const isEmpty = Object.keys(domainsObj).length === 0

        if(isEmpty) {
            verdict = domains

        } else if ('real_in' in domainsObj){
            verdict = 'Skip two rows'

        } else {
            // const attrs = ['e_sn', 'e_we', 'i_parent', 'j_parent', 'parent_id', 'ref_lat', 'ref_lon', 'br', 'tl', 'bl_i', 'br_i', 'bl_j', 'tl_j', 'grid_id', 'res']
            const attrs = ['e_sn', 'e_we', 'i_parent', 'j_parent', 'parent_id', 'ref_lat', 'ref_lon', 'nw_lat', 'nw_lon','se_lat', 'se_lon', 'grid_id', 'res']
            const ids   = [1, 2, 3]
            
            const coarse_res = domainsObj.geogrid_in.filter(e => {
                return e[0] === 'coarse_res'
            })[0][1]
    
            ids.forEach(id => {
                const domain = {}
    
                Object.values(domainsObj).forEach(progArr => {
                    progArr.forEach(attrArr => {
                        attrs.forEach(att => {
                            if(attrArr.includes(`${att}_${id}`)) {
                                if(attrArr[1].includes('[')) {
                                    const arr = attrArr[1].split(',')
    
                                    arr[0] = parseInt(arr[0].replace('[', ''))
                                    arr[1] = parseInt(arr[1].replace(']',''))
                                    
                                    domain[att] = arr
    
                                } else if(attrArr[1].includes('.')) {
                                    domain[att] = parseFloat(attrArr[1])
    
                                } else if(attrArr[1].includes('None')) {
                                    domain[att] = null
                                } else if(att === 'grid_id') {
                                    domain.id = id
                                } else {
                                    domain[att] = parseInt(attrArr[1])
                                }
                            }
                        })
                    })
                })
    
                if(Object.keys(domain).length !== 0) {
                    if(id === 1) domain.res = coarse_res
                    domains.push(domain)
                }
            })

            verdict = domains
        }

        return verdict
    }

    async getFormAttrs() {
        const method = 'get'
        const url = `${paths.baseUrl}/setup`

        const data = { params: { myparam: 'form' }}

        const resp = await axios[method](url, data)

        const attrs = resp.data

        return attrs
    }

    async getIcbcModel() {
        const method = 'get'
        const url = `${paths.baseUrl}/setup`

        const data = { params: { myparam: 'icbc_model' }}

        const resp = await axios[method](url, data)

        const attrs = resp.data

        return attrs
    }

    async getPhysics() {
        const method = 'get'
        const url = `${paths.baseUrl}/setup`

        const data = { params: { myparam: 'physics' }}

        const resp = await axios[method](url, data)

        const attrs = resp.data

        return attrs
    }

    async postDomain(domain) {
        const method = 'post'
        const url = `${paths.baseUrl}/setup`

        const data = { domain }

        await axios[method](url, data)
    }
    
    async postWorkflow(parentId) {
        const method = 'post'
        const url = `${paths.baseUrl}/workflow`
        const data = { parentId }

        const wfId = await axios[method](url, data)

        return wfId

    }

    // Workflow
    
    async deleteWorkflow(wfId) {
        const method = 'post'
        const url = `${paths.baseUrl}/workflow`

        const data = { wfId, del: true }

        await axios[method](url, data)
    }

    async getHmap(domIdx, atmvar, ti, tf) {
        const method = 'post'
        const url    = `${paths.baseUrl}/hmap`

        const data = { domIdx, atmvar, ti, tf }
        
        const resp = await axios[method](url, data)
        
        const output = resp.data
        
        return output

    }

    async getSunburst(domIdx, meas, gPt=null, tl=null, br=null, ) {
        const method = 'post'
        const url = `${paths.baseUrl}/sunburst`

        const data = { domIdx, meas, tl, br, gPt }

        const resp = await axios[method](url, data)
        const output = resp.data
        
        return output
    }
    
    async getTseries(domIdx, meas, gPt=null, tl=null, br=null) {
        const method = 'post'
        const url = `${paths.baseUrl}/tseries`

        const data = { domIdx, meas, tl, br, gPt }

        const resp = await axios[method](url, data)
        const output = resp.data
        
        return output
    }

    async getWorkflows() {
        const method = 'get'
        const url    = `${paths.baseUrl}/workflow`
        
        const resp = await axios[method](url)
        
        const workflows = resp.data
        
        return workflows

    }

    async setWorkflow(wfId) {
        const method = 'post'
        const url = `${paths.baseUrl}/active_workflow`

        const data = { wfId }

        const resp = await axios[method](url, data)
        const output = resp.data
        
        return output
    }

    // Collections
    async getCollections() {
        const method = 'get'
        const url    = `${paths.baseUrl}/collection`
        
        const resp = await axios[method](url)
        
        const output = resp.data
        
        return output
    }

    async getScatter(collectionId) {
        const method = 'get'
        const url    = `${paths.baseUrl}/scatter`
        console.log(collectionId)
        const data = { params: { collectionId } }

        const resp   = await axios[method](url, data)
        
        const output = resp.data
        
        return output
    }

    // Project
    async getProjects() {
        const method = 'get'
        const url = `${paths.baseUrl}/project`

        const resp = await axios[method](url)
        const projsList = resp.data

        return projsList
    }

    async postProject(projTitle) {
        const method = 'post'
        const url = `${paths.baseUrl}/project`

        const data = { projTitle }

        await axios[method](url, data)

    }

    async setActiveProject(projTp) {
        const method = 'post'
        const url = `${paths.baseUrl}/project`

        const data = { projTp }

        await axios[method](url, data)
    }

    // User
    async getActiveUser() {
        const method = 'get'
        const url = `${paths.baseUrl}/active_user`

        const resp = await axios[method](url)
        const user = resp.data

        return user
    }

    async getUsers() {
        const method = 'get'
        const url = `${paths.baseUrl}/user`

        const resp = await axios[method](url)
        const users = resp.data

        return users
    }

    async setActiveUser(userTp) {
        const method = 'post'
        const url = `${paths.baseUrl}/active_user`

        const data = { userTp }

        await axios[method](url, data)

    }

    async postUser(newUserName) {
        const method = 'post'
        const url = `${paths.baseUrl}/user`

        const data = { newUserName }

        const resp = await axios[method](url, data)
        const ok = resp.data

        return ok

    }

}

export default new Manager()