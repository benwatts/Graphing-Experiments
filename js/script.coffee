$(document).ready ->
  revenueChart  = new Graph('graph-revenue',testJson_small.periodical_facts.data, 'visits_count', {debug: true, } )
  visitorsChart = new Graph('graph-visitors',testJson_small.periodical_facts.data, 'visits_count', {debug: true} )
  ordersChart   = new Graph('graph-orders',testJson_large.periodical_facts.data, 'visits_count', {debug: true, symbol:{visible: false} })  


class Graph

  constructor: (domId, rawData, dataKey, options={}) -> 
    @domId    = domId
    @dataKey  = dataKey
    @opt      = $.extend {
                  height : $('#'+domId).height(),
                  width  : $('#'+domId).width(),
                  gutter : { top: 10, right: 10, bottom: 20, left: 40 }
                  symbol : 
                    visible       : true,
                    width         : 4,
                    fill          : '90-#3084ca-#5298d3',
                    strokeWidth   : 2,
                    strokeColour  : '#fff',
                  line :
                    fill          : '90-#f6f6f6-#fff'
                    strokeWidth   : 2,
                    strokeColour  : '#d4d4d4',
                }, options

    @chartX      = @opt.gutter.left
    @chartY      = @opt.gutter.top
    @chartWidth  = @opt.width  - @opt.gutter.left - @opt.gutter.right
    @chartHeight = @opt.height - @opt.gutter.top  - @opt.gutter.bottom

    @dataMaxVal = @dataMinVal = 0    

    if document.getElementById(@domId)?
      @paper = Raphael @domId, @opt.width, @opt.height

      # draw a rect that's the same size as the canvas (debugging)
      #bg = @paper.rect(0,0, @opt.width, @opt.height)
      #bg.attr('stroke-width', 1)

      @data = @normalizedData(rawData)

      @drawGraph()

      #@paper.linechart(@chartX, @chartY, @chartWidth, @chartHeight, [0..@values.length-1], @values, { shade: true, symbol: 'circle', gutter: 0.1 })


  drawGraph: -> 
    numItems = @data.length
    yScale = @chartHeight / @dataMaxVal
    xScale = @chartWidth / numItems
    pathConnectingPoints = []

    symbolOpacity = if @opt.symbol.visible then 1.0 else 0
    symbolSet = @paper.set();

    for index, point of @data

      i = parseInt(index);

      # create a column
      c = @paper.rect( index * xScale + @chartX, @chartY, xScale, @chartHeight )
      c.attr
        'fill': if index % 2 == 0 then '#f9f9f9' else '#fff'
        'stroke-width': 0
      point.column = c


      # create symbol
      sx = Math.round(c.attr('x') + xScale / 2)
      sy = Math.round(point.value * -yScale + @chartY + @chartHeight)
      s = @paper.circle(sx, sy, @opt.symbol.width)
      s.attr 
        'opacity': symbolOpacity,
        'fill': @opt.symbol.fill,
        'stroke': @opt.symbol.strokeColor
        'strokeWidth': @opt.symbol.strokeWidth
      point.symbol = s
      symbolSet.push(s);

      # create an array of SVG paths
      if i < 1 
        # first point - connect to bottom left of x axis 
        pathConnectingPoints = pathConnectingPoints.concat(['M', @chartX, @chartHeight + @chartY, 'L', sx, sy])        

      if @data[index-1]
        prevPoint = @data[index-1].symbol
        pathConnectingPoints = pathConnectingPoints.concat(['L', sx, sy])

      if i == numItems-1 
        # last point - connect to bottom right of x axis
        pathConnectingPoints = pathConnectingPoints.concat(['L', @chartWidth + @chartX, @chartHeight + @chartY])


    # draw the line
    line = @paper.path pathConnectingPoints
    line.attr
      'stroke': @opt.line.strokeColour,    
      'stroke-width': @opt.line.strokeWidth

    # draw the fill below the line
    fill = @paper.path pathConnectingPoints
    fill.attr 
      'fill': @opt.line.fill,
      'stroke-width': 0,
      'fill-opacity': 0.05    

    # change ordering 
    symbolSet.toFront()

    #fill = @paper.path(pathConnectingPoints).attr('fill')

    # loop through all the data points, create columns, add symbol finally, connect those bitches 
    #for i in [0..numItemsnumItems]
    #  console.log 'lol'



  normalizedData: (data) ->
    numDataPoints = data.length - 1
    dataPoints = []
    values = []

    for i in [0..numDataPoints]
      item = data[i]
      val = if item[@dataKey]? then item[@dataKey] else 0
      values.push(val)      
      dataPoints.push new DataPoint( val, item[@dataKey], 'prettyValue', item['date'], item['show'] )

    @dataMaxVal = Math.max.apply( Math, values )
    @dataMinVal = Math.min.apply( Math, values )

    @values = values # temp

    return dataPoints


### 
  DATAPOINT! 
  I DON'T KNOW WHAT I'M DOING. 

       value -- raw value 
 prettyValue -- value to display in bubble
      xLabel -- label for x axis
  showXLabel -- show label on x axis?
      column -- reference to the svg column
      symbol -- reference to the svg symbol

###
class DataPoint 
  constructor: (value, prettyValue, xLabel, showXLabel) ->
    @value       = value
    @prettyValue = prettyValue
    @xLabel      = xLabel
    @showXLabel  = showXLabel
    @x
    @y
    @column
    @symbol 

