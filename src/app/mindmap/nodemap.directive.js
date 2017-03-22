(function () {
  'use strict';

  angular
    .module('mindmapsample')
    .directive('nodemap', directive);

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
        var popup, force, contextMenuShown = false,
          svg = $scope.svg,
          links = $scope.links,
          nodes = $scope.nodes,
          lastNodeId = 0,
          colors = d3.scale.category10();
        svg.attr('viewBox', '0,0,' + $scope.extras.width + ',' + $scope.extras.height)
          .style('background-color', '#f0f0f0')
          .text('The Scene Graph')
          .select('#graph');

        force = d3.layout.force()
          .nodes(nodes)
          .links(links)
          .size([$scope.extras.width, $scope.extras.height])
          .linkDistance(150)
          .charge(-500)
          .on('tick', tick);

        // define arrow markers for graph links
        svg.append('svg:defs').append('svg:marker')
          .attr('id', 'end-arrow')
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 6)
          .attr('markerWidth', 3)
          .attr('markerHeight', 3)
          .attr('orient', 'auto')
          .append('svg:path')
          .attr('d', 'M0,-5L10,0L0,5')
          .attr('fill', '#000');

        svg.append('svg:defs').append('svg:marker')
          .attr('id', 'start-arrow')
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 4)
          .attr('markerWidth', 3)
          .attr('markerHeight', 3)
          .attr('orient', 'auto')
          .append('svg:path')
          .attr('d', 'M10,-5L0,0L10,5')
          .attr('fill', '#000');

        // line displayed when dragging new nodes
        var drag_line = svg.append('svg:path')
          .attr('class', 'link dragline hidden')
          .attr('d', 'M0,0L0,0');

        // handles to link and node element groups
        var path = svg.append('svg:g').selectAll('path'),
          circle = svg.append('svg:g').selectAll('g');

        // mouse event vars
        var selected_node = null,
          selected_link = null,
          mousedown_link = null,
          mousedown_node = null,
          mouseup_node = null;

        function resetMouseVars() {
          mousedown_node = null;
          mouseup_node = null;
          mousedown_link = null;
        }

        // update force layout (called automatically each iteration)
        function tick() {
          // draw directed edges with proper padding from node centers
          path.attr('d', function (d) {
            var deltaX = d.target.x - d.source.x,
              deltaY = d.target.y - d.source.y,
              dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
              normX = deltaX / dist,
              normY = deltaY / dist,
              sourcePadding = d.left ? 17 : 12,
              targetPadding = d.right ? 17 : 12,
              sourceX = d.source.x + (sourcePadding * normX),
              sourceY = d.source.y + (sourcePadding * normY),
              targetX = d.target.x - (targetPadding * normX),
              targetY = d.target.y - (targetPadding * normY);
            return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
          });

          circle.attr('transform', function (d) {
            return 'translate(' + d.x + ',' + d.y + ')';
          });
        }

        // update graph (called when needed)
        function restart() {
          // path (link) group
          path = path.data(links);

          // update existing links
          path.classed('selected', function (d) {
              return d === selected_link;
            })
            .style('marker-start', function (d) {
              return d.left ? 'url(#start-arrow)' : '';
            })
            .style('marker-end', function (d) {
              return d.right ? 'url(#end-arrow)' : '';
            });


          // add new links
          // path.enter().append('svg:path')
          //   .attr('class', 'link')
          //   .classed('selected', function (d) {
          //     return d === selected_link;
          //   })
          //   .style('marker-start', function (d) {
          //     return d.left ? 'url(#start-arrow)' : '';
          //   })
          //   .style('marker-end', function (d) {
          //     return d.right ? 'url(#end-arrow)' : '';
          //   })
          //   .on('mousedown', function (d) {
          //     if (d3.event.ctrlKey) return;
          //     // select link
          //     mousedown_link = d;
          //     if (mousedown_link === selected_link) selected_link = null;
          //     else selected_link = mousedown_link;
          //     selected_node = null;
          //     restart();
          //   });

          // remove old links
          // path.exit().remove();

          // circle (node) group
          // NB: the function arg is crucial here! nodes are known by id, not by index!
          circle = circle.data(nodes, function (d) {
            return d.title || d.id;
          });

          // update existing nodes (reflexive & selected visual states)
          circle.selectAll('rect')
            .style('fill', function (d) {
              return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
            })
            .classed('reflexive', function (d) {
              return d.reflexive;
            });

          // add new nodes
          var g = circle.enter().append('svg:g');

          g.append('svg:rect')
            .attr('class', 'node')
            .attr('height', '30px')
            .attr('width', function (d) {
              return (d.title ? d.title.length : 20) * 20;
            })
            .data(nodes, function (d) {
              return d.title || d.id;
            }).style('fill', function (d) {
              return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
            }).style('stroke', function (d) {
              return d3.rgb(colors(d.id)).darker().toString();
            }).classed('reflexive', function (d) {
              return d.reflexive;
            }).on('mouseover', function (d) {
              if (!mousedown_node || d === mousedown_node) return;
              // enlarge target node
              d3.select(this).attr('transform', 'scale(1.1)');
            }).on('mouseout', function (d) {
              if (!mousedown_node || d === mousedown_node) return;
              // unenlarge target node
              d3.select(this).attr('transform', '');
            }).on('mousedown', function (d) {
              if (d3.event.ctrlKey) return;
              d3.event.preventDefault();
              // // select node
              // mousedown_node = d;
              // if (mousedown_node === selected_node) selected_node = null;
              // else selected_node = mousedown_node;
              // selected_link = null;
              // drag_line
              //   .style('marker-end', 'url(#end-arrow)')
              //   .classed('hidden', false)
              //   .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' +
              //     mousedown_node.y);
              // restart();
            }).on('mouseup', function (d) {
              d3.event.preventDefault();
              // if (!mousedown_node) return;
              // // needed by FF
              // drag_line
              //   .classed('hidden', true)
              //   .style('marker-end', '');

              // // check for drag-to-self
              // mouseup_node = d;
              // if (mouseup_node === mousedown_node) {
              //   resetMouseVars();
              //   return;
              // }

              // // unenlarge target node
              // d3.select(this).attr('transform', '');

              // // add link to graph (update if exists)
              // // NB: links are strictly source < target; arrows separately specified by booleans
              // var source, target, direction;
              // if (mousedown_node.id < mouseup_node.id) {
              //   source = mousedown_node;
              //   target = mouseup_node;
              //   direction = 'right';
              // } else {
              //   source = mouseup_node;
              //   target = mousedown_node;
              //   direction = 'left';
              // }

              // var link;
              // link = links.filter(function (l) {
              //   return (l.source === source && l.target === target);
              // })[0];

              // if (link) {
              //   link[direction] = true;
              // } else {
              //   link = {
              //     source: source,
              //     target: target,
              //     left: false,
              //     right: false
              //   };
              //   link[direction] = true;
              //   links.push(link);
              // }

              // // select new link
              // selected_link = link;
              // selected_node = null;
              // restart();
            }).on('dblclick', function (d) {
              var p = this.parentNode,
                field = 'title';
              console.log(this, arguments);

              // inject a HTML form to edit the content here...

              // bug in the getBBox logic here, but don't know what I've done wrong here;
              // anyhow, the coordinates are completely off & wrong. :-((
              var xy = this.getBBox();
              var p_xy = p.getBBox();

              xy.x -= p_xy.x;
              xy.y -= p_xy.y;

              var el = d3.select(this);
              var p_el = d3.select(p);

              var frm = p_el.append('foreignObject');

              var inp = frm
                .attr('x', xy.x)
                .attr('y', xy.y)
                .attr('width', xy.width)
                .attr('height', xy.height)
                .append('xhtml:form')
                .append('input')
                .attr('value', function () {
                  // nasty spot to place this call, but here we are sure that the <input> tag is available
                  // and is handily pointed at by 'this':
                  this.focus();
                  return d[field];
                })
                .attr('style', 'width: ' + xy.width + 'px;')
                // make the form go away when you jump out (form looses focus) or hit ENTER:
                .on('blur', function () {
                  console.log('blur', this, arguments);
                  var txt = inp.node().value;
                  d[field] = txt;
                  el.text(function (d) {
                    return d.title;
                  });
                  // Note to self: frm.remove() will remove the entire <g> group! Remember the D3 selection logic!
                  p_el.select('foreignObject').remove();
                })
                .on('keypress', function () {
                  console.log('keypress', this, arguments);
                  // IE fix
                  if (!d3.event)
                    d3.event = window.event;

                  var e = d3.event;
                  if (e.keyCode == 13) {
                    if (typeof (e.cancelBubble) !== 'undefined') // IE
                      e.cancelBubble = true;
                    if (e.stopPropagation)
                      e.stopPropagation();
                    e.preventDefault();

                    var txt = inp.node().value;

                    d[field] = txt;
                    el.text(function (d) {
                      return d[field];
                    });
                    p_el.select('text').text(function (d) {
                      return d[field];
                    });
                    if (el.nextSibling) {
                      el.nextSibling.text(function (d) {
                        return d[field];
                      });
                    }

                    // odd. Should work in Safari, but the debugger crashes on this instead.
                    // Anyway, it SHOULD be here and it doesn't hurt otherwise.
                    p_el.select('foreignObject').remove();
                  }
                });
            });

          // show node IDs
          g.append('svg:text')
            .attr('x', 25)
            .attr('y', 20)
            .attr('text-anchor', 'center')
            .attr('fill', '#000')
            // .attr('x', 25)
            // .attr('y', function (d) {
            //   var tw = (d.title ? d.title.length : 20) * 20;
            //   return 15;
            // })
            .attr('class', 'id')
            .text(function (d) {
              return d.title;
            });

          // remove old nodes
          circle.exit().remove();

          // set the graph in motion
          force.start();
        }

        function mousedown() {
          // prevent I-bar on drag
          //d3.event.preventDefault();

          // because :active only works in WebKit?
          svg.classed('active', true);
          if (d3.event.which !== 1) return;
          if (d3.event.target.nodeName === 'rect' || d3.event.target.nodeName === 'INPUT') return;

          if (d3.event.ctrlKey || mousedown_node || mousedown_link) return;

          // insert new node at point
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

        function mousemove() {
          if (!mousedown_node) return;

          // update drag line
          drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(
            this)[1]);

          restart();
        }

        function mouseup() {
          if (mousedown_node) {
            // hide drag line
            drag_line
              .classed('hidden', true)
              .style('marker-end', '');
          }

          // because :active only works in WebKit?
          svg.classed('active', false);

          // clear mouse event vars
          resetMouseVars();
        }

        function spliceLinksForNode(node) {
          var toSplice = links.filter(function (l) {
            return (l.source === node || l.target === node);
          });
          toSplice.map(function (l) {
            links.splice(links.indexOf(l), 1);
          });
        }

        // only respond once per keydown
        var lastKeyDown = -1;

        function keydown() {
          d3.event.preventDefault();

          if (lastKeyDown !== -1) return;
          lastKeyDown = d3.event.keyCode;

          // ctrl
          if (d3.event.keyCode === 17) {
            circle.call(force.drag);
            svg.classed('ctrl', true);
          }

          if (!selected_node && !selected_link) return;
          switch (d3.event.keyCode) {
          case 8: // backspace
          case 46: // delete
            if (selected_node) {
              nodes.splice(nodes.indexOf(selected_node), 1);
              spliceLinksForNode(selected_node);
            } else if (selected_link) {
              links.splice(links.indexOf(selected_link), 1);
            }
            selected_link = null;
            selected_node = null;
            restart();
            break;
          case 66: // B
            if (selected_link) {
              // set link direction to both left and right
              selected_link.left = true;
              selected_link.right = true;
            }
            restart();
            break;
          case 76: // L
            if (selected_link) {
              // set link direction to left only
              selected_link.left = true;
              selected_link.right = false;
            }
            restart();
            break;
          case 82: // R
            if (selected_node) {
              // toggle node reflexivity
              selected_node.reflexive = !selected_node.reflexive;
            } else if (selected_link) {
              // set link direction to right only
              selected_link.left = false;
              selected_link.right = true;
            }
            restart();
            break;
          }
        }

        function keyup() {
          lastKeyDown = -1;

          // ctrl
          if (d3.event.keyCode === 17) {
            circle
              .on('mousedown.drag', null)
              .on('touchstart.drag', null);
            svg.classed('ctrl', false);
          }
        }
        // app starts here
        svg.on('mousedown', mousedown)
          .on('mousemove', mousemove)
          .on('mouseup', mouseup);
        // d3.select(window)
        // .on('keydown', keydown)
        // .on('keyup', keyup);
        restart();
      }
    }
  }
})();
