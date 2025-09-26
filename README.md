# 🍽️ Family Meal Planner

A comprehensive meal planning application that helps families organize their weekly meals with drag-and-drop functionality, family preferences, and recipe management.

![Family Meal Planner](https://img.shields.io/badge/React-19.0.0-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.110.1-green) ![MongoDB](https://img.shields.io/badge/MongoDB-4.5.0-brightgreen)

## ✨ Features

### 🥗 Meal Management
- **Create, Edit, Delete Meals**: Complete CRUD operations for meal recipes
- **Detailed Recipe Storage**: Store meal names, ingredient lists, and cooking instructions
- **Ingredient Management**: Add ingredients line by line with automatic formatting

### 👨‍👩‍👧‍👦 Family Preferences System
- **Family Member Emojis**: Visual representation for each family member
  - 👨‍💼 **Dad** - Father's preferences
  - 👩‍💼 **Mom** - Mother's preferences  
  - 👦 **Brother** - Son's preferences
  - 👧 **Sister** - Daughter's preferences
  - 👶 **Baby** - Baby's preferences
  - 👴 **Grandpa** - Grandfather's preferences
  - 👵 **Grandma** - Grandmother's preferences
- **Clickable Selection**: Toggle family member preferences for each recipe
- **Visual Indicators**: Selected preferences show with highlighted styling

### 📅 Weekly Planning Grid
- **7-Day Layout**: Complete weekly view (Monday through Sunday)
- **5 Meal Slots Per Day**:
  - 🌅 **Breakfast** - Morning meal
  - ☕ **Morning Snack** - Mid-morning snack
  - 🥗 **Lunch** - Afternoon meal
  - 🍽️ **Dinner** - Evening meal
  - 🍪 **Evening Snack** - Night-time snack

### 🎯 Drag & Drop Functionality
- **AI-Powered Recipe Generation**: Get recipe suggestions based on natural language prompts
- **Smart Recipe Creation**: Ask for "healthy chicken dinner" or "vegetarian pasta for kids"
- **Structured Recipe Output**: AI generates complete recipes with ingredients, instructions, and cooking details
- **Dietary Preferences**: Filter suggestions by vegetarian, vegan, gluten-free, keto, etc.
- **Cuisine Selection**: Choose from Italian, Asian, Mexican, American, and more
- **Difficulty Levels**: Easy, medium, or hard recipe complexity
- **Family Preference Suggestions**: AI recommends which family members might enjoy the recipe
- **One-Click Integration**: Add AI-generated recipes directly to your meal library
- **Intuitive Meal Assignment**: Drag meals from sidebar to planning slots
- **Visual Feedback**: Smooth animations and hover effects
- **Easy Reassignment**: Move meals between different time slots
- **Remove Function**: Click to remove meals from assigned slots

### 🎨 Modern UI/UX
- **Warm Color Scheme**: Food-themed orange and brown palette
- **Responsive Design**: Works on desktop and mobile devices
- **Glass Morphism Effects**: Modern blur effects and transparency
- **Smooth Animations**: Micro-interactions for better user experience

## 🛠️ Technology Stack

### Frontend
- **React 19.0.0** - Modern React with latest features
- **@dnd-kit** - Modern drag and drop library
- **Shadcn/UI** - Beautiful, accessible UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Axios** - HTTP client for API calls
- **React Hook Form** - Form handling
- **Sonner** - Toast notifications

### Backend
- **FastAPI 0.110.1** - Modern Python web framework
- **MongoDB 4.5.0** - NoSQL database
- **Motor** - Async MongoDB driver
- **Pydantic** - Data validation and serialization
- **Python-dotenv** - Environment variable management

### Typography
- **Inter** - Modern sans-serif for UI elements
- **Playfair Display** - Elegant serif for headings

## 🚀 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (running locally or connection string)
- Yarn package manager

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   Create `.env` file in backend directory:
   ```env
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=meal_planner_db
   CORS_ORIGINS=*
   ```

5. **Start the backend server**
   ```bash
   uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Configure environment variables**
   Create `.env` file in frontend directory:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:8001
   ```

4. **Start the frontend server**
   ```bash
   yarn start
   ```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs

## 📖 How to Use

### Creating Meals

1. **Click "Add Meal" button** in the top navigation
2. **Fill in meal details**:
   - **Meal Name**: Enter a descriptive name
   - **Ingredients**: Add one ingredient per line
   - **Recipe**: Provide detailed cooking instructions
3. **Select Family Preferences**: Click on family member emojis to mark favorites
4. **Save the meal**: Click "Create Meal" button

### AI Recipe Suggestions

1. **Click "AI Recipe Ideas" button** in the top navigation (purple button with sparkles)
2. **Describe what you want**: Enter a natural language prompt like:
   - "Healthy chicken dinner for the family"
   - "Quick vegetarian pasta recipe"
   - "Birthday cake that kids will love"
3. **Set preferences (optional)**:
   - **Dietary Requirements**: Select from vegetarian, vegan, gluten-free, keto, etc.
   - **Cuisine Type**: Choose Italian, Asian, Mexican, American, etc.
   - **Difficulty Level**: Pick easy, medium, or hard
4. **Generate Recipe**: Click "Generate Recipe" and wait for AI to create your custom recipe
5. **Review & Accept**: AI will show complete recipe with ingredients, instructions, and family preference suggestions
6. **Add to Meals**: Click "Add to My Meals" to save the AI-generated recipe

### Planning Your Week

1. **View Weekly Grid**: See 7 days with 5 meal slots each
2. **Drag Meals**: Click and drag meals from the sidebar to desired time slots
3. **Visual Confirmation**: Meals appear in assigned slots with family preferences
4. **Remove Meals**: Click the trash icon in assigned meal slots to remove

### Managing Meals

- **Edit Meals**: Click the edit icon (✏️) next to any meal in the sidebar
- **Delete Meals**: Click the delete icon (🗑️) with confirmation prompt
- **View Details**: Meal cards show ingredient previews and family preferences

## 🔌 API Endpoints

### Meals
- `GET /api/meals` - Retrieve all meals
- `POST /api/meals` - Create a new meal
- `GET /api/meals/{meal_id}` - Get specific meal
- `PUT /api/meals/{meal_id}` - Update meal
- `DELETE /api/meals/{meal_id}` - Delete meal

### Meal Plans
- `GET /api/meal-plans` - Get meal plans (optional week filter)
- `GET /api/meal-plans/{date}` - Get meal plan for specific date
- `POST /api/meal-plans` - Create/update meal plan
- `PUT /api/meal-plans/{date}` - Update specific meal slot

### Family Members
- `GET /api/family-members` - Get available family member emojis
- `POST /api/suggest-recipe` - Generate AI recipe suggestions based on user prompt
- `POST /api/create-meal-from-suggestion` - Create meal from AI recipe suggestion

## 🗄️ Data Models

### Meal Model
```javascript
{
  "id": "uuid",
  "name": "string",
  "ingredients": ["string"],
  "recipe": "string",
  "family_preferences": ["dad", "mom", "sister"],
  "created_at": "datetime"
}
```

### Meal Plan Model
```javascript
{
  "id": "uuid", 
  "date": "YYYY-MM-DD",
  "breakfast": "meal_id | null",
  "morning_snack": "meal_id | null",
  "lunch": "meal_id | null", 
  "dinner": "meal_id | null",
  "evening_snack": "meal_id | null",
  "created_at": "datetime"
}
```

## 🎨 Design Guidelines

### Color Palette
- **Primary**: Orange (#ff7518) - Main accent color
- **Secondary**: Light Orange (#ffb347) - Secondary elements  
- **Background**: Warm gradient from cream to light orange
- **Text**: Brown (#8b4513) - Primary text color
- **Success**: Green (#22c55e) - Success messages
- **Error**: Red (#ef4444) - Error messages

### Component Structure
- **Glassmorphism**: Backdrop blur effects with transparency
- **Rounded Corners**: 8-16px border radius for modern look
- **Shadows**: Subtle drop shadows for depth
- **Hover Effects**: Scale and color transitions on interactive elements

## 🧪 Testing

The application includes comprehensive testing coverage:

- **Backend API Testing**: All endpoints tested with various scenarios
- **Frontend Component Testing**: UI components and interactions
- **Integration Testing**: End-to-end functionality verification
- **Drag & Drop Testing**: Meal assignment and removal flows

### Running Tests
```bash
# Backend tests
cd backend && python -m pytest

# Frontend tests  
cd frontend && yarn test
```

## 🔧 Development

### Project Structure
```
/
├── backend/              # FastAPI backend
│   ├── server.py        # Main application file
│   ├── requirements.txt # Python dependencies
│   └── .env            # Environment variables
├── frontend/            # React frontend
│   ├── src/
│   │   ├── App.js      # Main React component
│   │   ├── App.css     # Global styles
│   │   └── components/ # UI components
│   ├── package.json    # Node dependencies
│   └── .env           # Environment variables
└── README.md          # This file
```

### Key Dependencies

**Frontend:**
- `@dnd-kit/core` - Drag and drop functionality
- `@radix-ui/*` - Accessible UI primitives
- `react-hook-form` - Form management
- `sonner` - Toast notifications

**Backend:**
- `motor` - Async MongoDB driver
- `pydantic` - Data validation
- `python-dotenv` - Environment management

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- **Desktop**: Full-width layout with sidebar
- **Tablet**: Stacked layout with optimized spacing
- **Mobile**: Single-column layout with touch-friendly controls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation at `/docs` endpoint
- Review the component documentation in the code

## 🚀 Deployment

### Environment Variables for Production

**Backend:**
```env
MONGO_URL=mongodb://your-mongo-host:27017
DB_NAME=meal_planner_production
CORS_ORIGINS=https://your-domain.com
EMERGENT_LLM_KEY=your-ai-api-key-for-recipe-suggestions
```

**Frontend:**
```env
REACT_APP_BACKEND_URL=https://your-api-domain.com
```

### Build Commands

**Frontend:**
```bash
yarn build
```

**Backend:**
```bash
pip install -r requirements.txt
```

---

Built with ❤️ for families who love to plan their meals together!
