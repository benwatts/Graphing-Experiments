var ChartManager = (function() {
  function ChartManager(domid, width, height, moneyFormat, lines) {
    this.domid       = domid;
    this.width       = width;
    this.height      = height;
    this.moneyFormat = moneyFormat;
    this._initLines(lines);
  }

  ChartManager.prototype = {
    upperBound: 15,
    timelineHeight: 65,
    labelWidth: 80,
    tooltipWidth: 100,
    tooltipHeight: 75,
    tooltipOffset: 20,
    bottomPadding: 20,

    setup: function(force_reload_paper) {
      if (this.canRender()) {
        if (!this.paper || force_reload_paper) {
          this.paper = Raphael(this.domid);
          this._onMouseOut();
        }
        this._makeLinesEnumerable();

        this.graph = new Graph(this, this._coords('graph'));
        this.timeline = new Timeline(this, this._coords('timeline'));
      }
    },
    canRender: function() {
      return ($(this.domid))
    },
    // send {force_reload: true} if the original dom element for the chart has been lost since last render
    render: function(options) {
      this.setup(options['force_reload']);
      
      var hasNewData   = false;
      
      if (options['domid']) {
        this.paper = Raphael(this.domid);
      }
      if (options['lines'])  { 
        hasNewData = (this.data && (this.data.length > 0)) || (options['data'] && (options['data'].length > 0));
        this.linesToShow = options['lines']; 
      }
      if (options['data'] && (options['data'].length > 0))   { 
        this.data = new Data(this, options['data'], this._coords('graph')); 
        hasNewData = true;
      }

      if (hasNewData) { this._reset(); }
    },
    toggleLine: function(lineToToggle) {
      var linesToShow = [];
      var isShowing = this.isShowing.bind(this);
      this.eachLine(function(key, line) {
        var matching = (key === lineToToggle);
        var showing  = isShowing(key);
        if ((!matching && showing) || (matching && !showing)) { linesToShow.push(key); }
      })
      this.render({lines: linesToShow});
    },
    isShowing: function(key) { 
      return this.linesToShow.indexOf(key) >= 0; 
    },
    formatAsMoney: function(number) {
      var re = new RegExp('{{(amount|amount_no_decimals|amount_with_comma_separator|amount_no_decimals_with_comma_separator)}}');
      return this.moneyFormat.replace(re, number)
    },
    _coords: function(string) {
      var coords = {
        'graph': {
          x: this.tooltipOffset, 
          y: this.upperBound, 
          width: this.width - this.labelWidth - this.tooltipOffset, 
          height: this.height - this.upperBound - this.timelineHeight - this.bottomPadding
        },
        'timeline': {
          x: 0,
          y: this.height - this.timelineHeight,
          width: this.width,
          height: this.timelineHeight
        }
      }
      return coords[string];
    },
    _reset: function() {
      this.paper.clear();
      this.paper.path(['M', 0, 0]);
      this.tooltip = null;
      this.graph.draw();
      this.timeline.draw();
      this._hoverSpots();
    },
    _initLines: function(lines) { 
      this.linesToShow = lines.defaults;
      delete lines.defaults;
      
      this.lines = {};
      this.keys = [];
      var colors = [ '#91d15a', '#348fb8', 'orange', '#8d785a'];
      for (var key in lines) {
        this.keys.push(key);
        var label = lines[key];
        
        // does line use money? if label has a $
        var md    = label.match(/\$ (.+)/);
        if (md) { label = md[1]; }
        this.lines[key] = {
          'label': label,
          'max': 0, 
          'color': colors.shift(), 
          'money': md 
        };
      }
    },
    _makeLinesEnumerable: function() {
      this.eachLine = (function(manager) {
        var loop = function(f) {
          for (var key in manager.lines) {
            var line = manager.lines[key];
            f.call(this, key, line);
          }
        }
        return loop;
      })(this)
      this.eachLineShowing = (function(manager) {
        var loop = function(f) {
          var max = manager.linesToShow.length;
          var i = -1;
          while (++i < max) {
            var key = manager.linesToShow[i];
            var line = manager.lines[key];
            f.call(this, key, line);
          }
        }
        return loop;
      })(this)
    },
    _showTooltip: function(day) {
      if (this.tooltip && this.linesToShow.length > 0) { 
        this.tooltip.slideTo(day); 
      } else { 
        this.tooltip = new Tooltip(day, this, {x: this.tooltipOffset, y: this.upperBound, width: this.tooltipWidth, height: this.tooltipHeight}) 
        this.tooltip.set.insertAfter(this.graph.set);
        if (this.tooltip.bigLine) {          
          this.tooltip.bigLine.insertBefore(this.tooltip.set);
        }
      }
    },
    _hoverSpots: function() {
      var manager = this;
      var hover = function(day) { 
        manager.tooltipHovered = true;
        manager._showTooltip(day);
      }
      this.data.each(function(day) {
        new Hotspot(manager, day, hover);
      });
    },
    _onMouseOut: function() {
      var manager = this;
      var pointerInside = function(event) {
        var chartPosition = Element.viewportOffset(manager.domid);
        var scrollOffsets = document.viewport.getScrollOffsets();
        x = window.Event.pointerX(event) - scrollOffsets.left;
        y = window.Event.pointerY(event) - scrollOffsets.top;
        var isInsideX = (x > chartPosition.left) && (x < chartPosition.left + manager.width);
        var isInsideY = (y > chartPosition.top) && (y < chartPosition.top + manager.height);
        var isInside = isInsideX && isInsideY;
        return (isInside);
      }
      window.Event.observe(document, 'mousemove', function(event) {
        var hover = function() {
          if (!manager.tooltip) { return }
          if (pointerInside(event)) {
            manager._mouseWentOut = false;
          } else {
            manager.tooltip && !manager._mouseWentOut && manager.tooltip.hide(); 
            manager._mouseWentOut = true
          }
        }
        clearTimeout(manager._hoverTimer);
        manager._hoverTimer = setTimeout(hover, 5)
      })
    }
  }
  
  function Hotspot(manager, day, callback) {
    this.manager = manager;
    var spot = manager.paper.rect(day.x-(day.width/2), manager.upperBound -5, day.width, manager.height - manager.upperBound);
    spot.attr({opacity: 0, fill: '#00C'});
    var over = function() {
      clearTimeout(manager._hoverTimer)
      clearTimeout(manager._hotspotTimer);
      manager._hotspotTimer = setTimeout(function() { callback(day) }, 20)
    }
    
    spot.hover(over); 
  }
  
  function Data(manager, data, coords) {
    this.manager = manager;
    this.lines = manager.lines;
    this.linesToShow = manager.linesToShow;
    this.tooltipOffset = manager.tooltipOffset;
    
    Object.extend(this, coords);
    this._eachLine = manager.eachLine;
    this._setLineMaxYValues(data);
    this._normalizeData(data, this.width);
    return data;
  }
  
  Data.prototype = {
    _normalizeData: function(data) {
      // length - 1 so that the last point is at the max x value
      var length = data.length - 1 > 0 ? data.length - 1 : 1;
      this.avgDayWidth = Math.floor(this.width / (length));
      this.remainder = this.width - (this.avgDayWidth * (length));
      var x = this.x;
      data.each(function(day) {
        day.y         = {};
        day.formatted = {};

        day.width     = this._calcWidth(day);
        day.x         = x;
        x             = x + day.width;

        this._setAndFormatYValues(day);
      }.bind(this))
    },
    _calcWidth: function(day) {
      var width = this.avgDayWidth;
      if (this.remainder > 0) { this.remainder -= 1; width += 1; }// add extra pixels until the remainder is gone
      return width;
    },
    _setAndFormatYValues: function(day) {
      var findMinY = (function(manager) {
        var loop = function() {
          var values = [];
          manager.eachLineShowing(function(key) {
            values.push(day.y[key]);
          });
          day.tooltip_y = Math.min.apply(Math, values);
        }
        return loop;
      })(this.manager)

      this._eachLine(function(key, line) {
        var actual = (day[key] || 0)
        day.y[key] = this._calcY(actual, line.max);
        day.formatted[key] = this._formatFloat(actual, line.money);
        day.findMinY = findMinY
      })
    },
    _setLineMaxYValues: function(data) {
      this._eachLine(function(key, line) { line.max = 0; });
      
      data.each(function(day) {
        this._eachLine(function(key, line) {
          line.max = Math.max(day[key] || 0, line.max);
        })
      }.bind(this))
    },
    _calcY: function(actual, max) {
      var normalized = (actual == 0) ? 0 : Math.round( (actual/max) * (this.height) );
      var flipped = this.height - normalized + this.y; // up is low, down is high
      return flipped;
    },
    _formatFloat: function(value, isMoney) {
      var n = new Number(value);
      if (n < 100) {
        return isMoney ? n.toFixed(2) : n;
      } else if (n < 999) {
        return n.toFixed(0);
      } else {
        var inK = (n / 1000).toFixed(1);
        return inK + 'k';
      }
    }
  }
  
  function Graph(manager, coords) {
    this.manager = manager;
    this.lines = manager.lines;
    this.linesToShow = manager.linesToShow;
    Object.extend(this, coords);
    this.min_label_y = this.y;
    this.max_label_y = this.y + this.height;
    this._eachLine = manager.eachLineShowing;
    this.set = this.manager.paper.set();
  }
  
  Graph.prototype = {
    draw: function() {
      this.data = this.manager.data;
      this.linesToShow = this.manager.linesToShow;
      this._eachLine(this._drawLine);
      this._addLabels();
    },
    _drawLine: function(key, line) {
      var lineAttrs = {'stroke': line.color, 'stroke-width': 2.8};
      var path = this.manager.paper.path(this._drawPath(key)).attr(lineAttrs)
      this.set.push(path);

      var lastPoint = path.getPointAtLength(path.getTotalLength());
      var dotAttrs  = {'stroke': line.color, 'fill': line.color};
      this.set.push(this.manager.paper.circle(lastPoint.x, lastPoint.y, 3).attr(dotAttrs));
      line.labelAt = lastPoint;
    },
    _drawPath: function(key) {
      var path = [];
      var firstDay = this.data[0];
      var pathToPoint = function(day, key) {
        var path = day === firstDay ? 'M' : 'L';
        return [path, day.x, day.y[key]];
      }
      this.manager.data.each(function(day) {
        path = path.concat(pathToPoint(day, key));
      })
      return path
    },
    _addLabels: function() {
      var sorted = this._boundedAndSortedLabels();
      if (sorted.length > 1) {
        this._offsetLabels(sorted); 
      }
      this._eachLine(this._drawLabel);
    },
    _drawLabel: function(key, line) {
      var point = line.labelAt;
      var label = line.label;
      var value = this._lastDay().formatted[key];

      if (line.money) { value = this.manager.formatAsMoney(value) }
      this.set.push(this.manager.paper.text(point.x+10, point.y-5, value).attr({'text-anchor': 'start', 'fill': line.color, 'font-size':'13', 'font-weight':'bold'}));
      this.set.push(this.manager.paper.text(point.x+10, point.y+8, label).attr({'text-anchor': 'start', 'fill': line.color, 'font-size':'11'}));     
    },
    _lastDay: function() {
      return this.data[this.data.length - 1];
    },
    _boundedAndSortedLabels: function() {
      var labelWithinBounds = function(y) {
        if (y < this.min_label_y) { y = this.min_label_y; }
        if (y > this.max_label_y) { y = this.max_label_y; }
        return y;
      }.bind(this)

      var adjustIfNeeded = function(line) {
        line.labelAt.y = labelWithinBounds(line.labelAt.y);
      }

      var smallestFirst = function(a,b) {
        var lineA = this.lines[a];
        var lineB = this.lines[b];
        // adjustment inside sort, saves a loop...
        adjustIfNeeded(lineA);
        adjustIfNeeded(lineB);
        if (lineB.labelAt.y == lineA.labelAt.y) { lineB.labelAt.y -= 1; }

        var aY = lineA.labelAt.y;
        var bY = lineB.labelAt.y;
        if (aY == bY) { return 0; }
        return((aY < bY) ? -1 : 1)
      }.bind(this)

      var sorted = this.linesToShow.slice();
      if (sorted.length == 1) {
        adjustIfNeeded(this.lines[sorted[0]])
        return sorted;
      } else {
        return sorted.sort(smallestFirst);
      }
    },
    _offsetLabels: function(labels) {
      var labelHeight = 30;

      var tooClose = function(smaller, larger) {
       return (larger.labelAt.y - smaller.labelAt.y < labelHeight);
      }
      var distanceNeeded = function(array, lowerBound, upperBound) {
        var distance = 0;

        var i = array.length - 1;
        var j = i-1;

        var smaller, larger;
        var lastTarget = upperBound;
        while ((larger = this.lines[array[i]]) && (smaller = this.lines[array[j]])) {
          var target = larger.labelAt.y - labelHeight;
          if (lastTarget - labelHeight < target)
            target = lastTarget - labelHeight
          delta = smaller.labelAt.y - target
          if ((delta > 0) && (lowerBound > target) && (delta > distance))
            distance = delta
          lastTarget = target
          i--; j--;
        }

        return distance;
      }.bind(this)
      var getFurther = function(smaller, array, lowerBound) {
        var distance = 0;
        var i = 0;
        var max = array.length;
        var next;
        while ((next = this.lines[array[i]]) && (i < max)) {
          if (smaller.labelAt.y > lowerBound) {
            smaller.labelAt.y -= 1; distance += 1;
          }
          var upperBound = this.max_label_y - (labelHeight * (max - i - 1));
          if ((next.labelAt.y - smaller.labelAt.y < labelHeight) && (next.labelAt.y < upperBound - 1)) {
            next.labelAt.y += 1; distance += 1;
          }
          i++;
        }
        return distance;
      }.bind(this)
      var moveFurtherApart = function(array, lowerBound) {
        var smaller  = this.lines[array[0]];
        var lower    = (lowerBound > smaller.labelAt.y) ? lowerBound : smaller.labelAt.y
        var distance = distanceNeeded(array, lower, this.max_label_y);
        var others   = array.slice(1, array.length);

        var j = 0; var max_j = this.linesToShow.length * 50;// max_j will stop infinite loops and save the browser in case of programmer idiocy
        while ((distance >= 1) && (++j < max_j)) {
          distance -= getFurther(smaller, others, lowerBound);
        }
      }.bind(this);

      var i = 0; var max = labels.length; 
      var lowerBound = this.min_label_y;
      var distance = 0;
      while (i < (max - 1)) {// this compares i with i+1, no need go all the way to max
        moveFurtherApart(labels.slice(i, labels.length), lowerBound)
        lowerBound = this.lines[labels[i]].labelAt.y + labelHeight;
        i++;
      }
    }
  }
  
  function Tooltip(point, manager, coords) {
    this.manager = manager;
    this.width  = coords.width;
    this.height = coords.height;
    this.leftBound = coords.x
    this.lowerBound = coords.y;
    this.offset = manager.tooltipOffset;
    
    this._labels   = [];
    this.lines     = manager.lines;
    this._eachLine = manager.eachLine;
    this.set       = manager.paper.set();
    
    if (manager.linesToShow.length > 0) { this._startAt(point); }
  }
  
  Tooltip.prototype = {
    showing: null,
    _arrowHeight: 5,
    _gapAroundPoint: 10,
    attrs: {fill:'black', opacity: 0.85},
    _labelsAt: [14,29,44,59,74],
    slideTo: function(point) {
      this.show();
      this._changePosition(point);
      this._updateLabels(point);
      this.previousPoint = point;
    },
    show: function() {
      this.showing = true;
      clearInterval(this.fadeoutTimer);
      this.set.attr({opacity: 100});
      this.bigLine.show();
      this.showUntil = (new Date()).getTime() + this.hideDelay;
      clearTimeout(this.hideTimer);
    },
    hide: function() {
      if (!this.showing) { return }
      var askedToHide = new Date();
      this.showing = false; 
      var opacity = 100;
      var opacityDrop = 1;
      var fadeOut = function() {
        if (opacity > 0) {
          opacity -= opacityDrop;
          opacityDrop *= 1.2;
          this.set.attr({'opacity': opacity/100})
        } else {
          clearInterval(this.fadeoutTimer);
        }
      }.bind(this)
      this.fadeoutTimer = setInterval(fadeOut, 10)
      this.bigLine.hide()
    },
    _drawBigLine: function() {
      var path = [];
      path = ['M', this.x + (this.width/2), this.manager.height - this.manager.timelineHeight, 'L', this.x + (this.width/2), 0]
      var line = this.manager.paper.path(path);
      line.attr({'stroke': "#ddd", 'stroke-width': 2, 'stroke-dasharray': '.'})
      return line;
    },
    _changePosition: function(point) {
      point.findMinY();
      var relativeX = this._calcRelativeX(point);
      var translation = relativeX + ',' + this._calcRelativeY(point);
      this.set.animate({'translation': translation}, 100, '<>').show();
      this.bigLine.animate({'translation': relativeX + ',' + 0}, 100, '<>').show()
    },
    _x: function(point) {
      // the x value of the tooltip is half the width of the tooltip away from the point
      return(point.x - this.width/2);
    },
    _y: function(point) {
      var y = point.tooltip_y - this.height - this._arrowHeight - this._gapAroundPoint;
      return y;
    },
    _calcRelativeX: function(point) {
      var relX = point.x - this.previousPoint.x;
      var newX = this._x(point);
      var offscreen = (newX < this.leftBound)
      if (offscreen) {
        relX = this._slideLeft(newX, relX);
      } else if (this._wasOffscreen) {
        relX = this._slideRight(relX);
      }
      return relX;
    },
    _calcRelativeY: function(point) {
      var relY = point.tooltip_y - this.previousPoint.tooltip_y
      if (this._shouldFlip(this._y(point))) {
        relY = this._flipVertical(relY)
      }
      return relY;
    },
    _flipVertical: function(relY) {
      var wasPointingDown = this.arrowPoints === 'down'
      this.arrowPoints = (wasPointingDown ? 'up' : 'down');
      var flip = (wasPointingDown) ? -1 : 1
      this.arrow.rotate(180).translate(0, ((this.height + this._arrowHeight) * flip))
      this.arrowPoints = (wasPointingDown ? 'up' : 'down');
      var delta = this.height + (this._gapAroundPoint * 2) + (this._arrowHeight * 2);
      return(relY - (flip * delta));
    },
    _shouldFlip: function(newY) {
      var wasPointingUp = this.arrowPoints === 'up';
      var offscreen = newY < this.lowerBound;
      return ((!wasPointingUp && offscreen) || (wasPointingUp && !offscreen))
    },
    _slideLeft: function(newX, relativeX) {
      var delta = 0 - (newX/2) + (this.offset);
      if (this._wasOffscreen) { delta -= this._wasOffscreen; }
      this._wasOffscreen = (this._wasOffscreen ? this._wasOffscreen : 0) + delta;
      this.arrow.translate(-delta,0);
      this.bigLine.translate(-delta,0);
      return(relativeX + delta);
    },
    _slideRight: function(relativeX) {
      this.arrow.translate(this._wasOffscreen,0)
      this.bigLine.translate(this._wasOffscreen,0)
      relativeX -= this._wasOffscreen;
      this._wasOffscreen = null;
      return relativeX;
    },
    _updateLabels: function(point) {
      var i = 0;
      this._labels[i].attr({text: point.label});
      this._eachLine(function(key, line) {
        i++;
        this._labels[i].attr({text: this._formatLabel(point, key, line)})
      })
    },
    _formatLabel: function(point, key, line) {
      var label = point.formatted[key] + ' ' + line.label;
      if (line.money) { label = this.manager.formatAsMoney(point.formatted[key]) + ' ' + key }
      return label;
    },
    _drawArrow: function() {
      var arrow = this.manager.paper.path("M{0} {1} L{2} {3} L{4} {1} z",this.x,this.y,(this.x+5),(this.y+5),(this.x+10))
      arrow.translate((this.width/2)-5, this.height)
      arrow.attr(this.attrs);
      // draws pointing down, then flips if needed
      if (this.arrowPoints === 'up') { arrow.rotate(180).translate(0, -this._arrowHeight-this.height); }
      this.arrow = arrow;
      return this.arrow;
    },
    _drawBackground: function() {
      this.background = this.manager.paper.rect(this.x, this.y, this.width, this.height, 4).attr(this.attrs)
      return this.background;
    },
    _drawLabel: function(label, color) {
      var drawnLabel = this.manager.paper.text(
        this.x+8, 
        this.y+this._labelsAt[this._labels.length],// because it isn't pushed yet, length, not length -1 
        label
      )

      this._labels.push(drawnLabel.attr({fill: color, 'text-anchor':'start', 'font-size':'11'}));
      return drawnLabel;
    },
    _startAt: function(point) {
      this.showing = true;
      point.findMinY();
      this.x = this._x(point);
      this.y = this._y(point);

      this.arrowPoints = (this.y < this.lowerBound) ? 'up' : 'down';
      // if pointing up: y value is the "tooltip_y" of the point, plus double offset
      // but if pointing down: y is the full height of the tooltip away from the point, plus the offset
      if (this.arrowPoints === 'up') { this.y = point.tooltip_y + this._arrowHeight + this._gapAroundPoint; }
      this.bigLine = this._drawBigLine();
      this.set.push(
        this._drawBackground(),
        this._drawArrow(),
        this._drawLabel(point.label, 'white')
      );
      this._eachLine(function(key, line) {
        this.set.push(this._drawLabel(this._formatLabel(point, key, line), line.color));
      })
      this.previousPoint = point;
    }
  }
  
  function Timeline(manager, coords) {
    this.manager = manager;
    Object.extend(this, coords);
    this.lineLength = this.height / 4;
  }
  
  Timeline.prototype = {
    lineAttrs: {'stroke': "#ddd", 'stroke-width': 1},
    otherLineAttrs: {'stroke': '#e0e0e0', 'stroke-width': 1, 'stroke-dasharray': '.'},
    textAttrs: { 'text-anchor': 'start', 'fill': '#999', 'font-size': '11' },
    draw: function() {
      var path = ['M', 0, this.y + 0.5, 'l', this.width + 0.5 , 0];
      this.manager.paper.path(path).attr(this.lineAttrs);
      this._drawDates()
    },
    _drawDates: function() {
      var path = [];
      var clearPreviousDay = this.x;
      var lastDay = this.manager.data[this.manager.data.length - 1];
      this.manager.data.each(function(day) {
        day.show = day.show && day.x > clearPreviousDay; // override show value if there's not enough room
        if (day.show) {
          path = path.concat(['M', day.x, this.y, 'L', day.x, this.y + this.lineLength])
          this.manager.paper.path(['M', day.x, this.y, 'L', day.x, 0]).attr(this.otherLineAttrs).toBack()
          var text = this.manager.paper.text(7+day.x, this.y+10, day.label).attr(this.textAttrs)
          clearPreviousDay = day.x + text.getBBox().width;
        }
      }.bind(this))
      this.manager.paper.path(path).attr(this.lineAttrs)
    }
  }
  
  return ChartManager;
})();