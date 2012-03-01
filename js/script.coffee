$(document).ready ->
  myFirstChart = new Graph('graph-revenue',testJson.periodical_facts.data, 'visits_count', {debug: true} )

class Graph

  constructor: (domId, rawData, dataKey, options={}) -> 
    @domId    = domId
    @rawData  = rawData
    @dataKey  = dataKey
    @opt      = $.extend
                  debug  : false,
                  height : 200,
                  width  : 800,
                  gutter :
                    top: 10, 
                    right: 0, 
                    bottom: 20, 
                    left: 40
                  options

    @chartX      = @opt.gutter.left
    @chartY      = @opt.gutter.top
    @chartWidth  = @opt.width  - @opt.gutter.left - @opt.gutter.right
    @chartHeight = @opt.height - @opt.gutter.top  - @opt.gutter.bottom
    @maxVal = @minVal = 0    

    if document.getElementById(@domId)?
      @paper = Raphael @domId, @opt.width, @opt.height

      # draw a rect that's the same size as the canvas (debugging)
      bg = @paper.rect(0,0, @opt.width, @opt.height)
      bg.attr('stroke-width', 1)

      @highlightColumns()                

      @data = @normalizedData()

      @paper.linechart(@chartX, @chartY, @chartWidth, @chartHeight, [0..@values.length-1], @values, { shade: true, symbol: 'circle', gutter: 0.1 })


  normalizedData: ->
    numDataPoints = @rawData.length - 1
    dataPoints = []
    @values = []

    for i in [0..numDataPoints]
      item = @rawData[i]
      @values.push(item[@dataKey])
      dataPoints.push new DataPoint(item[@dataKey], 'prettyValue', item['date'], item['show'] )

    @maxVal = Math.max.apply( Math, @values );
    @minVal = Math.min.apply( Math, @values );

    return dataPoints


  highlightColumns: ->
    numDataPoints = @rawData.length
    colWidth = (@chartWidth/numDataPoints) # no subpixel column widths 
    colWidthRemainder = @chartWidth - numDataPoints * colWidth

    #highlights alternating columns 
    for point in [0..numDataPoints]
      col = @paper.rect(point*colWidth+@opt.gutter.left, @opt.gutter.top, colWidth, @chartHeight)
      fillColour = if point % 2 == 0 then '#ff0' else '#09f'
      col.attr('fill', fillColour)
      col.attr('stroke-width', 0)




### 
  DATAPOINT! 
  ALALALALALALALALALALAL

       value -- raw value 
 prettyValue -- value to display in bubble
      xLabel -- label for x axis
  showXLabel -- show label on x axis?

###
class DataPoint 
  constructor: (value, prettyValue, xLabel, showXLabel) ->
    @value       = value
    @prettyValue = prettyValue
    @xLabel      = xLabel
    @showXLabel  = showXLabel
