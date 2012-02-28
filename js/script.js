(function() {
  var DashboardChart;

  DashboardChart = (function() {

    function DashboardChart(domid, width, height, lines, xData, yData) {
      var _i, _ref, _results;
      this.domid = domid;
      this.width = width;
      this.height = height;
      this.xData = xData;
      this.yData = yData;
      this.r = Raphael(this.domid);
      this.graph = this.r.linechart(0, 0, this.width, this.height, (function() {
        _results = [];
        for (var _i = 0, _ref = this.xData.length; 0 <= _ref ? _i <= _ref : _i >= _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
        return _results;
      }).apply(this), this.yData, {
        shade: true,
        symbol: "circle",
        gutter: 30
      });
    }

    return DashboardChart;

  })();

  $(document).ready(function() {
    var chart;
    return chart = DashboardChart('graph-revenue', 778, 200, '', ['Feb 1', 'Feb 2', 'Feb 3', 'Feb 4', 'Feb 5', 'Feb 6', 'Feb 7', 'Feb 8', 'Feb 9', 'Feb 10', 'Feb 11'], [17, 34, 56, 13, 12, 45, 34, 56, 123, 12, 45]);
  });

}).call(this);
