// Define width and height
const width = 850;
const height = 850;

// Define ellipse
const ellipse = d3
    .range(100)
    .map(i => [
        (width * (1 + 0.99 * Math.cos((i / 50) * Math.PI))) / 2,
        (height * (1 + 0.99 * Math.sin((i / 50) * Math.PI))) / 2
    ]);

// Create SVG element
const svg = d3.select("#visualization")
    .attr("width", width)
    .attr("height", height);

// Draw ellipse
svg.append("path")
    .datum(ellipse)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("id", "ellipse-path")
    .style("fill", "#d1cebd")
    .style("opacity", .8)
    .attr("d", d3.line());

// Load the data from the JSON file
d3.json("hierarchical_nations_data_with_revenue.json")
    .then(function (data) {
        const regions = Object.keys(data); // Get the list of regions (areas)
        const hierarchy = { children: [] };

        // Create a mapping from area names to colors
        const customColors = {
            "East": "#155263",
            "West": "#006A4E",
            "South": "#83580b",
            "North": "#1F305E",
            "Underdark": "#452c63"
        };
        const areaColorScale = d3.scaleOrdinal()
            .domain(Object.keys(customColors))
            .range(Object.values(customColors));

        const opacityScale = d3.scaleLinear()
            .domain([0.025, 0.05]) // Assuming LateOrders ranges from 0 to 0.1
            .range([0.4, 1]); // Adjust the range based on your desired opacity range

        // Create the hierarchy
        regions.forEach(region => {
            const regionData = data[region];
            const regionNode = {
                name: region,
                children: regionData.Nations.map(nation => ({
                    name: nation.Nation,
                    value: nation.TotalRevenue,
                    lateOrders: nation.LateOrders,
                    HighValueOrders: nation.HighValueOrders
                }))
            };
            hierarchy.children.push(regionNode);
        });

        const rootNode = d3.hierarchy(hierarchy)
            .sum(d => d.value); // Sum up the total revenue for each region

        const fontSizeScale = d3.scaleLinear()
            .domain([0, d3.max(rootNode.leaves(), d => d.data.value)])
            .range([9, 25]);

        // Define tooltip container
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden");

        // Define seed and voronoiTreeMap
        let seed = new Math.seedrandom(24);
        let voronoiTreeMap = d3.voronoiTreemap()
            .prng(seed)
            .clip(ellipse);
        voronoiTreeMap(rootNode);

        // Visualize the voronoi cells
        const nationCells = svg.selectAll(".nation-cell")
            .data(rootNode.descendants().filter(d => d.depth === 2)) // Filter only nation cells
            .enter().append("g")
            .attr("class", "nation-cell")
            .attr("opacity", 0.3) // Set initial opacity
            .on("mouseover", function (d) {
                // Highlight the hovered nation cell
                d3.select(this).attr("opacity", 1);

                // Retrieve data for the dropdown
                const nationData = d.data;

                // Create and position the dropdown
                const dropdown = d3.select(this)
                    .append("foreignObject")
                    .attr("class", "dropdown-container")
                    .attr("x", d3.pointer(this)[0])
                    .attr("y", d3.pointer(this)[1])
                    .attr("width", 150) // Set dropdown width
                    .attr("height", 100) // Set dropdown height
                    .append("xhtml:div")
                    .attr("class", "dropdown-content");

                // Populate dropdown with nation data
                dropdown.html(`
                    <p>Nation: ${nationData.name}</p>
                    <p>Total Revenue: ${nationData.value}</p>
                    <p>High Value Orders: ${nationData.HighValueOrders}</p>
                    <p>Late Orders: ${nationData.lateOrders}</p>
                `);
            })
            .on("mouseout", function () {
                // Reset opacity and remove dropdown on mouseout
                d3.select(this).attr("opacity", 0.3);
                d3.select(".dropdown-container").remove();
            });

        // Draw voronoi cells
        nationCells.append("path")
            .attr("d", function (d) { return "M" + d.polygon.join("L") + "Z"; })
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

        // Add nation labels
        nationCells.append("text")
            .attr("x", d => d.polygon.site.x + 10)
            .attr("y", d => d.polygon.site.y - fontSizeScale(d.data.value))
            .text(d => d.data.name)
            .style("text-anchor", "middle")
            .style("dominant-baseline", "middle")
            .style("font-size", d => fontSizeScale(d.data.value) + "px")
            .style("font-family", "Arial, sans-serif")
            .style("fill", "#d1cebd");
    })
    .catch(function (error) {
        console.log("Error loading the data: " + error);
    });