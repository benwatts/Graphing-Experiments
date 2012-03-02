(function() {
  var DataPoint, Graph;

  $(document).ready(function() {
    var myFirstChart;
    return myFirstChart = new Graph('graph-revenue', testJson.periodical_facts.data, 'visits_count', {
      debug: true
    });
  });

  Graph = (function() {

    function Graph(domId, rawData, dataKey, options) {
      var bg;
      if (options == null) options = {};
      this.domId = domId;
      this.dataKey = dataKey;
      this.opt = $.extend({
        debug: false,
        height: 200,
        width: 800,
        gutter: {
          top: 10,
          right: 10,
          bottom: 20,
          left: 40
        }
      }, options);
      this.chartX = this.opt.gutter.left;
      this.chartY = this.opt.gutter.top;
      this.chartWidth = this.opt.width - this.opt.gutter.left - this.opt.gutter.right;
      this.chartHeight = this.opt.height - this.opt.gutter.top - this.opt.gutter.bottom;
      this.dataMaxVal = this.dataMinVal = 0;
      if (document.getElementById(this.domId) != null) {
        this.paper = Raphael(this.domId, this.opt.width, this.opt.height);
        bg = this.paper.rect(0, 0, this.opt.width, this.opt.height);
        bg.attr('stroke-width', 1);
        this.data = this.normalizedData(rawData);
        this.drawGraph();
      }
    }

    Graph.prototype.drawGraph = function() {
      var c, index, numItems, point, s, sWidth, sx, sy, xScale, yScale, _ref, _results;
      numItems = this.data.length;
      yScale = this.chartHeight / this.dataMaxVal;
      xScale = this.chartWidth / numItems;
      sWidth = 4;
      _ref = this.data;
      _results = [];
      for (index in _ref) {
        point = _ref[index];
        c = this.paper.rect(index * xScale + this.chartX, this.chartY, xScale, this.chartHeight);
        c.attr({
          'fill': index % 2 === 0 ? '#ff0' : '#09f',
          'stroke-width': 0
        });
        sx = Math.round(c.attr('x') + sWidth);
        sy = Math.round(point.value * -yScale + this.chartY + this.chartHeight);
        s = this.paper.circle(sx, sy, sWidth).attr({
          'fill': '#444',
          'stroke-width': 0
        });
        point.column = c;
        _results.push(point.symbol = s);
      }
      return _results;
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
