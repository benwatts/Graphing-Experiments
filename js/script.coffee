revenueChart = visitorsChart = ordersChart = null

$(document).ready ->

  # silly redundancy happening here for the sake of quick testing 

  $('nav a').click (e) ->
    $.ajax
      url: this.href,
      success: (data, textStatus, jqXHR) ->
        if revenueChart? 
          revenueChart.newData(data)
        else 
          revenueChart = new Graph('graph-revenue', data.periodical_facts.data, 'visits_count' )

        if visitorsChart?
          visitorsChart.newData(data)
        else 
          visitorsChart  = new Graph('graph-visitors',data.periodical_facts.data, 'visits_count' )

        if ordersChart?
          ordersChart.newData(data)
        else 
          ordersChart  = new Graph('graph-orders',data.periodical_facts.data, 'visits_count', {symbol:{visible: false} }) 

    return false

  $('nav li:eq(2) a').trigger('click')



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
                    fill          : '90-#3084ca-#72abdb',
                    fillOnHover   : '90-#4eadfc-#2b9dfb',
                    strokeWidth   : 3,
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
      @canvas = Raphael @domId, @opt.width, @opt.height

      @tooltip = $('#'+domId).append('<div class="tooltip"> <div class="tooltip-title">N/A</div> <div class="tooltip-value">0</div> <div class="tooltip-arrow"></div> </div>').find('.tooltip:first')

      # draw a rect that's the same size as the canvas (debugging)
      #bg = @canvas.rect(0,0, @opt.width, @opt.height)
      #bg.attr('stroke-width', 1)

      @data = @normalizedData(rawData)
      @drawGraph()

      #@canvas.linechart(@chartX, @chartY, @chartWidth, @chartHeight, [0..@values.length-1], @values, { shade: true, symbol: 'circle', gutter: 0.1 })


  showTooltip: (e,x,y) ->
    @symbol.attr 'fill', @graph.opt.symbol.fillOnHover

    tooltip = @graph.tooltip
    tooltip.bind 'mouseLeave', @hideTip

    tooltip.find('.tooltip-title').text( @label )
    tooltip.find('.tooltip-value').text( @value )

    tooltip.show().css
      left  : @symbol.attr('cx') - tooltip.innerWidth() / 2, 
      top   : @symbol.attr('cy') - tooltip.height()

  hideTooltip: (e,x,y) ->
    @symbol.attr 'fill', @graph.opt.symbol.fill
    @graph.tooltip.hide()

  drawGraph: -> 
    numItems = @data.length
    yScale = @chartHeight / @dataMaxVal
    xScale = @chartWidth / numItems
    pathConnectingPoints = []

    symbolOpacity = if @opt.symbol.visible then 1.0 else 0

    columnSet = @canvas.set();
    symbolSet = @canvas.set();
    linesSet  = @canvas.set();

    for index, point of @data

      i = parseInt(index);

      # create a column (hit area + location to position symbol)
      c = @canvas.rect( index * xScale + @chartX, @chartY, xScale, @chartHeight )
      c.attr
        'fill': '#f00'
        'fill-opacity' : 0
        'stroke-width': 0
      point.column = c
      columnSet.push(c)

      # create symbol
      sx = Math.round(c.attr('x') + xScale / 2)
      sy = Math.round(point.value * -yScale + @chartY + @chartHeight)
      s = @canvas.circle(sx, sy, @opt.symbol.width)
      s.attr 
        'opacity': symbolOpacity,
        'fill': @opt.symbol.fill,
        'stroke': @opt.symbol.strokeColour
        'strokeWidth': @opt.symbol.strokeWidth 

      point.symbol = s
      symbolSet.push(s)

      c.hover @colHover, @colHoverOff, point, point

      # draw vertical line through symbol
      #console.log  @data[index].showXLabel
      if @data[index].showXLabel
        l = @canvas.path(['M', sx, @chartY, 'V', @chartY + @chartHeight]).attr('stroke' : '#eee')
        linesSet.push(l)

      # build the path that connects all the points together
      if i < 1 
        # first point - connect to bottom left of x axis 
        pathConnectingPoints = pathConnectingPoints.concat(['M', @chartX, @chartHeight + @chartY, 'L', sx, sy])        

      if i != 0
        prevPoint = @data[index-1].symbol
        pathConnectingPoints = pathConnectingPoints.concat(['L', sx, sy])

      if i == numItems-1 
        # last point - connect to bottom right of x axis
        pathConnectingPoints = pathConnectingPoints.concat(['L', @chartWidth + @chartX, @chartHeight + @chartY])


    # draw the line
    line = @canvas.path pathConnectingPoints
    line.attr
      'stroke': @opt.line.strokeColour,    
      'stroke-width': @opt.line.strokeWidth

    # draw the fill below the line
    fill = @canvas.path pathConnectingPoints
    fill.attr 
      'fill': @opt.line.fill,
      'stroke-width': 0,
      'fill-opacity': 0.05    

    # change ordering 
    linesSet.toFront()
    symbolSet.toFront()
    columnSet.toFront()


  normalizedData: (data) ->
    numDataPoints = data.length - 1
    dataPoints = []
    values = []

    for i in [0..numDataPoints]
      item = data[i]
      val = if item[@dataKey]? then item[@dataKey] else 0
      values.push(val)      
      dataPoints.push new DataPoint( @, val, item['date'], item['date'], item['show'] )

    @dataMaxVal = Math.max.apply( Math, values )
    @dataMinVal = Math.min.apply( Math, values )

    @values = values # temp

    return dataPoints

  newData: (rawData) ->
    @canvas.clear()
    @data = @normalizedData(rawData.periodical_facts.data)
    @drawGraph()  

  colHover: (e,x,y) ->
    @symbol.attr 'fill', @graph.opt.symbol.fillOnHover

    tooltip = @graph.tooltip
    $(tooltip).mousemove (e) ->
      $(this).show()

    tooltip.find('.tooltip-title').text( @label )
    tooltip.find('.tooltip-value').text( @value )

    tooltip.show().css
      left  : @symbol.attr('cx') - tooltip.innerWidth() / 2, 
      top   : @symbol.attr('cy') - tooltip.height()   

  colHoverOff: (e,x,y) ->
    @symbol.attr 'fill', @graph.opt.symbol.fill
    $(@tooltip).hide()


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
  constructor: (graph, value, label, xLabel, showXLabel) ->
    @graph       = graph
    @value       = value
    @label       = label
    @xLabel      = xLabel
    @showXLabel  = showXLabel
    @column
    @symbol 

