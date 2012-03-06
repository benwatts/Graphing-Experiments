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
            revenueChart = new Graph('graph-revenue', data, 'visits_count');
          }
          if (visitorsChart != null) {
            visitorsChart.newData(data);
          } else {
            visitorsChart = new Graph('graph-visitors', data, 'visits_count');
          }
          if (ordersChart != null) {
            return ordersChart.newData(data);
          } else {
            return ordersChart = new Graph('graph-orders', data, 'visits_count', {
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
      this.opt = {};
      $.extend(true, this.opt, {
        height: $('#' + domId).height(),
        width: $('#' + domId).width(),
        gutter: {
          top: 10,
          right: 10,
          bottom: 20,
          left: 40
        },
        grid: {
          strokeColour: '#eee',
          strokeColourOnHover: '#ddd'
        },
        symbol: {
          radius: 4,
          fill: '90-#3084ca-#72abdb',
          fillOnHover: '90-#4eadfc-#2b9dfb',
          strokeWidth: 2,
          strokeColour: '#fff',
          visible: true
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
        this.canvas = Raphael(this.domId, this.opt.width, this.opt.height);
        this.tooltip = $('#' + domId).append('<div class="tooltip"> <div class="tooltip-title">N/A</div> <div class="tooltip-value">0</div> <div class="tooltip-arrow"></div> </div>').find('.tooltip:first');
        this.data = this.normalizedData(rawData);
        this.drawGraph();
      }
    }

    Graph.prototype.drawGraph = function() {
      var c, columnSet, fill, i, index, l, line, linesSet, numItems, pathConnectingPoints, point, prevPoint, s, sx, sy, symbolSet, t, xScale, yIncrements, yScale, _ref;
      numItems = this.data.length;
      xScale = this.chartWidth / numItems;
      pathConnectingPoints = [];
      columnSet = this.canvas.set();
      symbolSet = this.canvas.set();
      linesSet = this.canvas.set();
      yScale = this.chartHeight / this.dataMaxVal;
      yIncrements = this.chartHeight / yScale;
      for (i = 0; 0 <= yIncrements ? i <= yIncrements : i >= yIncrements; 0 <= yIncrements ? i++ : i--) {
        this.canvas.path(['M', this.chartX, Math.round(this.chartY + yScale * i), 'H', this.chartX + this.chartWidth]).attr({
          'stroke': '#eee'
        });
      }
      this.opt.symbol.visible = numItems * (this.opt.symbol.radius * 2) > this.chartWidth ? false : true;
      _ref = this.data;
      for (index in _ref) {
        point = _ref[index];
        i = parseInt(index);
        c = this.canvas.rect(index * xScale + this.chartX, this.chartY, xScale, this.chartHeight);
        c.attr({
          'fill': '#f00',
          'fill-opacity': 0,
          'stroke-width': 0
        });
        point.column = c;
        columnSet.push(c);
        sx = Math.round(c.attr('x') + xScale / 2);
        sy = Math.round(point.value * -yScale + this.chartY + this.chartHeight);
        s = this.canvas.circle(sx, sy, this.opt.symbol.radius);
        s.attr({
          'fill': this.opt.symbol.fill,
          'stroke': this.opt.symbol.strokeColour,
          'stroke-width': this.opt.symbol.strokeWidth
        });
        if (!this.opt.symbol.visible) s.hide();
        point.symbol = s;
        symbolSet.push(s);
        l = this.canvas.path(['M', sx, this.chartY, 'V', this.chartY + this.chartHeight]).attr({
          'stroke': '#eee'
        });
        if (!this.data[index].showXLabel) l.hide();
        linesSet.push(l);
        point.xLine = l;
        if (this.data[index].showXLabel) {
          t = this.canvas.text(sx, this.chartY + this.chartHeight + 10, this.data[index].xLabel);
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
        c.hover(this.colHover, this.colHoverOff, point, point);
      }
      line = this.canvas.path(pathConnectingPoints);
      line.attr({
        'stroke': this.opt.line.strokeColour,
        'stroke-width': this.opt.line.strokeWidth
      });
      fill = this.canvas.path(pathConnectingPoints);
      fill.attr({
        'fill': this.opt.line.fill,
        'stroke-width': 0,
        'fill-opacity': 0.05
      });
      linesSet.toFront();
      symbolSet.toFront();
      return columnSet.toFront();
    };

    Graph.prototype.normalizedData = function(raw) {
      var data, dataPoints, i, item, numDataPoints, timeOnly, val, values;
      data = raw.periodical_facts.data;
      numDataPoints = data.length - 1;
      dataPoints = [];
      values = [];
      timeOnly = raw.start_date === raw.end_date ? true : false;
      for (i = 0; 0 <= numDataPoints ? i <= numDataPoints : i >= numDataPoints; 0 <= numDataPoints ? i++ : i--) {
        item = data[i];
        val = item[this.dataKey] != null ? item[this.dataKey] : 0;
        values.push(val);
        dataPoints.push(new DataPoint(this, val, item['date'], this.prettyDate(item['date'], timeOnly), item['show']));
      }
      this.dataMaxVal = Math.max.apply(Math, values);
      this.dataMinVal = Math.min.apply(Math, values);
      this.values = values;
      return dataPoints;
    };

    Graph.prototype.prettyDate = function(date, timeOnly) {
      if (timeOnly == null) timeOnly = false;
      if (timeOnly) date = date.split(' ')[1].substr(0, 5);
      return date;
    };

    Graph.prototype.newData = function(raw) {
      this.canvas.clear();
      this.data = this.normalizedData(raw);
      return this.drawGraph();
    };

    Graph.prototype.colHover = function(e, x, y) {
      var tooltip;
      this.symbol.attr('fill', this.graph.opt.symbol.fillOnHover).show();
      this.xLine.attr('stroke', this.graph.opt.grid.strokeColourOnHover).show();
      tooltip = this.graph.tooltip;
      tooltip.find('.tooltip-title').text(this.label);
      tooltip.find('.tooltip-value').text(this.value);
      return tooltip.show().css({
        left: this.symbol.attr('cx') - tooltip.innerWidth() / 2,
        top: this.symbol.attr('cy') - tooltip.height()
      });
    };

    Graph.prototype.colHoverOff = function(e, x, y) {
      this.symbol.attr('fill', this.graph.opt.symbol.fill);
      if (!this.graph.opt.symbol.visible) this.symbol.hide();
      this.xLine.attr('stroke', this.graph.opt.grid.strokeColour);
      if (!this.showXLabel) this.xLine.hide();
      return $(this.graph.tooltip).hide();
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

    function DataPoint(graph, value, label, xLabel, showXLabel) {
      this.graph = graph;
      this.value = value;
      this.label = label;
      this.xLabel = xLabel;
      this.showXLabel = showXLabel;
      this.xLine;
      this.column;
      this.symbol;
    }

    return DataPoint;

  })();

}).call(this);
