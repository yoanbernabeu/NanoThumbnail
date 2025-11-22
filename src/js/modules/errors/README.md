# Error Handling Module

This module provides a centralized, professional, and responsive error modal system for the application.

## Structure

```text
js/errors/
├── components/
│   └── Modal.js    # The HTML Template (View)
├── handler.js      # Main Controller & Logic
└── README.md       # Documentation
````

## Features

  - **Smart Defaults:** Automatically handles generic error messages if no specific data is provided.
  - **Syntax Highlighting:** Uses **PrismJS** to render JSON error details in a readable, colored format.

## Dependencies

This module requires the following packages (installed via npm):

  - `prismjs` (for JSON highlighting)

## Usage

Import the function where needed:

```javascript
import { showErrorModal } from './errors/modal.js';
```

### 1\. Generic System Error

Displays a standard "System Notification" message. Useful for unknown catch blocks.

```javascript
try {
    // ... risky code
} catch (error) {
    console.error(error);
    showErrorModal(); 
}
```

### 2\. API Error with Details

Displays the HTTP status code and formats the error object/response as pretty JSON.

```javascript
if (!response.ok) {
    const errorData = await response.json();
    
    showErrorModal({
        statusCode: response.status, // e.g., 404 or 500
        errorDetails: errorData      // Object or String
    });
}
```