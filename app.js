// ============================================
// MORTGAGE CALCULATOR - React-style Vanilla JS
// ============================================

// Application State (similar to React useState)
const state = {
  principal: '',
  interestRate: '',
  loanTerm: '',
  mortgageType: 'fixed',
  theme: 'light',
  results: null,
  chart: null
};

// ============================================
// CALCULATION UTILITIES
// ============================================

/**
 * Calculate mortgage payment details
 * Formula: M = P × [r(1+r)^n] / [(1+r)^n - 1]
 */
function calculateMortgage(principal, annualRate, years) {
  // Convert to proper units
  const P = parseFloat(principal);
  const r = parseFloat(annualRate) / 12 / 100; // Monthly interest rate
  const n = parseFloat(years) * 12; // Total number of payments

  // Validate inputs
  if (P <= 0 || annualRate < 0 || years <= 0) {
    return null;
  }

  // Handle zero interest rate
  let monthlyPayment;
  if (r === 0) {
    monthlyPayment = P / n;
  } else {
    // Mortgage formula
    const numerator = r * Math.pow(1 + r, n);
    const denominator = Math.pow(1 + r, n) - 1;
    monthlyPayment = P * (numerator / denominator);
  }

  const totalPayment = monthlyPayment * n;
  const totalInterest = totalPayment - P;
  const principalAmount = P;

  return {
    monthlyPayment: monthlyPayment,
    totalPayment: totalPayment,
    totalInterest: totalInterest,
    principalAmount: principalAmount,
    interestPercentage: (totalInterest / totalPayment) * 100,
    principalPercentage: (principalAmount / totalPayment) * 100
  };
}

/**
 * Format number as Indian currency (₹)
 */
function formatCurrency(amount) {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(amount);
  return `₹${formatted}`;
}

/**
 * Format percentage
 */
function formatPercentage(value) {
  return `${value.toFixed(1)}%`;
}

// ============================================
// LOCAL STORAGE UTILITIES
// ============================================

function saveToStorage() {
  const data = {
    principal: state.principal,
    interestRate: state.interestRate,
    loanTerm: state.loanTerm,
    mortgageType: state.mortgageType,
    theme: state.theme
  };
  
  try {
    // Using a JavaScript object to simulate storage since localStorage is blocked
    window.mortgageData = data;
  } catch (e) {
    console.log('Storage not available, keeping data in memory');
  }
}

function loadFromStorage() {
  try {
    // Load from our in-memory storage
    const data = window.mortgageData;
    if (data) {
      state.principal = data.principal || '';
      state.interestRate = data.interestRate || '';
      state.loanTerm = data.loanTerm || '';
      state.mortgageType = data.mortgageType || 'fixed';
      state.theme = data.theme || 'light';
      return true;
    }
  } catch (e) {
    console.log('Could not load data');
  }
  return false;
}

// ============================================
// THEME MANAGEMENT
// ============================================

function setTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  
  const themeIcon = document.querySelector('.theme-icon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
  
  saveToStorage();
  
  // Update chart if exists
  if (state.results) {
    updateChart(state.results);
  }
}

function toggleTheme() {
  const newTheme = state.theme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
}

// ============================================
// CHART RENDERING (Chart.js)
// ============================================

function updateChart(results) {
  const canvas = document.getElementById('mortgageChart');
  const ctx = canvas.getContext('2d');
  
  // Get computed colors based on current theme
  const styles = getComputedStyle(document.documentElement);
  const chartPrimary = styles.getPropertyValue('--chart-primary').trim();
  const chartSecondary = styles.getPropertyValue('--chart-secondary').trim();
  
  // Destroy existing chart
  if (state.chart) {
    state.chart.destroy();
  }
  
  // Create new chart
  state.chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Principal', 'Interest'],
      datasets: [{
        data: [results.principalAmount, results.totalInterest],
        backgroundColor: [chartPrimary, chartSecondary],
        borderWidth: 0,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = formatCurrency(context.parsed);
              const percentage = ((context.parsed / results.totalPayment) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
  
  // Update legend
  updateChartLegend(results);
}

function updateChartLegend(results) {
  const legendContainer = document.getElementById('chartLegend');
  const styles = getComputedStyle(document.documentElement);
  const chartPrimary = styles.getPropertyValue('--chart-primary').trim();
  const chartSecondary = styles.getPropertyValue('--chart-secondary').trim();
  
  legendContainer.innerHTML = `
    <div class="legend-item">
      <div class="legend-color" style="background-color: ${chartPrimary};"></div>
      <div>
        <div class="legend-label">Principal</div>
        <div class="legend-value">${formatCurrency(results.principalAmount)}</div>
      </div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: ${chartSecondary};"></div>
      <div>
        <div class="legend-label">Interest</div>
        <div class="legend-value">${formatCurrency(results.totalInterest)}</div>
      </div>
    </div>
  `;
}

// ============================================
// RESULT DISPLAY COMPONENT
// ============================================

function renderResults(results) {
  const container = document.getElementById('resultsDisplay');
  
  if (!results) {
    container.innerHTML = `
      <div class="placeholder-message">
        <p>💡 Enter your loan details to see monthly payment calculations</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="results-display">
      <div class="result-main">
        <div class="result-label">Your Monthly Payment</div>
        <div class="result-value">${formatCurrency(results.monthlyPayment)}</div>
        <div class="result-label">per month</div>
      </div>
      
      <div class="result-grid">
        <div class="result-item">
          <div class="result-item-label">Total Payment</div>
          <div class="result-item-value">${formatCurrency(results.totalPayment)}</div>
        </div>
        <div class="result-item">
          <div class="result-item-label">Total Interest</div>
          <div class="result-item-value">${formatCurrency(results.totalInterest)}</div>
        </div>
      </div>
      
      <div class="breakdown">
        <div class="breakdown-title">Payment Breakdown</div>
        <div class="breakdown-items">
          <div class="breakdown-item">
            <div class="breakdown-item-label">
              <span class="breakdown-dot principal"></span>
              <span>Principal Amount</span>
            </div>
            <div class="breakdown-item-value">${formatPercentage(results.principalPercentage)}</div>
          </div>
          <div class="breakdown-item">
            <div class="breakdown-item-label">
              <span class="breakdown-dot interest"></span>
              <span>Interest Paid</span>
            </div>
            <div class="breakdown-item-value">${formatPercentage(results.interestPercentage)}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// FORM HANDLING
// ============================================

function validateAndCalculate() {
  const principal = document.getElementById('principal').value;
  const interestRate = document.getElementById('interestRate').value;
  const loanTerm = document.getElementById('loanTerm').value;
  const mortgageType = document.querySelector('input[name="mortgageType"]:checked').value;
  
  // Update state
  state.principal = principal;
  state.interestRate = interestRate;
  state.loanTerm = loanTerm;
  state.mortgageType = mortgageType;
  
  // Save to storage
  saveToStorage();
  
  // Validate inputs
  if (!principal || !interestRate || !loanTerm) {
    state.results = null;
    renderResults(null);
    return;
  }
  
  if (parseFloat(principal) <= 0 || parseFloat(interestRate) < 0 || parseFloat(loanTerm) <= 0) {
    state.results = null;
    renderResults(null);
    return;
  }
  
  // Calculate mortgage
  const results = calculateMortgage(principal, interestRate, loanTerm);
  
  if (results) {
    state.results = results;
    renderResults(results);
    updateChart(results);
  } else {
    state.results = null;
    renderResults(null);
  }
}

function resetForm() {
  // Clear form
  document.getElementById('principal').value = '';
  document.getElementById('interestRate').value = '';
  document.getElementById('loanTerm').value = '';
  document.querySelector('input[name="mortgageType"][value="fixed"]').checked = true;
  
  // Clear state
  state.principal = '';
  state.interestRate = '';
  state.loanTerm = '';
  state.mortgageType = 'fixed';
  state.results = null;
  
  // Clear storage
  saveToStorage();
  
  // Update UI
  renderResults(null);
  
  // Clear chart
  if (state.chart) {
    state.chart.destroy();
    state.chart = null;
  }
}

function populateFormFromState() {
  if (state.principal) {
    document.getElementById('principal').value = state.principal;
  }
  if (state.interestRate) {
    document.getElementById('interestRate').value = state.interestRate;
  }
  if (state.loanTerm) {
    document.getElementById('loanTerm').value = state.loanTerm;
  }
  if (state.mortgageType) {
    document.querySelector(`input[name="mortgageType"][value="${state.mortgageType}"]`).checked = true;
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

function initializeEventListeners() {
  // Form inputs - real-time calculation
  const inputs = ['principal', 'interestRate', 'loanTerm'];
  inputs.forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener('input', validateAndCalculate);
  });
  
  // Mortgage type radio buttons
  const radioButtons = document.querySelectorAll('input[name="mortgageType"]');
  radioButtons.forEach(radio => {
    radio.addEventListener('change', validateAndCalculate);
  });
  
  // Reset button
  document.getElementById('resetBtn').addEventListener('click', resetForm);
  
  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
  // Load saved data
  loadFromStorage();
  
  // Set theme
  setTheme(state.theme);
  
  // Populate form
  populateFormFromState();
  
  // Initialize event listeners
  initializeEventListeners();
  
  // Calculate if data exists
  if (state.principal && state.interestRate && state.loanTerm) {
    validateAndCalculate();
  }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}