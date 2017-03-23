(function () {
  'use strict';

  angular
    .module('mindmapsample')
    .directive('mindmap', directive);

  directive.$inject = ['d3Service', '_'];

  /* @ngInject */
  function directive(d3Service, _) {
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
          .style('height', '600px');
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
          selectedNode = null,
          selectedLink = null,
          mousedownLink = null,
          mousedownNode = null,
          mouseupNode = null,
          path, nodeEls,
          dragLine, container,
          colors = d3.scale.category10(),
          size, zoom, minZoom = 0.1,
          maxZoom = 7,
          textSize = 15,
          rectHeight = 40,
          selectedRectHeight = 50,
          strokeWidth = 3,
          drag;

        var w = window.innerWidth;
        var h = window.innerHeight;
        size = d3.scale.pow().exponent(1)
          .domain([1, 100])
          .range([8, 24]);
        zoom = d3.behavior.zoom().scaleExtent([minZoom, maxZoom])

        svg.attr('viewBox', '0,0,' + $scope.extras.width + ',' + $scope.extras.height)
          .style('background-color', '#f0f0f0')
          .text('The Scene Graph')
          .select('#graph');
        container = svg.append('g');

        force = d3.layout.force()
          .nodes(nodes)
          .links(links)
          .size([$scope.extras.width, $scope.extras.height])
          .linkDistance(150)
          .charge(-500)
          .on('tick', tick);

        drag = force.drag;

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
        dragLine = svg.append('svg:path')
          .attr('class', 'link dragline hidden')
          .attr('d', 'M0,0L0,0');

        // handles to link and node element groups
        path = container.append('svg:g').selectAll('path');
        nodeEls = container.append('svg:g').selectAll('g');

        function resetMouseVars() {
          mousedownNode = null;
          mouseupNode = null;
          mousedownLink = null;
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

          nodeEls.attr('transform', function (d) {
            return 'translate(' + d.x + ',' + d.y + ')';
          });
        }

        // update graph (called when needed)
        function restart() {
          // path (link) group
          path = path.data(links);

          // update existing links
          path.classed('selected', function (d) {
              return d === selectedLink;
            })
            .style('marker-start', function (d) {
              return d.left ? 'url(#start-arrow)' : '';
            })
            .style('marker-end', function (d) {
              return d.right ? 'url(#end-arrow)' : '';
            });

          // add new links
          path.enter().append('svg:path')
            .attr('class', 'link')
            .classed('selected', function (d) {
              return d === selectedLink;
            })
            .style('marker-start', function (d) {
              return d.left ? 'url(#start-arrow)' : '';
            })
            .style('marker-end', function (d) {
              return d.right ? 'url(#end-arrow)' : '';
            })
            .on('mousedown', function (d) {
              if (d3.event.ctrlKey) return;

              // select link
              mousedownLink = d;
              if (mousedownLink === selectedLink) {
                selectedLink = null;
              } else {
                selectedLink = mousedownLink;
              }
              selectedNode = null;
              restart();
            });

          // remove old links
          path.exit().remove();

          // nodeEls (node) group
          // NB: the function arg is crucial here! nodes are known by id, not by index!
          _.forEach(nodes, function (d) {
            d.width = (d.title ? d.title.length : 5) * textSize;
            d.height = rectHeight;
          });
          nodeEls = nodeEls.data(nodes, function (d) {
            return d.id;
          });

          // update existing nodes (reflexive & selected visual states)
          nodeEls.selectAll('rect')
            .attr('width', function (d) {
              return d.width;
            }).attr('height', function (d) {
              return (d === selectedNode) ? selectedRectHeight : rectHeight;
            }).style('fill', function (d) {
              return (d === selectedNode) ? '#81D4FA' : '#4FC3F7';
            }).style('stroke', function (d) {
              return (d === selectedNode) ? '#00838F' : '#0277BD';
            })
            .classed('reflexive', function (d) {
              return d.reflexive;
            });

          nodeEls.selectAll('text').style('font-size', textSize + 'px');
          // add new nodes
          var g = nodeEls.enter().append('svg:g').attr('class', 'node'); //.call(drag);

          g.append('svg:rect')
            .attr('width', function (d) {
              return d.width;
            }).attr('height', function (d) {
              return (d === selectedNode) ? selectedRectHeight : rectHeight;
            }).attr('rx', 5)
            .attr('ry', 5)
            .style('fill', function (d) {
              return (d === selectedNode) ? '#81D4FA' : '#4FC3F7';
            }).style('stroke', function (d) {
              return (d === selectedNode) ? '#00838F' : '#0277BD';
            }).style('stroke-width', function (d) {
              return (d === selectedNode) ? strokeWidth + 2 : strokeWidth;
            }).classed('selected', function (d) {
              return d === selectedNode;
            })
            .on('mouseover', function (d) {
              if (!mousedownNode || d === mousedownNode) return;
              // enlarge target node
              d3.select(this).attr('transform', 'scale(1.1)');
            })
            .on('mouseout', function (d) {
              if (!mousedownNode || d === mousedownNode) return;
              // unenlarge target node
              d3.select(this).attr('transform', '');
            })
            .on('mousedown', mousedownEvent)
            .on('mouseup', mouseupEvent)
            .on('dblclick', function (d) {
              makeEditable(d);
            });

          // show node IDs
          g.append('svg:text')
            .attr('x', function (d) {
              return 10;
            }).attr('y', function (d) {
              return d === selectedNode ? 28 : 22;
            }).attr('class', 'id')
            .style('font-size', textSize + 'px')
            .text(function (d) {
              return d.title;
            }).on('dblclick', makeEditable).on('mouseup', mouseupEvent).on('mousedown', mousedownEvent);

          // remove old nodes
          nodeEls.exit().remove();

          // set the graph in motion
          force.start();
        }

        function mousedownEvent(d) {
          //   if (d3.event.ctrlKey) return;

          // select node
          mousedownNode = d;
          if (mousedownNode === selectedNode) {
            selectedNode = null;
          } else {
            selectedNode = mousedownNode;
          }
          selectedLink = null;

          // reposition drag line
          var x = mousedownNode.x + mousedownNode.width / 2,
            y = mousedownNode.y + mousedownNode.height / 2;
          dragLine
            .style('marker-end', 'url(#end-arrow)')
            .classed('hidden', false)
            .attr('d', 'M' + x + ',' + y + 'L' + x + ',' + y);

          restart();
        }

        function mouseupEvent(d) {
          if (!mousedownNode) return;

          // needed by FF
          dragLine
            .classed('hidden', true)
            .style('marker-end', '');

          // check for drag-to-self
          mouseupNode = d;
          if (mouseupNode === mousedownNode) {
            resetMouseVars();
            return;
          }

          // unenlarge target node
          d3.select(this).attr('transform', '');

          // add link to graph (update if exists)
          // NB: links are strictly source < target; arrows separately specified by booleans
          var source, target, direction;

          source = mousedownNode;
          target = mouseupNode;
          direction = 'right';

          // if (mousedownNode.id < mouseupNode.id) {
          //   source = mousedownNode;
          //   target = mouseupNode;
          //   direction = 'right';
          // } else {
          //   source = mouseupNode;
          //   target = mousedownNode;
          //   direction = 'left';
          // }

          var link;
          link = links.filter(function (l) {
            return (l.source === source && l.target === target);
          })[0];

          if (link) {
            link[direction] = true;
          } else {
            link = {
              source: source,
              target: target,
              left: false,
              right: false
            };
            link[direction] = true;
            links.push(link);
          }

          // select new link
          selectedLink = link;
          selectedNode = null;
          mousedownNode = null;
          mouseupNode = null;
          restart();
        }

        function dblClick() {
          if (d3.event.target.nodeName === 'rect' || d3.event.target.nodeName === 'text') {
            // makeEditable();
            return;
          }
          // prevent I-bar on drag
          d3.event.preventDefault();

          // because :active only works in WebKit?
          svg.classed('active', true);

          if (d3.event.ctrlKey || mousedownNode || mousedownLink) return;

          // insert new node at point
          var point = d3.mouse(this),
            node = {
              id: ++lastNodeId,
              title: 'N-' + lastNodeId,
              reflexive: false
            };
          node.x = point[0];
          node.y = point[1];
          nodes.push(node);

          restart();
        }

        function makeEditable(d) {
          var p = d3.event.target.parentNode,
            field = 'title',
            xy, pxy, el, pel, inp, frm;

          // inject a HTML form to edit the content here...

          // bug in the getBBox logic here, but don't know what I've done wrong here;
          // anyhow, the coordinates are completely off & wrong. :-((
          xy = p.getBBox();
          pxy = p.getBBox();
          xy.x -= pxy.x;
          xy.y -= pxy.y;
          el = d3.select(this);
          pel = d3.select(p);
          frm = pel.append('foreignObject');
          inp = frm
            .attr('x', xy.x)
            .attr('y', xy.y)
            .attr('width', xy.width < 150 ? 150 : xy.width)
            .attr('height', xy.height < 20 ? 20 : xy.height)
            .append('xhtml:form')
            .append('input')
            .attr('value', function () {
              // nasty spot to place this call, but here we are sure that the <input> tag is available
              // and is handily pointed at by 'this':
              d3.event.target.focus();
              return d[field];
            })
            .attr('style', 'width: ' + (xy.width < 150 ? 150 : xy.width) + 'px;font-size:' + textSize + 'px;  ')
            // make the form go away when you jump out (form looses focus) or hit ENTER:
            .on('blur', function () {
              console.log('blur', d3.event.target, arguments);
              var txt = inp.node().value;
              d[field] = txt;
              el.text(function (d) {
                return d[field];
              });
              pel.select('text').text(function (d) {
                return d[field];
              });
              d.width = d.width = (d.title ? d.title.length : 5) * 12;
              pel.select('rect').attr('width', function (d) {
                return d.width;
              });
              if (el.nextSibling) {
                el.nextSibling.text(function (d) {
                  return d[field];
                });
              }
              // Note to self: frm.remove() will remove the entire <g> group! Remember the D3 selection logic!
              if (pel.select('foreignObject').size() > 0) {
                pel.select('foreignObject').remove();
              }
            })
            .on('keypress', function () {
              console.log('keypress', d3.event.target, arguments);
              // IE fix
              if (!d3.event) {
                d3.event = window.event;
              }

              var e = d3.event,
                txt;
              if (e.keyCode === 13) {
                if (typeof (e.cancelBubble) !== 'undefined') { // IE
                  e.cancelBubble = true;
                }
                if (e.stopPropagation) {
                  e.stopPropagation();
                }
                e.preventDefault();
                txt = inp.node().value;

                d[field] = txt;
                el.text(function (d) {
                  return d[field];
                });
                pel.select('text').text(function (d) {
                  return d[field];
                });
                d.width = d.width = (d.title ? d.title.length : 5) * 12;
                pel.select('rect').attr('width', function (d) {
                  return d.width;
                });
                if (el.nextSibling) {
                  el.nextSibling.text(function (d) {
                    return d[field];
                  });
                }
                // odd. Should work in Safari, but the debugger crashes on this instead.
                // Anyway, it SHOULD be here and it doesn't hurt otherwise.
                if (pel.select('foreignObject').size() > 0) {
                  pel.select('foreignObject').remove();
                }
              }
            });
          inp[0][0].focus();
        }

        function mousemove() {
          if (!mousedownNode) {
            return;
          }

          // update drag line
          dragLine.attr('d', 'M' + mousedownNode.x + ',' + mousedownNode.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(
            this)[1]);

          restart();
        }

        // function mouseup() {
        //   if (mousedownNode) {
        //     // hide drag line
        //     dragLine
        //       .classed('hidden', true)
        //       .style('marker-end', '');
        //   }

        //   // because :active only works in WebKit?
        //   svg.classed('active', false);

        //   // clear mouse event vars
        //   resetMouseVars();
        // }

        function spliceLinksForNode(node) {
          var toSplice = links.filter(function (l) {
            return (l.source === node || l.target === node);
          });
          toSplice.map(function (l) {
            links.splice(links.indexOf(l), 1);
          });
        }

        function zoomed() {
          // var stroke = nominal_stroke;
          // if (nominal_stroke * zoom.scale() > max_stroke) stroke = max_stroke / zoom.scale();
          // link.style('stroke-width', stroke);
          // circle.style('stroke-width', stroke);

          // var base_radius = nominal_base_node_size;
          // if (nominal_base_node_size * zoom.scale() > max_base_node_size) base_radius = max_base_node_size / zoom.scale();
          // circle.attr('d', d3.svg.symbol()
          //   .size(function (d) {
          //     return Math.PI * Math.pow(size(d.size) * base_radius / nominal_base_node_size || base_radius, 2);
          //   })
          //   .type(function (d) {
          //     return d.type;
          //   }))

          // //circle.attr('r', function(d) { return (size(d.size)*base_radius/nominal_base_node_size||base_radius); })
          // if (!text_center) text.attr('dx', function (d) {
          //   return (size(d.size) * base_radius / nominal_base_node_size || base_radius);
          // });

          // var text_size = nominal_text_size;
          // if (nominal_text_size * zoom.scale() > max_text_size) text_size = max_text_size / zoom.scale();
          // text.style('font-size', text_size + 'px');

          // var newTextSize = textSize * zoom.scale();
          // if (newTextSize > 30) {
          //   newTextSize = 30;
          // }
          // textSize = newTextSize;
          // rectHeight = rectHeight * zoom.scale();
          // if (rectHeight > 40) {
          //   rectHeight = 40;
          // }
          // selectedRectHeight = rectHeight + 10;
          // if (selectedRectHeight > 50) {
          //   selectedRectHeight = 50;
          // }
          // strokeWidth = strokeWidth * zoom.scale();
          // if (strokeWidth > 10) {
          //   strokeWidth = 10;
          // }
          container.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
          restart();
        }

        function resize() {
          var width = window.innerWidth,
            height = window.innerHeight;
          svg.attr('width', width).attr('height', height);

          force.size([force.size()[0] + (width - w) / zoom.scale(), force.size()[1] + (height - h) / zoom.scale()]).resume();
          w = width;
          h = height;
        }
        // app starts here
        svg
        // .on('mousemove', mousemove)
        //   .on('mouseup', mouseup)
          .on('dblclick', dblClick);

        container.on('rezise', resize);
        zoom.on('zoom', zoomed);
        // svg.call(zoom);
        restart();
      }
    }
  }
})();
