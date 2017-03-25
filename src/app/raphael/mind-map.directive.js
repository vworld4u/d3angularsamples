(function () {
  'use strict';

  angular
    .module('mindmapsample')
    .directive('raphaelMindMap', directive);

  directive.$inject = [];

  /* @ngInject */
  function directive() {
    var directive = {
      bindToController: true,
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
      scope.render();
      window.onresize = function () {
        scope.$apply();
      };
    }
  }

  /* @ngInject */
  function Controller($scope, _) {
    /* jshint validthis:true */
    var $ctrl = this;
    var lastNode = 0;

    $scope.nodes = [];
    $scope.links = [];
    $scope.render = function () {
      renderRaphael();
    };

    $scope.rerender = function () {
      renderRaphael();
    };

    if ($scope.element) {
      $scope.render();
    }

    function renderRaphael() {
      var paper;
      if (!$scope.paper) {
        Raphael.st.draggable = function () {
          var me = this,
            myself = getNode(me),
            lx = 0,
            ly = 0,
            ox = 0,
            oy = 0,
            moveFnc = function (dx, dy) {
              lx = dx + ox;
              ly = dy + oy;
              me.transform('t' + lx + ',' + ly);
              var nearNode = findNearestNode(myself);
              if (nearNode) {
                drawNeighbourhood(nearNode, myself);
              } else if (myself.nearOne) {
                eraseNeighbourhood(myself.nearOne);
                myself.nearOne = undefined;
              }
            },
            startFnc = function () {},
            endFnc = function () {
              ox = lx;
              oy = ly;
              var nearNode = findNearestNode(myself);
              if (nearNode) {
                //drawNeighbourhood(nearNode, myself);
                createLinkBetween(nearNode, myself);
                eraseNeighbourhood(myself.nearOne);
                myself.nearOne = undefined;
              } else if (myself.nearOne) {
                eraseNeighbourhood(myself.nearOne);
                myself.nearOne = undefined;
              }
            };
          this.drag(moveFnc, startFnc, endFnc);
        };
        $scope.paper = new Raphael($scope.element[0], '100%', $scope.extras.height);
        $scope.paper.canvas.onmouseover = onPaperMouseOver;
        $scope.paper.canvas.onclick = onPaperClick;
        $scope.paper.canvas.ondblclick = onPaperDblClick;
        $scope.paperRect = $scope.paper.rect(0, 0, $scope.extras.width, $scope.extras.height).attr('fill', '#FFF3E0');
      }
      paper = $scope.paper;

      $scope.paperRect.attr('fill', '#FFF3E0');
      _.forEach($scope.nodes, function (node) {
        drawNode(node);
      });

      _.forEach($scope.links, function (link) {
        drawLink(link);
      });
    }

    function createLinkBetween(sourceNode, targetNode) {
      $scope.links = $scope.links || [];
      var index = _.find($scope.links, function (l) {
        return l.source === sourceNode && l.target === targetNode;
      });
      if (index > -1) {
        return;
      }
      $scope.links.push({
        source: sourceNode,
        target: targetNode
      });
      renderRaphael();
    }

    function drawLink(link) {
      if (!link.line) {
        var nearingPoints = findConnectingPoints(link.source, link.target);
        link.line = $scope.paper.path('M' + nearingPoints.x1 + ',' + nearingPoints.y1 + 'L' + nearingPoints.x2 + ',' +
          nearingPoints.y2).attr({
          'arrow-end': 'classic-wide-long'
        });
      }
    }

    function findConnectingPoints(n1, n2) {
      var b1 = n1.rectSvg.getBBox(),
        b2 = n2.rectSvg.getBBox();
      return {
        x1: b1.x,
        x2: b2.x,
        y1: b1.y,
        y2: b2.y
      };
    }

    function getNode(uiEl) {
      return _.find($scope.nodes, function (n) {
        return n.txtSvg.node === uiEl.items[0].node || uiEl.items[0].node === n.rectSvg.node;
      });
    }

    function drawNeighbourhood(node, targetNode) {
      if (targetNode.nearOne && targetNode.nearOne === node) {
        return;
      } else if (targetNode.nearOne && targetNode.nearOne !== node) {
        eraseNeighbourhood(targetNode.nearOne);
        targetNode.nearOne = undefined;
      }
      if (!node.sorround) {
        var bounds = node.rectSvg.getBBox(),
          centerX = bounds.x + bounds.width / 2,
          centerY = bounds.y + bounds.height / 2,
          radius = bounds.width / 2 + 20;
        node.sorround = $scope.paper.circle(centerX, centerY, 0).attr({
          'fill': '#FFE0B2',
          'fill-opacity': '0.3',
          'stroke': '#FFB74D'
        }).animate({
          r: radius
        }, 1000);
        targetNode.nearOne = node;
      }
    }

    function eraseNeighbourhood(node) {
      if (node.sorround) {
        node.sorround.animate({
          r: 0
        }, 1000, 'linear', function () {
          node.sorround.remove();
          node.sorround = undefined;
        });
      }
    }

    function findNearestNode(self) {
      var selfBounds = self.rectSvg.getBBox();
      return _.find($scope.nodes, function (n) {
        if (n === self) {
          return false;
        }
        var rectBounds = n.rectSvg.getBBox();
        if (distance(selfBounds, rectBounds) < 100) {
          return true;
        }
        return false;
      });
    }

    function distance(r1, r2) {
      return Math.sqrt((r1.x - r2.x) * (r1.x - r2.x) + (r1.y - r2.y) * (r1.y - r2.y));
    }

    function drawNode(node) {
      if (!node.st) {
        node.st = $scope.paper.set();
        node.width = node.text.length * 12;
        node.height = 30;
        node.rectSvg = $scope.paper.rect(node.x, node.y, node.width, node.height)
          .attr('stroke-width', '2').attr('stroke', '#4FC3F7').attr('fill', '#B3E5FC');
        node.txtSvg = $scope.paper.text(node.x + node.width - 35, node.y + 15, node.text)
          .attr({
            'font-size': '20px',
            'fill': 'green'
          });
        node.st.push(node.rectSvg);
        node.st.push(node.txtSvg);
        node.st.draggable();
      }
    }

    function onPaperMouseOver(e) {
      if (e.toElement.tagName === 'rect') return;
      console.log('paperMouseOver: Event = ', e);
    }

    function onPaperDblClick(e) {
      console.log('onPaperDblClick: Event = ', e);
      lastNode = lastNode + 1;
      var node = {
        id: lastNode,
        text: 'Node ' + lastNode,
        x: e.layerX,
        y: e.layerY
      };
      $scope.nodes.push(node);
      renderRaphael();
    }

    function onPaperClick(e) {
      console.log('onPaperClick: Event = ', e);
    }
  }
})();
