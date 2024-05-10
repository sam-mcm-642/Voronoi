{
    const svg = d3.select(DOM.svg(width + margin.left + margin.right, height + margin.left + margin.right));
    svg
        .append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .style("fill", "#F5F5F2");
    const voronoi = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    const labels = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    const pop_labels = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");



    let seed = new Math.seedrandom(20);
    let voronoiTreeMap = d3.voronoiTreemap()
        .prng(seed)
        .clip(ellipse);

    voronoiTreeMap(population_hierarchy);
    colorHierarchy(population_hierarchy);

    let allNodes = population_hierarchy.descendants()
        .sort((a, b) => b.depth - a.depth)
        .map((d, i) => Object.assign({}, d, { id: i }));

    let hoveredShape = null;
    //return allNodes;

    voronoi.selectAll('path')
        .data(allNodes)
        .enter()
        .append('path')
        .attr('d', d => "M" + d.polygon.join("L") + "Z")
        .style('fill', d => d.parent ? d.parent.color : d.color)
        .attr("stroke", "#F5F5F2")
        .attr("stroke-width", 0)
        .style('fill-opacity', d => d.depth === 2 ? 1 : 0)
        .attr('pointer-events', d => d.depth === 2 ? 'all' : 'none')
        .on('mouseenter', d => {
            let label = labels.select(`.label-${d.id}`);
            label.attr('opacity', 1)
            let pop_label = pop_labels.select(`.label-${d.id}`);
            pop_label.attr('opacity', 1)
        })
        .on('mouseleave', d => {
            let label = labels.select(`.label-${d.id}`);
            label.attr('opacity', d => d.data.population > 130000000 ? 1 : 0)
            let pop_label = pop_labels.select(`.label-${d.id}`);
            pop_label.attr('opacity', d => d.data.population > 130000000 ? 1 : 0)
        })
        .transition()
        .duration(1000)
        .attr("stroke-width", d => 7 - d.depth * 2.8)
        .style('fill', d => d.color);

    labels.selectAll('text')
        .data(allNodes.filter(d => d.depth === 2))
        .enter()
        .append('text')
        .attr('class', d => `label-${d.id}`)
        .attr('text-anchor', 'middle')
        .attr("transform", d => "translate(" + [d.polygon.site.x, d.polygon.site.y + 6] + ")")
        .text(d => d.data.key || d.data.countries)
        //.attr('opacity', d => d.data.key === hoveredShape ? 1 : 0)
        .attr('opacity', function (d) {
            if (d.data.key === hoveredShape) {
                return (1);
            } else if (d.data.population > 130000000) {
                return (1);
            } else { return (0); }
        })

        .attr('cursor', 'default')
        .attr('pointer-events', 'none')
        .attr('fill', 'black')
        .style('font-family', 'Montserrat');

    pop_labels.selectAll('text')
        .data(allNodes.filter(d => d.depth === 2))
        .enter()
        .append('text')
        .attr('class', d => `label-${d.id}`)
        .attr('text-anchor', 'middle')
        .attr("transform", d => "translate(" + [d.polygon.site.x, d.polygon.site.y + 25] + ")")
        .text(d => bigFormat(d.data.population))
        //.attr('opacity', d => d.data.key === hoveredShape ? 1 : 0)
        .attr('opacity', function (d) {
            if (d.data.key === hoveredShape) {
                return (1);
            } else if (d.data.population > 130000000) {
                return (1);
            } else { return (0); }
        })

        .attr('cursor', 'default')
        .attr('pointer-events', 'none')
        .attr('fill', 'black')
        .style('font-size', '12px')
        .style('font-family', 'Montserrat');

    return svg.node();
}







// Visualize the voronoi cells
d3.select("#visualization")
    .selectAll("path")
    .data(rootNode.descendants())
    .enter().append("path")
    .attr("d", function (d) { return "M" + d.polygon.join("L") + "Z"; })
    .attr("stroke", "#F5F5F2")
    //.attr("stroke-width", 0)
    .attr("stroke-opacity", 1) // Set stroke opacity based on depth
    .attr("stroke-width", function (d) { return d.depth * 2; })
    .style("opacity", function (d) {
        // Check if it's a nation node
        if (!d.data.children) {
            // Access the LateOrders value of the nation directly
            const lateOrders = d.data.lateOrders;
            // Map LateOrders to opacity using opacityScale
            return opacityScale(lateOrders);
        }
        // If it's an area node, return default opacity
        return 0;
    })
    .style("fill", function (d) {
        let areaName;
        if (d.depth === 1) {
            // For area nodes
            areaName = d.data.name;
        } else {
            // For nation nodes
            areaName = d.parent.data.name;
        }
        return areaColorScale(areaName);
    });









dropdown.html(`
          <p>Nation: ${nationData.Nation}</p>
          <p>Total Revenue: ${nationData.TotalRevenue}</p>
          <p>High Value Orders: ${nationData.HighValueOrders}</p>
          <p>Late Orders: ${nationData.LateOrders}</p>
      `);