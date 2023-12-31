from termcolor  import colored
from statistics import mean
import numpy as np

from bin.consts import nicks

class Ensemble(object):
    def __init__(self, interm) -> None:
        self.__interm = interm

        self.__id      = None

        self.__tuplesWfIds = []
        self.__domIds  = []
        self.__domain  = []
        self.__gridPts = []
        self.__nTimes  = 0
        self.__steps   = []
        self.__wfIds   = []

    def __setInfo(self):
        self.__domIds, self.__wfIds, self.__domain, self.__nTimes, gridPtsTps = self.__interm.setEnsembleMainInfo(self.__id)

        self.__steps = [1, 3, 24, self.__nTimes-1]
        
        for g in gridPtsTps:
            obj = {}
            obj['pt'] = int(g[0])
            obj['lat'] = round(float(g[1]), 6)
            obj['lon'] = round(float(g[2]), 6)

            self.__gridPts.append(obj)

    def getDomain(self):
        return self.__domain

    def getGridPts(self):
        return self.__gridPts

    def getId(self):
        return self.__id

    def getNTimes(self):
        return self.__nTimes

    def getWorkflowsIds(self):
        return self.__tuplesWfIds

    def setId(self, ensId):
        self.__id      = ensId

        self.__tuplesWfIds = []
        self.__domIds  = []
        self.__domain  = []
        self.__gridPts = []
        self.__nTimes  = 0
        self.__steps   = []
        self.__wfIds   = []

        if (ensId): self.__setInfo()

    def setWfIds(self, tuplesWfIds):
        self.__tuplesWfIds = tuplesWfIds

    def computeHmat(self, meas, atmvar, activeGridPt):
        def objPrec(i, dId, _wfId, _wfInt):
            
            objArr = []

            table = self.__interm.selectForecastAgg(dId, meas, [nick])

            for time in range(1, self.__nTimes):
                
                data = [tp for tp in table[atmvar] if tp[0] == time]
                arr  = []

                for j in range(nSteps):
                    stp = steps[j]

                    if time % stp == 0:
                        filtered = [tp[1] for tp in data if tp[2] == stp]
                        value = filtered[0]

                    else:
                        t = time + 1
                        
                        while t % stp != 0:
                            t += 1

                        filtered = [tp[1] for tp in table[atmvar] if tp[0] == t and tp[2] == stp]

                        if len(filtered) > 0:
                            value = filtered[0]
                        
                    arr.append(value)

                obj = {
                    'wfInternalId': _wfInt, 
                    'wfId' : _wfId,
                    'time' : time,
                    'value': arr,
                }

                objArr.append(obj)
                        
            return objArr

        def objPrecPt(i, dId, _wfId, _wfInt):
            objArr = []

            table = self.__interm.selectPrecAccPtHmat(dId, activeGridPt, tuple(steps))
            
            for time in range(1, self.__nTimes):
                arr  = []

                for j in range(nSteps):
                    stp = steps[j]

                    if time % stp == 0:
                        filtered = [tp[2] for tp in table if tp[0] == time and tp[1] == stp]
                        value = filtered[0]

                    else:
                        t = time + 1
                        
                        while t % stp != 0:
                            t += 1
                        
                        filtered = [tp[2] for tp in table if tp[0] == t and tp[1] == stp]
                        value = filtered[0]
                        
                    arr.append(value)

                obj = {
                    'wfInternalId': _wfInt,
                    'wfId' : _wfId,
                    'time' : time,
                    'value': arr,
                }

                objArr.append(obj)
                        
            return objArr

        steps    = [1, 3, 24]
        nSteps   = len(steps)

        nick = f"'{atmvar}'"

        hmat     = []
  
        for i, domId in enumerate(self.__domIds):
            wfId    = self.__wfIds[i]
            [wfInt] = [ tp[1] for tp in self.__tuplesWfIds if tp[0] == wfId]

            if atmvar == 'prec':
                hmat.append({
                    'wfInternalId': wfInt,
                    'wfId' : wfId,
                    'time' : 0,
                    'value': [0, 0, 0],
                    })
                    
                if meas == 'grid_pt':
                    objs = objPrecPt(i, domId, wfId, wfInt)
                else:
                    objs = objPrec(i, domId, wfId, wfInt)

                hmat = [*hmat, *objs]
            
            else:
                if meas == 'grid_pt':
                    table = self.__interm.selectForecastPt(domId, [nick], activeGridPt)

                else:                                       
                    table = self.__interm.selectForecastAgg(domId, meas, [nick], 1)

                for tp in table[atmvar]:
                    time  = tp[0]
                    value = tp[1]

                    obj = {
                        'wfInternalId': wfInt,
                        'wfId' : wfId,
                        'time' : time,
                        'value': [value],
                    }

                    hmat.append(obj)
                
        return hmat

    def computeHmatProb(self, atmvar, limit):
        hmat = []
        
        if atmvar == 'prec':
            infLim  = float(limit[0])
            accTime = int(float(limit[1]))
            maxTime = self.__nTimes - 1
            t0 = 1
            
            for d, dId in enumerate(self.__domIds):
                wfId    = self.__wfIds[d]
                [wfInt] = [ tp[1] for tp in self.__tuplesWfIds if tp[0] == wfId]
                
                hmat01 = [0] * self.__nTimes

                for i in range(maxTime, t0 - 1, -1):
                    k = i - accTime + 1 if i - accTime + 1 >= 1 else 1

                    verdict = self.__interm.selectExistsPrec(dId, infLim, k, i)
                    
                    if verdict:
                        for j in range(i, k - 1, -1):
                            if not hmat01[j]: hmat01[j] = 1

                for t in range(self.__nTimes):
                    hmat.append({
                            'wfInternalId': wfInt,#self.__tuplesWfIds[d][1],
                            'wfId' : wfId,#self.__tuplesWfIds[d][0],
                            'time' : t,
                            'value': [hmat01[t]],
                            })
        
        else:
            hmat = []
            infLim = float(limit)

            for d, dId in enumerate(self.__domIds):
                wfId    = self.__wfIds[d]
                [wfInt] = [ tp[1] for tp in self.__tuplesWfIds if tp[0] == wfId]
                
                resp = self.__interm.selectExists(dId, atmvar, infLim)
                
                for r in resp:
                    value = 1 if r[2] else 0

                    hmat.append({
                            'wfInternalId': wfInt,#self.__tuplesWfIds[d][1],
                            'wfId' : wfId,#self.__tuplesWfIds[d][0],
                            'time' : r[0],
                            'value': [value],
                            })
        return hmat
    
    def computeHmap(self, meas, atmvar, ti, tf, isMember):
        def buildDomainsList():
            dList = '('
            
            for i, dId in enumerate(self.__domIds):
                dList+= str(dId)
                if i <  nMembers - 1: dList+= ','
            dList +=')'

            return dList

        nMembers = len(self.__domIds)

        hmap = []

        if isMember:
            domIdx = self.__wfIds.index(meas)
            domId = self.__domIds[domIdx]

            if atmvar == nicks[0]:
                step = tf - ti + 1

                stored = atmvar == nicks[0] and step in self.__steps and tf % step == 0
                stored = stored or tf == step

                if stored:

                    tuples = self.__interm.selectPrecAcc(domId, tf, step)
                    data = [tp[5] for tp in tuples]

                else:
                    data = self.__interm.selectForecastMap(domId, atmvar, ti, tf)
                    data = [tp[0] for tp in data]

            else:
                data = self.__interm.selectForecastMap(domId, atmvar, ti, tf)
                data = [tp[0] for tp in data]

        else:
        
            if atmvar == nicks[0]:
                step = tf - ti + 1

                agg = mean if meas == 'avg' else max

                storedValue = step in self.__steps and tf % step == 0  
                membersMap = []

                for _, dId in enumerate(self.__domIds):

                    if storedValue:
                        tuples = self.__interm.selectPrecAcc(dId, tf, step)
                        data = [tp[5] for tp in tuples]

                    else:
                        data = self.__interm.selectForecastMap(dId, atmvar, ti, tf)
                        data = [tp[0] for tp in data]

                    membersMap.append(data)

                membersMap = np.array(membersMap).T

                data = [agg(row) for row in membersMap]

            else:
                domainsList = buildDomainsList()
                data = self.__interm.selectEnsembleMap(domainsList, meas, atmvar, ti, tf)
                data = [d[0] for d in data]
            
        hmap = [self.__domain, data, self.__gridPts]

        return hmap

    def computeHmapProb(self, atmvar, limit, ti, tf, isMember):
        def buildDomainsList():
            dList = '('
            
            for i, dId in enumerate(self.__domIds):
                dList+= str(dId)
                if i <  nMembers - 1: dList+= ','
            dList +=')'

            return dList

        nMembers = len(self.__domIds)
        
        domainsList = buildDomainsList()

        if atmvar == 'prec':
            infLim  = limit[0]
            accTime = int(float(limit[1]))

            for i in range(tf, ti - 1, -1):
                k = i - accTime + 1 if i - accTime + 1 >= 1 else 1

                resp = self.__interm.selectExistsPrecMap(domainsList, infLim, k, i)

                if i == tf:
                    arr = [list(r) for r in resp]
                else:
                
                    for a, b in zip(arr, resp):
                        if a[2] == False and b[2] == True: a[2] = True

            arr.sort(key=lambda k: (k[0], k[1]))

            data = []
            
            for i in range(0, len(arr), nMembers):
                count = 0

                for j in range(nMembers):
                    if arr[i+j][2] == True:
                        count += 1

                value = count/nMembers
                data.append(value)

        else:
            infLim = limit
            resp = self.__interm.selectExistsMap(domainsList, atmvar, infLim, ti, tf)

            data = [int(r[0]) / nMembers for r in resp]

        hmap = [self.__domain, data, self.__gridPts]

        return hmap
