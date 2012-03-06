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
          revenueChart = new Graph('graph-revenue', data, 'visits_count' )

        if visitorsChart?
          visitorsChart.newData(data)
        else 
          visitorsChart  = new Graph('graph-visitors',data, 'visits_count' )

        if ordersChart?
          ordersChart.newData(data)
        else 
          ordersChart  = new Graph('graph-orders',data, 'visits_count', {symbol:{visible: false}}) 

    return false

  $('nav li:eq(2) a').trigger('click') # trigger some data to be loaded, why not. 



class Graph

  constructor: (domId, rawData, dataKey, options={}) -> 
    @domId    = domId
    @dataKey  = dataKey
    @opt      = {}

    $.extend true, @opt, {
      height : $('#'+domId).height()
      width  : $('#'+domId).width()
      gutter : { top: 10, right: 10, bottom: 20, left: 40 }
      grid   :
        strokeColour  : '#eee'
        strokeColourOnHover : '#ddd'
      symbol : 
        radius        : 4
        fill          : '90-#3084ca-#72abdb'
        fillOnHover   : '90-#4eadfc-#2b9dfb'
        strokeWidth   : 2
        strokeColour  : '#fff'
        visible       : true                    
      line :
        fill          : '90-#f6f6f6-#fff'
        strokeWidth   : 2
        strokeColour  : '#d4d4d4'
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

  drawGraph: -> 
    numItems = @data.length
    xScale = @chartWidth / numItems
    pathConnectingPoints = []

    columnSet = @canvas.set();
    symbolSet = @canvas.set();
    linesSet  = @canvas.set();

    # draw y-axis lines
    yScale = @chartHeight / @dataMaxVal
    yIncrements = @chartHeight / yScale
    for i in [0..yIncrements]
      @canvas.path(['M', @chartX, Math.round(@chartY + yScale * i), 'H', @chartX + @chartWidth]).attr('stroke' : '#eee')

    # hide symbols if the density of points is too high
    @opt.symbol.visible =  if numItems * (@opt.symbol.radius*2) > @chartWidth then false else true    

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
      s = @canvas.circle(sx, sy, @opt.symbol.radius)
      s.attr 
        'fill': @opt.symbol.fill,
        'stroke': @opt.symbol.strokeColour
        'stroke-width': @opt.symbol.strokeWidth 
      if not @opt.symbol.visible then s.hide()

      point.symbol = s
      symbolSet.push(s)

      # draw vertical line through symbol
      l = @canvas.path(['M', sx, @chartY, 'V', @chartY + @chartHeight]).attr('stroke' : '#eee')
      if not @data[index].showXLabel then l.hide()
      linesSet.push(l)
      point.xLine = l

      # draw x-axis label, if appropriate 
      if @data[index].showXLabel
        t = @canvas.text sx, @chartY + @chartHeight + 10 , @data[index].xLabel


      # build the path that connects all the points together
      if i < 1 
        pathConnectingPoints = pathConnectingPoints.concat(['M', @chartX, @chartHeight + @chartY, 'L', sx, sy]) # first point - connect to bottom left of x axis       

      if i != 0
        prevPoint = @data[index-1].symbol
        pathConnectingPoints = pathConnectingPoints.concat(['L', sx, sy])

      if i == numItems-1 
        pathConnectingPoints = pathConnectingPoints.concat(['L', @chartWidth + @chartX, @chartHeight + @chartY]) # last point - connect to bottom right of x axis


      # hover over a column? highlight the column + show a bubble
      c.hover @colHover, @colHoverOff, point, point        


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


  normalizedData: (raw) ->
    data = raw.periodical_facts.data
    numDataPoints = data.length - 1
    dataPoints = []
    values     = []
    timeOnly  = if raw.start_date is raw.end_date then true else false

    for i in [0..numDataPoints]
      item = data[i]
      val = if item[@dataKey]? then item[@dataKey] else 0
      values.push(val)      
      dataPoints.push new DataPoint( @, val, item['date'], @prettyDate(item['date'], timeOnly), item['show'] )

    @dataMaxVal = Math.max.apply( Math, values )
    @dataMinVal = Math.min.apply( Math, values )

    @values = values # temp

    return dataPoints


  prettyDate: ( date, timeOnly = false ) -> 
    # should use batman filters, I think
    if timeOnly 
      date = date.split(' ')[1].substr(0,5)

    return date




  newData: (raw) ->
    @canvas.clear()
    @data = @normalizedData(raw)
    @drawGraph()  

  colHover: (e,x,y) ->
    @symbol.attr( 'fill', @graph.opt.symbol.fillOnHover ).show()
    @xLine.attr( 'stroke', @graph.opt.grid.strokeColourOnHover ).show()

    tooltip = @graph.tooltip
    tooltip.find('.tooltip-title').text( @label )
    tooltip.find('.tooltip-value').text( @value )

    tooltip.show().css
      left  : @symbol.attr('cx') - tooltip.innerWidth() / 2, 
      top   : @symbol.attr('cy') - tooltip.height()   

  colHoverOff: (e,x,y) ->
    @symbol.attr 'fill', @graph.opt.symbol.fill
    if not @graph.opt.symbol.visible then @symbol.hide()

    @xLine.attr 'stroke', @graph.opt.grid.strokeColour
    if not @showXLabel then @xLine.hide()

    $(@graph.tooltip).hide()





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
    @xLine
    @column
    @symbol

