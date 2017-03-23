(function () {
  'use strict';

  angular
    .module('mindmapsample')
    .directive('d3DragZoomSample', directive);

  directive.$inject = ['d3Service'];

  /* @ngInject */
  function directive(d3Service) {
    var directive = {
      bindToController: false,
      controller: Controller,
      controllerAs: 'vm',
      link: link,
      restrict: 'A',
      scope: {}
    };
    return directive;

    function link(scope, element, attrs) {
      scope.element = element;
      scope.attrs = attrs;
      scope.extras = {
        width: 1040,
        height: 900
      };
      d3Service.d3().then(function (d3) {
        scope.svg = d3.select(element[0])
          .append('svg')
          .style('width', '1040px')
          .style('height', '900px');
        scope.rerender();
        // Browser onresize event
        window.onresize = function () {
          scope.$apply();
        };
      });
    }
  }

  /* @ngInject */
  function Controller($scope, d3Service) {
    /* jshint validthis:true */
    var vm = this;

    $scope.nodes = [];
    $scope.links = [];
    $scope.render = function () {
      render();
    };

    $scope.rerender = function () {
      $scope.render();
    };

    function render() {
      if (!$scope.svg) {
        return false;
      }

      $scope.svg.selectAll('*').remove();
      d3Service.d3().then(function (d3) {
        renderUsingD3(d3);
      });
    }

    function renderUsingD3(d3) {
      var margin = {
          top: -5,
          right: -5,
          bottom: -5,
          left: -5
        },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

      var zoom = d3.behavior.zoom()
        .scaleExtent([1, 10])
        .on("zoom", zoomed);

      var drag = d3.behavior.drag()
        .origin(function (d) {
          return d;
        })
        .on("dragstart", dragstarted)
        .on("drag", dragged)
        .on("dragend", dragended);

      var svg = $scope.svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.right + ")")
        .call(zoom);

      var rect = svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all");

      var container = svg.append("g");
      container.append("g")
        .attr("class", "x axis")
        .selectAll("line")
        .data(d3.range(0, width, 10))
        .enter().append("line")
        .attr("x1", function (d) {
          return d;
        })
        .attr("y1", 0)
        .attr("x2", function (d) {
          return d;
        })
        .attr("y2", height);

      container.append("g")
        .attr("class", "y axis")
        .selectAll("line")
        .data(d3.range(0, height, 10))
        .enter().append("line")
        .attr("x1", 0)
        .attr("y1", function (d) {
          return d;
        })
        .attr("x2", width)
        .attr("y2", function (d) {
          return d;
        });

      var dots = [{
        x: 100,
        y: 100
      }];
      dot = container.append("g")
        .attr("class", "dot")
        .selectAll("circle")
        .data(dots)
        .enter().append("circle")
        .attr("r", 5)
        .attr("cx", function (d) {
          return d.x;
        })
        .attr("cy", function (d) {
          return d.y;
        })
        .call(drag);

      function dottype(d) {
        d.x = +d.x;
        d.y = +d.y;
        return d;
      }

      function zoomed() {
        container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      }

      function dragstarted(d) {
        d3.event.sourceEvent.stopPropagation();
        d3.select(this).classed("dragging", true);
      }

      function dragged(d) {
        d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
      }

      function dragended(d) {
        d3.select(this).classed("dragging", false);
      }
    }
  }
})();
