import pymonetdb as db

from datetime   import date
from termcolor  import colored
from statistics import mean

from bin.consts import mydatabase, systemMaxDoms, nicks

class Intermediary(object):
    def __init__(self) -> None:
        self.__className = 'Intermediary'
        self.__conn   = db.connect(database=mydatabase, hostname='localhost', port=int(5001), username='monetdb', password='monetdb')
        self.__cursor = self.__conn.cursor()

    
    # ################
    # Activity
    # ################
    
    def insertActivity(self, prog, wfId):
        # myquery = f"select id from program where name='{program[prog]}'"
        progName = prog.upper() if prog == 'wrf' else prog.capitalize()
        myquery = f"select id from program where name='{progName}'"
        self.__cursor.execute(myquery)
        progId  = self.__cursor.fetchone()[0]

        myquery = f"select id, name from relation where name like '{prog}%in'"
        self.__cursor.execute(myquery)
        input_relation_id = self.__cursor.fetchone()[0]

        if prog == 'geogrid' or prog == 'ungrib':
            output_relation_name = 'metgrid_in'
        elif prog == 'metgrid':
            output_relation_name = 'real_in'
        elif prog == 'real':
            output_relation_name = 'wrf_in'
        elif prog == 'wrf':
            output_relation_name = 'wrf_out'

        myquery = f"select id from relation where name='{output_relation_name}'"
        self.__cursor.execute(myquery)
        output_relation_id = self.__cursor.fetchone()[0]

        myquery = f"insert into activity values (default,{progId},{wfId},{input_relation_id},{output_relation_id})"
        self.__cursor.execute(myquery)
        
        myquery = f"select * from activity order by id desc limit 1"
        self.__cursor.execute(myquery)
        activityId = self.__cursor.fetchone()[0]

        self.__conn.commit()

        return activityId
    
    def insertActivityExecution(self, wfExecId, activId, start_time, end_time):
        myquery = f"insert into activity_execution values (default, '{start_time}', '{end_time}', {wfExecId}, {activId})"
        self.__cursor.execute(myquery)
        self.__conn.commit()

    # ################
    # Collection
    # ################

    def insertCollectionMembers(self, projId, wfId):
        ungribRelationId = f"select id from relation where name='ungrib_in'"
        dateAttrIds = "select id from attribute where name like '%_date'"

        wrfOutRelationId = "select id from relation where name='wrf_out'"
        domAttrIds       = f"select id from attribute where name like 'dom_%'"
        rtupleId   = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({wrfOutRelationId})"
        domainIds  = f"select value from attribute_value where relation_tuple_id in ({rtupleId}) and attribute_id in ({domAttrIds})"

        domainsQuery = f"select * from domain where id in ({domainIds})"

        self.__cursor.execute(domainsQuery)
        domainsArr = self.__cursor.fetchall()

        for dom in domainsArr:
            similarExists = False

            dId   = dom[0]
            gId   = dom[1]
            nLat  = dom[2]
            sLat  = dom[3]
            cLat  = dom[4]
            wLon  = dom[5]
            eLon  = dom[6]
            cLon  = dom[7]
            nRows = dom[8]
            nCols = dom[9]
            gDist = dom[10]

            similarDomQuery = f"""select id from domain where
                id               <> {dId}   and
                grid_id           = {gId}   and
                north_latitude    = {nLat}  and 
                south_latitude    = {sLat}  and 
                central_latitude  = {cLat}  and 
                west_longitude    = {wLon}  and 
                east_longitude    = {eLon}  and 
                central_longitude = {cLon}  and 
                number_of_rows    = {nRows} and 
                number_of_columns = {nCols} and 
                grid_distance     = {gDist} 

            """

            self.__cursor.execute(similarDomQuery)
            similarDom = self.__cursor.fetchall()

            dAttrId = f"select id from attribute where name like 'dom_{gId}'"

            if similarDom:

                # check dates
                for sDom in similarDom:
                    sDomId = sDom[0]

                    rTupleId    = f"select relation_tuple_id from attribute_value where attribute_id in ({dAttrId}) and value = '{sDomId}'"
                    similarWfId = f"select workflow_id from relation_tuple where id in ({rTupleId})"

                    rTupleIds = f"select id from relation_tuple where relation_id in ({ungribRelationId}) and workflow_id in ({wfId}, {similarWfId})"
                    checkSameDates = f"select attribute_id, count(distinct value) = 1 as checkSameDates from attribute_value where relation_tuple_id in ({rTupleIds}) and attribute_id in ({dateAttrIds}) group by attribute_id"

                    sameDatesQuery = f"select count(checkSameDates)=2 from ({checkSameDates}) as sameDates where checkSameDates=true"
                    self.__cursor.execute(sameDatesQuery)
                    sameDates = self.__cursor.fetchone()[0]

                    if sameDates:
                        similarExists = True
                        collectionIdQuery = f"select collection_id from collection_member where domain_id = {sDomId}"
                        self.__cursor.execute(collectionIdQuery)
                        collectionId = self.__cursor.fetchone()[0]

                        insertCollectionMember = f"insert into collection_member values (default, {dId}, {collectionId})"

                        self.__cursor.execute(insertCollectionMember)
                        print(f'[{self.__className} insertCollectionMembers]\nDomain {sDomId} collection {collectionId} (same dates)')
                        break
                
            if not similarExists:
                insertNewCollection = f"insert into collection values (default, 'collection', {projId})"
                self.__cursor.execute(insertNewCollection)

                collectionIdQuery = f"select id from collection order by id desc limit 1"
                self.__cursor.execute(collectionIdQuery)
                collectionId = self.__cursor.fetchone()[0]

                insertCollectionMember = f"insert into collection_member values (default, {dId}, {collectionId})"
                self.__cursor.execute(insertCollectionMember)
                

            self.__conn.commit()
    
    def selectCollections(self, projId):
        resp = []
        
        collectionsQuery     = f"select id, name from collection where project_id={projId} order by id"
        self.__cursor.execute(collectionsQuery)
        collections = self.__cursor.fetchall()


        collectionIds = f"select id from collection where project_id={projId}"
        membersQuery = f"select domain_id, collection_id from collection_member where collection_id in ({collectionIds})"
        self.__cursor.execute(membersQuery)
        members = self.__cursor.fetchall()

        attrId     = "select id from attribute where name like 'dom_%'"
        
        for j, coll in enumerate(collections):
            obj = {}

            cId = coll[0]
            
            obj['id']      = cId
            obj['name']    = coll[1]
            obj['grid']    = None
            obj['members'] = [m[0] for m in members if m[1] == cId]
            obj['internal_id'] = j+1

            nMembers = len(obj['members'])

            for i in range(nMembers):
                dId = obj['members'][i]

                if not obj['grid']:
               
                    gridIdQuery = f"select grid_id from domain where id = {dId}"
                    self.__cursor.execute(gridIdQuery)
                    obj['grid'] = self.__cursor.fetchone()[0]

                rtupleId  = f"select relation_tuple_id from attribute_value where attribute_id in ({attrId}) and value='{dId}'"
                wfIdQuery = f"select workflow_id from relation_tuple where id in ({rtupleId})"
                self.__cursor.execute(wfIdQuery)
                wfId = self.__cursor.fetchone()[0]

                obj['members'][i] = (dId, wfId)

            resp.append(obj)

        self.__conn.commit()

        return resp
 
    # ################
    # Ensemble
    # ################
    
    def deleteMember(self, ensId, wfId):
        relationId = "select id from relation where name='wrf_out'"
        attrId     = f"select id from attribute where name like 'dom_%'"
        rtupleId   = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relationId})"

        domainIds = f"select value from attribute_value where relation_tuple_id in ({rtupleId}) and attribute_id in ({attrId})"

        collectionId = f"select collection_id from ensemble where id={ensId}"

        cMemberId = f"select id from collection_member where collection_id in ({collectionId}) and domain_id in ({domainIds})"

        myquery = f"delete from member where collection_member_id in ({cMemberId}) and ensemble_id={ensId}"

        self.__cursor.execute(myquery)

        activeEnsIds = f"select ensemble_id from member where ensemble_id={ensId}"

        myquery = f"delete from ensemble where id in ({ensId}) and id not in ({activeEnsIds})"

        self.__cursor.execute(myquery)

        self.__conn.commit()
    
    def insertEnsemble(self, ensName, wfId, gId):
        ensembleId = None

        relationId = "select id from relation where name='wrf_out'"
        attrId     = f"select id from attribute where name='dom_{gId}'"
        rtupleId   = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relationId})"

        domainId = f"select value from attribute_value where relation_tuple_id in ({rtupleId}) and attribute_id in ({attrId})"

        collectionIdQuery = f"select collection_id from collection_member where domain_id in ({domainId})"

        self.__cursor.execute(collectionIdQuery)
        collectionId = self.__cursor.fetchone()[0]

        creation_date = f"{date.today()}"

        myquery = f"insert into ensemble values (default, '{ensName}', '{creation_date}', {collectionId})"

        self.__cursor.execute(myquery)

        ensembleIdQuery = f"select id from ensemble order by id desc limit 1"
        self.__cursor.execute(ensembleIdQuery)
        ensembleId = self.__cursor.fetchone()[0]

        self.__conn.commit()

        return ensembleId
    
    def insertMember(self, ensId, wfId):
        relationId = "select id from relation where name='wrf_out'"
        attrId     = f"select id from attribute where name like 'dom_%'"
        rtupleId   = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relationId})"

        domainIds = f"select value from attribute_value where relation_tuple_id in ({rtupleId}) and attribute_id in ({attrId})"

        collectionId = f"select collection_id from ensemble where id={ensId}"
        
        collectionMemberIdQuery = f"select id from collection_member where collection_id in ({collectionId}) and domain_id in ({domainIds})"
        
        self.__cursor.execute(collectionMemberIdQuery)
        collectionMemberId = self.__cursor.fetchone()[0]

        myquery = f"insert into member values (default, {collectionMemberId}, {ensId})"
        self.__cursor.execute(myquery)
        
        self.__conn.commit()
        
    def selectEnsembleMap(self, domainsList, meas, atmvar, ti, tf):
        atmvarId = f"select id from atmospheric_variable where nickname='{atmvar}'"
        agg = f'{meas}(value)'

        myquery = f"select {agg} from forecast where domain_id in {domainsList} and atmospheric_variable_id in ({atmvarId}) and time between {ti} and {tf} group by grid_point order by grid_point"
        
        self.__cursor.execute(myquery)
        resp = self.__cursor.fetchall()

        return resp
    
    def selectEnsembles(self, cArr):
        if len(cArr) > 1:
            cTuple = tuple(cArr)
        else:
            cTuple = f'({cArr[0]})'

        myquery = f"select id, name, collection_id from ensemble where collection_id in {cTuple}"
        self.__cursor.execute(myquery)

        ensembles = self.__cursor.fetchall()

        for i in range(len(ensembles)):
            ens = list(ensembles[i])
            ensId = ens[0]

            cMemberIds = f"select collection_member_id from member where ensemble_id={ensId}"
            domainsIds = f"select domain_id from collection_member where id in ({cMemberIds})"

            relationId = "select id from relation where name='wrf_out'"
            attrIds    = "select id from attribute where name like 'dom_%'"
            rtupleIds  = f"select relation_tuple_id from attribute_value where attribute_id in ({attrIds}) and value in ({domainsIds})"
            wfIdsQuery = f"select workflow_id from relation_tuple where id in ({rtupleIds})"

            self.__cursor.execute(wfIdsQuery)
            wfIds = self.__cursor.fetchall()

            wfIds = [wfId[0] for wfId in wfIds]

            ens.append(wfIds)

            ensembles[i] = ens

        self.__conn.commit()

        return ensembles
      
    def selectExists(self, domId, atmvar, infLim):
        atmvarId = f"select id from atmospheric_variable where nickname='{atmvar}'"
        condition = f"value >= {infLim} and domain_id={domId} and atmospheric_variable_id in ({atmvarId})"

        myquery=f"select time, count(time) as inf_lim_count, sum({condition}) > 0 as verdict from forecast where domain_id={domId} group by time order by time"
        
        self.__cursor.execute(myquery)
        resp = self.__cursor.fetchall()

        return resp
    
    def selectExistsMap(self, domainsList, atmvar, infLim, ti, tf):
        atmvarId = f"select id from atmospheric_variable where nickname='{atmvar}'"
        myquery1 = f"select grid_point, sum(value >= {infLim}) > 0 as is_greater_then_infLim from forecast where atmospheric_variable_id in ({atmvarId}) and domain_id in {domainsList} and time between {ti} and {tf} group by grid_point, domain_id"
        myquery2 = f"select sum(is_greater_then_infLim = true) as number_of_members from ({myquery1}) r group by grid_point order by grid_point"
        
        self.__cursor.execute(myquery2)
        resp = self.__cursor.fetchall()

        return resp
    
    def selectExistsPrec(self, domId, infLim, ti, tf):
        atmvarId = f"select id from atmospheric_variable where nickname='prec'"
        condition = f"select grid_point, sum(value) as accumulated_precipitation from forecast where domain_id={domId} and atmospheric_variable_id in ({atmvarId}) and time between {ti} and {tf} group by grid_point having sum(value) >= {infLim}"
        myquery = f"select exists({condition})"
        
        self.__cursor.execute(myquery)
        resp = self.__cursor.fetchone()[0]

        return resp
    
    def selectExistsPrecMap(self, domainsList, infLim, ti, tf):
        # myquery = f"select grid_point, sum(value) as accumulated_precipitation from forecast where domain_id={domId} and atmospheric_variable_id={atmvarId} and time between {ti} and {tf} group by grid_point having sum(value) >= {infLim}"
        
        atmvarId = f"select id from atmospheric_variable where nickname='prec'"
        myquery = f"select grid_point, domain_id, sum(value) > {infLim}  as accumulated from forecast where atmospheric_variable_id in ({atmvarId}) and domain_id in {domainsList} and time between {ti} and {tf} and grid_point group by grid_point, domain_id order by domain_id, grid_point"
        
        self.__cursor.execute(myquery)
        
        resp = self.__cursor.fetchall()

        return resp
    
    def selectPrecAccPtHmat(self, domId, gridPt, steps):
        myquery = f"select time, step, value from forecast_accumulated_precipitation \
        where domain_id={domId} and grid_point={gridPt} and step in {steps}"

        self.__cursor.execute(myquery)
        resp = self.__cursor.fetchall()

        return resp
    
    def setEnsembleMainInfo(self, ensId):
        cMemberIds     = f"select collection_member_id from member where ensemble_id={ensId}"
        domainIdsQuery = f"select domain_id from collection_member where id in ({cMemberIds})"

        self.__cursor.execute(domainIdsQuery)
        domainIds = self.__cursor.fetchall()
        domainIds = [d[0] for d in domainIds]

        domainQuery = f"select * from domain where id in ({domainIdsQuery}) limit 1"
        self.__cursor.execute(domainQuery)
        domain = self.__cursor.fetchone()
        
        dId = domain[0]
        
        precId  = "select id from atmospheric_variable where nickname='prec'"
        gridPtsQuery = f"select grid_point, latitude, longitude from forecast where domain_id={dId} and atmospheric_variable_id in ({precId}) and time=1 order by grid_point"
        self.__cursor.execute(gridPtsQuery)
        gridPts = self.__cursor.fetchall()
        
        domain = domain[1:]

        timeQuery = f"select max(time) as maxTime from forecast_aggregation where domain_id in ({domainIdsQuery})"
        self.__cursor.execute(timeQuery)
        nTimes = int(self.__cursor.fetchone()[0]) + 1

        domAttrIds = "select id from attribute where name like 'dom%'"

        wfIds = []

        for dId in domainIds:
            rtupleId   = f"select distinct relation_tuple_id from attribute_value where attribute_id in ({domAttrIds}) and value = '{dId}'"
            wfIdsQuery = f"select workflow_id from relation_tuple where id in ({rtupleId})"
        
            self.__cursor.execute(wfIdsQuery)
            wid = self.__cursor.fetchone()[0]
            
            wfIds.append(wid)

        
        return domainIds, wfIds, domain, nTimes, gridPts
    
    # ################
    # Forecast
    # ################
    
    def selectForecastAgg(self, domId, meas, atmvars, stp=None):
        measId    = f"select id from measure_aggregation where nickname='{meas}'"
        atmvarIds = f"select id from atmospheric_variable where nickname in ({atmvars[0]})"

        if stp == None:
            myquery = f"select atmospheric_variable_id, time, value, step from forecast_aggregation where domain_id={domId} \
                and measure_aggregation_id in ({measId}) and atmospheric_variable_id in ({atmvarIds}) order by id"

        else:
            myquery = f"select atmospheric_variable_id, time, value, step from forecast_aggregation where domain_id={domId} \
                and step={stp} and measure_aggregation_id in ({measId}) and atmospheric_variable_id in ({atmvarIds}) order by id"

        resp = {}

        self.__cursor.execute(myquery)
        fAgg = self.__cursor.fetchall()

        fAgg.sort(key=lambda x:(x[0], x[1]))

        atmvarListQ = "select id, nickname from atmospheric_variable"
        self.__cursor.execute(atmvarListQ)
        atmvarList = self.__cursor.fetchall()
        
        self.__conn.commit()

        for atmvar in atmvarList:
            atmvarId   = atmvar[0]
            atmvarNick = atmvar[1]

            if atmvarNick in atmvars[0]:
                data = [(d[1], d[2], d[3]) for d in fAgg if d[0] == atmvarId]
                resp[atmvarNick] = data
        
        return resp
    
    def selectForecastAggAcc(self, domId, meas):
        atmvarId = f"select id from atmospheric_variable where nickname='prec'"
        measId   = f"select id from measure_aggregation where nickname='{meas}'"
        myquery  = f"select time, value from forecast_aggregation where domain_id={domId} and measure_aggregation_id in ({measId}) and atmospheric_variable_id in ({atmvarId}) and time = step order by time"
        
        self.__cursor.execute(myquery)
        resp = self.__cursor.fetchall()

        return resp
    
    def selectForecastMap(self, domId, atmvar, ti, tf):
        atmvarId = f"select id from atmospheric_variable where nickname='{atmvar}'"

        if atmvar == 'prec':
            myquery = f"select sum(value) from forecast where domain_id={domId} and atmospheric_variable_id in ({atmvarId}) and time between {ti} and {tf} group by grid_point order by grid_point"
        else:
            myquery = f"select value from forecast where domain_id={domId} and atmospheric_variable_id in ({atmvarId}) and time between {ti} and {tf} order by id"
        
        self.__cursor.execute(myquery)
        resp = self.__cursor.fetchall()
        
        # if atmvar == 'prec': print(resp)
        self.__conn.commit()

        return resp
    
    def selectForecastPt(self, domId, atmvars, gridPt):
        atmvarIds = f"select id from atmospheric_variable where nickname in ({atmvars[0]})"
        myquery = f"select atmospheric_variable_id, time, value from forecast where domain_id={domId} and atmospheric_variable_id in ({atmvarIds}) and grid_point={gridPt} order by id"
        
        self.__cursor.execute(myquery)
        fPts = self.__cursor.fetchall()

        atmvarListQ = "select id, nickname from atmospheric_variable"
        self.__cursor.execute(atmvarListQ)
        atmvarList = self.__cursor.fetchall()
        
        self.__conn.commit()

        resp = {}

        for atmvar in atmvarList:
            atmvarId   = atmvar[0]
            atmvarNick = atmvar[1]

            if atmvarNick in atmvars[0]:
                data = [(d[1], d[2]) for d in fPts if d[0] == atmvarId]
                resp[atmvarNick] = data


        return resp
    
    def selectForecastGridPts(self, dId):
        precId  = "select id from atmospheric_variable where nickname='prec'"
        myquery = f"select grid_point, latitude, longitude from forecast where domain_id={dId} and atmospheric_variable_id in ({precId}) and time=1 order by grid_point"

        self.__cursor.execute(myquery)
        resp = self.__cursor.fetchall()

        return resp

    def selectForecastInfo(self, wfId):
        runHours = 0
        lastTime = 0
        domains  = []
        
        attr     = f"select id from attribute where name='run_hours'"
        relation = "select id from relation where name='ungrib_in'"
        rtuple   = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relation})"

        myquery = f"select value from attribute_value where relation_tuple_id in ({rtuple}) and attribute_id in ({attr})"
        self.__cursor.execute(myquery)

        resp = self.__cursor.fetchone()
        if resp: 
            runHours = int(resp[0])

        attr     = f"select id from attribute where name like 'dom_%'"
        relation = "select id from relation where name='wrf_out'"
        rtuple   = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relation})"
        domIds   = f"select value from attribute_value where relation_tuple_id in ({rtuple}) and attribute_id in ({attr})"
        
        myquery = f"select * from domain where id in ({domIds}) order by grid_id"
        self.__cursor.execute(myquery)
        resp = self.__cursor.fetchall()

        if resp:
            domains = [list(r) for r in resp]

        prec = "select id from atmospheric_variable where nickname='prec'"
        # maxTimes = f"select domain_id, max(time) as max_time from forecast where domain_id in ({domIds}) and atmospheric_variable_id in ({prec}) group by domain_id"
        maxTimes = f"select domain_id, max(time) as max_time from forecast_aggregation where domain_id in ({domIds}) and atmospheric_variable_id in ({prec}) group by domain_id"

        myquery = f"select min(max_time) as min_last_time from ({maxTimes}) as max_times"
        self.__cursor.execute(myquery)
        resp = self.__cursor.fetchone()

        if resp[0]:
            lastTime = int(resp[0])
        else:
            lastTime = 0
        
        self.__conn.commit()
        
        return runHours, lastTime, domains
    
    def selectLastTime(self, wfId):
        lastTime = None
        
        attr     = f"select id from attribute where name like 'dom_%'"
        relation = "select id from relation where name='wrf_out'"
        rtuple   = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relation})"
        domIds   = f"select value from attribute_value where relation_tuple_id in ({rtuple}) and attribute_id in ({attr})"

        prec = "select id from atmospheric_variable where nickname='prec'"
        maxTimes = f"select domain_id, max(time) as max_time from forecast where domain_id in ({domIds}) and atmospheric_variable_id in ({prec}) group by domain_id"

        myquery = f"select min(max_time) as min_last_time from ({maxTimes}) as max_times"
        self.__cursor.execute(myquery)
        resp = self.__cursor.fetchone()

        if resp and resp[0] != None:
            lastTime = int(resp[0])

        return lastTime
    
    def selectPrecAcc(self, domId, time, step, gridPt=None):
        if gridPt == None:
            myquery = f"select * from forecast_accumulated_precipitation where domain_id={domId} and time={time} and step={step} order by id"
            
        else:
            myquery = f"select * from forecast_accumulated_precipitation where domain_id={domId} and grid_point={gridPt} and time={time} and step={step}"

        self.__cursor.execute(myquery)
        grid = self.__cursor.fetchall()

        return grid
    
    def selectPrecAccPt(self, domId, gridPt):
        myquery = f"select time, value from forecast_accumulated_precipitation where domain_id={domId} and grid_point={gridPt} and time = step order by time"
        self.__cursor.execute(myquery)
        resp = self.__cursor.fetchall()

        return resp
    
    # ################
    # Project
    # ################

    def insertProject(self, projTitle, userId):
        myquery = f"select exists (select * from project where title='{projTitle}' and owner_id={userId})"
        self.__cursor.execute(myquery)
        exists = self.__cursor.fetchone()[0]

        project = None

        if not exists:
            version       = '1'
            creation_date = f"{date.today()}"

            myquery = f"insert into project values (default,'{projTitle}','{creation_date}','{version}',{userId})"
            self.__cursor.execute(myquery)

            
            myquery = f"select * from project order by id desc limit 1"
            self.__cursor.execute(myquery)
            project = self.__cursor.fetchone() # projs

        self.__conn.commit()

        return project

    # ################
    # Record Output
    # ################

    def insertAggregations(self, ti, tf, runHours, domId):
        def doPrec(insertValues01, insertValues02):
            newSteps = steps.copy()
            
            if time not in newSteps: 
                newSteps.append(time) #[*newSteps, *[time]]
                newSteps.sort()
            
            for stp in newSteps:
                if time % stp == 0:
                    t0 = time - stp + 1

                    myquery = f"select sum(value) as acc from forecast where domain_id={domId} and atmospheric_variable_id={atmvarId} and time between {t0} and {time} group by grid_point order by grid_point"
                    self.__cursor.execute(myquery)
                    accPrec = self.__cursor.fetchall()

                    self.__conn.commit()

                    agg = [ptValue[0] for ptValue in accPrec]

                    if measNick == 'avg':
                        v = mean(agg)
                    elif measNick == 'max':
                        v = max(agg)

                    row1 = f"(default, {atmvarId}, {domId}, {time}, {stp}, {measId}, {v}),"
                    
                    insertValues01 += row1

                    for i, vTp in enumerate(accPrec):
                        gridPt = i + 1

                        row2 = f"(default, {domId}, {time}, {stp}, {gridPt}, {vTp[0]}),"

                        insertValues02 += row2
            
            return insertValues01, insertValues02

        steps  = [1, 3, 24, runHours] if runHours > 24 else [1, 3, 24]

        myquery = f"select id, nickname from atmospheric_variable"
        self.__cursor.execute(myquery)
        atmvars = self.__cursor.fetchall()

        myquery = f"select id, nickname from measure_aggregation where nickname in ('avg', 'max')"
        self.__cursor.execute(myquery)
        measures = self.__cursor.fetchall()

        for atmvar in atmvars:
            atmvarId   = atmvar[0]
            atmvarNick = atmvar[1]

            for m, meas in enumerate(measures):
                measId   = meas[0]
                measNick = meas[1]
                
                msg = f"[{self.__className} - insertAggregations] Recording {atmvarNick} ({measNick})"

                print()
                print(colored(msg, 'blue'))

                aggregation = f'{measNick}(value)'

                if atmvarNick == 'prec':
                    
                    insertValues1 = ''
                    insertValues2 = ''

                    for time in range(ti, tf + 1):
                        if time == 0:
                            pass

                        else:
                            insertValues1, insertValues2 = doPrec(insertValues1, insertValues2)

                    if insertValues1 and insertValues2:

                        insertValues1 = insertValues1[:-1]
                        insertValues2 = insertValues2[:-1]

                        myquery = f"insert into forecast_aggregation values {insertValues1}"
                        self.__cursor.execute(myquery)

                        
                        if m == 0:
                            myquery = f"insert into forecast_accumulated_precipitation values {insertValues2}"
                            self.__cursor.execute(myquery)

                        self.__conn.commit()

                else:
                    insertValues = ''

                    for time in range(ti, tf + 1):
                
                        stp = 1

                        myquery = f"select {aggregation} from forecast where domain_id={domId} and atmospheric_variable_id={atmvarId} and time={time}"
                        self.__cursor.execute(myquery)
                        value = self.__cursor.fetchone()[0]

                        row = f"(default, {atmvarId}, {domId}, {time}, {stp}, {measId}, {value}),"
                        
                        insertValues += row
                    
                    if insertValues:
                        insertValues = insertValues[:-1]

                        myquery = f"insert into forecast_aggregation values {insertValues}"
                        self.__cursor.execute(myquery)
                        self.__conn.commit()
    
    def insertDomain(self, gridId, info, wfId):
        values = list(info.values())
        values.insert(0, gridId)

        valuesStr = [f"'{str(v)}'" for v in values]
        valuesStr = ','.join(valuesStr)
        valuesStr = '(default,' + valuesStr
        valuesStr += ')'

        myquery = f"insert into domain values {valuesStr}"
        self.__cursor.execute(myquery)

        myquery = f"select id from domain order by id desc limit 1"
        self.__cursor.execute(myquery)
        domainId = self.__cursor.fetchone()[0]

        relation = f"select id from relation where name='wrf_out'"
        myquery  = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relation})"
        self.__cursor.execute(myquery)
        rtuple = self.__cursor.fetchone()

        if rtuple:
            rtupleId = rtuple[0]
        
        else:
            self.__cursor.execute(relation)
            relationId = self.__cursor.fetchone()[0]
            
            myquery = f"insert into relation_tuple values (default, {relationId}, {wfId})"
            self.__cursor.execute(myquery)

            myquery = f"select id from relation_tuple order by id desc limit 1"
            self.__cursor.execute(myquery)
            rtupleId = self.__cursor.fetchone()[0]

        attrName  = f'dom_{gridId}'

        myquery = f"select id from attribute where name='{attrName}'"
        self.__cursor.execute(myquery)
        attrId = self.__cursor.fetchone()[0]

        myquery = f"insert into attribute_value values (default, {attrId}, {rtupleId}, {domainId})"
        self.__cursor.execute(myquery)

        self.__conn.commit()
    
    def insertForecast(self, atmvarsOut, domId, d):
        strValues = ''

        myquery = f"select id, nickname from atmospheric_variable"
        self.__cursor.execute(myquery)
        atmvars = self.__cursor.fetchall()

        for atmvar in atmvars:
            atmvarId   = atmvar[0]
            atmvarNick = atmvar[1] 

            atmvarData = atmvarsOut[atmvarNick]

            for tData in atmvarData:
                count = 1

                for row in tData:
                    time   = int(row[0])
                    _value = round(row[1], 6)
                    lat    = round(row[2], 6)
                    lon    = round(row[3], 6)

                    if len(strValues) > 0: strValues += ','

                    values = f"(default,{atmvarId}, {domId}, '{time}', {_value}, {count}, '{lat}', '{lon}')"
                    strValues += values

                    count += 1
        
        if len(strValues) > 0:
            myquery = f"insert into forecast values {strValues}"
            self.__cursor.execute(myquery)

        self.__conn.commit()
    
    def selectDomainId(self, wfId, gridId):
        attrName  = f'dom_{gridId}'

        relation = f"select id from relation where name='wrf_out'"
        rtuple   = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relation})"
        attr     = f"select id from attribute where name='{attrName}'"

        myquery = f"select value from attribute_value where relation_tuple_id in ({rtuple}) and attribute_id in ({attr})"
        self.__cursor.execute(myquery)
        domId = self.__cursor.fetchone()[0]

        self.__conn.commit()

        return domId
    
    # ################
    # Run
    # ################

    def selectPath(self, wfId, prog):
        relationName = f"{prog}_in"
        relationId = f"select id from relation where name='{relationName}'"
        rtuples    = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relationId})"
        attrIds    = f"select id from attribute where name = '{prog}_out_path'"

        attrValueQuery = f"select value from attribute_value where relation_tuple_id in ({rtuples}) and attribute_id in ({attrIds})"
        self.__cursor.execute(attrValueQuery)
        path = self.__cursor.fetchone()[0]

        self.__conn.commit()

        return path
          
    # ################
    # Scatter
    # ################

    def selectScatterData(self, domId, measNick):
        atmvarId = "select id from atmospheric_variable where nickname='prec'"
        measId   = f"select id from measure_aggregation where nickname='{measNick}'"
        myquery  = f"""
            select value from forecast_aggregation where 
                atmospheric_variable_id in ({atmvarId}) and 
                step > 1 and 
                domain_id={domId} and 
                measure_aggregation_id in ({measId}) order by step
            """
        self.__cursor.execute(myquery)
        resp = self.__cursor.fetchall()

        arr = [v[0] for v in resp]

        self.__conn.commit()

        return arr
    
    # ################
    # User
    # ################
    
    def insertUser(self, userName):
        userTable = '"user"'

        myquery = f"insert into {userTable} values (default, '{userName}')"
        self.__cursor.execute(myquery)

        self.__conn.commit()

    def selectUsersList(self):
        userTable = '"user"'

        myquery = f"select * from {userTable}"
        self.__cursor.execute(myquery)
        users = self.__cursor.fetchall()

        self.__conn.commit()

        return users
    
    def selectUserProjects(self, userId):
        myquery = f"select id,title from project where owner_id={userId}"
        self.__cursor.execute(myquery)

        projs = self.__cursor.fetchall()

        self.__conn.commit()

        return projs
    
    # ################
    # Workflow
    # ################
    
    def deleteWorkflow(self, wfId):
        wfPath = ''
        
        rtuples       = f"select id from relation_tuple where workflow_id={wfId}"

        domainAttrIds = f"select id from attribute where name like 'dom_%'"
        domainIds     = f"select value from attribute_value where relation_tuple_id in ({rtuples}) and attribute_id in ({domainAttrIds})"

        ##############################################################################
        # Ensemble and Members
        
        cmIds  = f"select id from collection_member where domain_id in ({domainIds})"

        myquery = f"delete from member where collection_member_id in ({cmIds})"
        self.__cursor.execute(myquery)

        projId = f"select project_id from workflow where id={wfId}"

        cIds = f"select id from collection where project_id in ({projId})"
        
        ensIds = f"select id from ensemble where collection_id in ({cIds})"

        activeEnsIds = f"select distinct ensemble_id from member where ensemble_id in ({ensIds})"

        myquery = f"delete from ensemble where collection_id in ({cIds}) and id not in ({activeEnsIds})"

        self.__cursor.execute(myquery)

        ##############################################################################
        # Collection

        myquery = f"delete from collection_member where domain_id in ({domainIds})"
        self.__cursor.execute(myquery)

        activeColIds = f"select distinct collection_id from collection_member where collection_id in ({cIds})"

        myquery = f"delete from collection where project_id in ({projId}) and id not in ({activeColIds})"
        self.__cursor.execute(myquery)
        
        ##############################################################################
        # Forecast and Domain

        myquery = f"delete from forecast_aggregation where domain_id in ({domainIds})"
        self.__cursor.execute(myquery)

        myquery = f"delete from forecast_accumulated_precipitation where domain_id in ({domainIds})"
        self.__cursor.execute(myquery)

        myquery = f"delete from forecast where domain_id in ({domainIds})"
        self.__cursor.execute(myquery)

        myquery = f"delete from domain where id in ({domainIds})"
        self.__cursor.execute(myquery)
        
        ##############################################################################
        # Attribute Value - get wfPath
        wfPathId = "select id from attribute where name='wrf_out_path'"

        myquery = f"select value from attribute_value where relation_tuple_id in ({rtuples}) and attribute_id in ({wfPathId})"
        self.__cursor.execute(myquery)
        wfPath = self.__cursor.fetchone()
        
        ##############################################################################
        # Attribute Value and Relation Tuple

        myquery = f"delete from attribute_value where relation_tuple_id in ({rtuples})"
        self.__cursor.execute(myquery)

        myquery = f"delete from relation_tuple where id in ({rtuples})"
        self.__cursor.execute(myquery)

        ##############################################################################
        # Activity Execution, Activity and Workflow Execution

        wfExecution = f"select id from workflow_execution where workflow_id={wfId}"

        myquery = f"delete from activity_execution where workflow_execution_id in ({wfExecution})"
        self.__cursor.execute(myquery)

        myquery = f"delete from activity where workflow_id={wfId}"
        self.__cursor.execute(myquery)

        myquery = f"delete from workflow_execution where id in ({wfExecution})"
        self.__cursor.execute(myquery)

        ##############################################################################
        # Workflow

        myquery = f"delete from workflow where id={wfId}"
        self.__cursor.execute(myquery)

        self.__conn.commit()

        return wfPath

    def insertWorkflow(self, projId, wfName, parentId):
        myquery = f"insert into workflow values (default, '{wfName}', {projId}, 0)"

        self.__cursor.execute(myquery)

        myquery  = "select * from workflow order by id desc limit 1"
        self.__cursor.execute(myquery)
        wf = self.__cursor.fetchone()

        if parentId == None:
            parentId = wf[0]

        myquery = f"update workflow set parent_id={parentId} where id={wf[0]}"
        
        self.__cursor.execute(myquery)
        
        self.__conn.commit()

        return wf
    
    def selectProjectWorkflows(self, projId):
        myquery = f"select * from workflow where project_id={projId} order by id"
        self.__cursor.execute(myquery)
        workflows = self.__cursor.fetchall()

        self.__conn.commit()

        return workflows

    def selectWorkflowValues(self, wfId):
        relationId = "select id from relation where name in ('ungrib_in', 'real_in')"
        attrId     = f"select id from attribute where relation_id in ({relationId}) and name not like '%_out_path'"
        rtupleId   = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relationId})"

        myquery = f"select attribute_id, value from attribute_value where relation_tuple_id in ({rtupleId}) and attribute_id in ({attrId}) order by attribute_id"

        self.__cursor.execute(myquery)
        attrValues = self.__cursor.fetchall()

        myquery = f"select id, name from attribute where relation_id in ({relationId}) and name not like '%_out_path' order by id"
        self.__cursor.execute(myquery)
        attrNames = self.__cursor.fetchall()

        obj = {}

        for attrn in attrNames:
            idn  = attrn[0]
            name = attrn[1]

            for attrv in attrValues:
                idv   = attrv[0]
                value = attrv[1]
                
                if idv == idn:
                    obj[name] = value
                    attrValues.remove(attrv)

        relationId = "select id from relation where name='wrf_out'"
        rtupleId   = f"select id from relation_tuple where relation_id in ({relationId}) and workflow_id={wfId}"
        attrIds    = "select id from attribute where name like 'dom_%'"
        domIds     = f"select value from attribute_value where relation_tuple_id in ({rtupleId}) and attribute_id in ({attrIds})"
        cIdsQ      = f"select collection_id from collection_member where domain_id in ({domIds})"

        self.__cursor.execute(cIdsQ)
        cIds = self.__cursor.fetchall()
        cIds = [c[0] for c in cIds]

        obj['collections'] = cIds

        nDomsQuery = f"select count(*) as nDoms from attribute_value where relation_tuple_id in ({rtupleId}) and attribute_id in ({attrIds})"
        self.__cursor.execute(nDomsQuery)
        nDoms = self.__cursor.fetchone()[0]

        obj['nDoms'] = nDoms

        return obj
    
    # ################
    # Workflow Execution
    # ################

    def deleteOutput(self, wfId):
        relation = "select id from relation where name='wrf_out'"
        rtuple   = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relation})"
        domains  = f"select value from attribute_value where relation_tuple_id in ({rtuple})"

        myquery = f"delete from forecast_aggregation where domain_id in ({domains})"
        self.__cursor.execute(myquery)

        myquery = f"delete from forecast_accumulated_precipitation where domain_id in ({domains})"
        self.__cursor.execute(myquery)

        myquery = f"delete from forecast where domain_id in ({domains})"
        self.__cursor.execute(myquery)

        myquery = f"delete from domain where id in ({domains})"
        self.__cursor.execute(myquery)

        myquery = f"delete from attribute_value where relation_tuple_id in ({rtuple})"
        self.__cursor.execute(myquery)

        self.__conn.commit()
    
    def existsWorkflowExecutionByWf(self, wfId):
        myquery = f"select exists (select * from workflow_execution where workflow_id={wfId})"
        self.__cursor.execute(myquery)
        
        exists = self.__cursor.fetchone()[0]

        self.__conn.commit()

        return exists

    def insertWorkflowExecution(self, wfId):
        start_time  = f"{date.today()}"
        end_time    = f"{date.today()}"

        values = f"(default, {wfId}, '{start_time}', '{end_time}')"
        myquery = f"insert into workflow_execution values {values}"
        self.__cursor.execute(myquery)

        getIdQuery = "select id from workflow_execution order by id desc limit 1"
        self.__cursor.execute(getIdQuery)
        wf_exec_id = self.__cursor.fetchone()[0]

        self.__conn.commit()

        return wf_exec_id
    
    def updateWorkflowExecution(self, wfExecId, start_time, end_time):
        myquery = f"update workflow_execution set start_time='{start_time}', end_time='{end_time}' where id={wfExecId}"
        self.__cursor.execute(myquery)

        self.__conn.commit()
    
    # ################
    # Workflow Setup
    # ################
        
    def cancelWorkflowSetup(self, wfId):
        rtuples = f"select id from relation_tuple where workflow_id={wfId}"
        myquery = f"delete from attribute_value where relation_tuple_id in ({rtuples})"
        self.__cursor.execute(myquery)

        myquery = f"delete from relation_tuple where workflow_id={wfId}"
        self.__cursor.execute(myquery)

        myquery = f"delete from workflow where id={wfId}"
        self.__cursor.execute(myquery)

        self.__conn.commit()

    def cloneParentAttributes(self, wfId, parentId):

        relations  = ['geogrid_in', 'ungrib_in', 'metgrid_in', 'real_in', 'conf']
        relationIds = f"select id from relation where name in {tuple(relations)}"
        
        # Clone relation tuples
        parentRtupleIds = f"select id from relation_tuple where workflow_id={parentId} and relation_id in ({relationIds})"

        tempTable       = "create temp table rtuple (relation_id bigint not null, workflow_id bigint not null) on commit preserve rows"
        self.__cursor.execute(tempTable)

        fillInTempTable = f"insert into tmp.rtuple (select relation_id, workflow_id from relation_tuple where id in ({parentRtupleIds}))"
        self.__cursor.execute(fillInTempTable)
        
        updateTempTable = f"update tmp.rtuple set workflow_id={wfId} where workflow_id={parentId}"
        self.__cursor.execute(updateTempTable)

        addChildRtuples = f"insert into relation_tuple (relation_id, workflow_id) (select relation_id, workflow_id from tmp.rtuple)"
        self.__cursor.execute(addChildRtuples)

        delTempTable = "drop table tmp.rtuple"
        self.__cursor.execute(delTempTable)

        self.__conn.commit()

        # Clone attribute values
        # attrId           = f"select id from attribute where relation_id in ({relationIds}) and name not like '%out_path'"
        attrId           = f"select id from attribute where relation_id in ({relationIds})"
        parentAttrValues = f"select attribute_id, relation_tuple_id, value from attribute_value where relation_tuple_id in ({parentRtupleIds}) and attribute_id in ({attrId})"

        tempTable2 = "create temp table attrvalues (attribute_id bigint not null, relation_tuple_id bigint not null, value varchar(100) not null) on commit preserve rows"
        self.__cursor.execute(tempTable2)

        fillInTempTable2 = f"insert into tmp.attrvalues ({parentAttrValues})"
        self.__cursor.execute(fillInTempTable2)

        for rName in relations:
            rId          = f"select id from relation where name='{rName}'"
            childRtuple  = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({rId})"
            self.__cursor.execute(childRtuple)
            childRtupleId = self.__cursor.fetchone()[0]

            parentRtuple = f"select id from relation_tuple where workflow_id={parentId} and relation_id in ({rId})"

            updateTempTable = f"update tmp.attrvalues set relation_tuple_id={childRtupleId} where relation_tuple_id in ({parentRtuple})"
            self.__cursor.execute(updateTempTable)

        addChildAttrValues = f"insert into attribute_value (attribute_id, relation_tuple_id, value) (select * from tmp.attrvalues)"
        self.__cursor.execute(addChildAttrValues)

        delTempTable2 = "drop table tmp.attrvalues"
        self.__cursor.execute(delTempTable2)

        self.__conn.commit()

    def countAttrDoms(self, wfId):
        relation = "select id from relation where name='geogrid_in'"
        rtuple   = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relation})"
        attrId   = f"select id from attribute where name like 'grid_id%'"
        
        countQuery = f"select count(*) from attribute_value where relation_tuple_id in ({rtuple}) and attribute_id in ({attrId})"
        self.__cursor.execute(countQuery)
        nDoms = self.__cursor.fetchone()[0]
        
        self.__conn.commit()
        
        return nDoms
    
    def defineDagToRestart(self, wfId):
        def printGeogridMsg():
            if runGeogrid:
                msg   = f"[{self.__className} - defineDagToRestart] new domains"
            else:
                msg = f"[{self.__className} - defineDagToRestart] same domains"

            print(colored(msg, 'yellow'))

        def printUngribMsg():
            if runUngrib:
                msg   = f"[{self.__className} - defineDagToRestart] ungrib will run"
                color = 'yellow'
            else:
                msg = f"[{self.__className} - defineDagToRestart] same dates"
                color = 'blue'

            print(colored(msg, color))
        
        parentIdQuery = f"select parent_id from workflow where id={wfId}"
        self.__cursor.execute(parentIdQuery)
        parentId = self.__cursor.fetchone()[0]

        runGeogrid = True
        runUngrib = True
        
        if wfId != parentId:
       
            relationIds    = f"select id from relation where name='geogrid_in'"
            attrIds        = f"select id from attribute where relation_id in ({relationIds}) and name not like '%out_path'"
            rtupleIds      = f"select id from relation_tuple where workflow_id in {(parentId, wfId)} and relation_id in ({relationIds})"
            attrValues     = f"select attribute_id, value from attribute_value where relation_tuple_id in ({rtupleIds}) and attribute_id in ({attrIds})"
            attrCount      = f"select attribute_id, count (distinct value) as distinctValues, count (attribute_id) as distinctDomains from ({attrValues}) attrValues group by attribute_id"
            attrIdsChanged = f"select attribute_id from ({attrCount}) getAttrs where distinctValues > 1 or distinctDomains < 2"

            runGeogridQuery = f"select exists ({attrIdsChanged}) rg"
            self.__cursor.execute(runGeogridQuery)
            runGeogrid = self.__cursor.fetchone()[0]

            printGeogridMsg()

            relationId      = f"select id from relation where name='ungrib_in'"
            ungribOutPathId = f"select id from attribute where name='ungrib_out_path'"
            rTuples         = f"select id from relation_tuple where workflow_id in {(parentId, wfId)} and relation_id in ({relationId})"
            attrValuesQuery = f"select count (distinct value) as distinctValues from attribute_value where relation_tuple_id in ({rTuples}) and attribute_id in ({ungribOutPathId}) group by attribute_id"
            # attrValuesQuery = f"select attribute_id, count (distinct value) as distinctValues from attribute_value where relation_tuple_id in ({rTuples}) and attribute_id in ({ungribOutPathId}) group by attribute_id"

            self.__cursor.execute(attrValuesQuery)
            nDistictPaths = self.__cursor.fetchone()[0]
            runUngrib =  nDistictPaths > 1

            printUngribMsg()
            
        return runGeogrid, runUngrib
    
    def deleteDomain(self, wfId, domId):
        relationsIds = "select id from relation where name in ('geogrid_in', 'conf')"
        rtuplesIds   = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relationsIds})"
        
        attrsIds = f"select id from attribute where name like '%_{domId}'"
        
        if domId == 1:
            attrsIds += " or name in ('coarse_res', 'ref_x', 'ref_y')"

        myquery = f"delete from attribute_value where relation_tuple_id in ({rtuplesIds}) and attribute_id in ({attrsIds})"
                
        self.__cursor.execute(myquery)

        self.__conn.commit()
    
    def insertAttrPaths(self, wfId, obj):

        attrNames = ''

        for k in obj.keys():
            attrNames += f"'{k}',"

        attrNames = attrNames[:-1]

        relationsIds = "select relation_id from attribute where name like '%_out_path'"
        queryRtuples   = f"select * from relation_tuple where workflow_id={wfId} and relation_id in ({relationsIds}) order by relation_id"

        self.__cursor.execute(queryRtuples)
        rtuples = self.__cursor.fetchall()

        # queryAttrs = "select * from attribute where name like '%_out_path' order by relation_id"
        queryAttrs = f"select * from attribute where name in ({attrNames}) order by relation_id"
        
        self.__cursor.execute(queryAttrs)
        attrs = self.__cursor.fetchall()

        insertValues = ''

        count = 1
        total = len(attrs)

        for rt in rtuples:
            rtId = rt[0]
            rId  = rt[1]

            for attr in attrs:
                if attr[3] == rId:
                    attrId   = attr[0]
                    attrName = attr[1]

                    v = f"(default, {attrId}, {rtId}, '{obj[attrName]}')"
                    
                    if count < total: v += ','
                    insertValues += v

                    count += 1

        if insertValues:
            insertQuery = f"insert into attribute_value values {insertValues}"
            self.__cursor.execute(insertQuery)

        self.__conn.commit()
    
    def insertAttrsSetup(self, wfId, data):
        insertValues = ''

        count = 1

        myquery = f"select id from relation"
        self.__cursor.execute(myquery)

        relationsArr = self.__cursor.fetchall()

        for r in relationsArr:
            rId = r[0]
            myquery = f"select exists (select id from relation_tuple where workflow_id={wfId} and relation_id={rId})"
            self.__cursor.execute(myquery)
            rtupleExists = self.__cursor.fetchone()[0]

            if not rtupleExists:
                myquery = f"insert into relation_tuple values (default, {rId}, {wfId})"
                self.__cursor.execute(myquery)

        for attrName, attrValue in data.items():          
            myquery = f"select id, relation_id from attribute where name='{attrName}'"
            self.__cursor.execute(myquery)
            attr = self.__cursor.fetchone()

            if not attr:
                pass

            else:
                attrId  = attr[0]
                attrRid = attr[1]

                myquery = f"select id from relation_tuple where workflow_id={wfId} and relation_id={attrRid}"
                self.__cursor.execute(myquery)
                rtId  = self.__cursor.fetchone()[0]

                v = f"(default, {attrId}, {rtId}, '{attrValue}')"
                if count < len(data): v += ','
            
                insertValues += v
                
            count += 1

        if len(insertValues) > 0:
            myquery = f"insert into attribute_value values {insertValues}"
            self.__cursor.execute(myquery)

        self.__conn.commit()
    
    def insertDomainSetup(self, wfId, relationsObj):
        for relation, attrObj in relationsObj.items():
            myquery = f"select id from relation where name='{relation}'"

            self.__cursor.execute(myquery)
            rId = self.__cursor.fetchone()[0]

            myquery = f"select id from relation_tuple where workflow_id={wfId} and relation_id={rId}"
            self.__cursor.execute(myquery)
            rtuple = self.__cursor.fetchone()
             
            if not rtuple:
                myquery = f"insert into relation_tuple values (default, {rId}, {wfId})"

                self.__cursor.execute(myquery)

                myquery  = "select * from relation_tuple order by id desc limit 1"
                self.__cursor.execute(myquery)
                rtuple = self.__cursor.fetchone()

            rtId = rtuple[0]
            
            for attrName, attrValue in attrObj.items():

                myquery = f"select id from attribute where name='{attrName}'"
                self.__cursor.execute(myquery)
                attrId = self.__cursor.fetchone()[0]

                myquery = f"insert into attribute_value values (default,{attrId},{rtId},'{attrValue}')"
                self.__cursor.execute(myquery)

            self.__conn.commit()
    
    def selectChildParams(self, wfId):

        obj = {}

        obj['coarse_res'] = ''
        obj['ref_x']      = ''
        obj['ref_y']      = ''

        obj['domains']    = []
        obj['physics']    = {}
        obj['dates']      = {'start_date': '', 'end_date': ''}
        obj['icbc']       = ''

        nDoms = self.countAttrDoms(wfId)

        # Domains
        relationId  = f"select id from relation where name in ('geogrid_in', 'conf')"
        attrsIds    = f"select id from attribute where relation_id in ({relationId}) and name not like '%_out_path'"
        rtupleIds   = f"select id from relation_tuple where workflow_id ={wfId} and relation_id in ({relationId})"
        
        attrsValuesQuery = f"select attribute_id, value from attribute_value where relation_tuple_id in ({rtupleIds}) and attribute_id in ({attrsIds})"
        self.__cursor.execute(attrsValuesQuery)
        attrValues = self.__cursor.fetchall()

        attrsQuery = f"select id, name from attribute where relation_id in ({relationId}) and name not like '%_out_path'"
        self.__cursor.execute(attrsQuery)
        attrNames = self.__cursor.fetchall()

        if attrValues:
            [coarseResId]  = [attTp[0] for attTp in attrNames if attTp[1] == 'coarse_res']
            [coarseResVal] = [attTp[1] for attTp in attrValues if attTp[0] == coarseResId]

            [refXId]  = [attTp[0] for attTp in attrNames if attTp[1] == 'ref_x']
            [refXVal] = [attTp[1] for attTp in attrValues if attTp[0] == refXId]

            [refYId]  = [attTp[0] for attTp in attrNames if attTp[1] == 'ref_y']
            [refYVal] = [attTp[1] for attTp in attrValues if attTp[0] == refYId]

            obj['coarse_res'] = coarseResVal
            obj['ref_x']      = refXVal
            obj['ref_y']      = refYVal

            for id in range(1, nDoms + 1):
                if id == 1:
                    
                    resVal = coarseResVal
                
                else:

                    [resId]  = [attTpN[0] for attTpN in attrNames  if attTpN[1] == f'res_{id}']
                    [resVal] = [attTpV[1] for attTpV in attrValues if attTpV[0] == resId]


                [pId]  = [attTp[0] for attTp in attrNames if attTp[1] == f'parent_id_{id}']
                [pVal] = [attTp[1] for attTp in attrValues if attTp[0] == pId]

                [gId]  = [attTp[0] for attTp in attrNames if attTp[1] == f'grid_id_{id}']
                [gVal] = [attTp[1] for attTp in attrValues if attTp[0] == gId]

                [refLonId]  = [attTp[0] for attTp in attrNames  if attTp[1] == f'ref_lon_{id}']
                [refLonVal] = [attTp[1] for attTp in attrValues if attTp[0] == refLonId]

                [refLatId]  = [attTp[0] for attTp in attrNames  if attTp[1] == f'ref_lat_{id}']
                [refLatVal] = [attTp[1] for attTp in attrValues if attTp[0] == refLatId]

                [nwLonId]  = [attTp[0] for attTp in attrNames  if attTp[1] == f'nw_lon_{id}']
                [nwLonVal] = [attTp[1] for attTp in attrValues if attTp[0] == nwLonId]

                [nwLatId]  = [attTp[0] for attTp in attrNames  if attTp[1] == f'nw_lat_{id}']
                [nwLatVal] = [attTp[1] for attTp in attrValues if attTp[0] == nwLatId]

                [seLonId]  = [attTp[0] for attTp in attrNames  if attTp[1] == f'se_lon_{id}']
                [seLonVal] = [attTp[1] for attTp in attrValues if attTp[0] == seLonId]

                [seLatId]  = [attTp[0] for attTp in attrNames  if attTp[1] == f'se_lat_{id}']
                [seLatVal] = [attTp[1] for attTp in attrValues if attTp[0] == seLatId]

                [eweId]  = [attTp[0] for attTp in attrNames  if attTp[1] == f'e_we_{id}']
                [eweVal] = [attTp[1] for attTp in attrValues if attTp[0] == eweId]

                [esnId]  = [attTp[0] for attTp in attrNames  if attTp[1] == f'e_sn_{id}']
                [esnVal] = [attTp[1] for attTp in attrValues if attTp[0] == esnId]

                [ipId]  = [attTp[0] for attTp in attrNames  if attTp[1] == f'i_parent_{id}']
                [ipVal] = [attTp[1] for attTp in attrValues if attTp[0] == ipId]

                [jpId]  = [attTp[0] for attTp in attrNames  if attTp[1] == f'j_parent_{id}']
                [jpVal] = [attTp[1] for attTp in attrValues if attTp[0] == jpId]


                domain = {
                    'res'      : resVal ,
                    'parent_id': pVal,
                    
                    'id'       : gVal,
                    'ref_lon'  : refLonVal,
                    'ref_lat'  : refLatVal,

                    'nw_lon'   : nwLonVal,
                    'nw_lat'   : nwLatVal,

                    'se_lon'   : seLonVal,
                    'se_lat'   : seLatVal,

                    'e_we'     : eweVal,
                    'e_sn'     : esnVal,

                    'i_parent' : ipVal,
                    'j_parent' : jpVal,
                }

                obj['domains'].append(domain)


        # Dates and Physics
        relationId = f"select id from relation where name in ('ungrib_in', 'real_in')"
        attrIds    = f"select id from attribute where relation_id in ({relationId}) and name not like '%_out_path' and name not like 'run_hours'"

        rtupleId = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relationId})"
        myquery = f"select attribute_id, value from attribute_value where relation_tuple_id in ({rtupleId}) and attribute_id in ({attrIds}) order by attribute_id"
        self.__cursor.execute(myquery)
        attrValues = self.__cursor.fetchall()

        attrsQuery = f"select id, name from attribute where relation_id in ({relationId}) and name not like '%_out_path' and name not like 'run_hours'"
        self.__cursor.execute(attrsQuery)
        attrNames = self.__cursor.fetchall()

        for attTp in attrValues:
            attId = attTp[0]
            attV  = attTp[1]

            [attName] = [tp[1] for tp in attrNames if tp[0] == attId]

            if 'date' in attName:
                obj['dates'][attName] = attV

            elif 'icbc' in attName:
                obj['icbc'] = attV

            else:
                obj['physics'][attName] = attV

        return obj
    
    def selectDomainsSetup(self, wfId):
        obj = {}

        relationId = f"select id from relation where name in ('geogrid_in', 'conf')"
        attrIds    = f"select id from attribute where relation_id in ({relationId}) and name not like '%_out_path'"

        myquery = "select * from relation where name in ('geogrid_in', 'conf')"
        self.__cursor.execute(myquery)
        relationsArr = self.__cursor.fetchall()

        for r in relationsArr:
            rId   = r[0]
            rName = r[1]
            
            myquery = f"select id from relation_tuple where workflow_id={wfId} and relation_id={rId}"
            self.__cursor.execute(myquery)
            
            rtuple = self.__cursor.fetchone()
            
            if rtuple:
                rtId = rtuple[0]

                myquery = f"select * from attribute_value where relation_tuple_id={rtId} and attribute_id in ({attrIds})"
                self.__cursor.execute(myquery)

                attrValueTable = self.__cursor.fetchall()

                if attrValueTable:
                    obj[rName] = []

                    for attrValueTuple in attrValueTable:
                        attrId    = attrValueTuple[1]
                        attrValue = attrValueTuple[3]

                        myquery = f"select name from attribute where id={attrId}"
                        self.__cursor.execute(myquery)
                        attrName = self.__cursor.fetchone()[0]

                        attr = [attrName, attrValue]

                        obj[rName].append(attr)
        
        self.__conn.commit()

        return obj
    
    def selectFormAttrValues(self, wfId):
        relationId = "select id from relation where name in ('geogrid_in', 'ungrib_in')"
        attrId     = f"select id from attribute where name in ('coarse_res', 'start_date', 'end_date')"
        rtupleId   = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relationId})"

        myquery = f"select attribute_id, value from attribute_value where relation_tuple_id in ({rtupleId}) and attribute_id in ({attrId}) order by attribute_id"
        self.__cursor.execute(myquery)
        attrValues = self.__cursor.fetchall()

        myquery = f"select id, name from attribute where name in ('coarse_res', 'start_date', 'end_date') order by id"
        self.__cursor.execute(myquery)
        attrNames = self.__cursor.fetchall()

        obj = {}

        for attrn in attrNames:
            idn  = attrn[0]
            name = attrn[1]

            for attrv in attrValues:
                idv   = attrv[0]
                value = attrv[1]
                
                if idv == idn:
                    obj[name] = value
                    attrValues.remove(attrv)

        return obj
    
    def selectIcbcModel(self, wfId):
        relationId = "select id from relation where name='ungrib_in'"
        attrId     = f"select id from attribute where name='icbc_model'"
        rtupleId   = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relationId})"
        
        myquery    = f"select value from attribute_value where relation_tuple_id in ({rtupleId}) and attribute_id in ({attrId})"
        self.__cursor.execute(myquery)
        attrValues = self.__cursor.fetchone()

        icbc_model = attrValues if not attrValues else attrValues[0]

        obj = {'icbc_model': icbc_model}
        
        return obj
        
    def selectNamelistsAttrs(self, wfId):
        relations = "select id from relation where name in ('geogrid_in', 'ungrib_in', 'metgrid_in', 'real_in')"
        attrs     = f"select id from attribute where relation_id in ({relations}) and name not like '%run_hours' or name like 'grid_id%' "
        
        rtuples     = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relations})" 
        attrValuesQuery = f"select attribute_id, value from attribute_value where relation_tuple_id in ({rtuples}) and attribute_id in ({attrs})"
    
        self.__cursor.execute(attrValuesQuery)
        attrValues = self.__cursor.fetchall()

        attrIds = [attr[0] for attr in attrValues]
        attrsQuery  = f"select id, name from attribute where id in {tuple(attrIds)} order by id"
        self.__cursor.execute(attrsQuery)
        attrs = self.__cursor.fetchall()

        self.__conn.commit()

        return attrs, attrValues
    
    def selectRestartData(self, wfId):
        names   = "('start_date', 'end_date', 'run_hours', 'wrf_out_path', 'icbc_model')"
        attrIds = f"select id from attribute where name in {names}"
        rtuples = f"select id from relation_tuple where workflow_id={wfId}"

        myquery = f"select attribute_id, value from attribute_value where relation_tuple_id in ({rtuples}) and attribute_id in ({attrIds})"
        self.__cursor.execute(myquery)
        data = self.__cursor.fetchall()

        attrIds = tuple([d[0] for d in data])

        myquery = f"select id, name from attribute where id in {attrIds}"
        self.__cursor.execute(myquery)
        attrIds = self.__cursor.fetchall()

        # relation  = "select id from relation where name='wrf_in'"
        # rtuple    = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relation})"
        
        # attribute = "select id from attribute where name='wrf_out_path'"

        # myquery = f"select value from attribute_value where relation_tuple_id in ({rtuple} and attribute_id in ({attribute}))"
        # self.__cursor.execute(myquery)
        # wf_path = self.__cursor.fetchone()[0]

        self.__conn.commit()

        return attrIds, data
    
    def updateAttrsSetup(self, wfId, parentId, data):
        def printGeogridMsg():
            if runGeogrid:
                msg   = f"[{self.__className} - updateAttrsSetup] new domains"

            else:
                msg = f"[{self.__className} - updateAttrsSetup] same domains"

            print(colored(msg, 'yellow'))

        # create rtuple for 'wrf_in':
        relId = f"select id from relation where name='wrf_in'"
        self.__cursor.execute(relId)
        rId = self.__cursor.fetchone()[0]

        myquery = f"insert into relation_tuple values (default, {rId}, {wfId})"
        self.__cursor.execute(myquery)
        
        # updates:
        relationIds    = f"select id from relation where name='geogrid_in'"
        attrIds        = f"select id from attribute where relation_id in ({relationIds}) and name not like '%out_path'"
        rtupleIds      = f"select id from relation_tuple where workflow_id in {(parentId, wfId)} and relation_id in ({relationIds})"
        attrValues     = f"select attribute_id, value from attribute_value where relation_tuple_id in ({rtupleIds}) and attribute_id in ({attrIds})"
        attrCount      = f"select attribute_id, count (distinct value) as distinctValues, count (attribute_id) as distinctDomains from ({attrValues}) attrValues group by attribute_id"
        attrIdsChanged = f"select attribute_id from ({attrCount}) getAttrs where distinctValues > 1 or distinctDomains < 2"

        runGeogridQuery = f"select exists ({attrIdsChanged}) rg"
        self.__cursor.execute(runGeogridQuery)
        runGeogrid = self.__cursor.fetchone()[0]

        printGeogridMsg()        
        #########################################################################################################

        relationsIds = f"select id from relation where name in ('ungrib_in', 'real_in')"
        attrIds      = f"select id from attribute where relation_id in ({relationsIds}) and name not like '%_out_path'"
        rTuples      = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relationsIds})"

        attrValuesQuery = f"select attribute_id, value from attribute_value where relation_tuple_id in ({rTuples}) and attribute_id in ({attrIds}) order by attribute_id"
        self.__cursor.execute(attrValuesQuery)
        attrValues = self.__cursor.fetchall()

        attrsQuery = f"select id, name from attribute where relation_id in ({relationsIds}) and name not like '%_out_path' order by id"
        self.__cursor.execute(attrsQuery)
        attrs = self.__cursor.fetchall()

        runUngrib = False

        for att in attrs:
            attrId    = att[0]
            attrName  = att[1]
            [attrValue] = [attv[1] for attv in attrValues if attv[0] == attrId]

            if attrName == 'run_hours':
                attrValue = int(attrValue)

            if attrName == 'icbc_model':
                attrValue = attrValue
            
            if attrValue != data[attrName]:
                if not runUngrib:
                    runUngrib = 'date' in attrName or 'run_hours' in attrName or 'icbc_model' in attrName
                
                myquery = f"update attribute_value set value='{data[attrName]}' where relation_tuple_id in ({rTuples}) and attribute_id={attrId}"
                self.__cursor.execute(myquery)

                msg   = f"[{self.__className} - updateAttrsSetup] new {attrName}"
                print(colored(msg, 'yellow'))

        #########################################################################################################
        
        self.__conn.commit()

        return runGeogrid, runUngrib
    
    def updatePath(self, wfId, prog, path):
        relationName = f"{prog}_in"
        relationId  = f"select id from relation where name='{relationName}'"
        rtuples     = f"select id from relation_tuple where workflow_id={wfId} and relation_id in ({relationId})"
        attrIds     = f"select id from attribute where name = '{prog}_out_path'"

        attrValueQuery = f"update attribute_value set value = '{path}' where relation_tuple_id in ({rtuples}) and attribute_id in ({attrIds})"
        self.__cursor.execute(attrValueQuery)

        self.__conn.commit()
    
    def updateWorkflowName(self, wfName, wfId):
        myquery = f"update workflow set name='{wfName}' where id={wfId}"
        self.__cursor.execute(myquery)

        self.__conn.commit()
    