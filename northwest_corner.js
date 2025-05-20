 // Reset the solver state variables before starting or restarting
function resetSolverData() {
  currentStep = 0;         // Reset step counter
  allocatedValues = [];    // Clear previous allocations
  costs = [];              // Clear cost matrix
}

// Reset the UI elements related to the solver
function resetUI() {
  const nextBtn = document.getElementById('nextStepButton');
  if (nextBtn) nextBtn.remove();           // Remove Next button if present

  const doneBtn = document.getElementById('doneButton');
  if (doneBtn) doneBtn.style.display = 'none'; // Hide Done button

  const ssBtn = document.getElementById('startSteppingStoneButton');
  if (ssBtn) ssBtn.remove();                // Remove Stepping Stone start button if present

  // Clear total cost formula and total cost display
  const formulaElem = document.getElementById('totalCostFormula');
  const totalCostElem = document.getElementById('totalCost');
  if (formulaElem) formulaElem.textContent = '';
  if (totalCostElem) totalCostElem.textContent = '';
}

// Main function to solve transportation problem using North-West Corner method
async function solveNorthWestCorner(final) {
  resetSolverData();  // Clear previous data
  resetUI();          // Clear UI controls and info

  const rows = final.rows;
  const supplyCount = rows.length - 2;      // Number of supply rows (excluding header and demand row)
  const demandCount = rows[0].cells.length - 2;  // Number of demand columns (excluding header and supply column)

  const supply = [];
  const demand = [];

  // Extract supply values from last column of each supply row
  for (let i = 1; i <= supplyCount; i++) {
    supply.push(parseInt(rows[i].cells[demandCount + 1].textContent || '0'));
  }

  // Extract demand values from last row of each demand column
  for (let j = 1; j <= demandCount; j++) {
    demand.push(parseInt(rows[supplyCount + 1].cells[j].textContent || '0'));
  }

  // Build cost matrix and initialize allocation matrix to zeros
  for (let i = 0; i < supplyCount; i++) {
    costs[i] = [];
    allocatedValues[i] = [];
    for (let j = 0; j < demandCount; j++) {
      costs[i][j] = parseInt(rows[i + 1].cells[j + 1].textContent || '0');
      allocatedValues[i][j] = 0;
    }
  }

  let i = 0, j = 0;  // Start from the top-left corner cell

  // Only add the Next button if it's not already there
    if (!document.getElementById('nextStepButton')) {
    const nextBtn = document.createElement('button');
    nextBtn.id = 'nextStepButton';
    nextBtn.textContent = 'Next';
    nextBtn.classList.add('next-button'); // Add class for styling

    // Keep static styles if needed
    nextBtn.style.marginTop = '20px';
    nextBtn.style.padding = '8px 16px';
    nextBtn.style.fontSize = '16px';
    nextBtn.style.cursor = 'pointer';
    nextBtn.style.borderRadius = '5px';

    // Add to DOM
    document.getElementById('solveSection').appendChild(nextBtn);

    nextBtn.addEventListener('click', async () => {
      nextBtn.disabled = true;

      if (i >= supply.length || j >= demand.length) {
        nextBtn.disabled = true;
        displayTotalCost();
        document.getElementById('doneButton').style.display = 'inline';
        return;
      }

      // Allocate supply/demand at cell (i, j)
      await allocateSupply(i, j, rows, supply, demand);

      // Move to next cell based on which supply or demand got exhausted
      if (supply[i] === 0 && demand[j] === 0) {
        i++;
        j++;
      } else if (supply[i] === 0) {
        i++;
      } else if (demand[j] === 0) {
        j++;
      }

      // If reached the end, disable Next button and show total cost, else enable Next button again
      if (i >= supply.length || j >= demand.length) {
        nextBtn.disabled = true;
        displayTotalCost();
      } else {
        nextBtn.disabled = false;
      }
    });

    // Add Next button to the solve section
    document.getElementById('solveSection').appendChild(nextBtn);
  }
}


// Allocate supply/demand at cell (i, j)
async function allocateSupply(i, j, rows, supply, demand) {
  const cell = rows[i + 1].cells[j + 1]; // Target cell in the table
  const allocation = Math.min(supply[i], demand[j]); // Max allocation possible here

  allocatedValues[i][j] = allocation; // Save allocation

  // Add visual allocation number in the cell, styled in blue bold text
  cell.style.position = 'relative';
  const allocDiv = document.createElement('div');
  allocDiv.textContent = allocation;

  const isDarkMode = document.body.classList.contains('dark-mode');

    Object.assign(allocDiv.style, {
      position: 'absolute',
      bottom: '17px',
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: '14px',
      fontWeight: 'bold'
    });

    allocDiv.classList.add('allocation-value');  // This is a separate statement


  cell.appendChild(allocDiv);

  // Mark allocated cells to avoid greying out later
  if (allocation > 0) {
    cell.dataset.allocated = 'true';
  }

  // Decrease supply and demand by allocated amount
  supply[i] -= allocation;
  demand[j] -= allocation;

  // Update supply and demand display cells, striking out old values for clarity
  const supplyCell = rows[i + 1].cells[rows[0].cells.length - 1];
  const demandCell = rows[rows.length - 1].cells[j + 1];

  supplyCell.innerHTML = `<del>${supplyCell.textContent}</del> ${supply[i]}`;
  demandCell.innerHTML = `<del>${demandCell.textContent}</del> ${demand[j]}`;

  // Grey out remaining unallocated cells in supply row if supply exhausted
  if (supply[i] === 0) {
    for (let col = 1; col <= demand.length; col++) {
      const c = rows[i + 1].cells[col];
      if (!c.dataset.allocated) {
        c.style.backgroundColor = isDarkMode ? '#333' : '#525457';
        c.style.color = isDarkMode ? '#aaa' : '#000';
      }
    }
  }

  // Grey out remaining unallocated cells in demand column if demand exhausted
  if (demand[j] === 0) {
    for (let row = 1; row <= supply.length; row++) {
      const c = rows[row].cells[j + 1];
      if (!c.dataset.allocated) {
        c.style.backgroundColor = isDarkMode ? '#333' : '#525457';
        c.style.color = isDarkMode ? '#aaa' : '#000';
      }
    }
  }

  await delay(300);  // Pause briefly so user can see the change before next step
}

// Calculate and display the total cost after allocations are done
function displayTotalCost() {
  const isDarkMode = document.body.classList.contains('dark-mode');

  let totalCost = 0;
  let formula = "Total Cost Formula = ";

  // Hide Next button when total cost is shown
  const nextBtn = document.getElementById('nextStepButton');
  if (nextBtn) {
    nextBtn.style.display = 'none';
  }

  // Sum up all allocated units times their costs and build formula string
  for (let i = 0; i < allocatedValues.length; i++) {
    for (let j = 0; j < allocatedValues[i].length; j++) {
      let allocatedValue = allocatedValues[i][j];
      let cost = costs[i][j];
      if (allocatedValue > 0) {
        totalCost += allocatedValue * cost;
        formula += `(${allocatedValue} x ${cost}) + `;
      }
    }
  }

  formula = formula.slice(0, -3); // Remove trailing ' + '

  const formulaEl = document.getElementById('totalCostFormula');
  const totalCostEl = document.getElementById('totalCost');

  formulaEl.textContent = formula;
  totalCostEl.textContent = "Initial Total Cost = " + totalCost;

  // Add a button to start the Stepping Stone method if it's not already added
  if (!document.getElementById('startSteppingStoneButton')) {
  const startButton = document.createElement('button');
  startButton.id = 'startSteppingStoneButton';
  startButton.textContent = 'Start Stepping Stone';
  startButton.addEventListener('click', startSteppingStoneMethod);

  document.getElementById('solveSection').appendChild(startButton);
}
}


// Starts the Stepping Stone method process (placeholder function check)
function startSteppingStoneMethod() {
  if (typeof displaySteppingStoneTable === 'function') {
    displaySteppingStoneTable();
  } else {
    alert("Stepping Stone Method function not loaded!");
  }
}

// Utility function to pause execution for a given time (in milliseconds)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*
resetSolverData(): Clears previous solution data and resets step counter to start fresh.
resetUI(): Removes or hides UI buttons and clears displayed results to prepare for a new run.
solveNorthWestCorner(final): Executes the North-West Corner method step-by-step, updating allocations on button clicks.
allocateSupply(i, j, rows, supply, demand): Allocates supply and demand in the specified cell, updates UI and data accordingly.
displayTotalCost(): Calculates total cost from allocations, shows formula and cost, and enables starting the Stepping Stone method.
startSteppingStoneMethod(): Initiates the Stepping Stone process if the method is implemented.
delay(ms): Utility to pause execution for smoother UI updates.
*/