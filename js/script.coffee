class DashboardChart
  constructor: (domid, width, height, lines, xData, yData) ->
    @domid  = domid;
    @width  = width;
    @height = height;
    @xData  = xData;
    @yData  = yData;
    #@.initLines(lines);

    @r = Raphael(@domid)

    @graph = @r.linechart 0, 0, @width, @height, [0..@xData.length], @yData,
                shade: true
                symbol: "circle" 
                gutter: 30


$(document).ready ->
  chart = DashboardChart('graph-revenue', 778, 200, '', ['Feb 1', 'Feb 2', 'Feb 3', 'Feb 4', 'Feb 5', 'Feb 6', 'Feb 7', 'Feb 8', 'Feb 9', 'Feb 10', 'Feb 11'], [17,34,56,13,12,45,34,56,123,12,45] )