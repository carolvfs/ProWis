from termcolor import colored

from bin.consts import nicks

class Workflow(object):
    def __init__(self, interm) -> None:
        self.__className = 'Workflow'
        self.__interm  = interm
        self.__id      = None

        self.__domains = []
        self.__gridPts = []
        self.__nDoms   = None

        self.__runHours = None
        self.__lastTime = None

        self.__steps = []

    def computeHmap(self, domIdx, atmvar, ti, tf):
        msg = f"\n[{self.__className} - computeHmap] ti: {ti}, tf: {tf}, dom: {domIdx+1}, atmvar: {atmvar}\n"
        print(colored(msg, 'green'))
        
        hmap = []

        domId = self.__domains[domIdx][0]

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

        activeDomain = list(self.__domains[domIdx])
        gridInfo = activeDomain[1:].copy()

        hmap = [gridInfo, data, self.__gridPts[domIdx]]
            
        
        return hmap
   
    def computeSunburst(self, domIdx, meas, tl=None, br=None, gridPt=None):
        def buildObj(_value, _time, _t, _step, _children=[]):
            _obj = {}

            _obj['name'] = f'{_step}h-{_t}'
            _obj['t']    = [_time - _step, _time]
            _obj['v']  = _value

            if _step > 1:
                _obj['children'] = _children
            else:
                _obj['size'] =  2
            
            return _obj

        msg = f"\n[{self.__className} - computeSunburst] dom: {domIdx+1}, meas: {meas}\n"
        print(colored(msg, 'green'))
        
        atmvar   = f"'{nicks[0]}'"
        nSteps   = len(self.__steps)
        
        domId    = self.__domains[domIdx][0]
        total    = [0 for _ in range(nSteps)]
        table    = []
        children = [[] for _ in range(nSteps)]

        if meas == 'grid_pt':
            table = self.__interm.selectForecastPt(domId, [atmvar], gridPt)

            for time in range(1, self.__runHours + 1):
                value = table[nicks[0]][time][1]
                total[-1] += value

                for j in range(nSteps-1):
                    stp = self.__steps[j]

                    total[j] += value

                    if time % stp == 0:
                        t   = int(time / stp)

                        obj = buildObj(total[j], time, t, stp, children[j])
                        children[j+1].append(obj)

                        total[j]    = 0
                        children[j] = []

            stp   = self.__steps[-1]
            time  = self.__runHours 
            value = total[-1]

        else:
            table = self.__interm.selectForecastAgg(domId, meas, [atmvar])

            for time in range(1, self.__runHours + 1):
                        
                data = [tp for tp in table[nicks[0]] if tp[0] == time]
               
                for j in range(nSteps-1):
                    stp = self.__steps[j]

                    if time % stp == 0:
                        t   = int(time / stp)

                        value = None 

                        filtered = [tp[1] for tp in data if tp[2] == stp]
                        
                        if len(filtered) > 0:
                            value = filtered[0]

                        obj = buildObj(value, time, t, stp, children[j])
                        children[j+1].append(obj)

                        children[j] = []

            stp   = self.__steps[-1]
            time  = self.__runHours 
            value = None 
        
            filtered = [tp[1] for tp in table[nicks[0]] if tp[0] == time and tp[2] == stp]
        
            if len(filtered) > 0:  value = filtered[0]

        obj = {
                'name'    : f'{self.__runHours}h-1',
                't'       : [0, self.__runHours],
                'v'       : value  ,
                'children': children[-1]
        }
            
        sunburst = {}
        sunburst['name']     = 'SunburstData'
        sunburst['t']        = [None, None]
        sunburst['children'] = [obj]

        return sunburst
    
    def computeTseries(self, domIdx, meas, tl=None, br=None, gPt=None):
        msg = f"\n[{self.__className} - computeTseries] dom: {domIdx+1}, meas: {meas}\n"
        print(colored(msg, 'green'))

        tseries = {}
        tseries[nicks[0]] = []

        atmvars = ','.join((f"'{n}'" for n in nicks[1:]))

        domId = self.__domains[domIdx][0]


        if meas == 'grid_pt':
            atmvarsObj = self.__interm.selectForecastPt(domId, [atmvars], gPt)
            precData   = self.__interm.selectPrecAccPt(domId, gPt)
            
        else:

            stp=1
            atmvarsObj = self.__interm.selectForecastAgg(domId, meas, [atmvars], stp)
            precData   = self.__interm.selectForecastAggAcc(domId, meas)
            
        for atmvar, arr in atmvarsObj.items():

            tseries[atmvar] = []

            for tp in arr:

                obj = { 'atmvar': atmvar, 't' : tp[0] , 'v' : tp[1] }
                tseries[atmvar].append(obj)
        
        
        for tp in precData:
            obj = { 'atmvar': nicks[0], 't' : tp[0] , 'v' : tp[1] }
            tseries[nicks[0]].append(obj)

        return tseries

    def getLastTime(self):
        return self.__lastTime
    
    def getNDoms(self):
        return self.__nDoms
    
    def getRunHours(self):
        return self.__runHours
    
    def setId(self, id=None):
        if id != None and id == self.__id and self.__lastTime != None and self.__lastTime < self.__runHours:
            self.__updateLastTime()
        
        else:
            self.__id      = id

            if id:
                self.__gridPts = []
                self.__setMainInfo()
            else:
                self.__domains = []
                self.__gridPts = []
                self.__nDoms   = None

                self.__runHours = None
                self.__lastTime = None

                self.__steps = []

    def __setMainInfo(self):
        self.__runHours, self.__lastTime, self.__domains = self.__interm.selectForecastInfo(self.__id)
        self.__nDoms   = len(self.__domains)

        self.__steps = [1, 3, 24, self.__runHours] if self.__runHours > 24 else [1, 3, 24]

        for d in self.__domains:
            dId = d[0]
            gDom = []
            
            gridPtsTps = self.__interm.selectForecastGridPts(dId)

            for g in gridPtsTps:
                obj = {}
                obj['pt'] = int(g[0])
                obj['lat'] = round(float(g[1]), 6)
                obj['lon'] = round(float(g[2]), 6)

                gDom.append(obj)

            self.__gridPts.append(gDom)
    
    def __updateLastTime(self):
        self.__lastTime = self.__interm.selectLastTime(self.__id)