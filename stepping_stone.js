// Display Stepping Stone Table
function displaySteppingStoneTable() {
    const existingTable = document.getElementById('steppingstonetable');
    if (existingTable) return;

    const table = document.createElement('table');
    table.id = 'steppingstonetable';
    table.style.marginTop = '20px';

    const supplyCount = allocatedValues.length;
    const demandCount = allocatedValues[0].length;

    // Header row
    const headerRow = document.createElement('tr');
    const cornerCell = document.createElement('th');
    cornerCell.textContent = '';
    headerRow.appendChild(cornerCell);

    for (let j = 0; j < demandCount; j++) {
        const th = document.createElement('th');
        th.textContent = 'D' + (j + 1);
        headerRow.appendChild(th);
    }
    table.appendChild(headerRow);

    // Data rows
    for (let i = 0; i < supplyCount; i++) {
        const row = document.createElement('tr');
        const label = document.createElement('th');
        label.textContent = 'S' + (i + 1);
        row.appendChild(label);

        for (let j = 0; j < demandCount; j++) {
            const td = document.createElement('td');
            td.style.width = '60px';
            td.style.height = '40px';
            td.style.textAlign = 'center';
            td.style.position = 'relative';

            // Cost tag
            const costTag = document.createElement('div');
            costTag.textContent = costs[i][j];
            Object.assign(costTag.style, {
                position: 'absolute',
                top: '2px',
                right: '4px',
                fontSize: '11px',
                color: '#555'
            });
            td.appendChild(costTag);

            // Allocation display
            if (allocatedValues[i][j] > 0) {
                td.style.backgroundColor = '#c8e6c9';
                const allocTag = document.createElement('div');
                allocTag.textContent = allocatedValues[i][j];
                allocTag.style.marginTop = '14px';
                allocTag.style.fontWeight = 'bold';
                allocTag.style.color = '#000';
                td.appendChild(allocTag);
            }
            row.appendChild(td);
        }
        table.appendChild(row);
    }

    const label = document.createElement('h3');
    label.textContent = 'Stepping Stone Table';
    label.style.marginTop = '20px';

    const solveSection = document.getElementById('solveSection');
    solveSection.appendChild(label);
    solveSection.appendChild(table);

    // Solve Stepping Stone Button
    const solveButton = document.createElement('button');
    solveButton.textContent = 'Solve Stepping Stone';
    solveButton.style.marginTop = '20px';
    solveButton.onclick = function () {
        displayClosedPathsAndCosts(true);  
    };
    solveSection.appendChild(solveButton);
}

// Display Closed Paths and Net Cost Changes
function displayClosedPathsAndCosts(isLoop = false) {
    const paths = getClosedPathsAndCosts();

    const label = document.createElement('h3');
    label.textContent = isLoop ? 'Closed Paths & Net Cost Changes (After Reallocation)' : 'Closed Paths & Net Cost Changes';
    label.style.marginTop = '20px';

    const table = document.createElement('table');
    table.style.marginTop = '10px';

    const header = document.createElement('tr');
    ['Unoccupied Cell', 'Closed Path', 'Net Cost Change'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        header.appendChild(th);
    });
    table.appendChild(header);

    let mostNegativePath = null;
    let mostNegativeCell = null;

    for (const item of paths) {
        const row = document.createElement('tr');

        const cell = document.createElement('td');
        cell.textContent = item.cell;
        row.appendChild(cell);

        const path = document.createElement('td');
        path.textContent = item.path.join(' → ');
        row.appendChild(path);

        const cost = document.createElement('td');
        const prettyCost = item.costPath.join(' ').replace(/^\+/, '');
        cost.textContent = `${prettyCost} = ${item.netCost}`;
        row.appendChild(cost);

        table.appendChild(row);

        if (!mostNegativePath || item.netCost < mostNegativePath.netCost) {
            mostNegativePath = item;
            mostNegativeCell = item.cell;
        }
    }

    solveSection.appendChild(label);
    solveSection.appendChild(table);


    // Stop here if no negative net cost (optimal)
    if (!mostNegativePath || mostNegativePath.netCost >= 0) {
        calculateTotalTransportationCost(); // Show final cost
        return; // Stop further processing here
    }

    // If we do have a negative path, reallocate and then continue looping asynchronously
    displayUpdatedSteppingStoneTable(mostNegativeCell, mostNegativePath.path, mostNegativePath.netCost);

    performReallocation(mostNegativeCell, mostNegativePath.path, () => {
        // Call next iteration with a small delay to avoid blocking UI
        setTimeout(() => {
            displayClosedPathsAndCosts(true);
        }, 50); // can be even smaller delay if you want faster looping
    });
}

// Get Closed Paths and Net Cost Changes 
function getClosedPathsAndCosts() {
    const closedPaths = [];

    for (let i = 0; i < allocatedValues.length; i++) {
        for (let j = 0; j < allocatedValues[i].length; j++) {
            if (allocatedValues[i][j] === 0) {
                const path = findSteppingStoneCycle(i, j);
                if (path) {
                    const { costPath, netCost } = calculateCost(path);
                    closedPaths.push({
                        cell: `S${i + 1}D${j + 1}`,
                        path: path,
                        costPath: costPath,
                        netCost: netCost
                    });
                }
            }
        }
    }

    return closedPaths;
}

// Stepping Stone Cycle Finder (Main Entry)
function findSteppingStoneCycle(startI, startJ) {
    const path = [];
    path.push(`S${startI + 1}D${startJ + 1}`);
    const visited = new Set([`${startI},${startJ}`]);
    const found = findClosedPath(startI, startJ, path, visited, startI, startJ);
    return found ? path : null;
}

// Alternating Row → Column Recursive Search
function findClosedPath(i, j, path, visited, startI, startJ) {
    for (let col = 0; col < allocatedValues[0].length; col++) {
        if (col === j) continue;
        if (allocatedValues[i][col] > 0) {
            const key = `${i},${col}`;
            if (visited.has(key)) continue;

            visited.add(key);
            path.push(`S${i + 1}D${col + 1}`);

            if (findColumnPath(i, col, path, visited, startI, startJ)) return true;

            visited.delete(key);
            path.pop();
        }
    }
    return false;
}

function findColumnPath(i, j, path, visited, startI, startJ) {
    for (let row = 0; row < allocatedValues.length; row++) {
        if (row === i) continue; // Skip current row

        // Check if we completed a cycle by returning to start cell with minimum path length
        if (row === startI && j === startJ && path.length >= 3) {
            path.push(`S${row + 1}D${j + 1}`);
            return true; // Found valid closed path
        }

        // If allocated cell found in this column (different row)
        if (allocatedValues[row][j] > 0) {
            const key = `${row},${j}`;
            if (visited.has(key)) continue; // Avoid cycles/loops

            visited.add(key); // Mark cell visited
            path.push(`S${row + 1}D${j + 1}`); // Add cell to path

            // Try to continue path searching along rows now
            if (findRowPath(row, j, path, visited, startI, startJ)) return true;

            // Backtrack if path not found
            visited.delete(key);
            path.pop();
        }
    }
    return false; // No path found in this direction
}

function findRowPath(i, j, path, visited, startI, startJ) {
    for (let col = 0; col < allocatedValues[0].length; col++) {
        if (col === j) continue; // Skip current column

        // Check if we completed a cycle by returning to start cell with minimum path length
        if (i === startI && col === startJ && path.length >= 3) {
            path.push(`S${i + 1}D${col + 1}`);
            return true; // Found valid closed path
        }

        // If allocated cell found in this row (different column)
        if (allocatedValues[i][col] > 0) {
            const key = `${i},${col}`;
            if (visited.has(key)) continue; // Avoid revisiting

            visited.add(key); // Mark cell visited
            path.push(`S${i + 1}D${col + 1}`); // Add cell to path

            // Try to continue path searching along columns now
            if (findColumnPath(i, col, path, visited, startI, startJ)) return true;

            // Backtrack if no path found
            visited.delete(key);
            path.pop();
        }
    }
    return false; // No path found in this direction
}

function calculateCost(path) {
    const costPath = [];
    let sign = 1; // Start with positive sign for first segment
    let netCost = 0;
    let mostNegativeNetCost = Infinity;  // Initialize for tracking negative costs
    let mostNegativePath = null;  // To store path with most negative cost

    // Loop through each cell in path except last (cycle ends at first cell)
    for (let k = 0; k < path.length - 1; k++) {
        const [rowStr, colStr] = path[k].match(/\d+/g); // Extract indices
        const row = parseInt(rowStr) - 1;
        const col = parseInt(colStr) - 1;
        const cost = costs[row][col];

        // Assign sign symbol for display
        const symbol = sign > 0 ? '+' : '-';
        costPath.push(`${symbol}${cost}`);

        netCost += sign * cost; // Accumulate net cost

        sign *= -1; // Alternate sign for next segment
    }

    // Check if this path has the lowest (most negative) net cost so far
    if (netCost < mostNegativeNetCost) {
        mostNegativeNetCost = netCost;  // Update lowest cost found
        mostNegativePath = path;        // Store path causing it
    }

    return { costPath, netCost, mostNegativeNetCost, mostNegativePath };
}

// Show updated stepping stone table with signs and highlight on critical cell
function displayUpdatedSteppingStoneTable(mostNegativeCell, closedPath) {
    const table = document.getElementById('steppingstonetable');
    
    // Create a fresh table to replace old one
    const newTable = document.createElement('table');
    newTable.id = 'steppingstonetable';
    newTable.border = '1';
    newTable.style.marginTop = '20px';

    const supplyCount = allocatedValues.length;
    const demandCount = allocatedValues[0].length;

    // Header row with demand labels
    const headerRow = document.createElement('tr');
    const cornerCell = document.createElement('th');
    cornerCell.textContent = '';
    headerRow.appendChild(cornerCell);

    for (let j = 0; j < demandCount; j++) {
        const th = document.createElement('th');
        th.textContent = 'D' + (j + 1);
        headerRow.appendChild(th);
    }
    newTable.appendChild(headerRow);

    // Create map to store + or − sign for each cell in the closed path
    const signMap = new Map();
    let sign = 1;
    for (let k = 0; k < closedPath.length - 1; k++) {
        const cell = closedPath[k];
        signMap.set(cell, sign > 0 ? '+' : '−');
        sign *= -1; // Alternate sign for next cell
    }

    // Build table rows for supplies
    for (let i = 0; i < supplyCount; i++) {
        const row = document.createElement('tr');
        const label = document.createElement('th');
        label.textContent = 'S' + (i + 1);
        row.appendChild(label);

        for (let j = 0; j < demandCount; j++) {
            const td = document.createElement('td');
            td.style.width = '60px';
            td.style.height = '40px';
            td.style.textAlign = 'center';
            td.style.position = 'relative';

            const cellId = `S${i + 1}D${j + 1}`;

            // Show cost value in cell top-right corner
            const costTag = document.createElement('div');
            costTag.textContent = costs[i][j];
            Object.assign(costTag.style, {
                position: 'absolute',
                top: '2px',
                right: '4px',
                fontSize: '11px',
                color: '#555'
            });
            td.appendChild(costTag);

            // Show sign + or − in top-left if cell is part of closed path
            if (signMap.has(cellId)) {
                const signTag = document.createElement('div');
                signTag.textContent = signMap.get(cellId);
                Object.assign(signTag.style, {
                    position: 'absolute',
                    top: '2px',
                    left: '4px',
                    fontSize: '30px',
                    fontWeight: 'bold',
                    color: signMap.get(cellId) === '+' ? '#2e7d32' : '#c62828' // green or red
                });
                td.appendChild(signTag);
            }

            // Highlight allocated values with green background
            if (allocatedValues[i][j] > 0) {
                td.style.backgroundColor = '#c8e6c9';
                const allocTag = document.createElement('div');
                allocTag.textContent = allocatedValues[i][j];
                allocTag.style.marginTop = '14px';
                allocTag.style.fontWeight = 'bold';
                allocTag.style.color = '#000';
                td.appendChild(allocTag);
            }

            // Highlight the most negative cell in yellow
            if (cellId === mostNegativeCell) {
                td.style.backgroundColor = '#ffeb3b';
            }

            row.appendChild(td);
        }
        newTable.appendChild(row);
    }

    // Add heading label above table
    const label = document.createElement('h3');
    label.textContent = 'Updated Stepping Stone Table with Highlighted Cell & Signs';
    label.style.marginTop = '20px';

    // Append to solve section in DOM
    const solveSection = document.getElementById('solveSection');
    solveSection.appendChild(label);
    solveSection.appendChild(newTable);
}

// Calculate total transportation cost based on current allocations
function calculateTotalTransportationCost() {
    let totalCost = 0;
    let formulaParts = [];

    for (let i = 0; i < allocatedValues.length; i++) {
        for (let j = 0; j < allocatedValues[i].length; j++) {
            const allocation = allocatedValues[i][j];
            const cost = costs[i][j];
            if (allocation > 0) {
                totalCost += allocation * cost;
                formulaParts.push(`(${allocation} × ${cost})`);
            }
        }
    }

    // Join formula parts
    const formulaString = formulaParts.join(' + ');

    // Display formula
    const formulaElement = document.createElement('p');
    formulaElement.textContent = `Total Cost Formula = ${formulaString}`;
    formulaElement.style.marginTop = '20px';
    formulaElement.style.fontWeight = 'bold';

    // Display final total cost
    const result = document.createElement('h3');
    result.textContent = `Optimum Total Cost = ${totalCost}`;
    result.style.marginTop = '10px';
    result.style.color = '#2e7d32';

    const solveSection = document.getElementById('solveSection');
    solveSection.appendChild(formulaElement);
    solveSection.appendChild(result);
}

// Perform Reallocation and update table
function performReallocation(mostNegativeCell, closedPath, onDone) {
    // Remove duplicate last cell
    const [firstRowStr, firstColStr] = closedPath[0].match(/\d+/g);
    const [lastRowStr, lastColStr] = closedPath[closedPath.length - 1].match(/\d+/g);
    if (firstRowStr === lastRowStr && firstColStr === lastColStr) closedPath.pop();

    const signedPath = closedPath.map((cell, index) => {
        return { cell, sign: index % 2 === 0 ? '+' : '-' };
    });

    let minAllocation = Infinity;
    for (const entry of signedPath) {
        const [rowStr, colStr] = entry.cell.match(/\d+/g);
        const row = parseInt(rowStr) - 1;
        const col = parseInt(colStr) - 1;
        if (entry.sign === '-' && allocatedValues[row][col] > 0) {
            minAllocation = Math.min(minAllocation, allocatedValues[row][col]);
        }
    }

    for (const entry of signedPath) {
        const [rowStr, colStr] = entry.cell.match(/\d+/g);
        const row = parseInt(rowStr) - 1;
        const col = parseInt(colStr) - 1;
        if (entry.sign === '+') {
            allocatedValues[row][col] += minAllocation;
        } else {
            allocatedValues[row][col] -= minAllocation;
        }
    }

    displayReallocatedTable(minAllocation, closedPath);  // Pass closedPath here
    displayAllocationSummary();
    // Call onDone callback after reallocation is done to continue loop
    if (onDone) onDone();
}

function displayReallocatedTable(minAllocation) {
    const instructionLabel = document.createElement('p');
    instructionLabel.textContent = `Re-allocate Minimum allocated value among all negative positions (-) on closed path = ${minAllocation}. Subtract ${minAllocation} from all (-) cells and add ${minAllocation} to all (+) cells in the closed path.`;
    instructionLabel.style.fontWeight = 'bold';
    instructionLabel.style.marginTop = '20px';

    const table = document.createElement('table');
    table.id = 'reallocatedSteppingStoneTable';
    table.style.marginTop = '10px';

    const supplyCount = allocatedValues.length;
    const demandCount = allocatedValues[0].length;

    const headerRow = document.createElement('tr');
    const corner = document.createElement('th');
    corner.textContent = '';
    headerRow.appendChild(corner);

    for (let j = 0; j < demandCount; j++) {
        const th = document.createElement('th');
        th.textContent = 'D' + (j + 1);
        headerRow.appendChild(th);
    }
    table.appendChild(headerRow);

    for (let i = 0; i < supplyCount; i++) {
        const row = document.createElement('tr');
        const labelCell = document.createElement('th');
        labelCell.textContent = 'S' + (i + 1);
        row.appendChild(labelCell);

        for (let j = 0; j < demandCount; j++) {
            const td = document.createElement('td');
            td.style.width = '60px';
            td.style.height = '40px';
            td.style.textAlign = 'center';

            const costTag = document.createElement('div');
            costTag.textContent = costs[i][j];
            costTag.style.position = 'absolute';
            costTag.style.top = '2px';
            costTag.style.right = '4px';
            costTag.style.fontSize = '11px';
            costTag.style.color = '#555';
            td.style.position = 'relative';
            td.appendChild(costTag);

            if (allocatedValues[i][j] > 0) {
                td.style.backgroundColor = '#c8e6c9';
                const alloc = document.createElement('div');
                alloc.textContent = allocatedValues[i][j];
                alloc.style.marginTop = '14px';
                alloc.style.fontWeight = 'bold';
                td.appendChild(alloc);
            }
            row.appendChild(td);
        }
        table.appendChild(row);
    }
    const solveSection = document.getElementById('solveSection');
    solveSection.appendChild(instructionLabel);
    solveSection.appendChild(table);
}

// Display Allocation Summary
function displayAllocationSummary() {
    for (let i = 0; i < allocatedValues.length; i++) {
        for (let j = 0; j < allocatedValues[i].length; j++) {
        }
    }
}

function updateAllocations(path) {
   let negativeCells = path.filter(cell => cell.sign === '-');
    let minValue = Math.min(...negativeCells.map(cell => cell.supply));

console.log('Minimum value among negative cells:', minValue);// Find the minimum supply/demand in the negative cells
    console.log(`Reallocation minimum value: ${minValue}`);

    // Traverse the closed path
    path.forEach(cell => {
        if (cell.sign === '-') {
            console.log(`Reducing ${cell.name} by ${minValue}`);
            cell.allocation -= minValue;
        } else if (cell.sign === '+') {
            console.log(`Increasing ${cell.name} by ${minValue}`);
            cell.allocation += minValue;
        }
    });

    // Log the updated allocations
    path.forEach(cell => {
        console.log(`Updated allocation for ${cell.name}: ${cell.allocation}`);
    });
}

/*
displaySteppingStoneTable(): Creates and shows the stepping stone table with costs and current allocations.
Adds a button to start the Stepping Stone solution process.

displayClosedPathsAndCosts(isLoop): Finds and displays all closed paths and their net cost changes.
If a negative net cost path exists, triggers reallocation and loops until optimal.

getClosedPathsAndCosts(): Scans all unallocated cells to find closed cycles and computes their net cost changes.
Returns a list of these paths with cost info.

findSteppingStoneCycle(startI, startJ): Attempts to find a closed path (cycle) starting from a given unallocated cell.
Returns the path if found; otherwise null.

findClosedPath(i, j, path, visited, startI, startJ): Recursive helper that searches along rows for next allocated cell in cycle.
Tries to build a valid closed path by alternating row and column moves.
Returns true if path found, false otherwise.

findColumnPath(i, j, path, visited, startI, startJ): 
    Recursively searches vertically (down/up) for a closed path in the stepping stone method, avoiding visited cells and building a cycle.

findRowPath(i, j, path, visited, startI, startJ): 
    Recursively searches horizontally (left/right) for a closed path in the stepping stone method, complementing findColumnPath to form a full cycle.

calculateCost(path): 
    Calculates net cost of a given closed path by alternating signs (+/-) on each cell's cost; tracks and returns the path with the most negative net cost.

displayUpdatedSteppingStoneTable(mostNegativeCell, closedPath): 
    Builds and displays an updated table showing costs, allocations, plus/minus signs along the closed path, highlighting the cell with the most negative net cost.

calculateTotalTransportationCost(): 
    Computes the total transportation cost from all allocated values multiplied by their costs and displays the final result in the UI.

performReallocation(mostNegativeCell, closedPath, onDone):
Updates allocations along the closed path by shifting supply based on the minimum allocation on '-' cells;
adjusts allocatedValues accordingly, updates the display table, and triggers a callback after completion.

displayReallocatedTable(minAllocation):
Creates and displays a table showing the updated allocations after reallocation, along with instructions describing the adjustment process.

displayAllocationSummary():
Placeholder function to display or update allocation summary details; currently empty but can be extended for summaries or logs.

updateAllocations(path):
Adjusts allocation values along a given path by subtracting the minimum allocation from '-' cells and adding it to '+' cells;
*/