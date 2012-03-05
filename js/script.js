(function() {
  var DataPoint, Graph, ordersChart, revenueChart, visitorsChart;

  revenueChart = visitorsChart = ordersChart = null;

  $(document).ready(function() {
    $('nav a').click(function(e) {
      $.ajax({
        url: this.href,
        success: function(data, textStatus, jqXHR) {
          if (revenueChart != null) {
            revenueChart.newData(data);
          } else {
            revenueChart = new Graph('graph-revenue', data.periodical_facts.data, 'visits_count');
          }
          if (visitorsChart != null) {
            visitorsChart.newData(data);
          } else {
            visitorsChart = new Graph('graph-visitors', data.periodical_facts.data, 'visits_count');
          }
          if (ordersChart != null) {
            return ordersChart.newData(data);
          } else {
            return ordersChart = new Graph('graph-orders', data.periodical_facts.data, 'visits_count', {
              symbol: {
                visible: false
              }
            });
          }
        }
      });
      return false;
    });
    return $('nav li:eq(2) a').trigger('click');
  });

  Graph = (function() {

    function Graph(domId, rawData, dataKey, options) {
      if (options == null) options = {};
      this.domId = domId;
      this.dataKey = dataKey;
      this.opt = $.extend({
        height: $('#' + domId).height(),
        width: $('#' + domId).width(),
        gutter: {
          top: 10,
          right: 10,
          bottom: 20,
          left: 40
        },
        symbol: {
          visible: true,
          width: 4,
          fill: '90-#3084ca-#72abdb',
          fillOnHover: '90-#4eadfc-#2b9dfb',
          strokeWidth: 3,
          strokeColour: '#fff'
        },
        line: {
          fill: '90-#f6f6f6-#fff',
          strokeWidth: 2,
          strokeColour: '#d4d4d4'
        }
      }, options);
      this.chartX = this.opt.gutter.left;
      this.chartY = this.opt.gutter.top;
      this.chartWidth = this.opt.width - this.opt.gutter.left - this.opt.gutter.right;
      this.chartHeight = this.opt.height - this.opt.gutter.top - this.opt.gutter.bottom;
      this.dataMaxVal = this.dataMinVal = 0;
      if (document.getElementById(this.domId) != null) {
        this.paper = Raphael(this.domId, this.opt.width, this.opt.height);
        this.tooltip = $('#' + domId).append('<div class="tooltip"></div>').find('.tooltip:first');
        this.data = this.normalizedData(rawData);
        this.drawGraph();
      }
    }

    Graph.prototype.showTooltip = function(e, x, y) {
      var tooltip;
      this.symbol.attr('fill', this.graph.opt.symbol.fillOnHover);
      tooltip = this.graph.tooltip;
      return tooltip.show().css({
        left: this.symbol.attr('cx') - tooltip.width() / 2,
        top: this.symbol.attr('cy') - tooltip.height() - 10
      });
    };

    Graph.prototype.hideTooltip = function(e, x, y) {
      return this.symbol.attr('fill', this.graph.opt.symbol.fill);
    };

    Graph.prototype.drawGraph = function() {
      var c, columnSet, fill, i, index, l, line, linesSet, numItems, pathConnectingPoints, point, prevPoint, s, sx, sy, symbolOpacity, symbolSet, xScale, yScale, _ref;
      numItems = this.data.length;
      yScale = this.chartHeight / this.dataMaxVal;
      xScale = this.chartWidth / numItems;
      pathConnectingPoints = [];
      symbolOpacity = this.opt.symbol.visible ? 1.0 : 0;
      columnSet = this.paper.set();
      symbolSet = this.paper.set();
      linesSet = this.paper.set();
      _ref = this.data;
      for (index in _ref) {
        point = _ref[index];
        i = parseInt(index);
        c = this.paper.rect(index * xScale + this.chartX, this.chartY, xScale, this.chartHeight);
        c.attr({
          'fill': '#f00',
          'fill-opacity': 0,
          'stroke-width': 0
        });
        point.column = c;
        columnSet.push(c);
        sx = Math.round(c.attr('x') + xScale / 2);
        sy = Math.round(point.value * -yScale + this.chartY + this.chartHeight);
        s = this.paper.circle(sx, sy, this.opt.symbol.width);
        s.attr({
          'opacity': symbolOpacity,
          'fill': this.opt.symbol.fill,
          'stroke': this.opt.symbol.strokeColour,
          'strokeWidth': this.opt.symbol.strokeWidth
        });
        point.symbol = s;
        symbolSet.push(s);
        c.hover(this.showTooltip, this.hideTooltip, point, point);
        if (this.data[index].showXLabel) {
          l = this.paper.path(['M', sx, this.chartY, 'V', this.chartY + this.chartHeight]).attr({
            'stroke': '#eee'
          });
          linesSet.push(l);
        }
        if (i < 1) {
          pathConnectingPoints = pathConnectingPoints.concat(['M', this.chartX, this.chartHeight + this.chartY, 'L', sx, sy]);
        }
        if (i !== 0) {
          prevPoint = this.data[index - 1].symbol;
          pathConnectingPoints = pathConnectingPoints.concat(['L', sx, sy]);
        }
        if (i === numItems - 1) {
          pathConnectingPoints = pathConnectingPoints.concat(['L', this.chartWidth + this.chartX, this.chartHeight + this.chartY]);
        }
      }
      line = this.paper.path(pathConnectingPoints);
      line.attr({
        'stroke': this.opt.line.strokeColour,
        'stroke-width': this.opt.line.strokeWidth
      });
      fill = this.paper.path(pathConnectingPoints);
      fill.attr({
        'fill': this.opt.line.fill,
        'stroke-width': 0,
        'fill-opacity': 0.05
      });
      linesSet.toFront();
      symbolSet.toFront();
      return columnSet.toFront();
    };

    Graph.prototype.normalizedData = function(data) {
      var dataPoints, i, item, numDataPoints, val, values;
      numDataPoints = data.length - 1;
      dataPoints = [];
      values = [];
      for (i = 0; 0 <= numDataPoints ? i <= numDataPoints : i >= numDataPoints; 0 <= numDataPoints ? i++ : i--) {
        item = data[i];
        val = item[this.dataKey] != null ? item[this.dataKey] : 0;
        values.push(val);
        dataPoints.push(new DataPoint(this, val, item['date'], item['show']));
      }
      this.dataMaxVal = Math.max.apply(Math, values);
      this.dataMinVal = Math.min.apply(Math, values);
      this.values = values;
      return dataPoints;
    };

    Graph.prototype.newData = function(rawData) {
      this.paper.clear();
      this.data = this.normalizedData(rawData.periodical_facts.data);
      return this.drawGraph();
    };

    return Graph;

  })();

  /* 
    DATAPOINT! 
    I DON'T KNOW WHAT I'M DOING. 
  
         value -- raw value 
   prettyValue -- value to display in bubble
        xLabel -- label for x axis
    showXLabel -- show label on x axis?
        column -- reference to the svg column
        symbol -- reference to the svg symbol
  */

  DataPoint = (function() {

    function DataPoint(graph, value, xLabel, showXLabel) {
      this.graph = graph;
      this.value = value;
      this.xLabel = xLabel;
      this.showXLabel = showXLabel;
      this.column;
      this.symbol;
    }

    return DataPoint;

  })();

}).call(this);
