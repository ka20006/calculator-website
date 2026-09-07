/**
 * ==========================================================
 * MODERN GLASSMORPHISM CALCULATOR - JAVASCRIPT LOGIC
 * ==========================================================
 * Clean, well-structured, beginner-friendly Vanilla JS
 * Handles arithmetic calculations, keyboard events, theme 
 * switching, calculation history, and display formatting.
 */

// --- 1. DOM ELEMENT SELECTION ---
const previousOperandText = document.getElementById('previous-operand');
const currentOperandText = document.getElementById('current-operand');
const keypad = document.querySelector('.keypad');

// Header action buttons
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const historyToggleBtn = document.getElementById('history-toggle-btn');
const copyBtn = document.getElementById('copy-btn');
const toast = document.getElementById('toast');

// History drawer elements
const historyPanel = document.getElementById('history-panel');
const closeHistoryBtn = document.getElementById('close-history-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const historyList = document.getElementById('history-list');

// --- 2. STATE MANAGEMENT ---
class Calculator {
    constructor() {
        this.previousOperand = '';
        this.currentOperand = '0';
        this.operation = undefined;
        this.shouldResetScreen = false;
        this.history = JSON.parse(localStorage.getItem('calc_history') || '[]');
        this.isErrorState = false;
    }

    /**
     * Clears all calculator state back to defaults (AC)
     */
    clear() {
        this.previousOperand = '';
        this.currentOperand = '0';
        this.operation = undefined;
        this.shouldResetScreen = false;
        this.isErrorState = false;
        this.updateDisplay();
    }

    /**
     * Deletes the last entered character (Backspace ⌫)
     */
    delete() {
        if (this.isErrorState) {
            this.clear();
            return;
        }
        if (this.shouldResetScreen) return;
        if (this.currentOperand === '0') return;

        if (this.currentOperand.length === 1 || (this.currentOperand.length === 2 && this.currentOperand.startsWith('-'))) {
            this.currentOperand = '0';
        } else {
            this.currentOperand = this.currentOperand.slice(0, -1);
        }
        this.updateDisplay();
    }

    /**
     * Appends a number or decimal point to the current operand
     * @param {string} number - The digit or decimal string to append
     */
    appendNumber(number) {
        if (this.isErrorState) {
            this.clear();
        }

        // If screen needs reset after calculation
        if (this.shouldResetScreen) {
            this.currentOperand = '';
            this.shouldResetScreen = false;
        }

        // Prevent multiple decimal points
        if (number === '.' && this.currentOperand.includes('.')) return;

        // Prevent multiple leading zeros
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number;
        } else {
            // Limit maximum digit length for clean display
            if (this.currentOperand.replace(/[^0-9]/g, '').length >= 15) return;
            this.currentOperand += number;
        }

        this.updateDisplay();
    }

    /**
     * Toggles positive / negative sign (±)
     */
    toggleSign() {
        if (this.isErrorState || this.currentOperand === '0') return;
        if (this.currentOperand.startsWith('-')) {
            this.currentOperand = this.currentOperand.substring(1);
        } else {
            this.currentOperand = '-' + this.currentOperand;
        }
        this.updateDisplay();
    }

    /**
     * Computes percentage of current value (%)
     */
    computePercentage() {
        if (this.isErrorState) return;
        const current = parseFloat(this.currentOperand);
        if (isNaN(current)) return;

        // If there's an active operation with a previous number (e.g. 200 + 10%)
        if (this.previousOperand !== '' && this.operation) {
            const prev = parseFloat(this.previousOperand);
            if (!isNaN(prev)) {
                // Calculate percentage relative to previous operand
                const percentValue = (prev * current) / 100;
                this.currentOperand = this.roundResult(percentValue).toString();
                this.updateDisplay();
                return;
            }
        }

        // Otherwise simple divide by 100
        this.currentOperand = this.roundResult(current / 100).toString();
        this.updateDisplay();
    }

    /**
     * Sets the mathematical operator (+, −, ×, ÷)
     * @param {string} operator - The selected operator symbol
     */
    chooseOperation(operator) {
        if (this.isErrorState) {
            this.clear();
        }

        // Normalize operator symbols for consistency
        const standardOp = (operator === '*' || operator === 'x') ? '×' : (operator === '/') ? '÷' : operator;

        // If user is switching operator without typing new numbers
        if (this.currentOperand === '' && this.previousOperand !== '') {
            this.operation = standardOp;
            this.updateDisplay();
            return;
        }

        // If previous calculation is already waiting, evaluate it first
        if (this.previousOperand !== '') {
            this.compute(false);
        }

        this.operation = standardOp;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '';
        this.updateDisplay();
    }

    /**
     * Performs calculation based on current state
     * @param {boolean} isFinal - Whether triggered by '=' (save to history) or chained operator
     */
    compute(isFinal = true) {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);

        // If either operand is invalid, cancel calculation
        if (isNaN(prev) || isNaN(current)) return;

        // Mathematical Operations & Edge Cases
        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
            case '−':
                computation = prev - current;
                break;
            case '×':
            case '*':
                computation = prev * current;
                break;
            case '÷':
            case '/':
                // Handle division by zero
                if (current === 0) {
                    this.showError("Cannot divide by 0");
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }

        // Round floating point precision issues (e.g. 0.1 + 0.2)
        const result = this.roundResult(computation);
        const expression = `${this.previousOperand} ${this.operation} ${this.currentOperand}`;

        // Save to History when equals is pressed
        if (isFinal) {
            this.addToHistory(expression, result.toString());
            this.previousOperand = `${expression} =`;
            this.operation = undefined;
        } else {
            this.previousOperand = result.toString();
        }

        this.currentOperand = result.toString();
        this.shouldResetScreen = true;
        this.updateDisplay();
    }

    /**
     * Fixes JavaScript floating-point inaccuracies
     * @param {number} num - Raw calculation result
     * @returns {number} Clean rounded number
     */
    roundResult(num) {
        if (!isFinite(num)) return num;
        return Math.round((num + Number.EPSILON) * 1e12) / 1e12;
    }

    /**
     * Displays friendly error state
     * @param {string} message - Error description
     */
    showError(message) {
        this.isErrorState = true;
        this.currentOperand = message;
        this.previousOperand = '';
        this.operation = undefined;
        this.updateDisplay();
    }

    /**
     * Formats numbers with international thousand separators
     * @param {string} numberStr 
     * @returns {string} Formatted number
     */
    formatDisplayNumber(numberStr) {
        if (this.isErrorState) return numberStr;
        if (!numberStr) return '';

        const stringNumber = numberStr.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        
        let integerDisplay;
        if (isNaN(integerDigits)) {
            integerDisplay = stringNumber.startsWith('-') ? '-' : '';
        } else {
            integerDisplay = integerDigits.toLocaleString('en-US', { maximumFractionDigits: 0 });
        }

        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }

    /**
     * Dynamically adjusts font size based on current number length
     */
    adjustFontSize() {
        const len = this.currentOperand.length;
        if (len > 14) {
            currentOperandText.style.fontSize = '1.5rem';
        } else if (len > 10) {
            currentOperandText.style.fontSize = '1.85rem';
        } else if (len > 7) {
            currentOperandText.style.fontSize = '2.15rem';
        } else {
            currentOperandText.style.fontSize = '2.5rem';
        }
    }

    /**
     * Updates calculator UI elements
     */
    updateDisplay() {
        // Render current operand with formatting
        if (this.isErrorState) {
            currentOperandText.innerText = this.currentOperand;
            currentOperandText.style.fontSize = '1.4rem';
        } else {
            currentOperandText.innerText = this.formatDisplayNumber(this.currentOperand) || '0';
            this.adjustFontSize();
        }

        // Render previous expression
        if (this.operation != null) {
            previousOperandText.innerText = `${this.formatDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            previousOperandText.innerText = this.previousOperand;
        }

        // Highlight active operator button
        document.querySelectorAll('.btn-operator').forEach(btn => {
            const op = btn.getAttribute('data-operator');
            if (this.operation && (op === this.operation || (op === '-' && this.operation === '−'))) {
                btn.classList.add('active-op');
            } else {
                btn.classList.remove('active-op');
            }
        });
    }

    /**
     * Adds an entry to calculation history and updates localStorage
     * @param {string} expr - Expression string (e.g. "12 + 8")
     * @param {string} res - Result string (e.g. "20")
     */
    addToHistory(expr, res) {
        const item = {
            id: Date.now(),
            expression: expr,
            result: res,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        this.history.unshift(item); // Add newest first
        if (this.history.length > 25) this.history.pop(); // Keep maximum 25 items

        localStorage.setItem('calc_history', JSON.stringify(this.history));
        this.renderHistory();
    }

    /**
     * Renders history items inside the drawer
     */
    renderHistory() {
        if (!this.history || this.history.length === 0) {
            historyList.innerHTML = '<div class="history-empty">No calculations yet</div>';
            return;
        }

        historyList.innerHTML = this.history.map(item => `
            <div class="history-item" data-result="${item.result}">
                <span class="history-expr">${item.expression} =</span>
                <span class="history-result">${this.formatDisplayNumber(item.result)}</span>
            </div>
        `).join('');

        // Allow clicking a history item to reload its result
        historyList.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', () => {
                const res = el.getAttribute('data-result');
                if (res) {
                    this.clear();
                    this.currentOperand = res;
                    this.updateDisplay();
                    toggleHistory(false);
                    showToast('Loaded from history');
                }
            });
        });
    }

    /**
     * Clears all calculation history
     */
    clearHistory() {
        this.history = [];
        localStorage.removeItem('calc_history');
        this.renderHistory();
        showToast('History cleared');
    }
}

// Initialize calculator instance
const calc = new Calculator();
calc.renderHistory();
calc.updateDisplay();


// --- 3. EVENT LISTENERS ---

/**
 * Handle Keypad Button Clicks
 */
keypad.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    // Trigger visual active feedback
    button.classList.add('active-key');
    setTimeout(() => button.classList.remove('active-key'), 120);

    const { number, operator, action } = button.dataset;

    if (number !== undefined) {
        calc.appendNumber(number);
    } else if (operator !== undefined) {
        calc.chooseOperation(operator);
    } else if (action !== undefined) {
        switch (action) {
            case 'clear':
                calc.clear();
                break;
            case 'delete':
                calc.delete();
                break;
            case 'calculate':
                calc.compute(true);
                break;
            case 'percent':
                calc.computePercentage();
                break;
            case 'plus-minus':
                calc.toggleSign();
                break;
        }
    }
});

/**
 * Handle Physical Keyboard Input
 */
window.addEventListener('keydown', (e) => {
    // Ignore keystrokes when user is focusing another input if applicable
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    let key = e.key;

    // Match numbers and decimal point
    if ((key >= '0' && key <= '9') || key === '.') {
        calc.appendNumber(key);
        highlightButton(`[data-number="${key}"]`);
    }
    // Match operators
    else if (key === '+' || key === '-') {
        calc.chooseOperation(key);
        highlightButton(`[data-operator="${key}"]`);
    } else if (key === '*' || key.toLowerCase() === 'x') {
        calc.chooseOperation('×');
        highlightButton(`[data-operator="×"]`);
    } else if (key === '/') {
        e.preventDefault(); // Prevent browser quick search
        calc.chooseOperation('÷');
        highlightButton(`[data-operator="÷"]`);
    }
    // Match calculation trigger
    else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calc.compute(true);
        highlightButton(`[data-action="calculate"]`);
    }
    // Match backspace
    else if (key === 'Backspace') {
        calc.delete();
        highlightButton(`[data-action="delete"]`);
    }
    // Match Escape / Delete (AC)
    else if (key === 'Escape' || key === 'Delete') {
        calc.clear();
        highlightButton(`[data-action="clear"]`);
    }
    // Match percentage
    else if (key === '%') {
        calc.computePercentage();
        highlightButton(`[data-action="percent"]`);
    }
    // Match Copy result (Ctrl+C / Cmd+C)
    else if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 'c') {
        copyCurrentResult();
    }
});

/**
 * Highlights a button temporarily when triggered via keyboard
 * @param {string} selector - CSS Selector for target button
 */
function highlightButton(selector) {
    const btn = document.querySelector(selector);
    if (btn) {
        btn.classList.add('active-key');
        setTimeout(() => btn.classList.remove('active-key'), 150);
    }
}


// --- 4. THEME TOGGLING ---
function initTheme() {
    const savedTheme = localStorage.getItem('calc_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'light' || (!savedTheme && !systemPrefersDark)) {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
}

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    localStorage.setItem('calc_theme', currentTheme);
    showToast(`${currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)} mode enabled`);
});

initTheme();


// --- 5. HISTORY DRAWER TOGGLE ---
function toggleHistory(open) {
    if (open) {
        historyPanel.classList.add('open');
    } else {
        historyPanel.classList.remove('open');
    }
}

historyToggleBtn.addEventListener('click', () => toggleHistory(true));
closeHistoryBtn.addEventListener('click', () => toggleHistory(false));
clearHistoryBtn.addEventListener('click', () => calc.clearHistory());

// Close history drawer when clicking outside of it
document.addEventListener('click', (e) => {
    if (historyPanel.classList.contains('open') && 
        !historyPanel.contains(e.target) && 
        !historyToggleBtn.contains(e.target)) {
        toggleHistory(false);
    }
});


// --- 6. COPY RESULT TO CLIPBOARD ---
async function copyCurrentResult() {
    const textToCopy = calc.currentOperand;
    if (calc.isErrorState || !textToCopy) return;

    try {
        await navigator.clipboard.writeText(textToCopy);
        showToast('Result copied to clipboard!');
    } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Result copied to clipboard!');
    }
}

copyBtn.addEventListener('click', copyCurrentResult);


// --- 7. TOAST NOTIFICATION UTILITY ---
let toastTimeout;
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2200);
}
