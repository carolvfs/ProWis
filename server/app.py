import json
from flask_cors import CORS
from flask import Flask, request
from flask_socketio import SocketIO, emit

from termcolor import colored

import time

from bin.Structure import Structure

structure = Structure()

app = Flask(__name__)
CORS(app)

socketIo   = SocketIO(app, cors_allowed_origins="*")
app.debug  = True

@socketIo.on('connect')
def connect():
	print('\nconnected\n')
	emit('success_conn', {'data': 'connected'})

@socketIo.on('disconnect')
def disconnect():
	print('\ndisconnected\n')
	emit('success_disconn', {'data': 'disconnected'})

# #######################################################

@socketIo.on('airflowPing')
def checkAirflow():

    structure.checkDag()

    workflows          = structure.getWorkflowsList()
    collections        = structure.computeCollections()
    scatter            = structure.getScatter()
    activeCollectionId = structure.getActiveCollectionId()

    resp = { 
        'workflows'  : workflows,
        'collections': collections,
        'scatter'    : scatter,
        'activeCollectionId': activeCollectionId,
        }

    emit('airflowPong', resp)

    dagState = structure.getDagState()

    if dagState:
        complete = structure.getComplete()

        while dagState == 'queued' or dagState == 'running' or not complete:
            time.sleep(60)

            recording = structure.getRecording()

            while recording:
                time.sleep(30)
                recording = structure.getRecording()

            structure.checkDag()

            workflows          = structure.getWorkflowsList()
            collections        = structure.computeCollections()
            scatter            = structure.getScatter()
            activeCollectionId = structure.getActiveCollectionId()

            resp = { 
                'workflows'  : workflows,
                'collections': collections,
                'scatter'    : scatter,
                'activeCollectionId': activeCollectionId,
            }

            emit('airflowPong', resp)

            dagState  = structure.getDagState()
            complete  = structure.getComplete()

            msg = f'\ndag state: {dagState}\ncomplete: {complete}\n'
            print(colored(msg, 'yellow'))

@app.route('/active_user', methods=('GET', 'POST'))
def handleActiveUser():
    if request.method == 'GET':
        activeUserTp = structure.getActiveUserTp()

        return json.dumps(activeUserTp)

    elif request.method == 'POST':
        data = request.json

        userTp = data['userTp']

        structure.setActiveUserTp(userTp)

        return ''

@app.route('/active_workflow', methods=('GET', 'POST'))
def handleActiveWorkflow():
    if request.method == 'GET':
        return ''

    else:
        data = request.json
        
        structure.awaitGreenLight('getForecast', 'app/active_workflow')
        structure.setGettingForecast(True)

        resp = structure.setActiveWorkflow(data['wfId'])
        structure.setGettingForecast(False)

        return json.dumps(resp)

@app.route('/ensemble'        , methods=('GET', 'POST'))
def handleEnsemble():
    if request.method == 'GET':
        ensembles = structure.getEnsembles()
        
        return json.dumps(ensembles)

    elif request.method == 'POST':
        data = request.json
        ensId = data['ensId']

        structure.awaitGreenLight('getForecast', 'app/ensemble')
        structure.setGettingForecast(True)

        resp = structure.setEnsemble(ensId)

        structure.setGettingForecast(False)

        return json.dumps(resp)

@app.route('/ensHmap', methods=('POST',))
def handleEnsHmap():
    if request.method == 'POST':
        data = request.json

        activeEnsemble = structure.getActiveEnsemble()

        ti       = data['ti']
        tf       = data['tf']
        meas     = data['meas']
        atmvar   = data['atmvar']
        limit    = data['limit']
        isMember = data['isMember']

        structure.awaitGreenLight('getForecast', 'app/ensHmap')
        structure.setGettingForecast(True)

        if meas == 'prob':
            hmap = activeEnsemble.computeHmapProb(atmvar, limit, ti, tf, isMember)

        else:
            hmap = activeEnsemble.computeHmap(meas, atmvar, ti, tf, isMember)

        structure.setGettingForecast(False)

        return json.dumps(hmap)

@app.route('/hmap', methods=('GET', 'POST'))
def handleHmap():
    if request.method == 'GET':
        return ''

    else:
        data = request.json

        structure.awaitGreenLight('getForecast', 'app/hmap')
        structure.setGettingForecast(True)

        activeWorflow = structure.getActiveWorkflow()
        hmap = activeWorflow.computeHmap(data['domIdx'], data['atmvar'], data['ti'], data['tf'])

        structure.setGettingForecast(False)

        return json.dumps(hmap)

@app.route('/hmat', methods=('GET', 'POST'))
def handleHmat():
    if request.method == 'GET':
        return ''

    else:
        data = request.json
        hmat = structure.getHmats(data['meas'], data['atmvars'], data['limits'], data['limitP'], data['gPt'])

        return json.dumps(hmat)

@app.route('/member' , methods=('GET', 'POST'))
def handleMember():
    if request.method == 'POST':
        data = request.json
        wfId    = data['wfId']
        meth    = data['meth']
        ensId   = data['ensId']
        
        structure.awaitGreenLight('getForecast', 'app/member')
        structure.setGettingForecast(True)

		# Post
        if meth == 'post':
            gridId  = data['gridId']
            ensName = data['ensName']
            
            if ensId != None:
                ensId = data['ensId']
                
            elif ensName != None:
                ensId = structure.insertEnsemble(ensName, wfId, gridId)
            
            structure.insertMember(ensId, wfId)
		
		# Delete
        elif meth == 'delete':
            structure.deleteMember(ensId, wfId)
            
        structure.setGettingForecast(False)
        
        return '[App/member - post done]'

@app.route('/project', methods=('GET', 'POST'))
def handleProject():
    if request.method == 'GET':
        projectsList = structure.getProjectsList()

        return json.dumps(projectsList)

    elif request.method == 'POST':
        data = request.json

        if 'projTitle' in data.keys():
            structure.postProject(data['projTitle'])
        
        else:
            structure.setActiveProject(data['projTp'])

        return ''

@app.route('/scatter', methods=('GET', 'POST'))
def handleScatter():
    if request.method == 'GET':
        data = request.args

        collectionId = data['collectionId']

        structure.awaitGreenLight('getForecast', 'app/scatter')
        structure.setGettingForecast(True)

        structure.setActiveCollectionId(collectionId)

        scatter = structure.getScatter()
        
        structure.setGettingForecast(False)

        return json.dumps(scatter)

@app.route('/setup', methods=('GET', 'POST'))
def handleSetup():
    if request.method == 'GET':
        data = request.args

        resp = {}

        if data['myparam'] == 'domain':
            resp = structure.getDomainsSetup()
        
        elif data['myparam'] == 'form':
            resp = structure.getFormAttrs()

        elif data['myparam'] == 'physics':
            resp = structure.getPhysics()

        elif data['myparam'] == 'icbc_model':
            resp = structure.getIcbcModel()

        elif data['myparam'] == 'child':
            resp = structure.getChildParams()

        return json.dumps(resp)

    else:
        data = request.json
        
        if data:
            keys = data.keys()

            if 'domain' in keys:
                structure.postDomain(data['domain'])

            elif 'domId' in keys:
                domId = data['domId']
                structure.deleteDomain(domId)

            else:
                structure.completeWorkflowSetup(data)
                structure.callAirflow()
                
        else:
            structure.cancelWorkflowSetup()

        return 'handleSetup (post) done'

@app.route('/sunburst', methods=('GET', 'POST'))
def handleSunburst():
    if request.method == 'POST':
        data = request.json

        structure.awaitGreenLight('getForecast', 'app/sunburst')
        structure.setGettingForecast(True)
        
        domIdx   = data['domIdx']
        meas     = data['meas']
        grid_pt  = data['gPt']

        tl  = data['tl']
        br  = data['br']

        activeWf = structure.getActiveWorkflow()

        resp = activeWf.computeSunburst(domIdx, meas, tl, br, grid_pt)

        structure.setGettingForecast(False)

        return json.dumps(resp)

@app.route('/tseries', methods=('GET', 'POST'))
def handleTseries():
    if request.method == 'POST':
        data = request.json

        activeWf = structure.getActiveWorkflow()

        structure.awaitGreenLight('getForecast', 'app/tseries')
        structure.setGettingForecast(True)

        resp = activeWf.computeTseries(data['domIdx'], data['meas'], data['tl'], data['br'], data['gPt'])
        structure.setGettingForecast(False)

        return json.dumps(resp)

@app.route('/user', methods=('GET', 'POST'))
def handleUser():
    if request.method == 'GET':
        resp = structure.getUsersList()

        return json.dumps(resp)

    elif request.method == 'POST':
        data = request.json

        ok = structure.postUser(data['newUserName'])

        return json.dumps(ok)

@app.route('/workflow', methods=('GET', 'POST'))
def handleWorkflow():
    if request.method == 'GET':
        wfs = structure.getWorkflows()
        return json.dumps(wfs)

    elif request.method == 'POST':
        data = request.json

        if data:
            keys = data.keys()

            if 'parentId' in keys:
                parentId = data['parentId']
                structure.postWorkflow(parentId)

            elif 'wfId' in keys:
                wfId = data['wfId']

                if 'del' in keys:
                    structure.deleteWorkflow(wfId)
                
                elif 'edit' in keys:
                    structure.editWorkflow(wfId)

            elif 'restartAirflow' in keys:
                wfId = data['restartAirflow']
                structure.restartAirflow(wfId)

            elif 'abortAirflow' in keys:
                wfId = data['abortAirflow']
                structure.abortAirflow(wfId)

        return 'Done'


