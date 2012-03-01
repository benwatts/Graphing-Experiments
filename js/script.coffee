$(document).ready ->
  #chart = DashboardChart

  window.myFirstChart = Graph('graph-revenue')

## ALALALALA
class Graph

  constructor: (domid, options={}) -> 
    @domid = domid

    @opt = $.extend
      height  : 200,
      width   : 800,
      padding :
        top: 20, 
        right: 20, 
        bottom: 20, 
        left: 20
      options

    if document.getElementById(@domid)?
      @paper = Raphael @domid, @opt.width, @opt.height

      # draw a rect that's the same size as the canvas for debugging 

      bg = @paper.rect(0,0, @opt.width, @opt.height)
      bg.attr('fill', '#ddd')
      bg.attr('stroke-width', 0)

      @paper.linechart(0, 0, @opt.width, @opt.height, [0..7], [10,15,15,1,15,20,30], { shade: true, symbol: 'circle', gutter: 0 })


class GraphTimeline

class GraphData