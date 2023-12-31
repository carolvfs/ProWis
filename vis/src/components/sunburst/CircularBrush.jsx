import * as d3 from 'd3'
import './CircularBrush.css'

export default function circularbrush() {
    let _extent     = [0, Math.PI * 2]
    
    const _circularbrushDispatch = d3.dispatch('brushstart', 'brushend', 'brush')
    
    const _arc = d3.arc()
        .innerRadius(50)
        .outerRadius(100)
    
    let _brushData = [
        { startAngle: _extent[0]     , endAngle: _extent[1]      , class: 'extent'  },
		{ startAngle: _extent[0] - 0.2, endAngle:  _extent[0]    , class: 'resize e'}, // left button
		{ startAngle: _extent[1]     , endAngle: _extent[1] + 0.2, class: 'resize w'}, // right button
		// { startAngle: _extent[0]     , endAngle: _extent[0] + 0.2, class: 'resize w'}, // right button
    ]
    
    let _newBrushData = []
    
    let _handleSize = 0.2
    let _origin     = null
    let _brushG     = null

    const _scale = d3.scaleLinear()
        .domain(_extent)
        .range(_extent)

    function _circularbrush(_container) {
        _brushG = _container

        const path = _brushG
            .selectAll('path.circularbrush')
            .data(_brushData)
       
        path.enter().append('path')
            .attr('class', 'path.resize')
            .attr('d', _arc)
            .attr('class', function(d) { return d.class + ' circularbrush'})

        _brushG.select('path.extent')
            .on('mousedown.brush', function(e,d) {resizeDown(e,d)})

        _brushG.selectAll('path.resize')
            .on('mousedown.brush', function(e,d) {resizeDown(e,d)})

        return _circularbrush

    }

    _circularbrush.extent = function(_value) {
        const _d = _scale.domain()
        const _r = _scale.range()

        const _actualScale = d3.scaleLinear()
            .domain([-_d[1], _d[0], _d[0], _d[1]])
            .range([_r[0],_r[1],_r[0],_r[1]])

        
        
        if (!arguments.length) return [_actualScale(_extent[0]),_actualScale(_extent[1])]
        
        _extent = [_scale.invert(_value[0]),_scale.invert(_value[1])]
        
        return this
    }

    _circularbrush.handleSize = function(_value) {

        if (!arguments.length) return _handleSize

        _handleSize = _value
        return this
    }

    _circularbrush.innerRadius = function(_value) {
        if (!arguments.length) return _arc.innerRadius()

        _arc.innerRadius(_value)

        return this
    }

    _circularbrush.reset = function() {

        _newBrushData = [
            { startAngle: 0          , endAngle: Math.PI * 2      , class: 'extent'  },
            { startAngle: 0 - 0.2    , endAngle:  0               , class: 'resize e'}, // left button
            { startAngle: Math.PI * 2, endAngle: Math.PI * 2 + 0.2, class: 'resize w'}, // right button
        ]

        _brushG
            .selectAll('path.circularbrush')
            .data(_newBrushData)
            .attr('d', _arc)

        _circularbrushDispatch.call('brush')
            
        _brushData = _newBrushData
        _extent = ([0,Math.PI * 2])
        
        _circularbrushDispatch.call('brushend')

    }

    _circularbrush.move = function() {
        ''
    }

    _circularbrush.outerRadius = function(_value) {
        if (!arguments.length) return _arc.outerRadius()

        _arc.outerRadius(_value)
        return this
    }

    _circularbrush.range = function(_value) {
        if (!arguments.length) return _scale.range()

        _scale.range(_value)
        return this
    }
    
    _circularbrush.on = function() {
        var value = _circularbrushDispatch.on.apply(_circularbrushDispatch, arguments)
        return value === _circularbrushDispatch ? _circularbrush : value
    }

    return _circularbrush

    
    function resizeDown(event, d) {
        const _mouse = d3.pointer(event, _brushG.node())

        const _originalBrushData = {
            startAngle: _brushData[0].startAngle, 
            endAngle  : _brushData[0].endAngle
        }

        _origin = _mouse

        const view = d3.select(event.view)

        if (d.class === 'resize e') {
            // d3_window
            view
            .on('mousemove.brush', function(e) { resizeMove(e, 'e') })
            .on('mouseup.brush', extentUp)
        }
        else if (d.class === 'resize w') {
            // d3_window
            view
            .on('mousemove.brush', function(e) { resizeMove(e, 'w') })
            .on('mouseup.brush', extentUp)
        }
        else {
            // d3_window
            view
            .on('mousemove.brush', function(e) { resizeMove(e, 'extent') })
            .on('mouseup.brush', extentUp)
        }

        _circularbrushDispatch.call('brushstart')

        function resizeMove(_event, _resize) {
            const __mouse   = d3.pointer(_event, _brushG.node())
            const _current = Math.atan2(__mouse[1],__mouse[0])
            const _start   = Math.atan2(_origin[1],_origin[0])
            // console.log(_mouse, __mouse)

            let _newStartAngle = null
            let _newEndAngle   = null
            let clampedAngle   = null
    
            if (_resize === 'e') {
                clampedAngle = Math.max(Math.min(_originalBrushData.startAngle + (_current - _start), _originalBrushData.endAngle), _originalBrushData.endAngle - (2 * Math.PI))
    
                if (_originalBrushData.startAngle + (_current - _start) > _originalBrushData.endAngle) {
                    clampedAngle = _originalBrushData.startAngle + (_current - _start) - (Math.PI * 2)
                }
                else if (_originalBrushData.startAngle + (_current - _start) < _originalBrushData.endAngle - (Math.PI * 2)) {
                    clampedAngle = _originalBrushData.startAngle + (_current - _start) + (Math.PI * 2)
                }
    
                _newStartAngle = clampedAngle
                _newEndAngle = _originalBrushData.endAngle	
            }
            else if (_resize === 'w') {
                clampedAngle = Math.min(Math.max(_originalBrushData.endAngle + (_current - _start), _originalBrushData.startAngle), _originalBrushData.startAngle + (2 * Math.PI))
    
                if (_originalBrushData.endAngle + (_current - _start) < _originalBrushData.startAngle) {
                    clampedAngle = _originalBrushData.endAngle + (_current - _start) + (Math.PI * 2)
                }
                else if (_originalBrushData.endAngle + (_current - _start) > _originalBrushData.startAngle + (Math.PI * 2)) {
                    clampedAngle = _originalBrushData.endAngle + (_current - _start) - (Math.PI * 2)
                }
    
                _newStartAngle = _originalBrushData.startAngle
                _newEndAngle = clampedAngle
            }
            else {
                _newStartAngle = _originalBrushData.startAngle + (_current - _start * 1)
                _newEndAngle   = _originalBrushData.endAngle + (_current - _start * 1)
            }
    
    
            _newBrushData = [
                {startAngle: _newStartAngle, endAngle: _newEndAngle, class: 'extent'},
                {startAngle: _newStartAngle - _handleSize, endAngle: _newStartAngle, class: 'resize e'},
                {startAngle: _newEndAngle, endAngle: _newEndAngle + _handleSize, class: 'resize w'}
            ]
    
            _brushG
                .selectAll('path.circularbrush')
                .data(_newBrushData)
                .attr('d', _arc)

            if (_newStartAngle > (Math.PI * 2)) {
                _newStartAngle = (_newStartAngle - (Math.PI * 2))
            }
            else if (_newStartAngle < -(Math.PI * 2)) {
                _newStartAngle = (_newStartAngle + (Math.PI * 2))
            }
    
            if (_newEndAngle > (Math.PI * 2)) {
                _newEndAngle = (_newEndAngle - (Math.PI * 2))
            }
            else if (_newEndAngle < -(Math.PI * 2)) {
                _newEndAngle = (_newEndAngle + (Math.PI * 2))
            }
    
            _extent = ([_newStartAngle,_newEndAngle])
    
            _circularbrushDispatch.call('brush')
    
        }

        function extentUp() {

            _brushData = _newBrushData
            // d3_window.on('mousemove.brush', null).on('mouseup.brush', null)
            view.on('mousemove.brush', null).on('mouseup.brush', null)
    
            _circularbrushDispatch.call('brushend')
        }
    }

}

// http://bl.ocks.org/emeeks/905c4691f343fc4780bd