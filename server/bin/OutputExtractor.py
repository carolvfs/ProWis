import numpy as np
import math

from netCDF4 import Dataset
from termcolor import colored

from wrf import getvar, interplevel, to_np, ALL_TIMES


class Output_Extractor(object):
    def __init__(self) -> None:
        self.__className = 'Output_Extractor'

        self.__ncDs = None
        
        self.__dx = None

        self.__latMatrix = None
        self.__lonMatrix = None

        self.__latList = None  # S --> N
        self.__lonList = None

        self.__nRows = None
        self.__nCols = None
        
        self.__cenLat = None
        self.__cenLon = None

        self.__lonW = None
        self.__lonE = None

        self.__latN = None
        self.__latS = None

        self.__nTimeSteps = None

        self.__startTstepIdx = 0
        self.__endTstepIdx = 0

        self.__accPrec = []  # N --> S

        self.__prec1h = []  # N --> S

        self.__tmp   = []  # N --> S
        self.__kidx  = []  # N --> S
        self.__moist = []  # N --> S
        self.__omg500hPa  = []  # N --> S
        self.__hdiv300hPa = []  # N --> S
        self.__conv850hPa = []  # N --> S

        self.__formattedAccPrec    = []  # N --> S
        self.__formattedPrec1h     = []  # N --> S
        self.__formattedHdiv300hPa = []  # N --> S
        self.__formattedOmg500hPa  = []  # N --> S
        self.__formattedConv850hPa = []  # N --> S
        self.__formattedMoist      = []  # N --> S
        self.__formattedTmp        = []  # N --> S
        self.__formattedKidx       = []  # N --> S

    def buildOutput(self):
        self.__buildAccPrec(interval=1)  # N --> S

        self.__buildPrec(interval=1)     # N --> S
        self.__buildTmp()           # N --> S
        self.__buildKidx()          # N --> S
        self.__buildMoist()         # N --> S
        self.__buildOmega(500)      # N --> S
        self.__buildHdiv(300)       # N --> S
        self.__buildHdiv(850, True) # N --> S

    def buildInitialState(self):
        ok = True

        try:
            self.__dx        = int(self.__ncDs.DX)
            self.__latMatrix = self.__ncDs.variables['XLAT'][:][0]
            self.__lonMatrix = self.__ncDs.variables['XLONG'][:][0]

            self.__latList = [row[0] for row in self.__latMatrix]  # S --> N
            self.__latList.reverse()  # N --> S

            self.__lonList = list(self.__lonMatrix[0])

            self.__nRows = self.__ncDs.dimensions['south_north'].size
            self.__nCols = self.__ncDs.dimensions['west_east'].size

            self.__cenLat = self.__ncDs.CEN_LAT
            self.__cenLon = self.__ncDs.CEN_LON

            self.__lonW = self.__lonList[0]
            self.__lonE = self.__lonList[self.__nCols-1]

            self.__latN = self.__latList[0]
            self.__latS = self.__latList[self.__nRows-1]

            self.__nTimeSteps = self.__ncDs.dimensions['Time'].size

            self.__setMaxTstep()

        except:
            ok = False
            print('Ncfile is not ready.')

        return ok

    def calculateLimitIndices(self, limits):
        limLonW = limits[0]
        limLonE = limits[1]
        limLatN = limits[2]
        limLatS = limits[3]

        startLatIdx = None
        endLatIdx = None

        startLonIdx = None
        endLonIdx = None

        for idx in range(len(self.__latList)):
            if startLatIdx == None:
                if self.__latList[idx] == limLatN:
                    startLatIdx = idx

                elif self.__latList[idx] < limLatN:
                    if idx == 0:
                        startLatIdx = idx

                    else:
                        startLatIdx = idx - 1

            if endLatIdx == None and self.__latList[idx] <= limLatS:
                endLatIdx = idx

                break

        for idx in range(len(self.__lonList)):
            if startLonIdx == None:
                if self.__lonList[idx] == limLonW:
                    startLonIdx = idx
                
                elif self.__lonList[idx] > limLonW:
                    startLonIdx = idx if idx == 0 else idx - 1

            if endLonIdx == None and self.__lonList[idx] >= limLonE:
                endLonIdx = idx
                break

        if startLatIdx == None:
            startLatIdx = 0
        
        if endLatIdx == None:
            endLatIdx = len(self.__latList)-1

        if startLonIdx == None:
            startLonIdx = 0
        
        if endLonIdx == None:
            endLonIdx = len(self.__lonList)-1

        return startLatIdx, endLatIdx, startLonIdx, endLonIdx
    
    def closeNcFile(self):
        self.__ncDs.close()

    def formatOutputNew(self, indices):

        if indices:
            startLatIdx = indices[0]
            endLatIdx = indices[1]
            startLonIdx = indices[2]
            endLonIdx = indices[3]

        else:
            startLatIdx = 0
            endLatIdx = self.__nRows - 1
            startLonIdx = 0
            endLonIdx = self.__nCols - 1

        if len(self.__accPrec):
            print('prec', self.__accPrec.shape)
        if len(self.__tmp):
            print('tmp', self.__tmp.shape)
        if len(self.__kidx):
            print('kidx', self.__kidx.shape)
        if len(self.__moist):
            print('moist', self.__moist.shape)
        if len(self.__omg500hPa):
            print('omg', self.__omg500hPa.shape)
        if len(self.__hdiv300hPa):
            print('hdiv', self.__hdiv300hPa.shape)
        if len(self.__conv850hPa):
            print('conv', self.__conv850hPa.shape)

        try:
            lastTidx = self.__endTstepIdx - self.__startTstepIdx
            for tIdx in range(lastTidx + 1):
                actualTstep = self.__startTstepIdx + tIdx

                tPrec = []
                tTmp = []
                tMoist = []
                tHdiv = []
                tConv = []
                tOmg = []
                tKidx = []

                for row in range(startLatIdx, endLatIdx + 1):
                    for col in range(startLonIdx, endLonIdx + 1):

                        precValue = 0 if math.isnan(
                            self.__accPrec[tIdx][row][col])     else round(self.__accPrec[tIdx][row][col]    , 4)
                        
                        tmpValue = 0 if math.isnan(
                            self.__tmp[tIdx][row][col])        else round(self.__tmp[tIdx][row][col]       , 4)
                        
                        moistValue = 0 if math.isnan(
                            self.__moist[tIdx][row][col])      else round(self.__moist[tIdx][row][col]     , 4)
                        
                        hdiv300hPaValue = 0 if math.isnan(
                            self.__hdiv300hPa[tIdx][row][col]) else round(self.__hdiv300hPa[tIdx][row][col], 4)
                        
                        omg500hPaValue = 0 if math.isnan(
                            self.__omg500hPa[tIdx][row][col])  else round(self.__omg500hPa[tIdx][row][col] , 4)
                        
                        conv850hPaValue = 0 if math.isnan(
                            self.__conv850hPa[tIdx][row][col]) else round(self.__conv850hPa[tIdx][row][col], 4)
                        
                        kidxValue = 0 if math.isnan(
                            self.__kidx[tIdx][row][col])       else round(self.__kidx[tIdx][row][col]      , 4)

                        tPrec.append([actualTstep , precValue      , round(self.__latList[row], 6), round(self.__lonList[col], 6)])
                        tTmp.append([actualTstep  , tmpValue       , round(self.__latList[row], 6), round(self.__lonList[col], 6)])
                        tMoist.append([actualTstep, moistValue     , round(self.__latList[row], 6), round(self.__lonList[col], 6)])
                        tHdiv.append([actualTstep , hdiv300hPaValue, round(self.__latList[row], 6), round(self.__lonList[col], 6)])
                        tOmg.append([actualTstep  , omg500hPaValue , round(self.__latList[row], 6), round(self.__lonList[col], 6)])
                        tConv.append([actualTstep , conv850hPaValue, round(self.__latList[row], 6), round(self.__lonList[col], 6)])
                        tKidx.append([actualTstep , kidxValue      , round(self.__latList[row], 6), round(self.__lonList[col], 6)])

                self.__formattedAccPrec.append(tPrec)
                self.__formattedTmp.append(tTmp)
                self.__formattedMoist.append(tMoist)
                self.__formattedHdiv300hPa.append(tHdiv)
                self.__formattedConv850hPa.append(tConv)
                self.__formattedOmg500hPa.append(tOmg)
                self.__formattedKidx.append(tKidx)

            self.__formattedAccPrec    = np.array(self.__formattedAccPrec)
            self.__formattedTmp        = np.array(self.__formattedTmp)
            self.__formattedMoist      = np.array(self.__formattedMoist)
            self.__formattedHdiv300hPa = np.array(self.__formattedHdiv300hPa)
            self.__formattedConv850hPa = np.array(self.__formattedConv850hPa)
            self.__formattedOmg500hPa  = np.array(self.__formattedOmg500hPa)
            self.__formattedKidx       = np.array(self.__formattedKidx)

        except:
            print(colored('Something went wrong at formatOutput.', 'red'))
    
    def formatOutput(self, indices):

        if indices:
            startLatIdx = indices[0]
            endLatIdx = indices[1]
            startLonIdx = indices[2]
            endLonIdx = indices[3]

        else:
            startLatIdx = 0
            endLatIdx = self.__nRows - 1
            startLonIdx = 0
            endLonIdx = self.__nCols - 1

        if len(self.__prec1h):
            print('prec', self.__prec1h.shape)
        if len(self.__tmp):
            print('tmp', self.__tmp.shape)
        if len(self.__kidx):
            print('kidx', self.__kidx.shape)
        if len(self.__moist):
            print('moist', self.__moist.shape)
        if len(self.__omg500hPa):
            print('omg', self.__omg500hPa.shape)
        if len(self.__hdiv300hPa):
            print('hdiv', self.__hdiv300hPa.shape)
        if len(self.__conv850hPa):
            print('conv', self.__conv850hPa.shape)

        try:
            # for tIdx in range(len(self.__prec1h)):
            lastTidx = self.__endTstepIdx - self.__startTstepIdx
            for tIdx in range(lastTidx + 1):
                actualTstep = self.__startTstepIdx + tIdx

                tPrec = []
                tTmp = []
                tMoist = []
                tHdiv = []
                tConv = []
                tOmg = []
                tKidx = []

                for row in range(startLatIdx, endLatIdx + 1):
                    for col in range(startLonIdx, endLonIdx + 1):

                        precValue = 0 if math.isnan(
                            self.__prec1h[tIdx][row][col])     else round(self.__prec1h[tIdx][row][col]    , 4)
                        
                        tmpValue = 0 if math.isnan(
                            self.__tmp[tIdx][row][col])        else round(self.__tmp[tIdx][row][col]       , 4)
                        
                        moistValue = 0 if math.isnan(
                            self.__moist[tIdx][row][col])      else round(self.__moist[tIdx][row][col]     , 4)
                        
                        hdiv300hPaValue = 0 if math.isnan(
                            self.__hdiv300hPa[tIdx][row][col]) else round(self.__hdiv300hPa[tIdx][row][col], 4)
                        
                        omg500hPaValue = 0 if math.isnan(
                            self.__omg500hPa[tIdx][row][col])  else round(self.__omg500hPa[tIdx][row][col] , 4)
                        
                        conv850hPaValue = 0 if math.isnan(
                            self.__conv850hPa[tIdx][row][col]) else round(self.__conv850hPa[tIdx][row][col], 4)
                        
                        kidxValue = 0 if math.isnan(
                            self.__kidx[tIdx][row][col])       else round(self.__kidx[tIdx][row][col]      , 4)

                        tPrec.append([actualTstep , precValue      , round(self.__latList[row], 6), round(self.__lonList[col], 6)])
                        tTmp.append([actualTstep  , tmpValue       , round(self.__latList[row], 6), round(self.__lonList[col], 6)])
                        tMoist.append([actualTstep, moistValue     , round(self.__latList[row], 6), round(self.__lonList[col], 6)])
                        tHdiv.append([actualTstep , hdiv300hPaValue, round(self.__latList[row], 6), round(self.__lonList[col], 6)])
                        tOmg.append([actualTstep  , omg500hPaValue , round(self.__latList[row], 6), round(self.__lonList[col], 6)])
                        tConv.append([actualTstep , conv850hPaValue, round(self.__latList[row], 6), round(self.__lonList[col], 6)])
                        tKidx.append([actualTstep , kidxValue      , round(self.__latList[row], 6), round(self.__lonList[col], 6)])

                self.__formattedPrec1h.append(tPrec)
                self.__formattedTmp.append(tTmp)
                self.__formattedMoist.append(tMoist)
                self.__formattedHdiv300hPa.append(tHdiv)
                self.__formattedConv850hPa.append(tConv)
                self.__formattedOmg500hPa.append(tOmg)
                self.__formattedKidx.append(tKidx)

            self.__formattedPrec1h     = np.array(self.__formattedPrec1h)
            self.__formattedTmp        = np.array(self.__formattedTmp)
            self.__formattedMoist      = np.array(self.__formattedMoist)
            self.__formattedHdiv300hPa = np.array(self.__formattedHdiv300hPa)
            self.__formattedConv850hPa = np.array(self.__formattedConv850hPa)
            self.__formattedOmg500hPa  = np.array(self.__formattedOmg500hPa)
            self.__formattedKidx       = np.array(self.__formattedKidx)

        except:
            print(colored('Something went wrong at formatOutput.', 'red'))

    def getEndTstepIdx(self):
        return self.__endTstepIdx

    def getInfo(self, indices):

        if indices:
            startLatIdx = indices[0]
            endLatIdx = indices[1]
            startLonIdx = indices[2]
            endLonIdx = indices[3]

            latN = self.__latList[startLatIdx]
            latS = self.__latList[endLatIdx]
            latC = str(round((latN + latS)/2, 6))

            lonW = self.__lonList[startLonIdx]
            lonE = self.__lonList[endLonIdx]
            lonC = str(round((lonE + lonW)/2, 6))

            nRows = len(self.__latList[startLatIdx:endLatIdx+1])
            nCols = len(self.__lonList[startLonIdx:endLonIdx+1])

        else:

            latN = str(self.__latN)
            latS = str(self.__latS)
            latC = str(self.__cenLat)

            lonW = str(self.__lonW)
            lonE = str(self.__lonE)
            lonC = str(self.__cenLon)

            nRows = self.__nRows
            nCols = self.__nCols

        info = {
            'latN': str(latN),
            'latS': str(latS),
            'latC': str(latC),
            'lonW': str(lonW),
            'lonE': str(lonE),
            'lonC': str(lonC),
            'nRows': str(nRows),
            'nCols': str(nCols),
            'dx'   : str(self.__dx)
        }

        return info

    def getLimits(self):
        return self.__lonW, self.__lonE, self.__latN, self.__latS
    
    def getOutput(self):
        return {
            # 'prec'  : self.__formattedAccPrec    ,
            'prec'  : self.__formattedPrec1h     ,
            'tmp'   : self.__formattedTmp        ,
            'moist' : self.__formattedMoist      ,
            'hdiv'  : self.__formattedHdiv300hPa ,
            'conv'  : self.__formattedConv850hPa ,
            'omg'   : self.__formattedOmg500hPa  ,
            'kidx'  : self.__formattedKidx       ,
        }

    def reset(self):
        self.__ncDs = None

        self.__dx = None

        self.__latMatrix = None
        self.__lonMatrix = None

        self.__latList = None  # S --> N
        self.__lonList = None

        self.__nRows = None
        self.__nCols = None

        self.__cenLat = None
        self.__cenLon = None

        self.__lonW = None
        self.__lonE = None

        self.__latN = None
        self.__latS = None

        self.__nTimeSteps = None

        self.__startTstepIdx = 0 # t0  # if t0 < self.__nTimeSteps else self.__nTimeSteps - 1
        self.__endTstepIdx = 0

        self.__accPrec = []  # N --> S

        self.__prec1h = []  # N --> S

        self.__tmp = []  # N --> S
        self.__kidx = []  # N --> S
        self.__moist = []  # N --> S
        self.__omg500hPa = []  # N --> S
        self.__hdiv300hPa = []  # N --> S
        self.__conv850hPa = []  # N --> S

        self.__formattedPrec1h     = []  # N --> S
        self.__formattedHdiv300hPa = []  # N --> S
        self.__formattedOmg500hPa  = []  # N --> S
        self.__formattedConv850hPa = []  # N --> S
        self.__formattedMoist      = []  # N --> S
        self.__formattedTmp        = []  # N --> S
        self.__formattedKidx       = []  # N --> S
    
    def setNcfile(self, ncFilePath):
        self.__ncDs = Dataset(ncFilePath)
    
    def setT0(self, t0):
        self.__startTstepIdx = t0
    
    def __buildAccPrec(self, interval):
        rainc = self.__ncDs.variables['RAINC'][:]
        rainnc = self.__ncDs.variables['RAINNC'][:]

        rainAc = []

        _t0 = 0 if self.__startTstepIdx == 0 else self.__startTstepIdx - interval

        for t in range(_t0, self.__endTstepIdx + 1):
            tRainc = rainc[t]
            tRainnc = rainnc[t]

            rainAc.append(np.flipud(tRainc + tRainnc))

        self.__accPrec = rainAc

    def __buildPrec(self, interval):
        prec = []
        print(f"""
            \n[{self.__className} - __buildPrec]\naccPrec len   --> {len(self.__accPrec)}\nstartTstepIdx --> {self.__startTstepIdx} endTstepIdx --> {self.__endTstepIdx}
        """)

        if self.__startTstepIdx == 0:
            prec.append(self.__accPrec[0])

        for t in range(1, len(self.__accPrec), interval):
            total = self.__accPrec[t] - self.__accPrec[t - interval]
            prec.append(total)

        self.__prec1h = np.array(prec)

    def __buildTmp(self):

        tmp = []

        for t in range(self.__startTstepIdx, self.__endTstepIdx + 1):
            tTmp = getvar(self.__ncDs, 'T2', timeidx=t,
                          squeeze=False, meta=False)[0]
            # tTmp = to_np(tTmp)
            # print(type(tTmp))

            tTmpCelsius = list(tTmp - 273)

            tTmpCelsius.reverse()

            tmp.append(tTmpCelsius)

        # print('tmp', self.__endTstepIdx)
        self.__tmp = np.array(tmp)

    def __buildMoist(self):
        rh850hPa = []

        for t in range(self.__startTstepIdx, self.__endTstepIdx + 1):
            tRh = getvar(self.__ncDs, 'rh', timeidx=t,
                         squeeze=False, meta=False)
            tP = getvar(self.__ncDs, 'pressure', timeidx=t,
                        squeeze=False, meta=False)

            tRh850hPa = to_np(interplevel(tRh, tP, 850))

            if np.ma.isMaskedArray(tRh850hPa):
                tRh850hPa = list(tRh850hPa)
                tRh850hPa.reverse()
                rh850hPa.append(tRh850hPa)
        # print('moist', self.__endTstepIdx)
        self.__moist = np.array(rh850hPa)

    def __buildHdiv(self, hPa, conv=False):
        print()
        print(f"OutputExtractor - buildHdiv")
        print()
        def cdiff(scalar, axis=0):
            '''
            Performs the same as GrADS function cdiff()
            http://cola.gmu.edu/grads/gadoc/gradfunccdiff.html
            The scalar quantity must by 2D.
            The finite differences calculation ignores the borders, where np.nan is returned.
            '''
            # Check if 2D
            dimScalar = np.size(np.shape(scalar))
            if dimScalar != 2:
                print(
                    "Pystuff Error: scalar must have only 2 dimensions, but it has %d." % dimScalar)
                return

            # Length of each dimension
            lendim0 = np.shape(scalar)[0]
            lendim1 = np.shape(scalar)[1]

            # Initialize output var
            out = np.zeros(np.shape(scalar))
            out.fill(np.nan)

            # Centered finite differences
            for x in np.arange(1, lendim0-1):
                for y in np.arange(1, lendim1-1):
                    if axis == 0:
                        out[x, y] = scalar[x+1, y]-scalar[x-1, y]
                    elif axis == 1:
                        out[x, y] = scalar[x, y+1]-scalar[x, y-1]
                    else:
                        print(
                            "Pystuff Error: Invalid axis option. Must be either 0 or 1.")
                        return
            return out

        def hdivg(u, v, lat, lon):
            '''
            Calculates the horizontal divergence (du/dx+dv/dy) exactly like GrADS. 
            lat and lon are 1D arrays.
            http://cola.gmu.edu/grads/gadoc/gradfunccdiff.html
            '''
            latv, lonv = np.meshgrid(lat, lon, indexing='ij')

            r = 6.371*(10**6)
            dtr = np.pi/180
            dudx = cdiff(u, axis=1)/cdiff(lonv*dtr, axis=1)
            dvdy = cdiff(v*np.cos(latv*dtr), axis=0)/cdiff(latv*dtr, axis=0)
            out = (dudx + dvdy)/(r*np.cos(latv*dtr))
            return out

        def fHdiv(v): return 0.0 if math.isnan(v) or v < 0 else v * 100000
        def fConv(v): return 0.0 if math.isnan(v) or v > 0 else abs(v) * 100000
        
        hdiv = []
        latListSN = [row[0] for row in self.__latMatrix]

        f = fConv if conv else fHdiv


        for t in range(self.__startTstepIdx, self.__endTstepIdx + 1):
            u = getvar(self.__ncDs, 'ua', timeidx=t, squeeze=False, meta=False)
            v = getvar(self.__ncDs, 'va', timeidx=t, squeeze=False, meta=False)
            p = getvar(self.__ncDs, 'pressure', timeidx=t,
                       squeeze=False, meta=False)

            tU = to_np(interplevel(u, p, hPa))
            tV = to_np(interplevel(v, p, hPa))

            tHdiv = hdivg(tU, tV, latListSN, self.__lonList)  # np.array

            for row in range(len(tHdiv)):
                tHdiv[row] = [f(value) for value in tHdiv[row]]
            
            tHdiv = list(tHdiv)
            tHdiv.reverse()

            hdiv.append(tHdiv)

        hdiv = np.array(hdiv)

        if conv:
            self.__conv850hPa = hdiv
        else:
            self.__hdiv300hPa = hdiv

    def __buildOmega(self, hPa):

        w500hPaUp = []

        for t in range(self.__startTstepIdx, self.__endTstepIdx + 1):
            w = getvar(self.__ncDs, 'omg', timeidx=t,
                       squeeze=False, meta=False)
            p = getvar(self.__ncDs, 'pressure', timeidx=t,
                       squeeze=False, meta=False)

            tW500hPa = to_np(interplevel(w, p, hPa))

            if np.ma.isMaskedArray(tW500hPa):
                tW500hPa = list(tW500hPa)
            tW500hPa.reverse()

            tW500hUpwards = []

            for row in tW500hPa:
                rowUp = [abs(w) if w < 0 else 0.0 for w in row] # https://forum.mmm.ucar.edu/threads/positive-or-negative-of-the-variable-w-z-wind-compoent.8777/ "When W is positive, the vertical velocity is upward."
                tW500hUpwards.append(rowUp)

            w500hPaUp.append(tW500hUpwards)

        self.__omg500hPa = np.array(w500hPaUp)

    def __buildKidx(self):
        print()
        print(f"OutputExtractor - buildKidx")
        print()
        kidx = []

        mv = 18.016
        le = 597.3 * 0.0000004186
        r = 0.00000083144

        for t in range(self.__startTstepIdx, self.__endTstepIdx + 1):
            tc = getvar(self.__ncDs, 'tc', timeidx=t,
                        squeeze=False, meta=False)
            rh = getvar(self.__ncDs, 'rh', timeidx=t,
                        squeeze=False, meta=False)
            p = getvar(self.__ncDs, 'pressure', timeidx=t,
                       squeeze=False, meta=False)

            tTc850hPa = to_np(interplevel(tc, p, 850))
            tTc500hPa = to_np(interplevel(tc, p, 500))
            tTc700hPa = to_np(interplevel(tc, p, 700))

            tRh850hPa = to_np(interplevel(rh, p, 850))
            tRh700hPa = to_np(interplevel(rh, p, 700))

            tArr = []

            for row in range(self.__nRows):
                rowArr = []

                for col in range(self.__nCols):
                    t1 = tTc850hPa[row][col]
                    t2 = tTc500hPa[row][col]
                    t4 = tTc700hPa[row][col]
                    _rh850hPa = tRh850hPa[row][col]
                    _rh700hPa = tRh700hPa[row][col]

                    e3 = 6.11 * math.exp((mv*le/r) *
                                         ((1/273.16) - (1/(t1+273.16))))
                    e5 = 6.11 * math.exp((mv*le/r) *
                                         ((1/273.16) - (1/(t4+273.16))))

                    es3 = _rh850hPa*e3/100
                    es5 = _rh700hPa*e5/100

                    td3 = 1/(1/273.16-(r/(mv*le)) *
                             math.log10(es3/6.11)) - 273.16
                    td5 = 1/(1/273.16-(r/(mv*le)) *
                             math.log10(es5/6.11)) - 273.16

                    t3 = td3
                    t5 = td5

                    k = t1-t2+t3-t4+t5

                    rowArr.append(k)

                tArr.append(rowArr)

            if tArr:
                tArr.reverse()
                kidx.append(tArr)
        # print('kidx', self.__endTstepIdx)
        self.__kidx = np.array(kidx)

    def __checkAtmvarDim(self, atmvarKey):
        maxTstep = 0

        for t in range(self.__nTimeSteps):
            try:
                if atmvarKey == 'rain':
                    rainc = self.__ncDs.variables['RAINC'][:][t]
                    rainnc = self.__ncDs.variables['RAINNC'][:][t]

                    if len(rainc) != self.__nRows or len(rainnc) != self.__nRows:
                        raise Exception(
                            f'{atmvarKey} not ready at time step {t}.')

                    else:
                        for rowRainc, rowRainnc in zip(rainc, rainnc):
                            if len(rowRainc) != self.__nCols or len(rowRainnc) != self.__nCols:
                                raise Exception(
                                    f'{atmvarKey} not ready at time step {t}.')
                else:
                    getvar(self.__ncDs, atmvarKey, timeidx=t, meta=False)

                maxTstep = t

            except:
                print(f'{atmvarKey} not ready at time step {t}.')
                break

        return maxTstep

    def __setMaxTstep(self):

        keys = ['rain', 'T2', 'ua', 'va', 'pressure', 'rh', 'omg', 'tc']
        maxTstep = 1000

        for k in keys:
            maxTstepK = self.__checkAtmvarDim(k)
            maxTstep = maxTstepK if maxTstepK < maxTstep else maxTstep

        self.__endTstepIdx = maxTstep