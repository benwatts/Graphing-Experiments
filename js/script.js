(function() {
  var Graph, GraphData, GraphTimeline;

  $(document).ready(function() {
    return window.myFirstChart = Graph('graph-revenue');
  });

  Graph = (function() {

    function Graph(domid, options) {
      var bg;
      if (options == null) options = {};
      this.domid = domid;
      this.opt = $.extend({
        height: 200,
        width: 800,
        padding: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        }
      }, options);
      if (document.getElementById(this.domid) != null) {
        this.paper = Raphael(this.domid, this.opt.width, this.opt.height);
        bg = this.paper.rect(0, 0, this.opt.width, this.opt.height);
        bg.attr('fill', '#ddd');
        bg.attr('stroke-width', 0);
        this.paper.linechart(0, 0, this.opt.width, this.opt.height, [0, 1, 2, 3, 4, 5, 6, 7], [10, 15, 15, 1, 15, 20, 30], {
          shade: true,
          symbol: 'circle',
          gutter: 0
        });
      }
    }

    return Graph;

  })();

  GraphTimeline = (function() {

    function GraphTimeline() {}

    return GraphTimeline;

  })();

  GraphData = (function() {

    function GraphData() {}

    return GraphData;

  })();

}).call(this);
