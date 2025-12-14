# Stock Broker Dashboard

A simple real-time stock tracking dashboard built with HTML, CSS, and JavaScript.

## Features

- Login with email
- Subscribe to stocks (GOOG, TSLA, AMZN, META, NVDA)
- Real-time price updates every second
- Multi-tab support for different users
- Price change indicators (green = up, red = down)

## How to Run

1. Clone this repository
2. Open `index.html` in your browser (or use Live Server in VS Code)
3. Login with any email
4. Subscribe to stocks and watch prices update

## Project Structure

```
stock-dashboard/
├── index.html    # Main page
├── styles.css    # Styling
└── app.js        # JavaScript logic
```

## How It Works

- **Login**: Enter your email to access the dashboard
- **Subscribe**: Select a stock from the dropdown and click Subscribe
- **Watch**: Prices update automatically every second
- **Unsubscribe**: Click the Unsubscribe button on any stock card

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- localStorage (for saving subscriptions)
- sessionStorage (for user sessions)

## Notes

- This uses simulated random prices, not real stock data
- Data is stored in your browser
- Each browser tab can have a different user

## Author

Bhuvan Bopanna - [bhuvandp23](https://github.com/bhuvandp23)