function displaySteppingStoneTable() {
    const existingTable = document.getElementById('steppingstonetable');
    if (existingTable) return;
    const isDarkMode = document.body.classList.contains('dark-mode');
    const table = document.createElement('table');
    table.id = 'steppingstonetable';
    table.style.marginTop = '20px';
    const supplyCount = allocatedValues.length;
    const demandCount = allocatedValues[0].length;
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
    for (let i = 0; i < supplyCount; i++) {
        const row = document.createElement('tr');
        const label = document.createElement('th');
        label.textContent = 'S' + (i + 1);
        row.appendChild(label);

        for (let j = 0; j < demandCount; j++) {
            const td = document.createElement('td');

            td.style.width = '70px';
            td.style.height = '75px';
            td.style.textAlign = 'center';
            td.style.position = 'relative';
            const costTag = document.createElement('div');
            costTag.textContent = costs[i][j];
            costTag.style.position = 'absolute';
            costTag.style.top = '2px';
            costTag.style.right = '4px';
            costTag.style.fontSize = '11px';
            td.appendChild(costTag);
            if (allocatedValues[i][j] > 0) {
                td.classList.add('allocated');  
                const allocTag = document.createElement('div');
                allocTag.textContent = allocatedValues[i][j];
                allocTag.style.marginTop = '14px';
                allocTag.style.fontWeight = 'bold';
                td.style.color = ''; 
                td.appendChild(allocTag);
            }
            row.appendChild(td);
        }
        table.appendChild(row);
    }
    const label = document.createElement('h3');
    label.textContent = 'Intial Stepping Stone Table';
    label.style.marginTop = '30px';
    label.classList.add('new-stepping-stone-label');
    
    const solveSection = document.getElementById('solveSection');
    solveSection.appendChild(label);
    solveSection.appendChild(table);
    const solveButton = document.createElement('button');
    solveButton.textContent = 'Solve Stepping Stone';
    solveButton.style.marginTop = '20px';
    solveButton.id = 'startSteppingStoneButton';

    solveButton.onclick = function () {
        solveButton.disabled = true;
        displayClosedPathsAndCosts(true);
    };
    solveSection.appendChild(solveButton);
    solveButton.scrollIntoView({ behavior: 'smooth' });
}
function displayClosedPathsAndCosts(isLoop = false) {
    const paths = getClosedPathsAndCosts();

    const solveSection = document.getElementById('solveSection');
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '40px';
    container.style.alignItems = 'flex-start';

    const closedPathsSection = document.createElement('div');
    closedPathsSection.style.flex = '1';

    const label = document.createElement('h3');
    label.textContent = 'Closed Paths & Net Cost Changes';
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
    let mostNegativeRow = null;

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
            mostNegativeRow = row;  
        }
    }

    if (mostNegativeRow && mostNegativePath.netCost < 0) {
        mostNegativeRow.classList.add('highlight-negative');
    }

    closedPathsSection.appendChild(label);
    closedPathsSection.appendChild(table);
    

    container.appendChild(closedPathsSection);
    solveSection.appendChild(container);

    if (!mostNegativePath || mostNegativePath.netCost >= 0) {
        container.appendChild(closedPathsSection);
        solveSection.appendChild(container);
        calculateTotalTransportationCost(); 
        return;
    }
    container.appendChild(closedPathsSection);
    displayUpdatedSteppingStoneTable(mostNegativeCell, mostNegativePath.path, container);
    
    performReallocation(mostNegativeCell, mostNegativePath.path, () => {
        setTimeout(() => {
            displayClosedPathsAndCosts(true);
        }, 50); 
    });
}
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
    } return closedPaths;
}
function findSteppingStoneCycle(startI, startJ) {
    const path = [];
    path.push(`S${startI + 1}D${startJ + 1}`);
    const visited = new Set([`${startI},${startJ}`]);
    const found = findClosedPath(startI, startJ, path, visited, startI, startJ);
    return found ? path : null;
}
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
    } return false;
}
function findColumnPath(i, j, path, visited, startI, startJ) {
    for (let row = 0; row < allocatedValues.length; row++) {
        if (row === i) continue; 
        if (row === startI && j === startJ && path.length >= 3) {
            path.push(`S${row + 1}D${j + 1}`);
            return true; 
        }
        if (allocatedValues[row][j] > 0) {
            const key = `${row},${j}`;
            if (visited.has(key)) continue;
            visited.add(key);
            if (findRowPath(row, j, path, visited, startI, startJ)) return true;
            visited.delete(key);
            path.pop();
        }
    } return false; 
}
function findRowPath(i, j, path, visited, startI, startJ) {
    for (let col = 0; col < allocatedValues[0].length; col++) {
        if (col === j) continue; 
        if (i === startI && col === startJ && path.length >= 3) {
            path.push(`S${i + 1}D${col + 1}`);
            return true; 
        }
        if (allocatedValues[i][col] > 0) {
            const key = `${i},${col}`;
            if (visited.has(key)) continue; 
            visited.add(key); 
            path.push(`S${i + 1}D${col + 1}`); 
            if (findColumnPath(i, col, path, visited, startI, startJ)) return true;
            visited.delete(key);
            path.pop();
        }
    } return false; 
}
function calculateCost(path) {
    const costPath = [];
    let sign = 1; 
    let netCost = 0;

    for (let k = 0; k < path.length - 1; k++) {
        const [rowStr, colStr] = path[k].match(/\d+/g);
        const row = parseInt(rowStr) - 1;
        const col = parseInt(colStr) - 1;
        const cost = costs[row][col];

        costPath.push((sign > 0 ? '+' : '-') + cost);
        netCost += sign * cost;
        sign = -sign;
    }
    return { costPath, netCost };
}
function displayUpdatedSteppingStoneTable(mostNegativeCell, closedPath, container) {
    const tableSection = document.createElement('div');
    tableSection.style.flex = '1';
    const newTable = document.createElement('table');
    newTable.id = 'steppingstonetable';
    newTable.style.marginTop = '20px';

    const supplyCount = allocatedValues.length;
    const demandCount = allocatedValues[0].length;
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
    const signMap = new Map();
    const arrowMap = new Map();
    const negativeCells = [];

    let sign = 1;
    for (let k = 0; k < closedPath.length - 1; k++) {
        const current = closedPath[k];
        const next = closedPath[k + 1];
        const cellSign = sign > 0 ? '+' : '−';
        signMap.set(current, cellSign);
        sign *= -1;
        const [curRow, curCol] = current.match(/\d+/g).map(Number);
        const [nextRow, nextCol] = next.match(/\d+/g).map(Number);

        let arrow = '';
        if (curRow === nextRow) {
            arrow = nextCol > curCol ? '→' : '←';
        } else if (curCol === nextCol) {
            arrow = nextRow > curRow ? '↓' : '↑';
        }
        arrowMap.set(current, arrow);
        if (cellSign === '−') {
            const i = curRow - 1;
            const j = curCol - 1;
            if (allocatedValues[i][j] > 0) {
                negativeCells.push({ row: i, col: j, value: allocatedValues[i][j], id: current });
            }
        }
    }
    let leastNegativeCell = null;
    if (negativeCells.length > 0) {
        leastNegativeCell = negativeCells.reduce((min, cell) => cell.value < min.value ? cell : min);
    }

    for (let i = 0; i < supplyCount; i++) {
        const row = document.createElement('tr');
        const label = document.createElement('th');
        label.textContent = 'S' + (i + 1);
        row.appendChild(label);

        for (let j = 0; j < demandCount; j++) {
            const td = document.createElement('td');
            td.style.width = '70px';
            td.style.height = '75px';
            td.style.textAlign = 'center';
            td.style.position = 'relative';
            const cellId = `S${i + 1}D${j + 1}`;
            const costTag = document.createElement('div');
            costTag.textContent = costs[i][j];
            costTag.classList.add('cost-tag');
            td.appendChild(costTag);
            if (signMap.has(cellId)) {
                const signTag = document.createElement('div');
                signTag.textContent = signMap.get(cellId);
                signTag.style.position = 'absolute';
                signTag.style.top = '2px';
                signTag.style.left = '4px';
                signTag.style.fontSize = '30px';
                signTag.style.fontWeight = 'bold';
                signTag.style.color = signMap.get(cellId) === '+' ? '#2e7d32' : '#c62828';
                td.appendChild(signTag);
            }
            if (arrowMap.has(cellId)) {
                const arrowTag = document.createElement('div');
                arrowTag.textContent = arrowMap.get(cellId);
                arrowTag.classList.add('arrow-tag');
                td.appendChild(arrowTag);
            }
            if (allocatedValues[i][j] > 0) {
                td.classList.add('allocated');
                const allocTag = document.createElement('div');
                allocTag.textContent = allocatedValues[i][j];
                allocTag.style.marginTop = '14px';
                allocTag.style.fontWeight = 'bold';
                td.appendChild(allocTag);
            } else {
                td.classList.add('unallocated');
            }
            if (cellId === mostNegativeCell) {
                td.classList.add('highlight-yellow');
            }
            if (leastNegativeCell && leastNegativeCell.row === i && leastNegativeCell.col === j) {
                td.classList.add('highlight-grey');
            }
            row.appendChild(td);
        } newTable.appendChild(row);
    }
    const label = document.createElement('h3');
    label.textContent = 'Grey: Add this value to + cells and Subtract from all (−) cells';
    label.classList.add('toggle-text');

    tableSection.id = 'steppingStoneTableSection';
    tableSection.appendChild(label);
    container.appendChild(tableSection);
    tableSection.appendChild(newTable);

    document.getElementById('steppingStoneTableSection').scrollIntoView({ behavior: 'smooth' });
}
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
    const isDarkMode = document.body.classList.contains('dark-mode');

    const formulaString = formulaParts.join(' + ');

    const formulaElement = document.createElement('p');
    formulaElement.textContent = `Total Cost Formula = ${formulaString}`;
    formulaElement.style.marginTop = '20px';
    formulaElement.style.fontWeight = 'bold';
    formulaElement.classList.add('formula-text');

    const result = document.createElement('h3');
    result.textContent = `Optimum Total Cost = ${totalCost}`;
    result.style.marginTop = '10px';
    result.style.color = isDarkMode ? '#80e27e' : '#2e7d32';
    result.classList.add('result-text');

    const solveSection = document.getElementById('solveSection');
    solveSection.appendChild(formulaElement);
    solveSection.appendChild(result);
}
function performReallocation(mostNegativeCell, closedPath, onDone) {
    const [firstRowStr, firstColStr] = closedPath[0].match(/\d+/g);
    const [lastRowStr, lastColStr] = closedPath[closedPath.length - 1].match(/\d+/g);
    if (firstRowStr === lastRowStr && firstColStr === lastColStr) closedPath.pop();

    const signedPath = closedPath.map((cell, index) => {
        return { cell, sign: index % 2 === 0 ? '+' : '-' };
    });

    let minAllocation = Infinity;
    let minCellBeforeAlloc = null;

    for (const entry of signedPath) {
        const [rowStr, colStr] = entry.cell.match(/\d+/g);
        const row = parseInt(rowStr) - 1;
        const col = parseInt(colStr) - 1;
        if (entry.sign === '-' && allocatedValues[row][col] > 0) {
            if (allocatedValues[row][col] < minAllocation) {
                minAllocation = allocatedValues[row][col];
                minCellBeforeAlloc = { row, col };
            }
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
    displayReallocatedTable(minAllocation, closedPath, minCellBeforeAlloc);
    if (onDone) onDone();
}
function displayReallocatedTable(minAllocation, closedPath, minCellBeforeAlloc) {
    const instructionLabel = document.createElement('h3');
    instructionLabel.textContent = `New Stepping Stone Table`;
    instructionLabel.classList.add('new-stepping-stone-label');

    const table = document.createElement('table');
    table.id = 'reallocatedSteppingStoneTable';

    const supplyCount = allocatedValues.length;
    const demandCount = allocatedValues[0].length;

    const headerRow = document.createElement('tr');
    const corner = document.createElement('th');
    corner.textContent = '';
    headerRow.appendChild(corner);

    for (let j = 0; j < demandCount; j++) {
        const th = document.createElement('th');
        th.textContent = 'D' + (j + 1);
        th.classList.add('header-label');
        headerRow.appendChild(th);
    }
    table.appendChild(headerRow);

    for (let i = 0; i < supplyCount; i++) {
        const row = document.createElement('tr');
        const labelCell = document.createElement('th');
        labelCell.textContent = 'S' + (i + 1);
        labelCell.classList.add('header-label');
        row.appendChild(labelCell);

        for (let j = 0; j < demandCount; j++) {
            const td = document.createElement('td');
            td.style.width = '70px';
            td.style.height = '75px';
            td.style.textAlign = 'center';
            td.style.position = 'relative';

            const costTag = document.createElement('div');
            costTag.textContent = costs[i][j];
            costTag.classList.add('cost-tag');
            td.appendChild(costTag);

            if (allocatedValues[i][j] > 0) {
            td.classList.add('allocated-cell');
            const alloc = document.createElement('div');
            alloc.textContent = allocatedValues[i][j];
            alloc.style.marginTop = '14px';
            alloc.style.fontWeight = 'bold';
            alloc.classList.add('alloc-value');
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
function updateAllocations(path) {
    let negativeCells = path.filter(cell => cell.sign === '-');
    let minValue = Math.min(...negativeCells.map(cell => cell.supply));

    console.log('Minimum value among negative cells:', minValue);
    console.log(`Reallocation minimum value: ${minValue}`);

    path.forEach(cell => {
        if (cell.sign === '-') {
            console.log(`Reducing ${cell.name} by ${minValue}`);
            cell.allocation -= minValue;
        } else if (cell.sign === '+') {
            console.log(`Increasing ${cell.name} by ${minValue}`);
            cell.allocation += minValue;
        }
    });
    path.forEach(cell => {
        console.log(`Updated allocation for ${cell.name}: ${cell.allocation}`);
    });
}
