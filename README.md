# 🍽️ Family Meal Planner

A comprehensive, AI-powered meal planning application that helps families organize their weekly meals with intelligent features, drag-and-drop functionality, smart ingredient search, and personalized family preferences.

![Family Meal Planner](https://img.shields.io/badge/React-19.0.0-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.110.1-green) ![MongoDB](https://img.shields.io/badge/MongoDB-4.5.0-brightgreen) ![AI Powered](https://img.shields.io/badge/AI-Powered-purple)

## ✨ Key Features

### 🥗 Advanced Meal Management
- **Complete CRUD Operations**: Create, read, update, and delete meal recipes
- **Structured Recipe Storage**: Organized meal names, ingredients, and detailed cooking instructions
- **Mandatory Field Validation**: Ensures data quality with required meal names and ingredients
- **Recipe Import/Export**: Save and share your favorite family recipes

### 🔍 Smart Ingredient Search System
- **Real-Time Autocomplete**: Type 2+ characters to see instant ingredient suggestions
- **Personal Ingredient Database**: Builds a personalized database of your commonly used ingredients
- **Pre-Seeded Database**: Comes with 70+ common cooking ingredients organized by category
- **Intelligent Categorization**: Ingredients sorted by type (protein, vegetable, spice, dairy, fruit, grain, oil, condiment, nut)
- **Usage Analytics**: Tracks ingredient usage frequency for smarter suggestions
- **Custom Ingredients**: Add ingredients not in the database for future use
- **Tag Interface**: Selected ingredients displayed as removable tags with counters

### 👨‍👩‍👧‍👦 Family Preferences System
- **Visual Family Members**: 7 emoji-based family member representations
  - 👨‍💼 **Dad** - Father's meal preferences
  - 👩‍💼 **Mom** - Mother's meal preferences  
  - 👦 **Brother** - Son's meal preferences
  - 👧 **Sister** - Daughter's meal preferences
  - 👶 **Baby** - Baby's meal preferences
  - 👴 **Grandpa** - Grandfather's meal preferences
  - 👵 **Grandma** - Grandmother's meal preferences
- **Interactive Selection**: Click family member emojis to mark meal favorites
- **Visual Meal Cards**: Family preferences displayed on each meal for quick reference
- **Customizable Preferences**: Each recipe can have multiple family member favorites

### 📅 Interactive Weekly Planning Grid
- **7-Day Layout**: Complete weekly view from Monday through Sunday
- **5 Daily Meal Slots**: Comprehensive daily meal planning
  - 🌅 **Breakfast** - Morning meal planning
  - ☕ **Morning Snack** - Mid-morning snack slot
  - 🥗 **Lunch** - Afternoon meal planning
  - 🍽️ **Dinner** - Evening meal slot
  - 🍪 **Evening Snack** - Night-time snack planning
- **Current Week Display**: Automatically shows current week with date labels
- **Visual Meal Assignment**: See assigned meals with ingredient previews and family preferences

### 🎯 Intuitive Drag & Drop Functionality
- **Seamless Meal Assignment**: Drag meals from sidebar directly to planning slots
- **Visual Feedback**: Smooth animations, hover effects, and drag overlays
- **Real-Time Updates**: Instant synchronization with backend database
- **Easy Reassignment**: Move meals between different time slots effortlessly
- **Remove Function**: Click to remove meals from assigned slots
- **Modern DnD Library**: Powered by @dnd-kit for accessibility and performance

### 🤖 AI-Powered Recipe Suggestions
- **Natural Language Prompts**: Describe recipes in plain English (e.g., "healthy chicken dinner for kids")
- **Intelligent Recipe Generation**: AI creates complete recipes with ingredients, instructions, and cooking details
- **Dietary Preference Filters**: Support for 10+ dietary requirements
  - Vegetarian, Vegan, Gluten-Free, Dairy-Free, Low-Carb, Keto, Paleo, Low-Sodium, High-Protein, Nut-Free
- **Cuisine Type Selection**: Choose from 10 international cuisines
  - Italian, Asian, Mexican, American, Mediterranean, Indian, French, Chinese, Thai, Japanese
- **Difficulty Levels**: Easy, Medium, or Hard recipe complexity options
- **Smart Family Suggestions**: AI recommends which family members might enjoy each recipe
- **One-Click Integration**: Add AI-generated recipes directly to your meal library
- **Cooking Time Estimates**: AI provides preparation and cooking time estimates

### 🎨 Modern UI/UX Design
- **Warm Color Palette**: Food-themed orange and brown gradient design
- **Glass Morphism Effects**: Modern backdrop blur effects and transparency
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Smooth Micro-Animations**: Hover states, transitions, and entrance animations
- **Professional Typography**: Inter for UI elements, Playfair Display for headings
- **Accessibility Features**: ARIA labels, keyboard navigation, and screen reader support

## 🛠️ Technology Stack

### Frontend Architecture
- **React 19.0.0** - Latest React with concurrent features and improved performance
- **@dnd-kit** - Modern, accessible drag and drop library
- **Shadcn/UI** - Beautiful, customizable UI component library
- **Tailwind CSS 3.4.17** - Utility-first CSS framework with custom design system
- **Lucide React** - Beautiful, consistent icon library
- **Axios 1.8.4** - Promise-based HTTP client for API communication
- **React Hook Form 7.56.2** - Performant form library with built-in validation
- **Sonner** - Elegant toast notification system
- **React Router DOM 7.5.1** - Declarative routing for single-page applications

### Backend Architecture
- **FastAPI 0.110.1** - High-performance Python web framework with automatic API documentation
- **MongoDB 4.5.0** - Flexible NoSQL database for complex data structures
- **Motor 3.3.1** - Asynchronous MongoDB driver for FastAPI
- **Pydantic 2.6.4+** - Data validation and serialization with type hints
- **Emergent Integrations** - Custom AI integration library for multiple LLM providers
- **Python-dotenv** - Environment variable management for secure configuration
- **PyJWT** - JSON Web Token implementation for future authentication features

### AI Integration
- **GPT-4o-mini** - OpenAI's efficient model for recipe generation
- **Emergent LLM Key** - Universal API key supporting OpenAI, Anthropic, and Google models
- **Structured AI Prompts** - Professional system prompts for consistent recipe generation
- **JSON Response Parsing** - Robust parsing and validation of AI-generated content

### Development Tools
- **ESLint & Prettier** - Code linting and formatting
- **TypeScript Support** - Type checking for improved development experience
- **Hot Reload** - Development server with instant updates
- **Git Integration** - Version control with GitHub integration
- **Responsive Testing** - Cross-device compatibility testing

## 🚀 Installation & Setup

### Prerequisites
- **Node.js 16+** - JavaScript runtime environment
- **Python 3.8+** - Backend programming language
- **MongoDB** - Database (local installation or cloud connection string)
- **Yarn** - Package manager (preferred over npm)
- **Git** - Version control system

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd family-meal-planner
   ```

2. **Navigate to backend directory**
   ```bash
   cd backend
   ```

3. **Create and activate virtual environment**
   ```bash
   # On macOS/Linux
   python -m venv venv
   source venv/bin/activate
   
   # On Windows
   python -m venv venv
   venv\Scripts\activate
   ```

4. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure environment variables**
   Create `.env` file in backend directory:
   ```env
   # Database Configuration
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=meal_planner_db
   
   # CORS Configuration
   CORS_ORIGINS=http://localhost:3000,https://your-domain.com
   
   # AI Configuration (for recipe suggestions)
   EMERGENT_LLM_KEY=your_emergent_llm_key_here
   ```

6. **Seed the ingredient database**
   ```bash
   curl -X POST http://localhost:8001/api/ingredients/seed
   ```

7. **Start the backend server**
   ```bash
   uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install Node.js dependencies**
   ```bash
   yarn install
   ```

3. **Configure environment variables**
   Create `.env` file in frontend directory:
   ```env
   # Backend API Configuration
   REACT_APP_BACKEND_URL=http://localhost:8001
   
   # Development Configuration
   WDS_SOCKET_PORT=443
   ```

4. **Start the development server**
   ```bash
   yarn start
   ```

### Access the Application
- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs
- **OpenAPI Schema**: http://localhost:8001/openapi.json

## 📖 How to Use

### Creating Meals

1. **Open Meal Creation**
   - Click "Add Meal" button in the top navigation

2. **Fill in Meal Details** (Required fields marked with *)
   - **Meal Name*** - Enter a descriptive name for your recipe
   - **Ingredients*** - Use the smart search system:
     - Type ingredient names to see real-time suggestions
     - Select from categorized suggestions with badges
     - Add custom ingredients not in the database
     - Remove ingredients by clicking the X on tags
   - **Recipe** - Provide detailed cooking instructions (optional)

3. **Select Family Preferences** (Optional)
   - Click family member emojis to mark who would enjoy this meal
   - Multiple selections allowed

4. **Save the Meal**
   - Click "Create Meal" to add to your recipe library

### AI Recipe Suggestions

1. **Open AI Recipe Generator**
   - Click "AI Recipe Ideas" button (purple button with sparkles icon)

2. **Describe Your Recipe*** 
   - Enter natural language descriptions like:
     - "Healthy chicken dinner for the family"
     - "Quick vegetarian pasta that kids will love"
     - "Birthday cake recipe for a 5-year-old"
     - "Low-carb Mexican lunch"

3. **Set Preferences** (Optional)
   - **Dietary Requirements**: Select from available options
     - Vegetarian, Vegan, Gluten-Free, Dairy-Free
     - Low-Carb, Keto, Paleo, Low-Sodium
     - High-Protein, Nut-Free
   - **Cuisine Type**: Choose international styles
     - Italian, Asian, Mexican, American, Mediterranean
     - Indian, French, Chinese, Thai, Japanese
   - **Difficulty Level**: Pick complexity
     - Easy (beginner-friendly)
     - Medium (some cooking experience)
     - Hard (advanced techniques)

4. **Generate Recipe**
   - Click "Generate Recipe" button
   - Wait for AI to create your custom recipe

5. **Review AI Suggestion**
   - Complete recipe with ingredients, instructions, and details
   - Family preference suggestions based on recipe content
   - Cuisine classification and difficulty assessment
   - Estimated cooking time

6. **Add to Meal Library**
   - Click "Add to My Meals" to save the AI-generated recipe
   - Recipe becomes available for weekly planning

### Weekly Meal Planning

1. **View Planning Grid**
   - See 7-day weekly layout with current dates
   - 5 meal slots per day with emoji indicators

2. **Assign Meals with Drag & Drop**
   - Drag meals from the sidebar to desired time slots
   - Visual feedback during dragging
   - Meals show ingredient preview and family preferences

3. **Manage Meal Assignments**
   - Remove meals by clicking trash icon in assigned slots
   - Reassign meals by dragging to different slots
   - View meal details in planning grid

### Ingredient Database Management

1. **Search Existing Ingredients**
   - Type in ingredient search field
   - See categorized suggestions with usage frequency
   - Common ingredients marked with badges

2. **Add Custom Ingredients**
   - Type ingredient name not in database
   - Press Enter or click to add
   - Ingredient saved for future use

3. **Usage Analytics**
   - Frequently used ingredients appear first
   - Usage count tracked per ingredient
   - Personal ingredient database builds over time

## 🔌 API Documentation

### Meal Management
```http
GET /api/meals                    # Retrieve all meals
POST /api/meals                   # Create a new meal
GET /api/meals/{meal_id}         # Get specific meal details
PUT /api/meals/{meal_id}         # Update existing meal
DELETE /api/meals/{meal_id}      # Delete meal
```

### Meal Planning
```http
GET /api/meal-plans              # Get meal plans (with optional week filter)
GET /api/meal-plans/{date}       # Get meal plan for specific date
POST /api/meal-plans             # Create or update meal plan
PUT /api/meal-plans/{date}       # Update specific meal slot
```

### AI Recipe Generation
```http
POST /api/suggest-recipe         # Generate AI recipe suggestions
POST /api/create-meal-from-suggestion  # Create meal from AI suggestion
```

### Ingredient Management
```http
POST /api/ingredients/search     # Search ingredients with autocomplete
POST /api/ingredients            # Create ingredient or increment usage
GET /api/ingredients/popular     # Get most frequently used ingredients
POST /api/ingredients/seed       # Seed database with common ingredients
```

### System Information
```http
GET /api/family-members          # Get available family member emojis
```

## 🗄️ Data Models

### Meal Model
```javascript
{
  "id": "uuid",
  "name": "Chicken Stir Fry",
  "ingredients": ["Chicken breast", "Bell peppers", "Soy sauce"],
  "recipe": "1. Heat oil in wok... 2. Add chicken...",
  "family_preferences": ["dad", "mom", "brother"],
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Meal Plan Model
```javascript
{
  "id": "uuid",
  "date": "2024-01-15",
  "breakfast": "meal_id_1",
  "morning_snack": "meal_id_2",
  "lunch": "meal_id_3",
  "dinner": "meal_id_4",
  "evening_snack": null,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Ingredient Model
```javascript
{
  "id": "uuid",
  "name": "Chicken Breast",
  "category": "protein",
  "is_common": true,
  "usage_count": 15,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### AI Recipe Suggestion Model
```javascript
{
  "name": "Healthy Chicken Stir Fry",
  "ingredients": ["Chicken breast", "Mixed vegetables", "Soy sauce"],
  "recipe": "Detailed cooking instructions...",
  "suggested_family_preferences": ["dad", "mom", "brother"],
  "cuisine_type": "Asian",
  "difficulty_level": "easy",
  "cooking_time": "20 minutes"
}
```

## 🎨 Design System

### Color Palette
- **Primary Orange**: #ff7518 - Main accent color and call-to-action buttons
- **Secondary Orange**: #ffb347 - Secondary elements and hover states
- **Background Gradient**: Warm cream to light orange gradient
- **Text Brown**: #8b4513 - Primary text color for optimal readability
- **Success Green**: #22c55e - Success messages and positive feedback
- **Error Red**: #ef4444 - Error messages and validation feedback
- **AI Purple**: #8b5cf6 - AI-related features and buttons

### Typography Hierarchy
- **Main Headings (H1)**: Playfair Display, 2rem (mobile: 1.5rem, large: 2.5rem)
- **Sub Headings (H2)**: Playfair Display, 1.5rem (mobile: 1.25rem, large: 2rem)
- **Body Text**: Inter, 1rem (mobile: 0.9rem)
- **Small Text**: Inter, 0.875rem (mobile: 0.8rem)
- **Captions**: Inter, 0.75rem

### Component Styling
- **Cards**: Glass morphism with backdrop blur and subtle shadows
- **Buttons**: Gradient backgrounds with hover animations
- **Form Elements**: Rounded corners with focus states
- **Drag Elements**: Transform and shadow effects during interaction

## 🧪 Testing

### Automated Testing Coverage
- **Backend API Testing**: Complete endpoint testing with various scenarios
- **Frontend Component Testing**: React Testing Library for UI components
- **Integration Testing**: End-to-end functionality verification
- **Drag & Drop Testing**: User interaction flow testing
- **AI Integration Testing**: Recipe generation and validation testing

### Manual Testing Checklist
- [ ] Meal creation with ingredient search
- [ ] Family preference selection and display
- [ ] Drag and drop meal assignment
- [ ] AI recipe generation with various prompts
- [ ] Weekly planning grid functionality
- [ ] Ingredient database growth and usage tracking
- [ ] Responsive design across devices
- [ ] Cross-browser compatibility
- [ ] Error handling and validation

### Running Tests
```bash
# Backend tests
cd backend
python -m pytest tests/ -v

# Frontend tests
cd frontend
yarn test --coverage

# Integration tests
yarn test:integration

# E2E tests
yarn test:e2e
```

## 📱 Responsive Design

### Breakpoint Strategy
- **Mobile**: < 768px - Single column, touch-friendly controls
- **Tablet**: 768px - 1200px - Stacked layout with optimized spacing
- **Desktop**: > 1200px - Full sidebar layout with drag and drop

### Mobile Optimizations
- **Touch Targets**: Minimum 44px touch targets for finger navigation
- **Gesture Support**: Swipe gestures for meal assignment
- **Simplified Navigation**: Collapsible menus and bottom navigation
- **Performance**: Optimized images and lazy loading

## 🔧 Development

### Project Structure
```
family-meal-planner/
├── backend/                 # FastAPI backend application
│   ├── server.py           # Main application with all endpoints
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment configuration
│   └── tests/             # Backend test suites
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Global styles and design system
│   │   ├── index.js       # Application entry point
│   │   └── components/    # Reusable UI components
│   │       └── ui/        # Shadcn UI component library
│   ├── public/            # Static assets
│   ├── package.json       # Node.js dependencies and scripts
│   └── .env              # Frontend environment variables
├── tests/                  # Integration and E2E tests
├── scripts/               # Utility and deployment scripts
├── docs/                  # Additional documentation
└── README.md              # This comprehensive guide
```

### Key Dependencies

**Frontend Core:**
- `react@19.0.0` - Latest React with concurrent features
- `@dnd-kit/core` - Modern drag and drop implementation
- `axios@1.8.4` - HTTP client for API communication
- `react-router-dom@7.5.1` - Client-side routing

**UI & Styling:**
- `@radix-ui/react-*` - Accessible UI primitive components
- `tailwindcss@3.4.17` - Utility-first CSS framework
- `lucide-react@0.507.0` - Modern icon library
- `sonner@2.0.3` - Toast notification system

**Backend Core:**
- `fastapi@0.110.1` - High-performance Python web framework
- `motor@3.3.1` - Asynchronous MongoDB driver
- `pydantic@2.6.4+` - Data validation with type hints
- `emergentintegrations` - AI integration library

## 🚀 Deployment

### Environment Configuration

**Production Backend (.env):**
```env
# Database
MONGO_URL=mongodb://your-production-mongo-host:27017
DB_NAME=meal_planner_production

# Security
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# AI Features
EMERGENT_LLM_KEY=your_production_emergent_key

# Optional: Additional security
JWT_SECRET_KEY=your_jwt_secret_for_future_auth
```

**Production Frontend (.env):**
```env
# API Configuration
REACT_APP_BACKEND_URL=https://api.your-domain.com

# Analytics (optional)
REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Build Commands

**Frontend Production Build:**
```bash
cd frontend
yarn build
# Creates optimized build in ./build directory
```

**Backend Preparation:**
```bash
cd backend
pip install -r requirements.txt
# Ensure all dependencies are installed
```

### Deployment Options

#### Docker Deployment
```dockerfile
# Example Docker configuration
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install
COPY frontend/ .
RUN yarn build

FROM python:3.9
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
COPY --from=frontend-build /app/frontend/build ./static
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Cloud Platform Deployment
- **Vercel/Netlify**: Frontend static hosting
- **Railway/Render**: Full-stack application hosting
- **AWS/Google Cloud**: Containerized deployment
- **MongoDB Atlas**: Managed database hosting

### Performance Optimization
- **Frontend**: Code splitting, lazy loading, image optimization
- **Backend**: Database indexing, caching strategies, connection pooling
- **CDN**: Static asset delivery optimization
- **Monitoring**: Application performance monitoring and error tracking

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Follow** code style guidelines and testing requirements
4. **Commit** changes with descriptive messages (`git commit -m 'Add amazing feature'`)
5. **Push** to your branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request with detailed description

### Code Style Guidelines
- **Frontend**: ESLint configuration with Prettier formatting
- **Backend**: PEP 8 Python style guide with Black formatter
- **Commits**: Conventional commit messages
- **Documentation**: Update README for any new features

### Issue Reporting
- Use GitHub Issues for bug reports and feature requests
- Include environment details, steps to reproduce, and expected behavior
- Label issues appropriately (bug, enhancement, documentation)

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support & Community

### Getting Help
- **Documentation**: Comprehensive guides in `/docs` directory
- **API Reference**: Interactive documentation at `/api/docs`
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Community Q&A and feature discussions

### Roadmap & Future Features
- [ ] **User Authentication**: Secure login and user profiles
- [ ] **Recipe Sharing**: Share favorite recipes with other families
- [ ] **Nutritional Information**: Calorie and nutrition tracking
- [ ] **Grocery List Generation**: Automatic shopping list creation
- [ ] **Meal History**: Track what you've cooked and when
- [ ] **Recipe Ratings**: Rate and review family recipes
- [ ] **Export Features**: PDF meal plans and shopping lists
- [ ] **Mobile App**: Native iOS and Android applications
- [ ] **Voice Integration**: Voice-controlled meal planning
- [ ] **Smart Home Integration**: Connect with smart kitchen appliances

## 📊 Analytics & Monitoring

### Built-in Analytics
- **Ingredient Usage Tracking**: Most popular ingredients analytics
- **Meal Planning Patterns**: Family meal preferences insights  
- **AI Recipe Performance**: Success rate of AI-generated recipes
- **User Engagement**: Feature usage and interaction patterns

### Optional Integrations
- **Google Analytics**: Web traffic and user behavior analysis
- **Sentry**: Error monitoring and performance tracking
- **LogRocket**: Session replay for debugging user issues
- **Mixpanel**: Advanced user analytics and cohort analysis

---

## 🎉 Quick Start Summary

1. **Clone** repository and install dependencies
2. **Configure** environment variables for backend and frontend
3. **Seed** ingredient database with common ingredients
4. **Start** development servers (backend on :8001, frontend on :3000)
5. **Create** your first meal with AI recipe suggestions
6. **Plan** your week using drag-and-drop functionality
7. **Enjoy** organized family meal planning!

---

**Built with ❤️ for families who love to plan their meals together!**

*Last updated: September 2024*
