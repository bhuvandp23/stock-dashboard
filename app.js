// ============================================
// STOCK DASHBOARD APPLICATION
// ============================================

// Supported stocks configuration
const SUPPORTED_STOCKS = ['GOOG', 'TSLA', 'AMZN', 'META', 'NVDA'];

// Initial stock prices (base prices for simulation)
const INITIAL_PRICES = {
    'GOOG': 140.50,
    'TSLA': 242.80,
    'AMZN': 178.30,
    'META': 512.60,
    'NVDA': 875.40
};

// Global state
let currentUser = null;
let stockPrices = {...INITIAL_PRICES};
let previousPrices = {...INITIAL_PRICES};
let priceUpdateInterval = null;
let subscribedStocks = [];
let sessionId = null; // Unique ID for this tab/session

// DOM Elements
let loginScreen;
let dashboardScreen;
let emailInput;
let loginBtn;
let logoutBtn;
let userEmailSpan;
let stockSelect;
let subscribeBtn;
let stocksContainer;

// ============================================
// INITIALIZATION
// ============================================

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing...');
    
    // Generate unique session ID for this tab
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    console.log('Session ID:', sessionId);
    
    // Get DOM elements
    loginScreen = document.getElementById('loginScreen');
    dashboardScreen = document.getElementById('dashboardScreen');
    emailInput = document.getElementById('emailInput');
    loginBtn = document.getElementById('loginBtn');
    logoutBtn = document.getElementById('logoutBtn');
    userEmailSpan = document.getElementById('userEmail');
    stockSelect = document.getElementById('stockSelect');
    subscribeBtn = document.getElementById('subscribeBtn');
    stocksContainer = document.getElementById('stocksContainer');
    
    console.log('Elements found:', {loginBtn, logoutBtn, subscribeBtn});
    
    setupEventListeners();
    setupStorageListener();
    checkExistingSession();
});

// ============================================
// SESSION MANAGEMENT
// ============================================

function checkExistingSession() {
    // Check if THIS specific tab had a user logged in
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = savedUser;
        showDashboard();
    }
}

function login() {
    const email = emailInput.value.trim();
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    currentUser = email;
    // Store in sessionStorage (unique per tab) instead of localStorage (shared across tabs)
    sessionStorage.setItem('currentUser', email);
    showDashboard();
}

function logout() {
    // Stop price updates
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
        priceUpdateInterval = null;
    }
    
    // Clear session for THIS tab only
    sessionStorage.removeItem('currentUser');
    currentUser = null;
    subscribedStocks = [];
    
    // Reset UI
    emailInput.value = '';
    showLogin();
}

function showLogin() {
    loginScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
}

function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    userEmailSpan.textContent = currentUser;
    
    loadUserSubscriptions();
    startPriceUpdates();
}

// ============================================
// STOCK SUBSCRIPTION MANAGEMENT
// ============================================

function loadUserSubscriptions() {
    const userKey = `subscriptions_${currentUser}`;
    const saved = localStorage.getItem(userKey);
    subscribedStocks = saved ? JSON.parse(saved) : [];
    renderStocks();
}

function saveUserSubscriptions() {
    const userKey = `subscriptions_${currentUser}`;
    localStorage.setItem(userKey, JSON.stringify(subscribedStocks));
    
    // Broadcast change to other tabs
    broadcastSubscriptionChange();
}

function subscribeToStock() {
    const selectedStock = stockSelect.value;
    
    if (!selectedStock) {
        alert('Please select a stock');
        return;
    }
    
    if (subscribedStocks.includes(selectedStock)) {
        alert('You are already subscribed to this stock');
        return;
    }
    
    subscribedStocks.push(selectedStock);
    saveUserSubscriptions();
    renderStocks();
    
    // Reset dropdown
    stockSelect.value = '';
}

function unsubscribeFromStock(ticker) {
    subscribedStocks = subscribedStocks.filter(stock => stock !== ticker);
    saveUserSubscriptions();
    renderStocks();
}

// ============================================
// PRICE UPDATE SYSTEM
// ============================================

function startPriceUpdates() {
    // Clear any existing interval
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
    }
    
    // Update prices every second
    priceUpdateInterval = setInterval(() => {
        updateStockPrices();
        renderStocks();
        broadcastPriceUpdate();
    }, 1000);
}

function updateStockPrices() {
    // Store previous prices for comparison
    previousPrices = {...stockPrices};
    
    // Update each stock price with random fluctuation
    SUPPORTED_STOCKS.forEach(ticker => {
        const currentPrice = stockPrices[ticker];
        
        // Random change between -2% and +2%
        const changePercent = (Math.random() - 0.5) * 0.04;
        const newPrice = currentPrice * (1 + changePercent);
        
        // Round to 2 decimal places
        stockPrices[ticker] = Math.round(newPrice * 100) / 100;
    });
}

function getPriceChange(ticker) {
    const current = stockPrices[ticker];
    const previous = previousPrices[ticker];
    const change = current - previous;
    const changePercent = (change / previous) * 100;
    
    return {
        amount: change.toFixed(2),
        percent: changePercent.toFixed(2),
        isPositive: change >= 0
    };
}

// ============================================
// UI RENDERING
// ============================================

function renderStocks() {
    if (subscribedStocks.length === 0) {
        stocksContainer.innerHTML = '<p class="empty-state">No stocks subscribed yet. Select a stock above to get started!</p>';
        return;
    }
    
    subscribedStocks.forEach((ticker, index) => {
        const price = stockPrices[ticker];
        const change = getPriceChange(ticker);
        const now = new Date().toLocaleTimeString();
        
        // Check if card already exists
        let card = stocksContainer.children[index];
        
        if (!card || !card.classList || !card.classList.contains('stock-card') || card.querySelector('.stock-ticker').textContent !== ticker) {
            // Create new card if it doesn't exist
            const newCard = document.createElement('div');
            newCard.className = 'stock-card';
            newCard.innerHTML = `
                <div class="stock-card-header">
                    <div class="stock-ticker">${ticker}</div>
                    <button class="unsubscribe-btn" data-ticker="${ticker}">
                        Unsubscribe
                    </button>
                </div>
                
                <div class="stock-price" data-ticker="${ticker}">$${price.toFixed(2)}</div>
                
                <div class="price-change ${change.isPositive ? 'positive' : 'negative'}">
                    <span>${change.isPositive ? '▲' : '▼'}</span>
                    <span>$${Math.abs(change.amount)} (${Math.abs(change.percent)}%)</span>
                </div>
                
                <div class="last-updated">Last updated: ${now}</div>
            `;
            
            // Add event listener to unsubscribe button
            const unsubBtn = newCard.querySelector('.unsubscribe-btn');
            unsubBtn.addEventListener('click', function() {
                unsubscribeFromStock(this.getAttribute('data-ticker'));
            });
            
            if (index < stocksContainer.children.length) {
                stocksContainer.replaceChild(newCard, stocksContainer.children[index]);
            } else {
                stocksContainer.appendChild(newCard);
            }
        } else {
            // Update only the price elements
            const priceElement = card.querySelector('.stock-price');
            const priceChangeElement = card.querySelector('.price-change');
            const lastUpdatedElement = card.querySelector('.last-updated');
            
            // Add blink animation to price
            priceElement.classList.add('price-blink');
            setTimeout(() => priceElement.classList.remove('price-blink'), 500);
            
            // Update price
            priceElement.textContent = `$${price.toFixed(2)}`;
            
            // Update price change
            priceChangeElement.className = `price-change ${change.isPositive ? 'positive' : 'negative'}`;
            priceChangeElement.innerHTML = `
                <span>${change.isPositive ? '▲' : '▼'}</span>
                <span>$${Math.abs(change.amount)} (${Math.abs(change.percent)}%)</span>
            `;
            
            // Update timestamp
            lastUpdatedElement.textContent = `Last updated: ${now}`;
        }
    });
    
    // Remove extra cards if user unsubscribed
    while (stocksContainer.children.length > subscribedStocks.length) {
        stocksContainer.removeChild(stocksContainer.lastChild);
    }
}

// ============================================
// CROSS-TAB SYNCHRONIZATION
// ============================================

// Listen for changes from other tabs/windows
function setupStorageListener() {
    window.addEventListener('storage', (e) => {
        // Handle subscription changes from other tabs
        if (e.key && e.key.startsWith('subscriptions_') && e.key.includes(currentUser)) {
            loadUserSubscriptions();
        }
        
        // Handle price updates from other tabs
        if (e.key === 'priceUpdate') {
            const data = JSON.parse(e.newValue);
            stockPrices = data.prices;
            previousPrices = data.previousPrices;
            renderStocks();
        }
    });
}

// Broadcast subscription changes to other tabs
function broadcastSubscriptionChange() {
    // localStorage changes trigger 'storage' event in other tabs
    localStorage.setItem('lastSubscriptionChange', Date.now().toString());
}

// Broadcast price updates to other tabs
function broadcastPriceUpdate() {
    localStorage.setItem('priceUpdate', JSON.stringify({
        prices: stockPrices,
        previousPrices: previousPrices,
        timestamp: Date.now()
    }));
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Login
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            console.log('Login button clicked');
            e.preventDefault();
            login();
        });
    }
    
    if (emailInput) {
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                login();
            }
        });
    }
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            console.log('Logout button clicked');
            e.preventDefault();
            logout();
        });
    }
    
    // Subscribe
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', function(e) {
            console.log('Subscribe button clicked');
            e.preventDefault();
            subscribeToStock();
        });
    }
}

// ============================================
// CLEANUP
// ============================================

// Clean up interval when page is closed
window.addEventListener('beforeunload', () => {
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
    }
});