$(document).ready ->
  myFirstChart = new Graph('graph-revenue',testJson.periodical_facts.data, 'visits_count', {debug: true} )

class Graph

  constructor: (domId, rawData, dataKey, options={}) -> 
    @domId    = domId
    @dataKey  = dataKey
    @opt      = $.extend {
                  debug  : false,
                  height : 200,
                  width  : 800,
                  gutter : { top: 10, right: 10, bottom: 20, left: 40 }
                }, options

    @chartX      = @opt.gutter.left
    @chartY      = @opt.gutter.top
    @chartWidth  = @opt.width  - @opt.gutter.left - @opt.gutter.right
    @chartHeight = @opt.height - @opt.gutter.top  - @opt.gutter.bottom

    @dataMaxVal = @dataMinVal = 0    

    if document.getElementById(@domId)?
      @paper = Raphael @domId, @opt.width, @opt.height

      # draw a rect that's the same size as the canvas (debugging)
      bg = @paper.rect(0,0, @opt.width, @opt.height)
      bg.attr('stroke-width', 1)

      @data = @normalizedData(rawData)

      @drawGraph()

      #@paper.linechart(@chartX, @chartY, @chartWidth, @chartHeight, [0..@values.length-1], @values, { shade: true, symbol: 'circle', gutter: 0.1 })


  drawGraph: -> 
    numItems = @data.length
    yScale = @chartHeight / @dataMaxVal
    xScale = @chartWidth / numItems
    sWidth = 4

    for index, point of @data

      # create column
      c = @paper.rect( index * xScale + @chartX, @chartY, xScale, @chartHeight )
      c.attr
        'fill': if index % 2 == 0 then '#ff0' else '#09f'
        'stroke-width': 0

      # create symbol
      sx = Math.round(c.attr('x') + sWidth)
      sy = Math.round(point.value * -yScale + @chartY + @chartHeight)
      s = @paper.circle(sx, sy, sWidth).attr( { 'fill': '#444', 'stroke-width': 0 })

      point.column = c
      point.symbol = s

    
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

