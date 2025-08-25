interface PackingListData {
  consignee: string;
  consigner: string;
  shippedTo: string;
  customerOpNo?: string;
  customerPoNo?: string;
  typeOfShipment: string;
  portLoading: string;
  portDestination: string;
  pallets: Array<{
    id: string;
    boxNumberFrom: number;
    boxNumberTo: number;
    products: Array<{
      id: string;
      productCode: string;
      description: string;
      batch: string;
      quantity: number;
      weightPerBox: number;
      totalGrossWeight: number;
      hasMixedProducts: boolean;
      secondProduct?: {
        productCode: string;
        description: string;
        batch: string;
        weightPerBox: number;
        totalGrossWeight: number;
      };
    }>;
  }>;
  totalGrossWeight: number;
  boxSize: string;
  shippingMark: string;
  airport: string;
  destination: string;
  countryOfOrigin: string;
}

export function generateSankeyChart(data: PackingListData) {
  // Create a new window for the Sankey chart
  const chartWindow = window.open("", "_blank", "width=1700,height=1000,scrollbars=yes,resizable=yes");

  if (!chartWindow) {
    alert("Please allow popups to generate Sankey Chart");
    return;
  }

  // Prepare data for Sankey diagram
  const nodes: Array<{name: string}> = [];
  const links: Array<{source: number, target: number, value: number}> = [];

  // Create nodes: Pallets -> Boxes -> Products -> Descriptions -> Batches
  
  // Add Pallet nodes
  data.pallets.forEach((pallet, index) => {
    nodes.push({name: `Pallet ${index + 1}`});
  });

  // Add Box nodes for each pallet
  data.pallets.forEach((pallet, pIndex) => {
    const from = Number(pallet.boxNumberFrom);
    const to = Number(pallet.boxNumberTo);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return;
    const start = Math.min(from, to);
    const end = Math.max(from, to);
    for (let boxNum = start; boxNum <= end; boxNum++) {
      nodes.push({name: `Box P${pIndex + 1}-${boxNum}`});
    }
  });

  // Collect all unique product codes, descriptions, and batches
  const allProducts = data.pallets.flatMap(pallet => 
    pallet.products.flatMap(product => {
      const products = [product];
      if (product.hasMixedProducts && product.secondProduct) {
        products.push({
          ...product.secondProduct,
          id: product.id + '_second',
          quantity: product.quantity,
          hasMixedProducts: false
        });
      }
      return products;
    })
  );
  
  const productCodes = [...new Set(allProducts.map(p => p.productCode).filter(Boolean))];
  const descriptions = [...new Set(allProducts.map(p => p.description).filter(Boolean))];
  const batches = [...new Set(allProducts.map(p => p.batch).filter(Boolean))];

  // Add Product, Description, and Batch nodes
  productCodes.forEach(code => nodes.push({name: `Product: ${code}`}));
  descriptions.forEach(desc => nodes.push({name: `Desc: ${desc}`}));
  batches.forEach(batch => nodes.push({name: `Batch: ${batch}`}));

  // Create links
  let nodeIndex = 0;
  const palletIndices: {[key: string]: number} = {};
  const boxIndices: {[key: string]: number} = {};
  const productCodeIndices: {[key: string]: number} = {};
  const descriptionIndices: {[key: string]: number} = {};
  const batchIndices: {[key: string]: number} = {};

  // Map pallets to indices
  data.pallets.forEach((pallet, index) => {
    palletIndices[`Pallet ${index + 1}`] = nodeIndex++;
  });

  // Map boxes to indices
  data.pallets.forEach((pallet, pIndex) => {
    const from = Number(pallet.boxNumberFrom);
    const to = Number(pallet.boxNumberTo);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return;
    const start = Math.min(from, to);
    const end = Math.max(from, to);
    for (let boxNum = start; boxNum <= end; boxNum++) {
      boxIndices[`Box P${pIndex + 1}-${boxNum}`] = nodeIndex++;
    }
  });

  // Map product codes to indices
  productCodes.forEach(code => {
    productCodeIndices[code] = nodeIndex++;
  });

  // Map descriptions to indices
  descriptions.forEach(desc => {
    descriptionIndices[desc] = nodeIndex++;
  });

  // Map batches to indices
  batches.forEach(batch => {
    batchIndices[batch] = nodeIndex++;
  });

  // Create links between nodes: Pallet -> Boxes -> Products -> Description -> Batch
  data.pallets.forEach((pallet, palletIndex) => {
    const palletNodeIndex = palletIndices[`Pallet ${palletIndex + 1}`];

    // Create Pallet -> Box links
    const from = Number(pallet.boxNumberFrom);
    const to = Number(pallet.boxNumberTo);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return;
    const start = Math.min(from, to);
    const end = Math.max(from, to);
    for (let boxNum = start; boxNum <= end; boxNum++) {
      const boxNodeIndex = boxIndices[`Box P${palletIndex + 1}-${boxNum}`];
      links.push({
        source: palletNodeIndex,
        target: boxNodeIndex,
        value: 1 // Each box has value 1
      });
    }

    // Create Box -> Product links based on product quantities
    pallet.products.forEach(product => {
      // Helper function to create links for a product
      const createLinksForProduct = (prod: { productCode?: string; description?: string; batch?: string }, quantity: number) => {
        if (!prod || !prod.productCode) return;
        const safeQty = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
        if (safeQty <= 0) return;

        // Distribute product quantity across boxes
        let remainingQuantity = safeQty;
        for (let boxNum = start; boxNum <= end && remainingQuantity > 0; boxNum++) {
          const boxNodeIndex = boxIndices[`Box P${palletIndex + 1}-${boxNum}`];
          const productIndex = productCodeIndices[prod.productCode];
          
          // Each box gets 1 unit of this product (or remaining if less than 1)
          const boxQuantity = Math.min(1, remainingQuantity);
          
          if (boxQuantity > 0) {
            const existingLink = links.find(link => 
              link.source === boxNodeIndex && link.target === productIndex
            );
            
            if (existingLink) {
              existingLink.value += boxQuantity;
            } else {
              links.push({
                source: boxNodeIndex,
                target: productIndex,
                value: boxQuantity
              });
            }
            remainingQuantity -= boxQuantity;
          }
        }

        // Product Code -> Description
        if (prod.productCode && prod.description) {
          const productIndex = productCodeIndices[prod.productCode];
          const descIndex = descriptionIndices[prod.description];
          
          const existingLink = links.find(link => 
            link.source === productIndex && link.target === descIndex
          );
          
          if (existingLink) {
            existingLink.value += safeQty;
          } else {
            links.push({
              source: productIndex,
              target: descIndex,
              value: safeQty
            });
          }
        }

        // Description -> Batch
        if (prod.description && prod.batch) {
          const descIndex = descriptionIndices[prod.description];
          const batchIndex = batchIndices[prod.batch];
          
          const existingLink = links.find(link => 
            link.source === descIndex && link.target === batchIndex
          );
          
          if (existingLink) {
            existingLink.value += safeQty;
          } else {
            links.push({
              source: descIndex,
              target: batchIndex,
              value: safeQty
            });
          }
        }
      };

      // Create links for main product
      createLinksForProduct(product, Number(product.quantity));

      // Create links for second product if it exists
      if (product.hasMixedProducts && product.secondProduct) {
        createLinksForProduct(product.secondProduct, Number(product.quantity));
      }
    });
  });

  const sankeyData = {
    nodes: nodes,
    links: links
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Packing List - Sankey Chart</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          background-color: #f5f5f5;
          overflow-x: auto;
        }
        
        #my_dataviz {
          min-width: 1600px;
          overflow: visible;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header h1 {
          margin: 0;
          color: #333;
        }
        .chart-container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          position: relative;
          overflow: hidden;
        }
        .chart-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 15px;
        }
        .chart-wrapper {
          background: rgba(255,255,255,0.95);
          border-radius: 10px;
          padding: 20px;
          position: relative;
          z-index: 1;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .link {
          fill: none;
          stroke-opacity: 0.4;
          transition: stroke-opacity 0.3s ease;
        }
        .link:hover {
          stroke-opacity: 0.8;
        }
        .node rect {
          cursor: move;
          fill-opacity: 0.9;
          shape-rendering: crispEdges;
          rx: 3;
          ry: 3;
          transition: all 0.3s ease;
          filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));
        }
        .node rect:hover {
          fill-opacity: 1;
          transform: scale(1.05);
        }
        .node text {
          pointer-events: none;
          text-shadow: 0 1px 2px rgba(255,255,255,0.8);
          font-size: 14px;
          font-weight: 600;
          fill: #2c3e50;
          text-anchor: middle;
        }
        .node text tspan {
          font-size: inherit;
          font-weight: inherit;
          fill: inherit;
        }
        .controls {
          text-align: center;
          margin-top: 20px;
        }
        .controls button {
          padding: 10px 20px;
          margin: 0 10px;
          font-size: 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .close-btn {
          background: #6c757d;
          color: white;
        }
        .close-btn:hover {
          background: #5a6268;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Packing List Distribution - Sankey Chart</h1>
        <p>Customer PO: ${data.customerPoNo || data.customerOpNo || ''} | Total Pallets: ${data.pallets.length} | Total Products: ${productCodes.length}</p>
        <p style="font-size: 12px; color: #666; margin-top: 10px;">
          <strong>Note:</strong> Flow values represent product quantities per pallet. Pallet box counts show total boxes (${data.pallets.map(p => (p.boxNumberTo - p.boxNumberFrom) + 1).join(', ')}).
        </p>
        
        <!-- Legend -->
        <div style="display: flex; justify-content: center; gap: 15px; margin-top: 10px; font-size: 11px;">
          <div style="display: flex; align-items: center;">
            <div style="width: 18px; height: 10px; background: #440154; margin-right: 4px; border-radius: 2px;"></div>
            Pallets
          </div>
          <div style="display: flex; align-items: center;">
            <div style="width: 18px; height: 10px; background: #8E44AD; margin-right: 4px; border-radius: 2px;"></div>
            Boxes
          </div>
          <div style="display: flex; align-items: center;">
            <div style="width: 18px; height: 10px; background: #FDE725; margin-right: 4px; border-radius: 2px;"></div>
            Products
          </div>
          <div style="display: flex; align-items: center;">
            <div style="width: 18px; height: 10px; background: #35B779; margin-right: 4px; border-radius: 2px;"></div>
            Descriptions
          </div>
          <div style="display: flex; align-items: center;">
            <div style="width: 18px; height: 10px; background: #31688E; margin-right: 4px; border-radius: 2px;"></div>
            Batches
          </div>
        </div>
      </div>
      
      <div class="chart-container">
        <div class="chart-wrapper">
          <div id="my_dataviz"></div>
        </div>
      </div>

      <div class="controls">
        <button class="close-btn" onclick="window.close()">Close Window</button>
      </div>

      <!-- Load d3.js -->
      <script src="https://d3js.org/d3.v4.min.js"></script>
      
      <!-- Load the sankey.js function -->
      <script src="https://cdn.jsdelivr.net/gh/holtzy/D3-graph-gallery@master/LIB/sankey.js"></script>

      <script>
        // Data from our packing list
        var graph = ${JSON.stringify(sankeyData)};
        
        // set the dimensions and margins of the graph
        var margin = {top: 60, right: 120, bottom: 60, left: 120},
            width = 1600 - margin.left - margin.right,
            height = 900 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        var svg = d3.select("#my_dataviz").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Viridis-inspired color scale (similar to R's viridis package)
        var viridisColors = [
          "#440154", "#482878", "#3E4A89", "#31688E", 
          "#26828E", "#1F9E89", "#35B779", "#6DCD59", 
          "#B4DE2C", "#FDE725"
        ];
        
        var color = d3.scaleOrdinal()
            .range(viridisColors);

        // Enhanced color function for different node types
        function getNodeColor(d) {
          if (d.name.startsWith('Pallet')) return "#440154";   // Purple - Far Left
          if (d.name.startsWith('Box')) return "#8E44AD";      // Light Purple - Second column
          if (d.name.startsWith('Product:')) return "#FDE725"; // Yellow - Third column
          if (d.name.startsWith('Desc:')) return "#35B779";    // Green - Fourth column
          if (d.name.startsWith('Batch:')) return "#31688E";   // Blue - Far Right
          return color(d.name.replace(/ .*/, ""));
        }

        // Enhanced link color function
        function getLinkColor(d) {
          var sourceColor = getNodeColor(d.source);
          var targetColor = getNodeColor(d.target);
          return d3.interpolateRgb(sourceColor, targetColor)(0.5);
        }

        // Set the sankey diagram properties
        var sankey = d3.sankey()
            .nodeWidth(80)
            .nodePadding(40)
            .size([width, height]);

        // Constructs a new Sankey generator with the default settings.
        sankey
            .nodes(graph.nodes)
            .links(graph.links)
            .layout(50); // Increase layout iterations for better positioning

        // add in the links with enhanced styling
        var link = svg.append("g")
          .selectAll(".link")
          .data(graph.links)
          .enter()
          .append("path")
            .attr("class", "link")
            .attr("d", sankey.link())
            .style("stroke-width", function(d) { return Math.max(2, d.dy); })
            .style("stroke", function(d) { return getLinkColor(d); })
            .style("stroke-opacity", 0.4)
            .sort(function(a, b) { return b.dy - a.dy; })
            .on("mouseover", function(d) {
              d3.select(this).style("stroke-opacity", 0.8);
            })
            .on("mouseout", function(d) {
              d3.select(this).style("stroke-opacity", 0.4);
            });

        // add in the nodes
        var node = svg.append("g")
          .selectAll(".node")
          .data(graph.nodes)
          .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .call(d3.drag()
              .subject(function(d) { return d; })
              .on("start", function() { this.parentNode.appendChild(this); })
              .on("drag", dragmove));

        // add the rectangles for the nodes with enhanced styling
        node
          .append("rect")
            .attr("height", function(d) { return d.dy; })
            .attr("width", sankey.nodeWidth())
            .style("fill", function(d) { 
              d.color = getNodeColor(d);
              return d.color;
            })
            .style("stroke", function(d) { 
              return d3.rgb(d.color).darker(1.5); 
            })
            .style("stroke-width", 2)
            .attr("rx", 3)
            .attr("ry", 3)
            .on("mouseover", function(d) {
              d3.select(this)
                .style("fill", d3.rgb(d.color).brighter(0.3))
                .style("stroke-width", 3);
            })
            .on("mouseout", function(d) {
              d3.select(this)
                .style("fill", d.color)
                .style("stroke-width", 2);
            })
          // Add hover text
          .append("title")
            .text(function(d) { 
              if (d.name.startsWith('Pallet')) {
                return d.name + "\\nContains all boxes in this pallet";
              } else if (d.name.startsWith('Box')) {
                // For box nodes, show what products are in this box
                var products = [];
                graph.links.forEach(function(link) {
                  if (link.source === d && graph.nodes[link.target].name.startsWith('Product:')) {
                    products.push(graph.nodes[link.target].name.replace('Product: ', ''));
                  }
                });
                return d.name + "\\nContains: " + (products.length > 0 ? products.join(', ') : 'No products');
              } else {
                // For other nodes, show flow value
                var totalFlow = 0;
                graph.links.forEach(function(link) {
                  if (link.target === d || link.source === d) {
                    totalFlow += link.value;
                  }
                });
                return d.name + "\\nFlow: " + totalFlow; 
              }
            });

                // add in the title for the nodes with intelligent positioning
        node
            .append("text")
            .attr("x", function(d) { 
              // Positioning based on node position with more space
              if (d.x < width * 0.25) {
                return sankey.nodeWidth() + 15;
              } else if (d.x > width * 0.75) {
                return -15;
              } else {
                return sankey.nodeWidth() / 2;
              }
            })
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", function(d) { 
              if (d.x < width * 0.25) return "start";
              if (d.x > width * 0.75) return "end";
              return "middle";
            })
            .each(function(d) {
              // Handle long text with line wrapping
              var text = d3.select(this);
              var words = d.name.split(/\s+/);
              var lineHeight = 1.1; // ems
              var maxWidth = 150; // pixels
              
              if (words.length > 1 && d.name.length > 20) {
                // Multi-line for long text
                text.text(null);
                var tspan = text.append("tspan").attr("x", text.attr("x")).attr("dy", 0);
                var line = [];
                var lineNumber = 0;
                
                for (var i = 0; i < words.length; i++) {
                  line.push(words[i]);
                  tspan.text(line.join(" "));
                  
                  if (tspan.node().getComputedTextLength() > maxWidth && line.length > 1) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [words[i]];
                    tspan = text.append("tspan")
                      .attr("x", text.attr("x"))
                      .attr("dy", lineHeight + "em")
                      .text(words[i]);
                    lineNumber++;
                  }
                }
              } else {
                // Single line for short text
                text.text(d.name);
              }
            })
            .style("font-size", function(d) {
              // Larger font size for better readability
              return d.dy > 50 ? "16px" : d.dy > 30 ? "14px" : "12px";
            })
            .style("font-weight", "600")
            .style("fill", "#2c3e50");

        // the function for moving the nodes
        function dragmove(d) {
          d3.select(this)
            .attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
          sankey.relayout();
          link.attr("d", sankey.link());
        }
      </script>
    </body>
    </html>
  `;

  chartWindow.document.write(htmlContent);
  chartWindow.document.close();
  chartWindow.focus();
}
