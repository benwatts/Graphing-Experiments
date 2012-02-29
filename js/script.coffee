$(document).ready ->
  #chart = DashboardChart

  window.myFirstChart = Graph('graph-revenue', 778, 200)
  console.log('here?')


## ALALALALA
class Graph

  @padding =
    top:    20
    right:  20
    bottom: 20
    left:   20

  constructor: (domid, width, height, opts={}) -> 
    @domid        = domid
    @width        = width
    @height       = height

    console.log(@domid)

    if document.getElementById(@domid).length
      @paper = Raphael(@domid)
      console.log('here')


class GraphTimeline

class GraphData