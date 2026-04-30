# Vheart-Chat

> 📄 **[中文版说明文档](./README_zh.md)**

A full-stack cross-platform mobile application imitating WeChat, built with uni-app + Vue 3 + TypeScript.

![Version](https://img.shields.io/badge/version-1.2.3-blue)
![Platform](https://img.shields.io/badge/platform-H5%7CAndroid%7CiOS-green)
![License](https://img.shields.io/badge/license-MIT-orange)

## Features

- **Chat System** - Real-time messaging with contacts, supporting text and media messages
- **Contact Management** - Add friends, friend requests, and contact organization
- **Discover Feed** - Music player, anime browsing, and more entertainment features
- **User Profile** - Personal information management and settings
- **Music Player** - Built-in music playback with playlist support
- **Cross-Platform** - Runs on H5, Android, iOS, and other platforms

## Tech Stack

### Frontend
- **Framework**: [uni-app](https://uniapp.dcloud.io/) (Vue 3)
- **Language**: TypeScript
- **State Management**: Composition API with reactive models
- **Styling**: SCSS/uni.scss

### Backend
- **Cloud Services**: uniCloud (DCloud)
- **Authentication**: JWT-based auth system
- **Database**: JSON-based database with schema validation

## Project Structure

```
Vheart-Chat/
├── common/                 # Common components and utilities
│   ├── tabbar/            # Tab bar component
│   └── utils/            # Helper functions
├── core/                  # Core business logic
│   ├── bean/             # Data models
│   ├── data/             # Data definitions
│   ├── model/            # Business models (use-xxx-model.ts)
│   ├── net/              # Network API
│   └── services/         # Services
├── pages/                 # Page components
│   ├── chat/             # Chat list page
│   ├── chat-detail/      # Chat detail page
│   ├── contact/          # Contacts page
│   ├── discover/         # Discover page
│   ├── profile/          # Profile page
│   ├── music-index/      # Music player
│   ├── player/           # Full-screen player
│   └── ...
├── static/               # Static resources
├── uniCloud-alipay/      # Cloud functions
│   └── cloudfunctions/   # Backend API functions
│       ├── Api-Auth/     # Authentication API
│       ├── Api-Vheart-Chat/  # Chat API
│       └── ...
└── uni_modules/          # Uni-app plugins
```

## Getting Started

### Prerequisites

- Node.js 16+
- HBuilderX (recommended) or VS Code with uni-app extension
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/Vheart-Chat.git

# Install dependencies
npm install
```

### Development

Open the project in HBuilderX and run it on your desired platform:

```bash
# H5
npm run dev:h5

# Android
npm run dev:app-android

# iOS
npm run dev:app-ios
```

### Build

```bash
# Build for Android
npm run build:app-android

# Build for iOS
npm run build:app-ios

# Build for H5
npm run build:h5
```

## Configuration

### manifest.json

Key configurations in `manifest.json`:

- `appid`: Application identifier
- `versionName` / `versionCode`: Version information
- `modules`: Required native modules (Push, etc.)
- `distribute`: Publishing configurations for Android/iOS

### Cloud Functions

Deploy cloud functions to uniCloud before running the app:

1. Open `uniCloud-alipay` directory in HBuilderX
2. Right-click on `cloudfunctions` folder
3. Select "Deploy to Cloud Space"

## Screenshots

| Chat | Contacts | Discover | Profile |
|------|----------|----------|---------|
| ![Chat](./static/Chat.png) | ![Contacts](./static/Contacts.png) | ![Discover](./static/Discover.png) | ![Profile](./static/Profile.png) |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [uni-app](https://uniapp.dcloud.io/) - Cross-platform framework
- [DCloud](https://www.dcloud.io/) - Cloud services and tooling
- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework
