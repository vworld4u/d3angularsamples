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
      templateUrl: 'app/raphael/mindmap.tmp.html',
      controller: Controller,
      controllerAs: 'vm',
      link: link,
      restrict: 'A',
      scope: {
        addNode: '&',
        removeNode: '&',
        addLink: '&',
        editNode: '&'
      }
    };

    (function ($) {
      $.extend($.fn, {
        contextMenu: function (options) {
          // Defaults
          var defaults = {
              fadeIn: 150,
              fadeOut: 75
            },
            o = $.extend(true, defaults, options || {}),
            d = document;

          // Loop each context menu
          $(this).each(function () {
            var el = $(this),
              offset = el.offset(),
              $m = $('#' + o.menu);

            // Add contextMenu class
            $m.addClass('contextMenu');

            // Simulate a true right click
            $(this).mousedown(function (e) {

              // e.stopPropagation(); // Terry: No, thank you
              $(this).mouseup(function (e) {
                // e.stopPropagation(); // Terry: No, thank you
                var target = $(this);

                $(this).unbind('mouseup');

                if (e.button == 2) {
                  // Hide context menus that may be showing
                  $(".contextMenu").hide();
                  // Get this context menu

                  if (el.hasClass('disabled')) return false;

                  // show context menu on mouse coordinates or keep it within visible window area
                  var x = Math.min(e.pageX, $(document).width() - $m.width() - 5),
                    y = Math.min(e.pageY, $(document).height() - $m.height() - 5);

                  // Show the menu
                  $(document).unbind('click');
                  $m
                    .css({
                      top: y,
                      left: x
                    })
                    .fadeIn(o.fadeIn)
                    .find('A')
                    .mouseover(function () {
                      $m.find('LI.hover').removeClass('hover');
                      $(this).parent().addClass('hover');
                    })
                    .mouseout(function () {
                      $m.find('LI.hover').removeClass('hover');
                    });

                  if (o.onShow) o.onShow(this, {
                    x: x - offset.left,
                    y: y - offset.top,
                    docX: x,
                    docY: y
                  });

                  // Keyboard
                  $(document).keypress(function (e) {
                    var $hover = $m.find('li.hover'),
                      $first = $m.find('li:first'),
                      $last = $m.find('li:last');

                    switch (e.keyCode) {
                    case 38: // up
                      if ($hover.size() == 0) {
                        $last.addClass('hover');
                      } else {
                        $hover.removeClass('hover').prevAll('LI:not(.disabled)').eq(0).addClass(
                          'hover');
                        if ($hover.size() == 0) $last.addClass('hover');
                      }
                      break;
                    case 40: // down
                      if ($hover.size() == 0) {
                        $first.addClass('hover');
                      } else {
                        $hover.removeClass('hover').nextAll('LI:not(.disabled)').eq(0).addClass(
                          'hover');
                        if ($hover.size() == 0) $first.addClass('hover');
                      }
                      break;
                    case 13: // enter
                      $m.find('LI.hover A').trigger('click');
                      break;
                    case 27: // esc
                      $(document).trigger('click');
                      break
                    }
                  });

                  // When items are selected
                  $m.find('A').unbind('click');
                  $m.find('LI:not(.disabled) A').click(function () {
                    var checked = $(this).attr('checked');

                    switch ($(this).attr('type')) // custom attribute
                    {
                    case 'radio':
                      $(this).parent().parent().find('.checked').removeClass('checked').end()
                        .find('a[checked="checked"]').removeAttr('checked');
                      // break; // continue...
                    case 'checkbox':
                      if ($(this).attr('checked') || checked) {
                        $(this).removeAttr('checked');
                        $(this).parent().removeClass('checked');
                      } else {
                        $(this).attr('checked', 'checked');
                        $(this).parent().addClass('checked');
                      }

                      //if ($(this).attr('hidemenu'))
                      {
                        $(".contextMenu").hide();
                      }
                      break;
                    default:
                      $(document).unbind('click').unbind('keypress');
                      $(".contextMenu").hide();
                      break;
                    }
                    // Callback
                    if (o.onSelect) {
                      o.onSelect($(this), $(target), $(this).attr('href'), {
                        x: x - offset.left,
                        y: y - offset.top,
                        docX: x,
                        docY: y
                      });
                    }
                    return false;
                  });

                  // Hide bindings
                  setTimeout(function () { // Delay for Mozilla
                    $(document).click(function () {
                      $(document).unbind('click').unbind('keypress');
                      $m.fadeOut(o.fadeOut);
                      return false;
                    });
                  }, 0);
                }
              });
            });

            // Disable text selection
            if ($.browser) { // latest version of jQuery no longer supports $.browser()
              if ($.browser.mozilla) {
                $m.each(function () {
                  $(this).css({
                    'MozUserSelect': 'none'
                  });
                });
              } else if ($.browser.msie) {
                $m.each(function () {
                  $(this).bind('selectstart.disableTextSelect', function () {
                    return false;
                  });
                });
              } else {
                $m.each(function () {
                  $(this).bind('mousedown.disableTextSelect', function () {
                    return false;
                  });
                });
              }
            }
            // Disable browser context menu (requires both selectors to work in IE/Safari + FF/Chrome)
            el.add($('UL.contextMenu')).bind('contextmenu', function () {
              return false;
            });

          });
          return $(this);
        },
        // Destroy context menu(s)
        destroyContextMenu: function () {
          // Destroy specified context menus
          $(this).each(function () {
            // Disable action
            $(this).unbind('mousedown').unbind('mouseup');
          });
          return ($(this));
        }

      });
    })($);

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
    var lastNode = 0,
      maxSquareDist = 20000,
      highlightRadius = 40,
      ndistance = 30;

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
              moveLinks(myself);
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
              moveLinks(myself);
            };
          if (myself) {
            this.drag(moveFnc, startFnc, endFnc);
          }
        };
        $scope.paper = new Raphael('svgContainer', '100%', $scope.extras.height); //$scope.element[0]
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

    function moveLinks(self) {
      if (!self || !self.rectSvg) {
        return;
      }
      var bounds = self.rectSvg.getBBox(),
        points = getPoints(bounds);
      _.forEach(self.links, function (link) {
        if (!link.line) {
          drawLink(link);
          return;
        }
        var tpoints = getPoints(link.target.rectSvg.getBBox()),
          linePoints = getLinePoints(points, tpoints);
        link.points = linePoints;
        link.line.animate({
          path: 'M' + link.points[0][0] + ',' + link.points[0][1] + 'L' + link.points[1][0] + ',' + link.points[
            1][1]
        }, 10);
      });
      _.forEach(self.endLinks, function (link) {
        if (!link.line) {
          drawLink(link);
          return;
        }
        var spoints = getPoints(link.source.rectSvg.getBBox()),
          linePoints = getLinePoints(spoints, points);
        link.points = linePoints;
        link.line.animate({
          path: 'M' + link.points[0][0] + ',' + link.points[0][1] + 'L' + link.points[1][0] + ',' + link.points[
            1][1]
        }, 10);
      });
    }

    function getLinePoints(points, tpoints) {
      var min = 9999999,
        pt1, pt2;
      _.forEach(points, function (pt) {
        _.forEach(tpoints, function (tpt) {
          var d = (pt[0] - tpt[0]) * (pt[0] - tpt[0]) + (pt[1] - tpt[1]) * (pt[1] - tpt[1]);
          if (d <= min) {
            pt1 = pt;
            pt2 = tpt;
            min = d;
          }
        });
      });
      return [pt1, pt2];
    }

    function getPoints(bounds) {
      return [
        [bounds.x, bounds.y],
        [bounds.x + bounds.width / 2, bounds.y],
        [bounds.x + bounds.width, bounds.y],
        [bounds.x + bounds.width, bounds.y + bounds.height / 2],
        [bounds.x + bounds.width, bounds.y + bounds.height],
        [bounds.x + bounds.width / 2, bounds.y + bounds.height],
        [bounds.x, bounds.y + bounds.height],
        [bounds.x, bounds.y + bounds.height / 2]
      ];
    }

    function createLinkBetween(sourceNode, targetNode) {
      $scope.links = $scope.links || [];
      var index = _.find($scope.links, function (l) {
        return l.source === sourceNode && l.target === targetNode;
      });
      if (index > -1) {
        return;
      }
      addLink(sourceNode, targetNode);
      renderRaphael();
    }

    function drawLink(link) {
      if (!link.line) {
        var nearingPoints = findConnectingPoints(link.source, link.target);
        link.line = $scope.paper.path('M' + nearingPoints[0][0] + ',' + nearingPoints[0][1] + 'L' +
          nearingPoints[1][0] + ',' + nearingPoints[1][1]).attr({
          'arrow-end': 'classic-wide-long'
        });
      }
    }

    function findConnectingPoints(n1, n2) {
      var b1 = n1.rectSvg.getBBox(),
        b2 = n2.rectSvg.getBBox();
      return getLinePoints(getPoints(b1), getPoints(b2));
    }

    function getNode(uiEl) {
      return _.find($scope.nodes, function (n) {
        return n.txtSvg.node === uiEl.items[0].node || uiEl.items[0].node === n.rectSvg.node;
      });
    }

    function drawNeighbourhood(node, targetNode) {
      if (!node || !targetNode) {
        return undefined;
      }
      if (targetNode.nearOne && targetNode.nearOne === node) {
        return;
      } else if (targetNode.nearOne && targetNode.nearOne !== node) {
        eraseNeighbourhood(targetNode.nearOne);
        targetNode.nearOne = undefined;
      }
      if (!node.sorround) {
        var bounds = node.rectSvg.getBBox();
        node.sorround = $scope.paper.rect(bounds.x - ndistance, bounds.y - ndistance, 0, 0).attr({
          fill: '#C5CAE9',
          'fill-opacity': '0.3',
          stroke: '#FFB74D'
        }).animate({
          width: bounds.width + ndistance * 2,
          height: bounds.height + ndistance * 2,
          rx: 5,
          ry: 5
        }, 200);
        targetNode.nearOne = node;
      }
    }

    function eraseNeighbourhood(node) {
      if (!node) {
        return;
      }
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
      if (!self) {
        return undefined;
      }
      var selfBounds = self.rectSvg.getBBox();
      return _.find($scope.nodes, function (n) {
        if (n === self) {
          return false;
        }
        var rectBounds = n.rectSvg.getBBox();
        if (doOverlap(rectBounds, selfBounds, ndistance)) {
          return true;
        }
        return false;
      });
    }

    function doOverlap(sbounds, tbounds, dist) {
      var x1 = sbounds.x - dist,
        y1 = sbounds.y - dist,
        x2 = x1 + sbounds.width + dist * 2,
        y2 = y1 + sbounds.height + dist * 2;
      if (tbounds.x2 < x1 || tbounds.x > x2) {
        return false;
      }
      if (tbounds.y2 < y1 || tbounds.y > y2) {
        return false;
      }
      return true;
    }

    function drawNode(node) {
      if (!node.st) {
        node.st = $scope.paper.set();
        node.width = node.text.length * 12;
        node.height = 30;
        node.rectSvg = $scope.paper.rect(node.x, node.y, node.width, node.height)
          .attr('stroke-width', '2').attr('stroke', '#4FC3F7').attr('fill', '#B3E5FC');
        node.selectionRectSvg = $scope.paper.rect(node.x - 5, node.y - 5, node.width + 10, node.height + 10)
          .attr({
            'stroke-width': '3',
            'stroke': '#43A047',
            rx: 5,
            ry: 5
          });
        node.txtSvg = $scope.paper.text(node.x + node.width / 2, node.y + 15, node.text)
          .attr({
            'font-size': '20px',
            fill: 'green'
          });
        node.st.push(node.rectSvg);
        node.st.push(node.txtSvg);
        node.st.push(node.selectionRectSvg);
        node.st.draggable();

        node.st.dblclick(function (e) {
          onNodeDblClick(e, node);
        });
        node.st.click(function (e) {
          onNodeClick(e, node);
        });
        _.forEach([node.rectSvg, node.txtSvg], function (el) {
          el.node.oncontextmenu = function (e) {
            showNodeContextMenu(node, e);
          };
        });
        // $([node.rectSvg.node, node.txtSvg.node]).contextMenu({
        //   menu: 'nodeMenu',
        //   onShow: onContextMenuShow,
        //   onSelect: onContextMenuItemSelect
        // });
        node.selectionRectSvg.hide();
      }
    }

    function onContextMenuShow(target, pos) {
      console.log('onContextMenuShow: target = ', target);
      console.log('onContextMenuShow: pos = ', pos);
    }

    function onContextMenuItemSelect(menuitem, target, href, pos) {
      console.log('onContextMenuItemSelect: target = ', target);
      console.log('onContextMenuItemSelect: pos = ', pos);
      console.log('onContextMenuItemSelect: menuitem = ', menuitem);
      console.log('onContextMenuItemSelect: href = ', href);
    }
    // Node Click Event handlers
    function onNodeDblClick(e, node) {
      // var node = getNode(e.toElement);
      if ($scope.dblClickedNode) {
        removeEditBox($scope.dblClickedNode);
      }
      $scope.dblClickedNode = node;
      addEditBox($scope.dblClickedNode);
    }

    function onNodeClick(e, node) {
      // var node = getNode(e.toElement);
      removeSelection($scope.selectedNode);
      $scope.selectedNode = node;
      addSelection($scope.selectedNode);
    }

    function removeEditBox(node) {
      if (!node || !$scope.infobox) {
        return;
      }
      $scope.infobox.hide();
      $scope.dblClickedNode = undefined;
    }

    function addEditBox(node) {
      if (!node) {
        return;
      }
      if (!$scope.infobox) {
        $scope.infobox = new Infobox($scope.paper);
        var inputbox = $('<input type=\'text\' value=\'\' style=\'overflow: none;\'/>')
          .attr('id', 'myfieldid')
          .attr('name', 'myfieldid');
        inputbox.bind('blur keyup', function (e) {
          if ((e.type === 'blur' || e.keyCode === 13) && $scope.dblClickedNode) {
            $scope.dblClickedNode.text = inputbox.val();
            $scope.infobox.hide();
            $scope.dblClickedNode.txtSvg.attr({
              text: $scope.dblClickedNode.text
            });
            updateWidthOfNode($scope.dblClickedNode);
            renderRaphael();
          }
        });
        $scope.infobox.div.append(inputbox);
        $scope.infobox.hide();
        $scope.inputbox = inputbox;
      }
      var bounds = node.rectSvg.getBBox();
      $scope.infobox.x = bounds.x + 10;
      $scope.infobox.y = bounds.y2 + bounds.height + 3;
      $scope.infobox.width = bounds.width > 200 ? bounds.width : 200;
      $scope.infobox.height = 40;
      $scope.inputbox.val(node.text);
      $scope.infobox.update();
      $scope.infobox.show();
    }

    function updateWidthOfNode(node) {
      node.width = node.text.length * 12;
      node.rectSvg.animate({
        width: node.width
      }, 200);
      node.selectionRectSvg.attr({
        x: node.x - 5,
        y: node.y - 5,
        width: node.width + 10,
        height: node.height + 10
      });
      node.txtSvg.attr({
        x: node.x + node.width / 2
      });
      if (node.selectedNode === node) {
        node.selectionRectSvg.show();
      } else {
        node.selectionRectSvg.hide();
      }
    }

    function removeSelection(node) {
      if (!node) {
        return;
      }
      node.selected = false;
      node.selectionRectSvg.hide();
    }

    function addSelection(node) {
      if (!node) {
        return;
      }
      node.selected = true;
      node.selectionRectSvg.show();
    }

    function showNodeContextMenu(node, e) {
      if (!node) {
        return;
      }
      if (e.preventDefault) {
        e.preventDefault();
      }
      if (e.stopPropagation) {
        e.stopPropagation();
      }
      e.cancelBubble = false;
      if (!$scope.nodeMenu) {
        var menu = $('<ul class=\'contextMenu\'>'),
          delBtn = $('<li><a>Delete</a></li>'),
          editBtn = $('<li><a>Edit</a></li>');
        menu.append(delBtn);
        menu.append(editBtn);
        $scope.nodeMenu = menu;
        $scope.editItem = editBtn;
        $scope.deleteItem = delBtn;
        var container = $('#' + node.rectSvg.node.parentNode.parentNode.id);
        container.append($scope.nodeMenu);
        console.log('container offset = ', container.offset());
      }
      $scope.editItem.bind('click', function (e) {
        editNode(e, node);
        $scope.nodeMenu.css({
          display: 'none'
        });
      });
      $scope.deleteItem.bind('click', function (e) {
        deleteNode(e, node);
        $scope.nodeMenu.css({
          display: 'none'
        });
      });
      var bounds = node.rectSvg.getBBox();
      console.log('Event = ', e);
      console.log('RectBounds = ', bounds);
      $scope.nodeMenu.css({
        top: bounds.cy + bounds.height + bounds.height,
        left: bounds.cx,
        display: 'block'
      });
    }

    function editNode(e, node) {
      console.log('editNode: Node = ', node);
      window.alert('editNode Clicked : Node = ' + node.text);
    }

    function deleteNode(e, node) {
      console.log('deleteNode: Node = ', node);
      window.alert('deleteNode Clicked : Node = ' + node.text);
    }

    function onPaperMouseOver(e) {
      if (e.toElement.tagName === 'rect') {
        return;
      }
      console.log('paperMouseOver: Event = ', e);
    }

    function onPaperDblClick(e) {
      if (e.toElement === $scope.paperRect.node) {
        console.log('onPaperDblClick: Event = ', e);
        addNode(e);
        renderRaphael();
      }
    }

    function addNode(location) {
      lastNode = lastNode + 1;
      var node = {
        id: lastNode,
        text: 'Node ' + lastNode,
        x: location.layerX,
        y: location.layerY
      };
      $scope.nodes.push(node);
    }

    function addLink(sourceNode, targetNode) {
      var link = {
        source: sourceNode,
        target: targetNode
      };
      $scope.links.push(link);
      sourceNode.links = sourceNode.links || [];
      targetNode.endLinks = targetNode.endLinks || [];
      sourceNode.links.push(link);
      targetNode.endLinks.push(link);
    }

    function onPaperClick(e) {
      console.log('onPaperClick: Event = ', e);
    }

    function Infobox(r, options, attrs) {
      options = options || {};
      attrs = attrs || {};
      this.paper = r;
      this.x = options.x || 0;
      this.y = options.y || 0;
      this.width = options.width || this.paper.width;
      this.height = options.height || this.paper.height;
      this.rounding = options.rounding || 0;
      this.showBorder = options.withBorder || false;
      this.container = this.paper.rect(this.x, this.y, this.width, this.height, this.rounding).attr(attrs);
      var containerId = this.container.node.parentNode.parentNode.id;
      containerId = containerId || this.container.node.parentNode.parentNode.parentNode.id;
      this.raphContainer = $('#' + containerId);

      if (!this.showBorder) {
        this.container.hide();
      }

      this.div = $('<div style=\'position: absolute; overflow: auto; width: 0; height: 0;\'></div>').insertAfter(
        this.raphContainer);
      $(document).bind('ready', this, function (event) {
        event.data.update();
      });
      $(window).bind('resize', this, function (event) {
        event.data.update();
      });
    }

    Infobox.prototype.update = function () {
      // var offset = this.raphContainer.offset();
      // this.div.css({
      //   top: (this.y + (this.rounding) + (offset.top)) + 'px',
      //   left: (this.x + (this.rounding) + (offset.left)) + 'px',
      //   height: (this.height - (this.rounding * 2) + 'px'),
      //   width: (this.width - (this.rounding * 2) + 'px')
      // });
      this.div.css({
        top: this.y,
        left: this.x,
        width: this.width,
        height: this.height
      });
    };

    // Note that the fadein/outs for the content div are at double speed. With frequent animations,
    // it gives the best behavior
    Infobox.prototype.show = function () {
      this.container.animate({
        opacity: 1
      }, 400, '>');
      this.div.fadeIn(200);
    };

    Infobox.prototype.hide = function () {
      this.container.animate({
        opacity: 0.5
      }, 400, '>');
      this.div.fadeOut(200);
    };
  }
})();
