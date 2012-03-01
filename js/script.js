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
      var bg, _i, _ref, _results;
      if (options == null) options = {};
      this.domId = domId;
      this.rawData = rawData;
      this.dataKey = dataKey;
      this.opt = $.extend({
        debug: false,
        height: 200,
        width: 800,
        gutter: {
          top: 10,
          right: 0,
          bottom: 20,
          left: 40
        }
      }, options);
      this.chartX = this.opt.gutter.left;
      this.chartY = this.opt.gutter.top;
      this.chartWidth = this.opt.width - this.opt.gutter.left - this.opt.gutter.right;
      this.chartHeight = this.opt.height - this.opt.gutter.top - this.opt.gutter.bottom;
      this.maxVal = this.minVal = 0;
      if (document.getElementById(this.domId) != null) {
        this.paper = Raphael(this.domId, this.opt.width, this.opt.height);
        bg = this.paper.rect(0, 0, this.opt.width, this.opt.height);
        bg.attr('stroke-width', 1);
        this.highlightColumns();
        this.data = this.normalizedData();
        this.paper.linechart(this.chartX, this.chartY, this.chartWidth, this.chartHeight, (function() {
          _results = [];
          for (var _i = 0, _ref = this.values.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this), this.values, {
          shade: true,
          symbol: 'circle',
          gutter: 0.1
        });
      }
    }

    Graph.prototype.normalizedData = function() {
      var dataPoints, i, item, numDataPoints;
      numDataPoints = this.rawData.length - 1;
      dataPoints = [];
      this.values = [];
      for (i = 0; 0 <= numDataPoints ? i <= numDataPoints : i >= numDataPoints; 0 <= numDataPoints ? i++ : i--) {
        item = this.rawData[i];
        this.values.push(item[this.dataKey]);
        dataPoints.push(new DataPoint(item[this.dataKey], 'prettyValue', item['date'], item['show']));
      }
      this.maxVal = Math.max.apply(Math, this.values);
      this.minVal = Math.min.apply(Math, this.values);
      return dataPoints;
    };

    Graph.prototype.highlightColumns = function() {
      var col, colWidth, colWidthRemainder, fillColour, numDataPoints, point, _results;
      numDataPoints = this.rawData.length;
      colWidth = this.chartWidth / numDataPoints;
      colWidthRemainder = this.chartWidth - numDataPoints * colWidth;
      _results = [];
      for (point = 0; 0 <= numDataPoints ? point <= numDataPoints : point >= numDataPoints; 0 <= numDataPoints ? point++ : point--) {
        col = this.paper.rect(point * colWidth + this.opt.gutter.left, this.opt.gutter.top, colWidth, this.chartHeight);
        fillColour = point % 2 === 0 ? '#ff0' : '#09f';
        col.attr('fill', fillColour);
        _results.push(col.attr('stroke-width', 0));
      }
      return _results;
    };

    return Graph;

  })();

  /* 
    DATAPOINT! 
    ALALALALALALALALALALAL
  
         value -- raw value 
   prettyValue -- value to display in bubble
        xLabel -- label for x axis
    showXLabel -- show label on x axis?
  */

  DataPoint = (function() {

    function DataPoint(value, prettyValue, xLabel, showXLabel) {
      this.value = value;
      this.prettyValue = prettyValue;
      this.xLabel = xLabel;
      this.showXLabel = showXLabel;
    }

    return DataPoint;

  })();

}).call(this);
