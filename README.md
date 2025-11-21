# NanoThumbnail

NanoThumbnail is a free, open-source SaaS generator designed to create viral YouTube thumbnails using the power of AI. It leverages the **Google Nano Banana Pro** model via the Replicate API to transform simple prompts into high-quality, expressive images.

![NanoThumbnail Preview](https://yoanbernabeu.github.io/NanoThumbnail/assets/preview.png)

## Features

-   **Nano Banana Pro Integration**: Uses Google's latest model, optimized for text rendering and photorealism.
-   **BYOK (Bring Your Own Key)**: Connect your own Replicate API key. You pay the provider directly, ensuring privacy and the lowest cost.
-   **100% Free Interface**: No monthly subscriptions or hidden fees for the UI.
-   **Drag & Drop Reference**: Upload reference images to guide the AI.
-   **Internationalization**: Fully translated in English 🇺🇸 and French 🇫🇷.
-   **Privacy Focused**: API keys are stored locally in your browser (LocalStorage).

## Tech Stack

-   **Framework**: Vanilla JS
-   **Bundler**: [Vite](https://vitejs.dev/)
-   **Styling**: Custom CSS (Glassmorphism UI)
-   **API**: [Replicate](https://replicate.com/)

## Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yoanbernabeu/NanoThumbnail.git
    cd NanoThumbnail
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser at `http://localhost:5173`.

## Building for Production

To create a production build:

```bash
npm run build
```

The output will be in the `dist/` directory, ready to be deployed to GitHub Pages or any static host.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Yoan Bernabeu**

-   Website: [YoanDev.co](https://yoandev.co)
-   Twitter: [@yOyO38](https://twitter.com/yOyO38)

