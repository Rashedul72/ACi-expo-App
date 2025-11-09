# Shwapno Barcode Scanner - Project Documentation

## 📱 Project Overview

**Shwapno Barcode Scanner** is a mobile application developed for ACI Logistics Limited (Shwapno) that enables users to scan product barcodes, fetch product details from an external API, and manage products using a Kanban-style board interface. The app allows users to organize products into custom categories through an intuitive drag-and-drop interface.

📱 Download the Android App

You can download and test the Shwapno Barcode Scanner (Kanban-style Android App) directly on your Android device using the link below:

👉 https://expo.dev/artifacts/eas/eraM6WDT7r4XKnTigcyFDa.apk 


### Key Features
- ✅ Barcode scanning using device camera
- ✅ Product details fetching from external API
- ✅ Product management with MongoDB database
- ✅ Kanban board with drag-and-drop functionality
- ✅ Category management (create, delete, organize)
- ✅ Search functionality
- ✅ Category filtering
- ✅ Manual barcode entry
- ✅ Custom app icon and splash screen
- ✅ Responsive design for all Android screen sizes

---

## 🛠️ Tools & Libraries

### Frontend (React Native / Expo)

#### **Core Framework**
- **Expo (~54.0.23)**: Chosen for rapid development, built-in tooling, and easy deployment. Expo provides a managed workflow that simplifies React Native development without needing native code setup.
- **React Native (0.81.5)**: Cross-platform mobile framework enabling code sharing between iOS and Android.

#### **Navigation & Routing**
- **Expo Router (~6.0.14)**: File-based routing system that simplifies navigation setup and provides type-safe routes. Chosen for its simplicity and integration with Expo.
- **@react-navigation/native (~7.1.8)**: Core navigation library providing the foundation for React Navigation.
- **@react-navigation/bottom-tabs (~7.4.0)**: Bottom tab navigator for the main app navigation (Scanner and Kanban screens).

#### **Camera & Barcode Scanning**
- **expo-camera (~17.0.9)**: Provides camera access and barcode scanning capabilities. Chosen for its Expo integration and ease of use.

#### **Animations & Gestures**
- **react-native-reanimated (~4.1.1)**: High-performance animation library running on the UI thread. Essential for smooth drag-and-drop animations in the Kanban board.
- **react-native-gesture-handler (~2.28.0)**: Provides gesture recognition capabilities. Used for implementing drag-and-drop, long press, and pan gestures in the Kanban board.

#### **UI & Styling**
- **@expo/vector-icons (~15.0.3)**: Icon library providing Material Icons for consistent UI elements.
- **expo-haptics (~15.0.7)**: Provides haptic feedback for better user experience during interactions (drag, drop, long press).

#### **Development Tools**
- **TypeScript (5.9.2)**: Type-safe JavaScript for better code quality and developer experience.
- **ESLint**: Code linting for maintaining code quality.

### Backend (Node.js / Express)

#### **Core Framework**
- **Node.js**: JavaScript runtime for server-side development.
- **Express (^5.1.0)**: Minimal and flexible web application framework for Node.js. Chosen for its simplicity and large ecosystem.

#### **Database**
- **MongoDB**: NoSQL database chosen for its flexibility in handling product and category data.
- **Mongoose (^8.19.3)**: MongoDB object modeling tool that provides schema validation, middleware, and type casting. Simplifies database operations and ensures data consistency.

#### **Middleware & Utilities**
- **CORS (^2.8.5)**: Enables Cross-Origin Resource Sharing, allowing the mobile app to communicate with the backend API.
- **dotenv (^17.2.3)**: Loads environment variables from `.env` file for secure configuration management.

#### **Development Tools**
- **nodemon (^3.1.10)**: Automatically restarts the server during development when files change.

### Deployment
- **Vercel**: Backend API is deployed on Vercel for reliable hosting and easy deployment.
- **EAS Build (Expo Application Services)**: Used for building production APK files for Android.

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (optional, for local development)
- MongoDB Atlas account (or local MongoDB instance)
- Android device or emulator (for testing)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   Create a `.env` file in the `backend` directory with the following content:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/barcode_scanner?retryWrites=true&w=majority
   PORT=5000
   ```
   Replace `username`, `password`, and `cluster` with your MongoDB Atlas credentials.

4. **Start the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

5. **Verify the server is running:**
   Visit `http://localhost:5000/health` in your browser. You should see:
   ```json
   {
     "status": "OK",
     "message": "Server is running"
   }
   ```

### Frontend Setup

1. **Navigate to app directory:**
   ```bash
   cd app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Expo development server:**
   ```bash
   npx expo start
   ```

4. **Run on Android:**
   - Press `a` in the terminal to open on Android emulator
   - Or scan the QR code with Expo Go app on your Android device

5. **Run on iOS:**
   - Press `i` in the terminal to open on iOS simulator
   - Or scan the QR code with Expo Go app on your iOS device

### Testing the Live Version

#### Backend API
The backend is deployed at: `https://aci-backend.vercel.app/api`

**Health Check:**
```bash
GET https://aci-backend.vercel.app/health
```

**Test Endpoints:**
- Get all products: `GET https://aci-backend.vercel.app/api/products`
- Get all categories: `GET https://aci-backend.vercel.app/api/categories`

See `backend/API_ENDPOINTS.md` for complete API documentation.

#### Mobile App
1. **Using Expo Go:**
   - Install Expo Go app on your device
   - Run `npx expo start` in the app directory
   - Scan the QR code with Expo Go

2. **Using Production APK:**
   - Build APK using EAS Build (see Build Instructions below)
   - Install the APK on your Android device
   - Enable "Install from Unknown Sources" if prompted

---

## 🎁 Bonus Features

### 1. Search Functionality
**Location:** Kanban Board Screen

**Features:**
- Search products by barcode, material number, or description
- Real-time filtering as you type
- Case-insensitive search
- Automatically hides empty categories when searching
- Clears search with a single tap

**Implementation:**
- Uses `TextInput` component with debounced search
- Filters products on the client side for instant results
- Updates the Kanban board in real-time

### 2. Category Filter Dropdown
**Location:** Kanban Board Screen

**Features:**
- Dropdown menu showing all available categories
- "All Categories" option to show all products
- Visual indicator (checkmark) for selected category
- Modal-based dropdown for better UX
- Automatically scrolls to the front when filter changes

**Implementation:**
- Fetches categories from the backend API
- Uses React Native `Modal` component for overlay
- Integrates with search functionality for combined filtering

### 3. Custom App Icon
**Location:** `app/assets/images/favicon.png`

**Features:**
- Custom favicon/icon for the app
- Used as app icon on Android home screen
- Used as adaptive icon with custom background color (#00A859 - Shwapno Green)
- Consistent branding across the app

**Implementation:**
- Configured in `app.json` under `android.adaptiveIcon`
- Supports foreground, background, and monochrome variants
- Automatic icon generation for different screen densities

### 4. Custom Splash Screen
**Location:** `app/components/splash-screen.tsx`

**Features:**
- Animated splash screen with app logo
- Company branding (ACI Logistics Limited - Shwapno)
- Smooth fade-in and scale animations
- Loading indicator with animated dots
- Custom green background (#00A859) matching brand colors

**Implementation:**
- Uses React Native `Animated` API for smooth animations
- Custom component with fade, scale, and slide animations
- Configured in `app.json` under `expo-splash-screen` plugin
- Shows during app startup

### 5. Manual Barcode Entry
**Location:** Scanner Screen

**Features:**
- Alternative to camera scanning
- Text input for manual barcode entry
- Number pad keyboard for easy input
- Validates barcode format before fetching
- Same functionality as camera scanning (checks database, fetches from API, saves to database)

**Implementation:**
- Toggle button to show/hide manual input
- `TextInput` with `keyboardType="number-pad"`
- Reuses the same scanning logic as camera scanning
- Provides fallback when camera is unavailable or barcode is difficult to scan

### Additional UX Enhancements

#### Drag-and-Drop Improvements
- **1-second hold requirement:** Prevents accidental drags
- **Visual feedback:** Card "pops up" when ready to drag
- **Smooth animations:** 60fps animations using Reanimated
- **Auto-scroll:** Automatically scrolls categories when dragging near screen edges
- **Haptic feedback:** Provides tactile feedback on interactions

#### Responsive Design
- **Adaptive layouts:** Works on all Android screen sizes (phones, tablets)
- **Responsive fonts:** Font sizes adjust based on screen size
- **Flexible columns:** Kanban columns adapt to screen width
- **Touch-friendly:** Buttons and interactive elements are appropriately sized

#### Performance Optimizations
- **Throttled updates:** Category detection throttled to reduce JS thread overhead
- **Optimized renders:** Uses `useCallback` and `useMemo` for performance
- **Efficient scrolling:** Smooth vertical and horizontal scrolling
- **Lazy loading:** Products loaded on demand

---

## 📱 Build Instructions

### Building APK for Android

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Build APK:**
   ```bash
   cd app
   eas build --platform android --profile preview
   ```

4. **Download APK:**
   - After build completes, download from Expo dashboard
   - Install on Android device
   - Enable "Install from Unknown Sources" if needed

For detailed build instructions, see `app/BUILD_APK_GUIDE.md`.

---

## 🗄️ Database Schema

### Product Schema
```javascript
{
  material: Number,        // Required, Material number
  barcode: String,         // Required, Unique, Indexed
  description: String,     // Required, Product description
  category: String,        // Default: "Uncategorized"
  scannedAt: Date,         // When product was scanned
  createdAt: Date,         // Auto-generated
  updatedAt: Date          // Auto-generated
}
```

### Category Schema
```javascript
{
  name: String,            // Required, Unique
  createdAt: Date,         // Auto-generated, Used for sorting
  updatedAt: Date          // Auto-generated
}
```

---

## 🔌 API Endpoints

### Base URL
- **Production:** `https://aci-backend.vercel.app/api`
- **Local:** `http://localhost:5000/api`

### Products
- `GET /api/products` - Get all products
- `GET /api/products?category=CategoryName` - Get products by category
- `GET /api/products/:barcode` - Get product by barcode
- `POST /api/products` - Save a new product
- `PATCH /api/products/:id/category` - Update product category

### Categories
- `GET /api/categories` - Get all categories (sorted by createdAt)
- `POST /api/categories` - Create a new category
- `DELETE /api/categories/:name` - Delete a category

### Health Check
- `GET /health` - Check if server is running

For detailed API documentation, see `backend/API_ENDPOINTS.md`.

---

## 🏗️ Project Structure

```
.
├── app/                    # Frontend (Expo/React Native)
│   ├── app/               # App screens and routing
│   │   ├── (tabs)/       # Tab navigation screens
│   │   │   ├── scanner.tsx
│   │   │   └── kanban.tsx
│   │   ├── _layout.tsx   # Root layout
│   │   └── index.tsx     # Index route (redirects to scanner)
│   ├── components/        # Reusable components
│   │   ├── header.tsx
│   │   ├── splash-screen.tsx
│   │   └── ...
│   ├── services/         # API services
│   │   └── api.ts
│   ├── constants/        # Constants and theme
│   │   └── theme.ts
│   └── assets/          # Images and assets
│       └── images/
│           └── favicon.png
│
└── backend/              # Backend (Node.js/Express)
    ├── routes/          # API routes
    │   ├── products.js
    │   └── categories.js
    ├── models/          # Database models
    │   ├── Product.js
    │   └── Category.js
    ├── index.js         # Server entry point
    └── .env            # Environment variables (not in repo)
```

---

## 🔒 Security & Best Practices

### Environment Variables
- MongoDB connection string stored in `.env` file (not committed to git)
- `.env` file added to `.gitignore`

### Data Validation
- Backend validates all input data
- Unique constraints on barcode and category names
- Error handling for duplicate products

### CORS
- Backend configured to allow requests from mobile app
- CORS enabled for cross-origin requests

### Error Handling
- Comprehensive error handling in both frontend and backend
- User-friendly error messages
- Graceful degradation when API is unavailable

---

## 🐛 Troubleshooting

### Common Issues

1. **"Unmatched route" error:**
   - Ensure `app/app/index.tsx` exists and redirects to `/(tabs)/scanner`
   - Rebuild the APK after making routing changes

2. **Camera not working:**
   - Check device permissions
   - Ensure `expo-camera` is properly installed
   - Try manual barcode entry as alternative

3. **Backend connection issues:**
   - Verify backend is running
   - Check API URL in `app/services/api.ts`
   - Ensure CORS is enabled on backend

4. **Build fails:**
   - Check `eas.json` configuration
   - Ensure all dependencies are installed
   - Verify `app.json` has correct package name and version code

---

## 📝 License

This project is proprietary software developed for ACI Logistics Limited (Shwapno).

---

## 👥 Contributors

Developed for ACI Logistics Limited (Shwapno) by MD Rashedul Islam Junayed

---


