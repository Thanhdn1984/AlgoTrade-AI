# **App Name**: AlgoTrade AI

## Core Features:

- Data Collection: Collect real-time tick/OHLC data from providers or MT5 playback and store in Cloud Storage, along with metadata in Firestore.
- Manual Labeling UI: A Firebase-based UI tool enabling traders to manually label data (BUY/SELL/IGNORE) with reasons, and export as CSV for training.
- Automated Feature Engineering: Use a script or Cloud Build to transform raw data into feature files (MA, RSI, volume increase, candlestick patterns), and store the results in Cloud Storage.
- AI-Powered Signal Generation: Leverage a model to perform the labeling instead of a person. Present the signals in a table. Display statistics about the models like accuracy, F1 score etc
- Execution Signal Service: The back-end service that will take signals and execute them. Service reads signals and executes order in MT5 or Exness.
- User Authentication and Permissions: Firebase Authentication for user management, profiles, and role-based access control for data labeling and dashboard functionalities.
- Model Training Status: Displays statistics about the models being trained in Vertex AI

## Style Guidelines:

- Primary color: Deep navy blue (#2E3192) to evoke trust, security, and a sophisticated analytical environment. This color mirrors the precision and depth required for trading algorithms.
- Background color: Light, desaturated blue-gray (#E8E9F3) to provide a clean, professional backdrop that reduces eye strain during extended use.
- Accent color: Vibrant magenta (#F0F) to draw attention to important interactive elements, conveying a sense of cutting-edge technology and innovation.
- Font pairing: 'Space Grotesk' (sans-serif) for headlines, conveying a computerized and techy feel; 'Inter' (sans-serif) for body text, providing a modern, neutral, and highly readable interface.
- Use a set of minimalist icons related to trading, data analysis, and machine learning, ensuring they are easily recognizable and contribute to the app's technical aesthetic.
- Maintain a clean, grid-based layout to present data and features in a logical, easily navigable structure. The design will facilitate clear information hierarchy and decision-making.
- Incorporate subtle transitions and animations for data updates and signal alerts to enhance the user experience without causing distractions, ensuring important changes are noticeable but not overwhelming.