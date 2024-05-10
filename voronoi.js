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

        console.log(data);
        // Create the hierarchy
        regions.forEach(region => {
            const regionData = data[region];
            const regionNode = {
                name: region,
                children: regionData.Nations.map(nation => ({
                    name: nation.Nation,
                    value: nation.TotalRevenue,
                    lateOrders: nation.LateOrders, // Accessing LateOrders property here
                    HighValueOrders: nation.HighValueOrders

                }))
            };
            hierarchy.children.push(regionNode);
        });

        const rootNode = d3.hierarchy(hierarchy)
            .sum(d => d.value); // Sum up the total revenue for each region

        const fontSizeScale = d3.scaleLinear()
            .domain([0, d3.max(rootNode.leaves(), d => d.data.value)]) // Domain based on TotalRevenue values
            .range([9, 25]); // Range of font sizes you want to use

        const textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor.";
        // Define tooltip container

        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("z-index", "9999");


        // Define seed and voronoiTreeMap
        let seed = new Math.seedrandom(24);
        let voronoiTreeMap = d3.voronoiTreemap()
            .prng(seed)
            .clip(ellipse);
        voronoiTreeMap(rootNode);
        console.log(rootNode)

        // Visualize the voronoi cells
        d3.select("#visualization")
            .selectAll("path")
            .data(rootNode.descendants())
            .enter().append("path")
            .each(function (d) {
                // Raise area paths to the front
                if (d.depth === 1) {
                    d3.select(this).raise();
                }
            })
            .attr("d", function (d) { return "M" + d.polygon.join("L") + "Z"; })
            .attr("stroke", "#d1cebd")
            .attr("stroke-opacity", 1) // Set stroke opacity based on depth
            .attr("stroke-width", function (d) {
                // Set stroke width based on depth
                return d.depth === 1 ? 8 : 2.5; // Change the value based on your preference
            })
            .style("opacity", function (d) {
                // Check if it's a nation node
                if (!d.data.children) {
                    // Access the LateOrders value of the nation directly
                    const lateOrders = d.data.lateOrders;
                    // Map LateOrders to opacity using opacityScale
                    return opacityScale(lateOrders);
                }
                // If it's an area node, return default opacity
                return 0.3;
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
        // Add green dots for HighValueOrders in nation cells
        svg.selectAll("circle")
            .data(rootNode.descendants())
            .enter()
            .filter(d => d.depth === 1) // Filter only area cells
            .selectAll("circle")
            .data(d => d.children) // Access the children (nation cells) of each area cell
            .enter().append("circle")
            .attr("cx", d => d.polygon.site.x - 15) // Use voronoi cell center as circle center
            .attr("cy", d => d.polygon.site.y + 20)
            .attr("r", d => (d.data.HighValueOrders / 12)) // Radius based on HighValueOrders
            .style("fill", "#004953") // Green color for the dots
            .style("opacity", .7);

        svg.selectAll("text")
            .data(rootNode.descendants())
            .enter()
            .filter(d => d.depth === 1) // Filter only area cells
            .selectAll("text")
            .data(d => d.children) // Access the children (nation cells) of each area cell
            .enter().append("text")
            .attr("x", d => d.polygon.site.x + 10) // Use voronoi cell center as circle center
            .attr("y", d => d.polygon.site.y - fontSizeScale(d.data.value))
            .text(d => d.data.name) // Set the label text to the nation name
            .style("text-anchor", "middle") // Center the text horizontally
            .style("dominant-baseline", "middle") // Center the text vertically
            .style("font-size", d => fontSizeScale(d.data.value) + "px")
            .style("font-family", "Arial, sans-serif") // Set font family
            .style("fill", "#d1cebd"); // Set the text color

        svg.append("text")
            .append("textPath")
            // Reference the ID of the existing ellipse path
            .attr("xlink:href", "#ellipse-path")
            // Set the text content
            .style("fill", "#d1cebd")
            .style("font-size", "60px")

            .text("----East----------------------------South------------------------West-------Underdark-----------North------------------------");



        // Event listener for hover over nation cells
        const nationCells = svg.selectAll(".nation-cell")
            .data(rootNode.descendants().filter(d => d.depth === 2)) // Filter only nation cells
            .enter().append("g")
            .attr("class", "nation-cell")
            .on("mouseover", function (event, d) {
                // Log the data for debugging
                console.log("Node data:", d);

                // Adjust opacity to 1 when hovered over
                d3.select(this).select("path").style("opacity", 1);

                // Show tooltip and position it
                tooltip.style("visibility", "visible")
                    .style("display", "block")
                    .style("left", `${event.pageX + 10}px`) // Adjust position to the right of the mouse pointer
                    .style("top", `${event.pageY + 10}px`) // Adjust position below the mouse pointer


                    // Define tooltip content based on the data associated with 'd'
                    .html(`<p>Name: ${d.data.name}</p>` // Display the name of the nation
                        + `<p>Total Revenue: ${d.data.value}</p>` // Display the total revenue of the nation
                        + `<p>Late Orders: ${d.data.lateOrders}</p>`
                        + `<p>High Value Orders: ${d.data.HighValueOrders}</p>`); // Display the number of late orders
            })
            .on("mouseout", function () {
                // Revert opacity back to the original value
                d3.select(this).select("path").style("opacity", function (d) {
                    return d.depth === 2 ? opacityScale(d.data.lateOrders) : 0.3;
                });

                // Hide tooltip
                tooltip.style("visibility", "hidden");
            });

        nationCells.append("path")
            .attr("d", function (d) { return "M" + d.polygon.join("L") + "Z"; })
            .style("opacity", 0)
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


        // Define the legend element
        const legendContainer = d3.select("#legend") // Select the body element or any other container element
            .append("div")
            .attr("class", "legend-container")
            .style("position", "absolute") // Position the legend relative to the body or container
            .style("top", "40px") // Adjust top position as needed
            .style("left", "50px"); // Adjust right position as needed

        // Create the gradient legend
        const legend1 = legendContainer.append("legend")
            .attr("class", "legend")
            .style("width", "100px") // Adjust width as needed
            .style("height", "20px"); // Adjust height as needed

        // Define the gradient for the legend
        const gradient = legend1.append("legend")
            .attr("class", "gradient")
            .style("background", "linear-gradient(to right, rgba(100, 10, 20, 0.3), rgba(100, 10, 20, 1))")
            .style("width", "100%")
            .style("height", "100%");

        // Add text labels for the opacity values
        const opacityLabels = legendContainer.selectAll(".opacity-label")
            .data([0.05, .025]) // Add more values if needed
            .enter()
            .append("div")
            .attr("class", "opacity-label")
            .style("position", "absolute")
            .style("top", "20px") // Adjust top position as needed
            .style("right", (d, i) => (i === 0 ? "0" : "100%")) // Position first label on left and second on right
            .style("transform", (d, i) => (i === 0 ? "translateX(-0%)" : "translateX(70%)")) // Center labels
            .text(d => (d * 100) + "%");

        const legend = d3.select("#legend");

        // Append the green circle to the legend
        const greenCircle = legend.append("div")
            .attr("id", "green-circle")
            .append("svg")
            .attr("width", 130)
            .attr("height", 70);

        greenCircle.append("circle")
            .attr("cx", 100)
            .attr("cy", 18)
            .attr("r", 18)
            .attr("fill", "#004953");



        console.log(rootNode);

    })
    .catch(function (error) {
        console.log("Error loading the data: " + error);
    });