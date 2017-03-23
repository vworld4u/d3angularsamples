(function () {
  'use strict';

  angular
    .module('mindmapsample')
    .directive('nonForceGraph', directive);

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
          .style('width', '1000px')
          .style('height', '400px');
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
      var container, zoom, drag, svg, nodes, links, width, height, nodeEls, linkEls, selectedNode, lastNodeId = 0,
        colors = d3.scale.category10();

      zoom = d3.behavior.zoom()
        .scaleExtent([1, 10])
        .on('zoom', zoomed);
      drag = d3.behavior.drag()
        .origin(function (d) {
          return d;
        })
        .on('dragstart', dragstarted)
        .on('drag', dragged)
        .on('dragend', dragended);
      svg = $scope.svg;
      nodes = $scope.nodes || [];
      links = $scope.links || [];

      svg.attr('viewBox', '0,0,' + $scope.extras.width + ',' + $scope.extras.height)
        .style('background-color', '#f0f0f0')
        .text('The Scene Graph')
        .select('#graph').call(zoom);
      width = $scope.extras.width;
      height = $scope.extras.height;

      container = svg.append('g');
      nodeEls = container.append('svg:g').selectAll('g');
      linkEls = container.append('svg:g').selectAll('g');

      svg.on('dblclick', svgDoubleClicked).on('mousedown', mousedown)
        .on('mousemove', mousemove)
        .on('mouseup', mouseup);

      // Functions
      function zoomed() {
        container.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
      }

      function dragstarted(d) {
        d3.event.sourceEvent.stopPropagation();
        d3.select(this).classed('dragging', true);
      }

      function dragged(d) {
        d3.select(this).attr('cx', d.x = d3.event.x).attr('cy', d.y = d3.event.y);
      }

      function dragended(d) {
        d3.select(this).classed('dragging', false);
      }

      function mousedown() {}

      function mousemove() {}

      function mouseup() {}

      function svgDoubleClicked() {
        if (d3.event.which !== 1) return;
        if (d3.event.target.nodeName === 'rect' || d3.event.target.nodeName === 'INPUT') return;
        var point = d3.mouse(this),
          node = {
            id: ++lastNodeId,
            reflexive: false,
            title: 'Node ' + lastNodeId
          };
        node.x = point[0];
        node.y = point[1];
        nodes.push(node);
        restart();
      }

      function restart() {
        nodeEls = nodeEls.data(nodes, function (d) {
          return d.title || d.id;
        });

        // update existing nodes (reflexive & selected visual states)
        nodeEls.selectAll('rect')
          .style('fill', function (d) {
            return (d === selectedNode) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
          })
          .classed('reflexive', function (d) {
            return d.reflexive;
          });

        var g = nodeEls.enter().append('svg:g').call(drag);
        g.append('svg:rect')
          .attr('class', 'node')
          .attr('x', function (d) {
            return d.x;
          }).attr('y', function (d) {
            return d.y;
          }).attr('height', '30px')
          .attr('width', function (d) {
            return (d.title ? d.title.length : 20) * 20;
          }).style('fill', function (d) {
            return (d === selectedNode) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
          }).style('stroke', function (d) {
            return d3.rgb(colors(d.id)).darker().toString();
          }).classed('reflexive', function (d) {
            return d.reflexive;
          });

        // show node IDs
        g.append('svg:text').attr('x', function (d) {
            return d.x;
          }).attr('y', function (d) {
            return d.y;
          }).attr('text-anchor', 'center')
          .attr('class', 'id')
          .text(function (d) {
            return d.title;
          });
        nodeEls.exit().remove();
      }

      function zoomed() {
        container.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
      }

      function dragstarted(d) {
        d3.event.sourceEvent.stopPropagation();
        d3.select(this).classed('dragging', true);
        restart();
      }

      function dragged(d) {
        d3.select(this).attr('cx', d.x = d3.event.x).attr('cy', d.y = d3.event.y);
        restart();
      }

      function dragended(d) {
        d3.select(this).classed('dragging', false);
        restart();
      }
    }
  }
})();
