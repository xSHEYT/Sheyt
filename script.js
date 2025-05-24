// Default counts for supply (rows) and demand (columns)
let supplyCount = 3;
let demandCount = 3;

// Generate a sample transportation problem with random costs, supply, and demand
function generateSample() {
  // Clear final matrix display
  document.getElementById('finalTable').innerHTML = '';

  // Clear total cost info
  document.getElementById('totalCostFormula').textContent = '';
  document.getElementById('totalCost').textContent = '';

  // Clear solve section (NW button, stepping stone results, etc.)
  document.getElementById('solveSection').innerHTML = '';

  // Get number of rows and columns from user inputs
  const rows = parseInt(document.getElementById('rowsInput').value);
  const cols = parseInt(document.getElementById('columnsInput').value);

  // Get which dummy option user selected (none, add dummy supply, add dummy demand)
  const dummyOption = document.querySelector('input[name="dummyOption"]:checked').value;

  // First generate the empty input table based on rows and columns
  generateTable();

  let supply = [];
  let demand = [];
  let totalSupply = 0;
  let totalDemand = 0;

  // Generate random supply values between 20 and 69
  for (let i = 0; i < rows; i++) {
    const val = Math.floor(Math.random() * 50) + 20;
    supply.push(val);
    totalSupply += val;
  }

  // Generate random demand values between 20 and 69
  for (let j = 0; j < cols; j++) {
    const val = Math.floor(Math.random() * 50) + 20;
    demand.push(val);
    totalDemand += val;
  }

  // Adjust supply/demand based on dummy option selected
  switch (dummyOption) {
    case 'none': {
      // If no dummy, balance supply and demand by scaling one to match the other
      const supplySum = supply.reduce((a, b) => a + b, 0);
      const demandSum = demand.reduce((a, b) => a + b, 0);

      if (supplySum > demandSum) {
        
        // Scale demand up proportionally to match supply total
        const factor = supplySum / demandSum;
        demand = demand.map(val => Math.floor(val * factor));
        
        // Fix rounding errors by adjusting last demand value
        const newDemandSum = demand.reduce((a, b) => a + b, 0);
        const diff = supplySum - newDemandSum;
        demand[demand.length - 1] += diff;
      } else if (demandSum > supplySum) {
        
        // Scale supply up proportionally to match demand total
        const factor = demandSum / supplySum;
        supply = supply.map(val => Math.floor(val * factor));
        
        // Fix rounding errors by adjusting last supply value
        const newSupplySum = supply.reduce((a, b) => a + b, 0);
        const diff = demandSum - newSupplySum;
        supply[supply.length - 1] += diff;
      }

      // Update totals after adjustments
      totalSupply = supply.reduce((a, b) => a + b, 0);
      totalDemand = demand.reduce((a, b) => a + b, 0);
      break;
    }

    case 'supply':
      // Force demand to be greater than supply to create a dummy supply row later
      if (totalDemand <= totalSupply) {
        const index = Math.floor(Math.random() * cols);
        const delta = (totalSupply - totalDemand) + Math.floor(Math.random() * 10) + 5;
        demand[index] += delta;
        totalDemand += delta;
      }
      break;

    case 'demand':
      // Force supply to be greater than demand to create a dummy demand column later
      if (totalSupply <= totalDemand) {
        const index = Math.floor(Math.random() * rows);
        const delta = (totalDemand - totalSupply) + Math.floor(Math.random() * 10) + 5;
        supply[index] += delta;
        totalSupply += delta;
      }
      break;
  }

  // Fill the supply input fields with generated values
  for (let i = 0; i < rows; i++) {
    document.getElementById(`supplyInput${i}`).value = supply[i];
  }

  // Fill the demand input fields with generated values
  for (let j = 0; j < cols; j++) {
    document.getElementById(`demandInput${j}`).value = demand[j];
  }

  // Fill each cost input cell in the table with a random cost between 1 and 20
  const table = document.getElementById('inputTable');
  for (let i = 1; i <= rows; i++) {
    for (let j = 1; j <= cols; j++) {
      const cell = table.rows[i].cells[j];
      const input = cell.querySelector('input');
      input.value = Math.floor(Math.random() * 20) + 1;
    }
  }
  // Show total supply and demand in the bottom-right cell
  const lastRow = table.rows[table.rows.length - 1]; // last row (demand row)
  const lastCell = lastRow.cells[lastRow.cells.length - 1]; // last cell in demand row
  lastCell.innerHTML = `Supply: ${totalSupply}<br>Demand: ${totalDemand}`;
  lastCell.style.fontWeight = 'bold';
  lastCell.style.textAlign = 'center';
}

// When page loads, generate initial input table with default sizes
document.addEventListener("DOMContentLoaded", function () {
  generateTable();
});

// Generate the input table for entering costs, supply, and demand
function generateTable() {
  // Clear final matrix display
  document.getElementById('finalTable').innerHTML = '';

  // Clear total cost info
  document.getElementById('totalCostFormula').textContent = '';
  document.getElementById('totalCost').textContent = '';

  // Clear solve section (NW button, stepping stone results, etc.)
  document.getElementById('solveSection').innerHTML = '';


  supplyCount = parseInt(document.getElementById('rowsInput').value);
  demandCount = parseInt(document.getElementById('columnsInput').value);

  // Check for invalid input sizes
  if (supplyCount <= 1 || demandCount <= 1) {
    alert("Please enter a value greater than 1 for both rows and columns.");
    return;
  }

  // Clear existing table before generating new one
  const tableSection = document.getElementById('tableSection');
  tableSection.innerHTML = '';

  const table = document.createElement('table');
  table.id = 'inputTable';

  // Create header row with demand labels D1, D2, ..., and 'Supply' column at end
  const header = document.createElement('tr');
  header.appendChild(document.createElement('th')); // empty top-left corner cell
  for (let j = 0; j < demandCount; j++) {
    const th = document.createElement('th');
    th.textContent = `D${j + 1}`;
    header.appendChild(th);
  }
  const supplyTh = document.createElement('th');
  supplyTh.textContent = 'Supply';
  header.appendChild(supplyTh);
  table.appendChild(header);

  // Create rows for each supply source with cost inputs and supply input at end
  for (let i = 0; i < supplyCount; i++) {
    const row = document.createElement('tr');
    const th = document.createElement('th');
    th.textContent = `S${i + 1}`;
    row.appendChild(th);

    for (let j = 0; j < demandCount; j++) {
      const td = document.createElement('td');
      const label = document.createElement('label');
      label.textContent = 'Cost: ';
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      td.appendChild(label);
      td.appendChild(input);
      row.appendChild(td);
    }

    // Supply input field for this row
    const supplyTd = document.createElement('td');
    const supplyInput = document.createElement('input');
    supplyInput.type = 'number';
    supplyInput.min = '0';
    supplyInput.id = `supplyInput${i}`;
    supplyTd.appendChild(supplyInput);
    row.appendChild(supplyTd);

    table.appendChild(row);
  }

  // Create demand row at the bottom with inputs for each demand column
  const demandRow = document.createElement('tr');
  const thDemand = document.createElement('th');
  thDemand.textContent = 'Demand';
  demandRow.appendChild(thDemand);

  for (let j = 0; j < demandCount; j++) {
    const td = document.createElement('td');
    const demandInput = document.createElement('input');
    demandInput.type = 'number';
    demandInput.min = '0';
    demandInput.id = `demandInput${j}`;
    td.appendChild(demandInput);
    demandRow.appendChild(td);
  }

  // Empty cell at the end of demand row under 'Supply' column
  const emptyTd = document.createElement('td');
  demandRow.appendChild(emptyTd);

  table.appendChild(demandRow);
  tableSection.appendChild(table);
}

// Generates the matrix table from user input and prepares it for solving
function generateMatrix() {
  // Clear any previous total cost displays
  const formulaElem = document.getElementById('totalCostFormula');
  const totalCostElem = document.getElementById('totalCost');
  const nextBtn = document.getElementById('nextStepButton');
  
  if (totalCostElem && totalCostElem.textContent.trim() !== '') {
    if (nextBtn) nextBtn.style.display = 'none';  // Hide next button
  }
  if (formulaElem) formulaElem.textContent = '';
  if (totalCostElem) totalCostElem.textContent = '';

  const table = document.getElementById('inputTable');
  const rows = table.rows;

  // Validate all input fields first
  for (let i = 1; i <= supplyCount; i++) {
    for (let j = 1; j <= demandCount; j++) {
      const input = rows[i].cells[j].querySelector('input');
      if (!input || input.value.trim() === '') {
        alert('Please insert all cost values before generating the matrix.');
        return;
      }
    }

    const supplyInput = rows[i].cells[demandCount + 1].querySelector('input');
    if (!supplyInput || supplyInput.value.trim() === '') {
      alert('Please insert all supply values before generating the matrix.');
      return;
    }
  }

  const demandRowInputs = rows[supplyCount + 1];
  for (let j = 1; j <= demandCount; j++) {
    const demandInput = demandRowInputs.cells[j].querySelector('input');
    if (!demandInput || demandInput.value.trim() === '') {
      alert('Please insert all demand values before generating the matrix.');
      return;
    }
  }


  let supplyTotal = 0;
  let demandTotal = 0;

  // Create a new table to show the final matrix
  const final = document.createElement('table');
  final.id = 'finalMatrix';

  // Copy header row from input table
  final.appendChild(rows[0].cloneNode(true));

  // Copy cost values and supply values for each supply row
  for (let i = 1; i <= supplyCount; i++) {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.textContent = `S${i}`;
    tr.appendChild(th);

    // Copy costs from each demand column
    for (let j = 1; j <= demandCount; j++) {
      const td = document.createElement('td');
      const input = rows[i].cells[j].querySelector('input');
      const cost = input ? (input.value || 0) : '0';

      // Check if dark mode is on
      const isDarkMode = document.body.classList.contains('dark-mode');

      // Show cost in cell with styling
      td.style.position = 'relative';
      const costDiv = document.createElement('div');
      costDiv.textContent = cost;
      costDiv.style.position = 'absolute';
      costDiv.style.top = '2px';
      costDiv.style.right = '4px';
      costDiv.style.fontSize = '12px';
      costDiv.classList.add('cost-value');
    
      td.appendChild(costDiv);
      tr.appendChild(td);
    }

    // Copy supply value for the row
    const supplyTd = document.createElement('td');
    const supplyInput = rows[i].cells[demandCount + 1].querySelector('input');
    const supplyVal = supplyInput ? (supplyInput.value || 0) : '0';
    supplyTd.textContent = supplyVal;
    supplyTotal += Number(supplyVal);
    tr.appendChild(supplyTd);

    final.appendChild(tr);
    // Make solve section visible after generating matrix
    document.getElementById('solveSection').style.display = 'block';
  }

  // Copy demand row values
  const demandRow = document.createElement('tr');
  const thDemand = document.createElement('th');
  thDemand.textContent = 'Demand';
  demandRow.appendChild(thDemand);

  for (let j = 1; j <= demandCount; j++) {
    const td = document.createElement('td');
    const demandInput = rows[supplyCount + 1].cells[j].querySelector('input');
    const demandVal = demandInput ? (demandInput.value || 0) : '0';
    td.textContent = demandVal;
    demandTotal += Number(demandVal);
    demandRow.appendChild(td);
  }

  // Add a cell showing total supply and demand
  const totalTd = document.createElement('td');
  totalTd.innerHTML = `Supply: ${supplyTotal}<br>Demand: ${demandTotal}`;
  demandRow.appendChild(totalTd);
  final.appendChild(demandRow);
  
  // Clear old matrix and append new one
  const finalTableSection = document.getElementById('finalTable');
  finalTableSection.innerHTML = '<h2>North West Corner Method:</h2>';
  finalTableSection.appendChild(final);

  // Check if supply and demand are not equal, adjust with dummy supply/demand
  // After adjusting for dummy rows/columns, update total supply and demand display
  if (supplyTotal !== demandTotal) {
  adjustForDummyRowsAndColumns(final, supplyTotal, demandTotal);

  // Recalculate totals to include dummy rows/columns
  let newSupplyTotal = 0;
  let newDemandTotal = 0;

  // Sum supply column (last column except last row)
  for (let i = 1; i < final.rows.length - 1; i++) {
    newSupplyTotal += Number(final.rows[i].cells[final.rows[i].cells.length - 1].textContent) || 0;
  }

  // Sum demand row (last row except last cell)
  const lastRow = final.rows[final.rows.length - 1];
  for (let j = 1; j < lastRow.cells.length - 1; j++) {
    newDemandTotal += Number(lastRow.cells[j].textContent) || 0;
  }

  // Update bottom-right cell in demand row
  const bottomRightCell = lastRow.cells[lastRow.cells.length - 1];
  bottomRightCell.innerHTML = `Supply: ${newSupplyTotal}<br>Demand: ${newDemandTotal}`;
}


  // Clear old buttons
  const solveSection = document.getElementById('solveSection');
  solveSection.innerHTML = '';

  // Create the Solve button with styles and append it
  const solveBtn = document.createElement('button');
  solveBtn.textContent = 'Solve';
  solveBtn.classList.add('solve-button');
  solveBtn.style.marginTop = '20px';
  solveBtn.style.cursor = 'pointer';

  solveBtn.addEventListener('click', function() {
    solveBtn.style.display = 'none';
    solveNorthWestCorner(final);
  });

  solveSection.appendChild(solveBtn);
}

function adjustForDummyRowsAndColumns(final, supplyTotal, demandTotal) {
  const isDarkMode = document.body.classList.contains('dark-mode');
  const finalRows = final.rows;
  let realSupplyCount = supplyCount; // number of original supply rows
  let realDemandCount = demandCount; // number of original demand columns

  if (supplyTotal > demandTotal) {
    const remainingDemand = supplyTotal - demandTotal;

    // Add header cell for the new dummy demand column, visually highlighted
    const newDemandHeader = document.createElement('th');
    newDemandHeader.textContent = `D${realDemandCount + 1}`;
    newDemandHeader.classList.add('dummy-demand-header'); // Apply reusable class

    finalRows[0].insertBefore(newDemandHeader, finalRows[0].cells[finalRows[0].cells.length - 1]);


    // Add a 0 cost cell for dummy demand to each supply row (to keep table consistent)
    for (let i = 1; i <= realSupplyCount; i++) {
      const tr = finalRows[i];
      const newCell = document.createElement('td');
      newCell.textContent = 0;
      newCell.style.textAlign = 'right';
      newCell.style.verticalAlign = 'top';
      newCell.style.padding = '3.5px';
      newCell.style.fontSize = '12px';
      newCell.style.color = isDarkMode ? '#eee' : '#222';
      tr.insertBefore(newCell, tr.cells[tr.cells.length - 1]);
    }

    const newDemandCell = document.createElement('td');
    newDemandCell.textContent = remainingDemand;
    newDemandCell.style.color = isDarkMode ? '#eee' : '#222';
    finalRows[finalRows.length - 1].insertBefore(newDemandCell, finalRows[finalRows.length - 1].cells[finalRows[finalRows.length - 1].cells.length - 1]);

    realDemandCount++;

  } else {
    const remainingSupply = demandTotal - supplyTotal;
    const newSupplyRow = document.createElement('tr');

    // Add header for the new dummy supply row, visually highlighted
    const newSupplyHeader = document.createElement('th');
    newSupplyHeader.textContent = `S${realSupplyCount + 1}`;
    newSupplyHeader.classList.add('dummy-supply-header'); // Reusable class
    newSupplyRow.appendChild(newSupplyHeader);

    // Add 0 cost cells for each demand column in this new dummy supply row
    for (let j = 1; j <= realDemandCount; j++) {
      const newCell = document.createElement('td');
      newCell.textContent = 0;
      newCell.style.textAlign = 'right';
      newCell.style.verticalAlign = 'top';
      newCell.style.padding = '3.5px';
      newCell.style.fontSize = '12px';
      newCell.style.color = isDarkMode ? '#eee' : '#222';
      newSupplyRow.appendChild(newCell);
    }

    // Add the dummy supply quantity at the end of the row
    const supplyTd = document.createElement('td');
    supplyTd.textContent = remainingSupply;
    supplyTd.style.color = isDarkMode ? '#eee' : '#222';
    newSupplyRow.appendChild(supplyTd);

    // Insert the dummy supply row before the last row (which is the demand row)
    final.insertBefore(newSupplyRow, final.rows[final.rows.length - 1]);

    realSupplyCount++; // Increase supply count to include dummy row
  }
}



/*
generateSample(): Creates a random transportation problem — random costs, supply, and demand.
Adjusts supply/demand to balance the problem or adds dummy rows/columns based on user choice.
Populates the input table fields with generated values.

generateTable(): Builds the empty input table for costs, supply, and demand based on user-specified rows and columns.
Clears old table, creates headers, inputs for costs, supply, and demand.

addSolveButton(): Adds a Solve button to the UI that triggers generating the matrix from inputs (not used directly here).

generateMatrix(): Reads user inputs from the table, creates a clean matrix showing costs, supply, and demand.
Displays this matrix and adds a Solve button to start the solving process.
Handles adding dummy supply/demand rows or columns if totals are unbalanced.

adjustForDummyRowsAndColumns(): Adds a dummy supply row or demand column to the matrix to balance total supply and demand.
Updates table headers, costs, and quantities accordingly with clear visual distinction.
*/
