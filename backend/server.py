from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, date, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Family member emojis
FAMILY_MEMBERS = {
    "dad": "👨‍💼",
    "mom": "👩‍💼", 
    "brother": "👦",
    "sister": "👧",
    "baby": "👶",
    "grandpa": "👴",
    "grandma": "👵"
}

# Define Models
class Meal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    ingredients: List[str]
    recipe: str
    family_preferences: List[str] = Field(default_factory=list)  # List of family member keys
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MealCreate(BaseModel):
    name: str
    ingredients: List[str]
    recipe: str
    family_preferences: List[str] = Field(default_factory=list)

class MealPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # YYYY-MM-DD format
    breakfast: Optional[str] = None  # Meal ID
    morning_snack: Optional[str] = None
    lunch: Optional[str] = None
    dinner: Optional[str] = None
    evening_snack: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MealPlanCreate(BaseModel):
    date: str
    breakfast: Optional[str] = None
    morning_snack: Optional[str] = None
    lunch: Optional[str] = None
    dinner: Optional[str] = None
    evening_snack: Optional[str] = None

class MealPlanUpdate(BaseModel):
    meal_slot: str  # breakfast, morning_snack, lunch, dinner, evening_snack
    meal_id: Optional[str] = None

# Helper functions
def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    return data

def parse_from_mongo(item):
    """Parse datetime strings back from MongoDB"""
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    return item

# Meal endpoints
@api_router.get("/meals", response_model=List[Meal])
async def get_meals():
    """Get all meals"""
    meals = await db.meals.find().to_list(1000)
    return [Meal(**parse_from_mongo(meal)) for meal in meals]

@api_router.post("/meals", response_model=Meal)
async def create_meal(meal_input: MealCreate):
    """Create a new meal"""
    # Validate required fields
    if not meal_input.name or not meal_input.name.strip():
        raise HTTPException(status_code=422, detail="Meal name is required")
    if not meal_input.ingredients or len(meal_input.ingredients) == 0:
        raise HTTPException(status_code=422, detail="At least one ingredient is required")
    if not meal_input.recipe or not meal_input.recipe.strip():
        raise HTTPException(status_code=422, detail="Recipe is required")
    
    meal_dict = meal_input.dict()
    meal_obj = Meal(**meal_dict)
    meal_data = prepare_for_mongo(meal_obj.dict())
    await db.meals.insert_one(meal_data)
    return meal_obj

@api_router.get("/meals/{meal_id}", response_model=Meal)
async def get_meal(meal_id: str):
    """Get a specific meal by ID"""
    meal = await db.meals.find_one({"id": meal_id})
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    return Meal(**parse_from_mongo(meal))

@api_router.put("/meals/{meal_id}", response_model=Meal)
async def update_meal(meal_id: str, meal_input: MealCreate):
    """Update a meal"""
    meal = await db.meals.find_one({"id": meal_id})
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    updated_meal = Meal(id=meal_id, **meal_input.dict())
    meal_data = prepare_for_mongo(updated_meal.dict())
    await db.meals.replace_one({"id": meal_id}, meal_data)
    return updated_meal

@api_router.delete("/meals/{meal_id}")
async def delete_meal(meal_id: str):
    """Delete a meal"""
    result = await db.meals.delete_one({"id": meal_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Meal not found")
    return {"message": "Meal deleted successfully"}

# Meal Plan endpoints
@api_router.get("/meal-plans", response_model=List[MealPlan])
async def get_meal_plans(week_start: Optional[str] = None):
    """Get meal plans, optionally filtered by week"""
    query = {}
    if week_start:
        # Get meal plans for the week starting from week_start
        from datetime import datetime, timedelta
        start_date = datetime.fromisoformat(week_start).date()
        end_date = start_date + timedelta(days=6)
        query = {
            "date": {
                "$gte": start_date.isoformat(),
                "$lte": end_date.isoformat()
            }
        }
    
    meal_plans = await db.meal_plans.find(query).to_list(1000)
    return [MealPlan(**parse_from_mongo(plan)) for plan in meal_plans]

@api_router.get("/meal-plans/{date}", response_model=MealPlan)
async def get_meal_plan_by_date(date: str):
    """Get meal plan for specific date"""
    meal_plan = await db.meal_plans.find_one({"date": date})
    if not meal_plan:
        # Return empty meal plan for the date
        return MealPlan(date=date)
    return MealPlan(**parse_from_mongo(meal_plan))

@api_router.post("/meal-plans", response_model=MealPlan)
async def create_meal_plan(plan_input: MealPlanCreate):
    """Create or update a meal plan"""
    # Check if meal plan already exists for this date
    existing = await db.meal_plans.find_one({"date": plan_input.date})
    
    if existing:
        # Update existing meal plan
        meal_plan = MealPlan(id=existing["id"], **plan_input.dict())
        meal_data = prepare_for_mongo(meal_plan.dict())
        await db.meal_plans.replace_one({"date": plan_input.date}, meal_data)
    else:
        # Create new meal plan
        meal_plan = MealPlan(**plan_input.dict())
        meal_data = prepare_for_mongo(meal_plan.dict())
        await db.meal_plans.insert_one(meal_data)
    
    return meal_plan

@api_router.put("/meal-plans/{date}", response_model=MealPlan)
async def update_meal_plan_slot(date: str, update_data: MealPlanUpdate):
    """Update a specific meal slot in a meal plan"""
    # Get existing meal plan or create new one
    existing = await db.meal_plans.find_one({"date": date})
    
    if existing:
        meal_plan = MealPlan(**parse_from_mongo(existing))
    else:
        meal_plan = MealPlan(date=date)
    
    # Update the specific slot
    if update_data.meal_slot == "breakfast":
        meal_plan.breakfast = update_data.meal_id
    elif update_data.meal_slot == "morning_snack":
        meal_plan.morning_snack = update_data.meal_id
    elif update_data.meal_slot == "lunch":
        meal_plan.lunch = update_data.meal_id
    elif update_data.meal_slot == "dinner":
        meal_plan.dinner = update_data.meal_id
    elif update_data.meal_slot == "evening_snack":
        meal_plan.evening_snack = update_data.meal_id
    else:
        raise HTTPException(status_code=400, detail="Invalid meal slot")
    
    # Save to database
    meal_data = prepare_for_mongo(meal_plan.dict())
    await db.meal_plans.replace_one(
        {"date": date}, 
        meal_data, 
        upsert=True
    )
    
    return meal_plan

@api_router.get("/family-members")
async def get_family_members():
    """Get available family members"""
    return FAMILY_MEMBERS

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()