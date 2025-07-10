# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

//
//
//
Project structure

```
src/
├── components/
│   ├── ui/                          # Reusable UI components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.scss
│   │   │   └── index.ts
│   │   ├── Modal/
│   │   │   ├── Modal.tsx
│   │   │   ├── Modal.module.scss
│   │   │   └── index.ts
│   │   └── ErrorBoundary/
│   │       ├── ErrorBoundary.tsx
│   │       └── index.ts
│   │
│   ├── game/                        # Game-related components
│   │   ├── GameBoard/
│   │   │   ├── GameBoard.tsx
│   │   │   ├── GameBoard.module.scss
│   │   │   └── index.ts
│   │   ├── PlayerStats/
│   │   │   ├── PlayerStats.tsx
│   │   │   ├── PlayerStats.module.scss
│   │   │   └── index.ts
│   │   └── GameControls/
│   │       ├── GameControls.tsx
│   │       ├── GameControls.module.scss
│   │       └── index.ts
│   │
│   ├── analytics/                   # Analytics and charts
│   │   ├── TradingChart/            # Your current functionality
│   │   │   ├── TradingChart.tsx     # Main component
│   │   │   ├── TradingChart.module.scss
│   │   │   ├── components/
│   │   │   │   ├── Chart/
│   │   │   │   │   ├── Chart.tsx
│   │   │   │   │   ├── Chart.module.scss
│   │   │   │   │   └── index.ts
│   │   │   │   ├── PriceDisplay/
│   │   │   │   │   ├── PriceDisplay.tsx
│   │   │   │   │   ├── PriceDisplay.module.scss
│   │   │   │   │   └── index.ts
│   │   │   │   ├── StatsPanel/
│   │   │   │   │   ├── StatsPanel.tsx
│   │   │   │   │   ├── StatsPanel.module.scss
│   │   │   │   │   └── index.ts
│   │   │   │   └── BlockGrid/
│   │   │   │       ├── BlockGrid.tsx
│   │   │   │       ├── BlockGrid.module.scss
│   │   │   │       └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   └── GameAnalytics/           # Game-related analytics
│   │       ├── GameAnalytics.tsx
│   │       ├── GameAnalytics.module.scss
│   │       └── index.ts
│   │
│   └── wallet/                      # Solana wallet components
│       ├── WalletConnection/
│       │   ├── WalletConnection.tsx
│       │   ├── WalletConnection.module.scss
│       │   └── index.ts
│       └── TokenBalance/
│           ├── TokenBalance.tsx
│           ├── TokenBalance.module.scss
│           └── index.ts
│
├── hooks/                           # Custom React hooks
│   ├── useWallet.ts
│   ├── useGameState.ts
│   ├── useTradingData.ts
│   └── useSolanaProgram.ts
│
├── services/                        # API and Solana services
│   ├── solana/
│   │   ├── connection.ts
│   │   ├── program.ts
│   │   └── transactions.ts
│   ├── api/
│   │   ├── trading.ts
│   │   ├── game.ts
│   │   └── analytics.ts
│   └── utils/
│       ├── formatters.ts
│       └── validators.ts
│
├── store/                           # Application state (Redux or Zustand)
│   ├── gameSlice.ts
│   ├── walletSlice.ts
│   ├── tradingSlice.ts
│   └── index.ts
│
├── types/                           # TypeScript types and interfaces
│   ├── game.ts
│   ├── solana.ts
│   ├── trading.ts
│   └── api.ts
│
├── pages/                           # Top-level app pages
│   ├── GamePage/
│   │   ├── GamePage.tsx
│   │   ├── GamePage.module.scss
│   │   └── index.ts
│   ├── TradingPage/
│   │   ├── TradingPage.tsx
│   │   ├── TradingPage.module.scss
│   │   └── index.ts
│   └── DashboardPage/
│       ├── DashboardPage.tsx
│       ├── DashboardPage.module.scss
│       └── index.ts
│
└── utils/                           # General utilities and configs
    ├── constants.ts
    ├── helpers.ts
    └── config.ts
```
