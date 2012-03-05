(function() {
  var DataPoint, Graph;

  $(document).ready(function() {
    var ordersChart, revenueChart, visitorsChart;
    revenueChart = new Graph('graph-revenue', testJson_small.periodical_facts.data, 'visits_count', {
      debug: true
    });
    visitorsChart = new Graph('graph-visitors', testJson_small.periodical_facts.data, 'visits_count', {
      debug: true
    });
    return ordersChart = new Graph('graph-orders', testJson_large.periodical_facts.data, 'visits_count', {
      debug: true,
      symbol: {
        visible: false
      }
    });
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
          fill: '90-#3084ca-#5298d3',
          strokeWidth: 2,
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
        this.data = this.normalizedData(rawData);
        this.drawGraph();
      }
    }

    Graph.prototype.drawGraph = function() {
      var c, fill, i, index, line, numItems, pathConnectingPoints, point, prevPoint, s, sx, sy, symbolOpacity, symbolSet, xScale, yScale, _ref;
      numItems = this.data.length;
      yScale = this.chartHeight / this.dataMaxVal;
      xScale = this.chartWidth / numItems;
      pathConnectingPoints = [];
      symbolOpacity = this.opt.symbol.visible ? 1.0 : 0;
      symbolSet = this.paper.set();
      _ref = this.data;
      for (index in _ref) {
        point = _ref[index];
        i = parseInt(index);
        c = this.paper.rect(index * xScale + this.chartX, this.chartY, xScale, this.chartHeight);
        c.attr({
          'fill': index % 2 === 0 ? '#f9f9f9' : '#fff',
          'stroke-width': 0
        });
        point.column = c;
        sx = Math.round(c.attr('x') + xScale / 2);
        sy = Math.round(point.value * -yScale + this.chartY + this.chartHeight);
        s = this.paper.circle(sx, sy, this.opt.symbol.width);
        s.attr({
          'opacity': symbolOpacity,
          'fill': this.opt.symbol.fill,
          'stroke': this.opt.symbol.strokeColor,
          'strokeWidth': this.opt.symbol.strokeWidth
        });
        point.symbol = s;
        symbolSet.push(s);
        if (i < 1) {
          pathConnectingPoints = pathConnectingPoints.concat(['M', this.chartX, this.chartHeight + this.chartY, 'L', sx, sy]);
        }
        if (this.data[index - 1]) {
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
      return symbolSet.toFront();
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
        dataPoints.push(new DataPoint(val, item[this.dataKey], 'prettyValue', item['date'], item['show']));
      }
      this.dataMaxVal = Math.max.apply(Math, values);
      this.dataMinVal = Math.min.apply(Math, values);
      this.values = values;
      return dataPoints;
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

    function DataPoint(value, prettyValue, xLabel, showXLabel) {
      this.value = value;
      this.prettyValue = prettyValue;
      this.xLabel = xLabel;
      this.showXLabel = showXLabel;
      this.x;
      this.y;
      this.column;
      this.symbol;
    }

    return DataPoint;

  })();

}).call(this);
