import os
import time
import glob
import shutil

from datetime import datetime

from termcolor  import colored

from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

from bin.consts import mainPath, icbcPath, wrfPath, prefixWrfout, prefixWrfrst, icbc_models_prefix, icbc_models_ext, geogrid_out_folder, ungrib_out_folder, metgrid_out_folder


from bin.Intermediary    import Intermediary
from bin.NamelistsEditor import Namelists_Editor
from bin.OutputExtractor import Output_Extractor
from bin.Workflow        import Workflow
from bin.Ensemble        import Ensemble

from airflow.models                  import DagRun
from airflow.api.client.local_client import Client

class Structure(object):
    def __init__(self) -> None:
        self.__className = 'Structure'

        self.__interm = Intermediary()
        self.__client = Client(None, None)
        self.__editor = Namelists_Editor()
        self.__workflow = Workflow(self.__interm)
        
        self.__usersList    = self.__interm.selectUsersList()
        self.__activeUserTp = []

        self.__projectsList    = []
        self.__activeProjectTp = []
        self.__projectPath     = None

        self.__workflowsList   = []
        self.__collectionsList = []

        ###### setup

        self.__wfPath          = None
        self.__icbc_path       = None
        self.__workflowInSetup = None

        ###### Running
        self.__running = {
            'wf'       : None, 
            'domains'  : []  , 
            'run_hours': 0   , 
            'last_time': 0   ,
            'start_ymd': None,
            'end_ymd'  : None,
            'output_file_date': None,
        } 

        self.__limits          = None
        self.__complete        = True
        self.__dagState        = None
        self.__recording       = False
        self.__currentDag      = None
        self.__currentDagTask  = None
        self.__startTimeIdx    = []
        self.__gettingForecast = False
        self.__abort           = False

        self.__run_geogrid = None
        self.__run_ungrib  = None

        self.__rawOutput = Output_Extractor()

        ###### Ensemble
        self.__ensemble = Ensemble(self.__interm)
        self.__ensemblesList = []

        ###### Scatter
        self.__activeCollectionId = None
        self.__activeScatter = []


    ###########################################
    ####################
    # Collections
    ####################
    ###########################################

    def computeCollections(self):
        collections = []

        if len(self.__collectionsList) > 0:
            for obj in self.__collectionsList:
                id     = obj['id']
                name   = obj['name'].capitalize()
                gridId = obj['grid']
                internal_id = obj['internal_id']
                wfIds = [m[1]for m in obj['members']]
                
                if len(obj['members']) > 1:
                    data = [id, f"{name} {internal_id} (Grid{gridId})", '', wfIds]
                
                else:
                    data = [id, f"{name} {internal_id} (Grid{gridId})", 'disabled', wfIds]
                
                collections.append(data)

        return collections
            
    def getActiveCollectionId(self):
        return self.__activeCollectionId
    
    def getCollectionsList(self):
        return self.__collectionsList
            
    def setActiveCollectionId(self, cId=None):
            if len(self.__collectionsList) > 0:
                if cId == None: 
                    if self.__activeCollectionId == None:
                        self.__activeCollectionId = self.__collectionsList[0]['id']

                else:
                    self.__activeCollectionId = int(cId)
                
                self.__activeScatter = self.__computeScatter()

            else: 
                self.__activeCollectionId = None
                self.__activeScatter = []
 
    def __setCollectionsList(self):
        # collectionsList = [{'id': 1 , 'name': '', 'members': [(dId, wfId, gId), (dId, wfId, gId)]}, {}, {} ...]

        self.__collectionsList = self.__interm.selectCollections(self.__activeProjectTp[0])
    
    ###########################################
    ####################
    # Ensemble
    ####################
    ###########################################

    def deleteMember(self, ensId, wfId):
        self.__interm.deleteMember(ensId, wfId)
        self.__setEnsembles()

        msg = f'\nWorkflow {wfId} deleted from the ensemble {ensId}.\n'
        color = 'green'

        print(colored(msg, color))
    
    def getActiveEnsemble(self):
        return self.__ensemble
    
    def getEnsembles(self):
        return self.__ensemblesList
    
    def getHmats(self, meas, atmvars, limits, limitP, gPt):
        self.awaitGreenLight('getForecast', 'structure/getHmats')
        self.setGettingForecast(True)

        hmat = {}

        if meas == 'prob':
            for atmvar in atmvars:
                limit = limitP['prec'] if atmvar == 'prec' else limits[atmvar]
                hmat[atmvar] = self.__ensemble.computeHmatProb(atmvar, limit)

        else:
            for atmvar in atmvars:
                hmat[atmvar] = self.__ensemble.computeHmat(meas, atmvar, gPt)

        self.setGettingForecast(False)

        return hmat
    
    def insertEnsemble(self, ensName, wfId, gId):
        ensembleId = self.__interm.insertEnsemble(ensName, wfId, gId)

        return ensembleId
    
    def insertMember(self, ensId, wfId):
        exists = [mArr for mArr in self.__ensemblesList if mArr[0] == ensId and wfId in mArr[4]]
        # exists = [mArr for mArr in self.__ensemblesList if wfId in mArr[4]]
        print(self.__ensemblesList)
        if len(exists) > 0:
            msg = f'\nWorkflow {wfId} already exists in the ensemble {ensId}. Nothing to do.\n'
            color = 'red'
        else:
            self.__interm.insertMember(ensId, wfId)
            self.__setEnsembles()

            msg = f'\nWorkflow {wfId} included in the ensemble {ensId}.\n'
            color = 'green'

        print(colored(msg, color))
    
    def setEnsemble(self, ensId):
        self.__ensemble.setId(ensId)
        print()
        print('structure-setEnsemble')
        print(self.__ensemblesList)
        print()

        if ensId:
            [wfIds] = [mArr[4] for mArr in self.__ensemblesList if mArr[0] == ensId]
            # [cId]   = [mArr[2] for mArr in self.__ensemblesList if mArr[0] == ensId]

            tuplesWfIds = [(wfObj['id'], wfObj['internal_id']) for wfObj in self.__workflowsList if wfObj['id'] in wfIds]
            
            self.__ensemble.setWfIds(tuplesWfIds)

            msg = f'Ensemble {ensId} set.'
        else:
            msg = f'No ensemble set.'

        domain  = self.__ensemble.getDomain()
        nTimes  = self.__ensemble.getNTimes()
        gridPts = self.__ensemble.getGridPts()
        
        print(colored(msg, 'yellow'))

        return domain, nTimes, gridPts
    
    def __setEnsembles(self):
        ensembles = []
        collectionIds = [c['id'] for c in self.__collectionsList]

        if len(collectionIds) > 0:
            resp = self.__interm.selectEnsembles(collectionIds)

            for ens in resp:
                ensCid = int(ens[2])

                [_c] = [c for c in self.__collectionsList if c['id'] == ensCid]
                arr = [ens[0], ens[1], _c['id'], _c['internal_id'], ens[3]]
                ensembles.append(arr)
        
        self.__ensemblesList = ensembles

    ###########################################
    ####################
    # Folders and files
    ####################
    ###########################################

    def __copyPasteOutputFiles(self, domId):
        
        src    = f"{wrfPath}/{prefixWrfout}{domId}_{self.__running['start_date']}"

        if os.path.exists(src):
            time        = os.path.getmtime(src)
            last_change = datetime.fromtimestamp(time)#.strftime('%Y-%m-%d %H:%M:%S')
            now_date    = datetime.now()

            diff = now_date - last_change

            if diff.total_seconds() < 300:
                tmp = f"{self.__wfPath}/{prefixWrfout}{domId}_{self.__running['start_date']}"
                
                stDate = self.__running['start_date'].replace('00:00:00', '00_00_00')
                dst = f"{self.__wfPath}/{prefixWrfout}{domId}_{stDate}"

                shutil.copy(src,tmp)
                os.rename(tmp, dst)

    def __deleteFilesStartWith(self, _path, prefix):
        for file in os.listdir(_path):
            if file.startswith(prefix):
                path = os.path.join(_path, file)
                os.remove(path)

    def __deleteDirContent(self, _path):
        if os.path.exists(_path):
            for file in os.listdir(_path):
                path = os.path.join(_path, file)
                os.remove(path)
    
    def __deleteOutputFiles(self):
        wrfoutFiles = f"{wrfPath}/{prefixWrfout}"
        wrfrstFiles = f"{wrfPath}/{prefixWrfrst}"

        wrfoutFilesArr = glob.glob(f'{wrfoutFiles}*')        
        wrfrstFilesArr = glob.glob(f'{wrfrstFiles}*')

        for f in wrfoutFilesArr: os.remove(f)
        for f in wrfrstFilesArr: os.remove(f)
    
    def __deletePathTree(self, _path):
        if os.path.exists(_path):
            try:
                shutil.rmtree(_path)

            except OSError as e:
                os.remove(_path)
    
    def __makeDir(self, _path):
        if not os.path.exists(_path):
            os.makedirs(_path)

            msg = "Folder created."
            clr = 'green'

        else:

            msg = "Folder exists."
            clr = 'red'

        print(colored(msg, clr))
        
    ###########################################
    ####################
    # Project
    ####################
    ###########################################
        
    def getProjectsList(self):
        return self.__projectsList
    
    def postProject(self, projTitle):
        msg = 'There is no active user.'

        if self.__activeUserTp:
            project = self.__interm.insertProject(projTitle, self.__activeUserTp[0])

            if project == None:
                msg = 'Project exists'

            else:
                projPath = f"{mainPath}/{self.__activeUserTp[1]}/{projTitle}"
                self.__makeDir(projPath)
                # self.__copyPasteDefaultNamelists(projPath)
                self.__setProjectsList()

                msg = f'{project[1]} created for {self.__activeUserTp[1]}.'
        
        print(colored(msg, 'yellow'))
        
    def setActiveProject(self, projTp):
        if projTp == None:
            self.__resetProject()

        else:
            self.__activeProjectTp = projTp
            self.__setProjectPath()
            self.__setCollectionsList()
            self.__setWorkflowsList()
            self.__setEnsembles()

            self.setActiveCollectionId()

    def __resetProject(self):
        self.__activeProjectTp = []
        self.__projectPath     = None

        self.__workflowsList = []

        self.__activeCollectionId = None
        self.__activeScatter = []
        self.__collectionsList = []

        self.__ensemblesList = []

        self.__workflow.setId()

    def __setProjectsList(self):
        if self.__activeUserTp:
            userId = self.__activeUserTp[0]
            self.__projectsList = self.__interm.selectUserProjects(userId)

        else:
            self.__projectsList = []

    def __setProjectPath(self):
        self.__projectPath = f'{mainPath}/{self.__activeUserTp[1]}/{self.__activeProjectTp[1]}'

    ###########################################
    ####################
    # Race conditions
    ####################
    ###########################################

    def awaitGreenLight(self, waitingTo=None, whodidcall=None):
        msg = colored(f"{whodidcall}: Red Light", 'red')

        rec = self.__recording
        gf  = self.__gettingForecast

        waitTimeRec = 30
        waitTimeGf = 15

        if waitingTo == 'getForecast':
             while rec:
                print(msg)
                time.sleep(waitTimeRec)

                rec = self.__recording

        elif waitingTo == 'recordForecast':
            while gf:
                print(msg)
                time.sleep(waitTimeGf)

                gf  = self.__gettingForecast

        else:
             while rec or gf:
                print(msg)
                time.sleep(waitTimeRec)

                gf  = self.__gettingForecast
                rec = self.__recording


        msg = colored(f"{whodidcall}: Green Light", 'green')
        print(msg)
    
    ###########################################
    ####################
    # Run
    ####################
    ###########################################

    def abortAirflow(self, wfId):
        if self.__running['wf'] and self.__running['wf']['id'] == wfId:
            dag_run   = self.__defineMostRecentDagRun()

            if dag_run:

                for task in dag_run.get_task_instances():
                    task.set_state('failed')

                self.__abort = True

                self.awaitGreenLight(whodidcall="abortAirflow")
                
                self.checkDag()
                    
                msg = '\nDag aborted.\n'
                print(colored(msg, 'red'))
    
    def callAirflow(self):
        icbc_date = f"{self.__running['start_ymd']}_{self.__running['end_ymd']}"
        
        doms = ''

        for i in self.__running['domains']:
            if i == len(self.__running['domains']) - 1:
                doms += f'{str(i+1)}'
            else:
                doms += f'{str(i+1)} '

        myparams = {
            'start_date'   : self.__running['start_date']      , # yyyy-mm-dd_hh:mm:ss
            'end_date'     : self.__running['end_date']        , # yyyy-mm-dd_hh:mm:ss
            'domains'      : doms                              ,
            'icbc_date'    : icbc_date                         , # yyyymmdd_yyyymmdd
            'icbc_model'   : self.__running['icbc_model']      , 
            'ungribPath'   : self.__ungrib_path                , 
            'metPath'      : self.__metgrid_path               , 
            'wfPath'       : self.__wfPath                     , 
            'f_start_date' : self.__running['output_file_date'], # yyyy-mm-dd_hh_mm_ss
        }

        self.__complete = False
        msg = f'[Structure - callAirflow] DAG: {self.__currentDag}'
        print(colored(msg, 'yellow'))

        self.__deleteOutputFiles()
        self.__client.trigger_dag(dag_id=self.__currentDag, conf=myparams)
     
    def checkDag(self):
        def computeLastTime():
            lt = 0
            if len(self.__startTimeIdx) > 0 and self.__startTimeIdx[-1] > 0:
                lt = self.__startTimeIdx[-1] -1

            return lt
        
        if self.__running['wf']:
            self.__currentDagTask = None
            dag_run   = self.__defineMostRecentDagRun()

            dag_state = dag_run.state
            wrf_state = dag_run.get_task_instance('WRF').state

            self.__dagState = dag_run.state

            msg = f'\ndag state: {self.__dagState}\nwrf state: {wrf_state}\ncomplete: {self.__complete}\n'
            print(colored(msg, 'yellow'))

            # 
            tasks = dag_run.get_task_instances()

            ascendingTasks = []
            for tsk in tasks: ascendingTasks.insert(0,tsk)

            for tsk in ascendingTasks:
                print(tsk.task_id, tsk.state)
                if tsk.state == 'success' and tsk.task_id != 'WRF':
                    pass

                elif tsk.state != None:
                    self.__currentDagTask = tsk.task_id

            self.__updateStatus()

            if dag_run.state != 'success':
                self.__dagState = dag_run.state
                self.__updateStatus()

            if dag_run.state == 'failed' or wrf_state == 'failed':
                self.__currentDagTask = None
                self.__updateStatus()
                self.__resetRunningVars()
                self.__setWorkflowsList()

            else:
                if wrf_state == 'running' or wrf_state == 'success':
                    if not self.__recording and not self.__gettingForecast:
                        self.__recordForecast()
                            
                        lastTimeDone = computeLastTime()
                        progress     = str(int((lastTimeDone * 100) / (self.__running['run_hours'])))

                        self.__currentDagTask = f"{self.__currentDagTask} {progress}% ({lastTimeDone}h/{self.__running['run_hours']}h)" 
                        self.__updateStatus()

                    if dag_state == 'success' and not self.__recording and not self.__gettingForecast:
                        self.__updateDb(dag_run)
                        self.__setCollectionsList()
                        self.setActiveCollectionId()
                        self.__deleteOutputFiles()
                        self.__resetRunningVars()
                        self.__setWorkflowsList()
                        # self.__dagState = dag_run
                        

            msg = f'\ndag state: {self.__dagState}\nwrf state: {wrf_state}\ncomplete: {self.__complete}\n'             
            print()
            print(colored(msg, 'green'))

    def getComplete(self):
        return self.__complete
    
    def getDagState(self):
        return self.__dagState
        
    def getRecording(self):
        return self.__recording
    
    def restartAirflow(self, wfId):
        msg = f"[{self.__className}] restartAirflow --> wf {wfId}"
        print(colored(msg, 'yellow'))

        for wf in self.__workflowsList:
            if wf['id'] == wfId and wf['wfName']:
                self.__running['wf'] = wf
                break

        if self.__running['wf']:

            self.__setWorkflowPath(self.__running['wf']['wfName'])
        
            attrIds, data = self.__interm.selectRestartData(wfId)

            obj = {}

            for attrTp in attrIds:
                attrId   = attrTp[0]
                attrName = attrTp[1]
                [attrValue] = [d[1] for d in data if d[0] == attrId]

                obj[attrName] = attrValue
            
            nDoms      = self.__interm.countAttrDoms(wfId)

            start_date = obj['start_date']
            end_date   = obj['end_date']
            
            start_ymd  = start_date.split('_')[0].replace('-','')
            end_ymd    = end_date.split('_')[0].replace('-','')

            self.__running['start_date']       = start_date
            self.__running['domains']          = [i for i in range(nDoms)]
            self.__running['run_hours']        = int(obj['run_hours'])
            self.__running['start_ymd']        = start_ymd
            self.__running['end_date']         = end_date
            self.__running['end_ymd']          = end_ymd
            self.__running['icbc_model']       = obj['icbc_model']
            self.__running['output_file_date'] = start_date.replace(':', '_')

            self.__wfPath = obj['wrf_out_path']

            geogridPath  = f"{self.__wfPath}/{geogrid_out_folder}"
            ungribPath   = f"{self.__wfPath}/{ungrib_out_folder}"
            metgridPath  = f"{self.__wfPath}/{metgrid_out_folder}"

            self.__deleteDirContent(geogridPath)
            self.__deleteDirContent(ungribPath)
            self.__deleteDirContent(metgridPath)
            self.__deleteFilesStartWith(self.__wfPath, 'wrfout')

             # delete output from database
            self.__interm.deleteOutput(wfId)

            self.__run_geogrid, self.__run_ungrib = self.__interm.defineDagToRestart(wfId)

            self.__defineDag()
            self.__createPaths()
            
            self.callAirflow()

    def setGettingForecast(self, _bool):
        self.__gettingForecast = _bool
            
    def __defineDag(self):
        def checkICBC():
            icbc_model = self.__running['icbc_model']

            icbc_path = f"{icbcPath}/{icbc_model}/{self.__running['start_ymd']}_{self.__running['end_ymd']}"
            exists = os.path.exists(icbc_path)

            if exists:
                prefix = icbc_models_prefix[icbc_model]

                suffix = f"{'{:03d}'.format(self.__running['run_hours'])}{icbc_models_ext[icbc_model]}"

                arr = [filename for filename in os.listdir(icbc_path) if filename.startswith(prefix) and filename.endswith(suffix)]

                _download  = not arr
                    
            else:
                _download  = not exists
            
            if _download: self.__icbc_path = icbc_path
            
            return _download  

        currentDag = 'r_wrf'

        geogrid_path = f'{self.__wfPath}/{geogrid_out_folder}'
        ungrib_path  = f'{self.__wfPath}/{ungrib_out_folder}'
        metgrid_path = f'{self.__wfPath}/{metgrid_out_folder}'
        
        wfId = int(self.__running['wf']['id'])

        if self.__run_geogrid or self.__run_ungrib:

            if self.__run_geogrid:

                if self.__run_ungrib:
                    downloadICBC = checkICBC()

                    if downloadICBC:

                        currentDag = 'gdum_' + currentDag
                    
                    else:
                        currentDag = 'gum_' + currentDag
                
                else:
                    ungrib_path = self.__interm.selectPath(wfId, 'ungrib')
                    currentDag = 'gm_' + currentDag
            
            else:
                geogrid_path = self.__interm.selectPath(wfId, 'geogrid')

                downloadICBC = checkICBC()

                if downloadICBC:
                    currentDag = 'dum_' + currentDag
                
                else:
                    currentDag = 'um_' + currentDag

        else:
            geogrid_path = self.__interm.selectPath(wfId, 'geogrid')
            ungrib_path  = self.__interm.selectPath(wfId, 'ungrib')
            metgrid_path = self.__interm.selectPath(wfId, 'metgrid')
        
        
        self.__currentDag = currentDag

        self.__geogrid_path = geogrid_path
        self.__ungrib_path  = ungrib_path
        self.__metgrid_path = metgrid_path

        print(f"[{self.__className} - __defineDag] {self.__geogrid_path}")
        print(f"[{self.__className} - __defineDag] {self.__ungrib_path}")
        print(f"[{self.__className} - __defineDag] {self.__metgrid_path}")

        msg = f'[{self.__className} - __defineDag] DAG: {currentDag}'
        print(colored(msg, 'yellow'))

    def __defineMostRecentDagRun(self):
        dag_runs = DagRun.find(dag_id=self.__currentDag)
        dag_runs.sort(key=lambda x: x.execution_date, reverse=True)
        return dag_runs[0] if dag_runs else None
    
    def __recordForecast(self):
        self.__recording = True
        nDoms = len(self.__running['domains'])
        
        if len(self.__startTimeIdx) == 0: 
            self.__startTimeIdx = [0] * nDoms

        allTimesDone = all(tidx == self.__running['run_hours'] + 1 for tidx in self.__startTimeIdx)

        if not allTimesDone:
            for dIdx in reversed(self.__running['domains']):
                gridId = dIdx + 1

                self.__copyPasteOutputFiles(gridId)
                
                stDate     = self.__running['start_date'].replace('00:00:00', '00_00_00')
                ncFilePath = f"{self.__wfPath}/{prefixWrfout}{gridId}_{stDate}"
                
                if os.path.exists(ncFilePath):
                    startTimeIdx = self.__startTimeIdx[dIdx]

                    msgDom = f'\n[{self.__className} - __recordForecast] Domain {gridId}'
                    print(colored(msgDom, 'green'))


                    self.__rawOutput.setNcfile(ncFilePath)
                    self.__rawOutput.setT0(startTimeIdx)

                    ok = self.__rawOutput.buildInitialState()

                    if ok:
                        lastTimeIdx = self.__rawOutput.getEndTstepIdx()

                        if lastTimeIdx == 0:
                            msg = colored('No data yet', 'blue')
                            print(msg)

                        elif startTimeIdx > lastTimeIdx:
                            msg = colored('No update.', 'blue')
                            print(msg)

                        else:
                            start_time = time.time()

                            self.__rawOutput.buildOutput()

                            if gridId == nDoms  and not self.__limits:
                                self.__limits = self.__rawOutput.getLimits()
                                msg = colored('Limits done', 'blue')
                                print(msg)

                            indices = self.__rawOutput.calculateLimitIndices(self.__limits)
                            self.__rawOutput.formatOutput(indices)

                            atmvarsOut = self.__rawOutput.getOutput()

                            if startTimeIdx == 0:
                                domInfo  = self.__rawOutput.getInfo(indices)
                                self.__interm.insertDomain(gridId, domInfo, self.__running['wf']['id'])

                            domId = self.__interm.selectDomainId(self.__running['wf']['id'], gridId)

                            self.__interm.insertForecast(atmvarsOut, domId, gridId)
                            self.__interm.insertAggregations(startTimeIdx, lastTimeIdx, self.__running['run_hours'], domId)

                            self.__startTimeIdx[dIdx] = lastTimeIdx + 1

                            msg = f'\n[{self.__className} - __recordForecast] Recorded from time {startTimeIdx} to {lastTimeIdx}'
                            print(colored(msg, 'blue'))

                            end_time = time.time()
                            duration = end_time - start_time
                            msgDur = f'\n[{self.__className} - __recordForecast] Duration: {duration}'
                            print(colored(msgDur, 'blue'))

                    self.__rawOutput.closeNcFile()
                    self.__rawOutput.reset()

        else:
            msg = colored(f'[{self.__className} - __recordForecast] Nothing to record.', 'blue')
            print(msg)

        self.__recording = False

    def __resetRunningVars(self):
        self.__running = {
            'wf'       : None, 
            'domains'  : []  , 
            'run_hours': 0   , 
            'last_time': 0   ,
            'start_ymd': None,
            'end_ymd'  : None,
            'output_file_date': None,
        } 

        self.__limits          = None
        self.__complete        = True
        self.__dagState        = None
        self.__recording       = False
        self.__currentDag      = None
        self.__currentDagTask  = None
        self.__startTimeIdx    = []
        self.__abort           = False

        self.__run_geogrid = None
        self.__run_ungrib  = None

        self.__wfPath      = None
        self.__icbc_path   = None
    
    def __updateDb(self, dagRun):
        
        # Workflow Execution
        wfExecId = self.__interm.insertWorkflowExecution(self.__running['wf']['id'])

        startTime = None
        endTime   = None

        progs = ['geogrid', 'ungrib', 'metgrid', 'real', 'wrf']

        if not self.__run_geogrid: progs.remove('geogrid')
        if not self.__run_ungrib:  progs.remove('ungrib')

        if 'geogrid' not in progs and 'ungrib' not in progs: progs.remove('metgrid')

        tasks = dagRun.get_task_instances()

        # Activity and Activity Execution
        for i, prog in enumerate(progs):
            progName = prog.upper() if prog == 'wrf' else prog.capitalize()
            activityId = self.__interm.insertActivity(prog, self.__running['wf']['id'])
            
            for tsk in tasks:
                if tsk.task_id == progName:
                    activityStartTime = tsk.start_date
                    activityEndTime   = tsk.end_date

                    if   i == 0            : startTime = tsk.start_date
                    elif i == len(progs)-1 : endTime   = tsk.end_date

                    self.__interm.insertActivityExecution(wfExecId, activityId, activityStartTime, activityEndTime)
                    break
        # Workflow Execution
        self.__interm.updateWorkflowExecution(wfExecId, startTime, endTime)


        # Collections
        projId = self.__activeProjectTp[0]
        wfId   = self.__running['wf']['id']
        
        self.__interm.insertCollectionMembers(projId, wfId)

    def __updateStatus(self):
        if self.__running['wf'] != None :
            for wf in self.__workflowsList:            
                if wf['id'] == self.__running['wf']['id']:
                    
                    wf['status'] = f'{str(self.__dagState)} {self.__currentDagTask}' if self.__currentDagTask else f'{str(self.__dagState)}'
                    
                    self.__running['wf'] = wf
                    
                    break


    ###########################################
    ####################
    # Scatter
    ####################
    ###########################################
    
    def getScatter(self):

        if len(self.__activeScatter) == 0:
            self.setActiveCollectionId()

        return self.__activeScatter
    
    def __computeScatter(self):

        scatter = []
        params  = []
        wfs     = []

        [membersArr] = [obj['members'] for obj in self.__collectionsList if obj['id'] == self.__activeCollectionId]
        
        if len(membersArr) > 1:
            msg = '\nBuilding scatter...'
            print(colored(msg, 'green'))
            measures = ['avg', 'max', 'sd']

            pca = PCA(n_components=2)

            for mTp in membersArr:
                domainParams = []
                dId  = mTp[0]
                wfId = mTp[1]
                wf = [_wf for _wf in self.__workflowsList if _wf['id'] == wfId]

                if len(wf) > 0: wfs.append(wf[0])

                for meas in measures:
                    
                    data = self.__interm.selectScatterData(dId, meas)
                    domainParams = [*domainParams, *data]
                params.append(domainParams)

            params = StandardScaler().fit_transform(params)
            principalComponents = pca.fit_transform(params)
            principalComponents = principalComponents.tolist()           

            for pt, wf in zip(principalComponents, wfs):
                obj = wf.copy()
                obj['x'] = pt[0]
                obj['y'] = pt[1]

                scatter.append(obj)

        msg = '\nScatter done.'
        print(colored(msg, 'green'))
        
        return scatter
    
    
    ###########################################
    ####################
    # User
    ####################
    ###########################################
    
    def getActiveUserTp(self):
        return self.__activeUserTp

    def getUsersList(self):
        return self.__usersList

    def postUser(self, newUserName):
        ok = True

        for userTp in self.__usersList:
            if userTp[1] == newUserName:
                ok = False
                break

        if ok:
            self.__interm.insertUser(newUserName)
            self.__usersList = self.__interm.selectUsersList()

            msg = f"New user added: {newUserName}"

            userPath = f"{mainPath}/{newUserName}"
            self.__makeDir(userPath)

        else:
            msg = f"User exists."

        print(colored(msg, 'yellow'))

        return ok
    
    def setActiveUserTp(self, userTp):
        self.__activeUserTp = userTp
        self.__setProjectsList()


        msg = f"[{self.__className} - setActiveUserTp]\nActive user: {self.__activeUserTp[1]}"
        print(colored(msg, 'yellow'))
    
    ###########################################
    ####################
    # Workflow
    ####################
    ###########################################
    
    def deleteWorkflow(self, wfId):
        wfPath = self.__interm.deleteWorkflow(wfId)

        if wfPath: self.__deletePathTree(wfPath[0])

        for wf in self.__workflowsList:
            if wf['id'] == wfId:
                self.__workflowsList.remove(wf)
                break

        self.__setCollectionsList()
        self.__setWorkflowsList()
        self.__setEnsembles()
        self.setActiveCollectionId()

        msg = f'Workflow {wfId} deleted.'
        print(colored(msg, 'yellow'))
    
    def getActiveWorkflow(self):
        return self.__workflow
    
    def getWorkflows(self):
        workflows = self.__interm.selectProjectWorkflows(self.__activeProjectTp[0])

        return workflows
    
    def setActiveWorkflow(self, wfId):

        if not wfId:
            self.__workflow.setId(None)

            return []

        else:

            [requestedWf] = [wf for wf in self.__workflowsList if wf['id'] == wfId]

            if requestedWf['wfName']:
                # ok = self.__interm.checkOutput(wfId)

                # if ok:
            
                self.__workflow.setId(wfId)

                nDoms    = self.__workflow.getNDoms()
                runHours = self.__workflow.getRunHours()
                lastTime = self.__workflow.getLastTime()
            
                return nDoms, runHours, lastTime

            else:
                return []
    
    def __setWorkflowsList(self):
        workflows = self.__interm.selectProjectWorkflows(self.__activeProjectTp[0])
        arr = []

        for i, wf in enumerate(workflows):
            wfId     = wf[0]
            wfName   = wf[1]
            parentId = wf[3]

            attributes = self.__interm.selectWorkflowValues(wfId)

            for j in range(len(attributes['collections'])):
                cId = attributes['collections'][j]

                [cInternalId] = [c['internal_id'] for c in self.__collectionsList if c['id'] == cId]
                attributes['collections'][j] = cInternalId

            obj = {
                'internal_id'  : i+1     ,
                'id'           : wfId    ,
                'parent_id'    : parentId,
                'wfName'       : wfName  ,
            }

            wfObj = obj | attributes

            status = 'failed'

            if self.__running['wf'] != None and self.__running['wf']['id'] == wfId:
                 status = self.__dagState

            else:
                wfExecExists = self.__interm.existsWorkflowExecutionByWf(wfId)

                if wfExecExists: status = 'success'

            wfObj['status'] = status
            arr.append(wfObj)

        arr.sort(key=lambda d: d['id'], reverse=True)
        arr.sort(key=lambda d: d['parent_id'], reverse=True)
        self.__workflowsList = arr
 
    def __setWorkflowPath(self, wfName):
        self.__wfPath = f"{self.__projectPath}/{wfName}" 
    
    ###########################################
    ####################
    # Workflow Setup
    ####################
    ###########################################

    def deleteDomain(self, domId):
        wfId = self.__workflowInSetup['id']
        self.__interm.deleteDomain(wfId, domId)
    
    def cancelWorkflowSetup(self):
        wfId = self.__workflowInSetup['id']
        self.__interm.cancelWorkflowSetup(wfId)

        self.__workflowInSetup = None
        self.__setWorkflowsList()
            
    def completeWorkflowSetup(self, data):
        def calculateRunHours():
            _start_date = data['start_date'].replace('_', ' ')
            _end_date   = data['end_date'].replace('_', ' ')

            start_date_obj = datetime.strptime(_start_date, '%Y-%m-%d %H:%M:%S')
            end_date_obj   = datetime.strptime(_end_date, '%Y-%m-%d %H:%M:%S')

            diff = end_date_obj-start_date_obj
        
            _run_hours = int(diff.total_seconds() / 3600)

            return _run_hours
    
        data['run_hours'] = calculateRunHours()

        self.__setWorkflowPath(data['wfName'])

        self.__postAttrs(data)

        start_ymd = data['start_date'].split('_')[0].replace('-','')     
        end_ymd   = data['end_date'].split('_')[0].replace('-','')
        nDoms     = self.__interm.countAttrDoms(self.__workflowInSetup['id'])

        self.__running['wf']               = self.__workflowInSetup
        self.__running['start_date']       = data['start_date']                   # yyyy-mm-dd_hh:mm:ss
        self.__running['end_date']         = data['end_date']                     # yyyy-mm-dd_hh:mm:ss
        self.__running['domains']          = [i for i in range(nDoms)]
        self.__running['run_hours']        = int(data['run_hours'])
        self.__running['start_ymd']        = start_ymd                            # yyyymmdd
        self.__running['end_ymd']          = end_ymd                              # yyyymmdd
        self.__running['output_file_date'] = data['start_date'].replace(':', '_') # yyyy-mm-dd_hh_mm_ss
        self.__running['icbc_model']       = data['icbc_model']
        
        self.__workflowInSetup = None

        self.__defineDag()
        self.__createPaths()
        self.__postAttrPaths()
        self.__editNamelists()

        self.__interm.updateWorkflowName(data['wfName'], self.__running['wf']['id'])

        self.__setWorkflowsList()

        for wf in self.__workflowsList:
            if wf['id'] == self.__running['wf']['id']:              
                self.__running['wf'] = wf
                break
       
    def editWorkflow(self, wfId):
   
        for wf in self.__workflowsList:
            if wf['id'] == wfId:
                self.__workflowInSetup = wf
                break

        msg = f"Workflow: {self.__workflowInSetup['id']}"
        print(colored(msg, 'yellow'))
    
    def getChildParams(self):
        resp = self.__interm.selectChildParams(self.__workflowInSetup['id'])
        return resp
    
    def getDomainsSetup(self):
        resp = self.__interm.selectDomainsSetup(self.__workflowInSetup['id'])
        return resp
    
    def getFormAttrs(self):
        resp = self.__interm.selectFormAttrValues(self.__workflowInSetup['id'])
        return resp
        
    def getIcbcModel(self):
        resp = self.__interm.selectIcbcModel(self.__workflowInSetup['id'])
        return resp
    
    def getPhysics(self):
        resp = self.__interm.selectWorkflowValues(self.__workflowInSetup['id'])

        if 'run_hours' in resp.keys(): 
            del resp['run_hours']

        if 'icbc_model' in resp.keys(): 
            del resp['icbc_model']

        return resp
    
    def getWorkflowsList(self):
        return self.__workflowsList
        
    def postDomain(self, domain):
        def buildObj():
            obj = {}

            obj['geogrid_in'] = {}
            obj['conf']       = {}

            print(domain)

            id = domain['id']

            # Geogrid
            obj['geogrid_in'][f"grid_id_{id}"]   = domain['id']
            obj['geogrid_in'][f"e_sn_{id}"]      = domain['e_sn']
            obj['geogrid_in'][f"e_we_{id}"]      = domain['e_we']
            obj['geogrid_in'][f"i_parent_{id}"]  = domain['i_parent']
            obj['geogrid_in'][f"j_parent_{id}"]  = domain['j_parent']
            obj['geogrid_in'][f"parent_id_{id}"] = domain['parent_id']

            # Conf
            obj['conf'][f"nw_lat_{id}"] = domain['nw_lat']
            obj['conf'][f"nw_lon_{id}"] = domain['nw_lon']
            obj['conf'][f"se_lat_{id}"] = domain['se_lat']
            obj['conf'][f"se_lon_{id}"] = domain['se_lon']

            if id == 1:
                obj['geogrid_in']['coarse_res']    = domain['res']
                obj['geogrid_in'][f"ref_lat_{id}"] = domain['ref_lat']
                obj['geogrid_in'][f"ref_lon_{id}"] = domain['ref_lon']
                obj['geogrid_in']['ref_x']         = domain['ref_x']
                obj['geogrid_in']['ref_y']         = domain['ref_y']

            else:
                obj['conf'][f"res_{id}"]     = domain['res']
                obj['conf'][f"ref_lat_{id}"] = domain['ref_lat']
                obj['conf'][f"ref_lon_{id}"] = domain['ref_lon']

            return obj
        

        myObj = buildObj()
        wfId  = self.__workflowInSetup['id']

        self.__interm.insertDomainSetup(wfId, myObj)

        msg = f"[{self.__className} - createDomain]Domain recorded.\nWorkflow: {self.__workflowInSetup['id']}"
        
        print(colored(msg, 'yellow'))
    
    def postWorkflow(self, parentId):
        wfName = ''

        wfInSetup = self.__interm.insertWorkflow(self.__activeProjectTp[0], wfName, parentId)
    
        self.__setWorkflowsList()

        for wf in self.__workflowsList:
            if wf['id'] == wfInSetup[0]:
                self.__workflowInSetup = wf
                break
        
        if parentId:
            self.__interm.cloneParentAttributes(wfInSetup[0], parentId)

        msg = f"Workflow: {self.__workflowInSetup['id']}"
        print(colored(msg, 'yellow'))
        
    def __createPaths(self):
        self.__makeDir(self.__wfPath)

        if self.__run_geogrid or self.__run_ungrib:
            self.__makeDir(self.__geogrid_path)
            
            if self.__run_ungrib:
                self.__makeDir(self.__ungrib_path)

                if self.__icbc_path:
                    if os.path.exists(self.__icbc_path):
                        self.__deleteDirContent(self.__icbc_path)
                    else:
                        self.__makeDir(self.__icbc_path)

            self.__makeDir(self.__metgrid_path) 

        msg = f"\n[{self.__className} - __createPaths] Dirs created."
        print(colored(msg, 'yellow'))
    
    def __editNamelists(self):
        wfId = self.__running['wf']['id']

        attrs, attrValues = self.__interm.selectNamelistsAttrs(wfId)
        obj = {}

        obj['max_dom'] = int(len(self.__running['domains']))

        for attr in attrs:
            attrId      = attr[0]
            attrName    = attr[1]
            [value] = [attrv[1] for attrv in attrValues if attrv[0] == attrId]

            obj[attrName] = value


        self.__editor.setAttrs(obj)
        self.__editor.computeDynamicValues()
        self.__editor.createNamelistInput(self.__wfPath)
        self.__editor.createNamelistWps(self.__wfPath)
        self.__editor.reset()
    
    def __postAttrs(self, data):
        wfId     = self.__workflowInSetup['id']
        parentId = self.__workflowInSetup['parent_id']

        if wfId == parentId:
            self.__run_geogrid = True
            self.__run_ungrib  = True
            
            self.__interm.insertAttrsSetup(wfId, data)
        else:
            self.__run_geogrid, self.__run_ungrib = self.__interm.updateAttrsSetup(wfId, parentId, data)
    
    def __postAttrPaths(self):
        wfId = self.__running['wf']['id']
        parentId = self.__running['wf']['parent_id']

        if wfId == parentId:

            obj = {
                'geogrid_out_path': self.__geogrid_path,
                'ungrib_out_path' : self.__ungrib_path ,
                'metgrid_out_path': self.__metgrid_path,
                'wrf_out_path'    : self.__wfPath      ,
            }

            self.__interm.insertAttrPaths(wfId, obj)

        else:

            obj = {'wrf_out_path'    : self.__wfPath }
            self.__interm.insertAttrPaths(wfId, obj)

            if self.__run_geogrid or self.__run_ungrib:
                self.__interm.updatePath(wfId, 'metgrid', self.__metgrid_path)
                
                if self.__run_geogrid:
                    self.__interm.updatePath(wfId, 'geogrid', self.__geogrid_path)
                    
                if self.__run_ungrib:
                    self.__interm.updatePath(wfId, 'ungrib', self.__ungrib_path)
    