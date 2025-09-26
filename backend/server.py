from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, date, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

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

# Common ingredients database (initial seed data)
COMMON_INGREDIENTS = [
    "Salt", "Black pepper", "Olive oil", "Butter", "Garlic", "Onion", "Tomatoes", "Chicken breast", 
    "Ground beef", "Eggs", "Milk", "Flour", "Sugar", "Rice", "Pasta", "Bread", "Cheese", "Lemon",
    "Carrots", "Potatoes", "Bell peppers", "Mushrooms", "Spinach", "Broccoli", "Lettuce", "Cucumber",
    "Basil", "Oregano", "Thyme", "Parsley", "Ginger", "Cumin", "Paprika", "Bay leaves",
    "Chicken stock", "Vegetable stock", "Soy sauce", "Vinegar", "Honey", "Brown sugar",
    "Heavy cream", "Yogurt", "Parmesan cheese", "Mozzarella cheese", "Cheddar cheese",
    "Salmon", "Shrimp", "Tuna", "Cod", "Beef steak", "Pork chops", "Bacon", "Ham",
    "Green beans", "Zucchini", "Eggplant", "Corn", "Peas", "Celery", "Avocado",
    "Apples", "Bananas", "Strawberries", "Blueberries", "Oranges", "Lemons", "Limes",
    "Almonds", "Walnuts", "Pine nuts", "Cashews", "Peanuts", "Coconut oil", "Sesame oil"
]

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

class RecipeSuggestionRequest(BaseModel):
    prompt: str
    dietary_preferences: Optional[List[str]] = Field(default_factory=list)  # e.g., ["vegetarian", "low-carb"]
    cuisine_type: Optional[str] = None  # e.g., "Italian", "Asian", "Mexican"
    difficulty_level: Optional[str] = None  # e.g., "easy", "medium", "hard"

class AIRecipeSuggestion(BaseModel):
    name: str
    ingredients: List[str]
    recipe: str
    suggested_family_preferences: List[str] = Field(default_factory=list)
    cuisine_type: Optional[str] = None
    difficulty_level: Optional[str] = None
    cooking_time: Optional[str] = None

class Ingredient(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: Optional[str] = None  # e.g., "vegetable", "protein", "spice", "dairy"
    is_common: bool = False  # True for pre-seeded common ingredients
    usage_count: int = 0  # How many times user has used this ingredient
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class IngredientCreate(BaseModel):
    name: str
    category: Optional[str] = None

class IngredientSearch(BaseModel):
    query: str
    limit: Optional[int] = 10

class GroceryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: Optional[str] = None  # produce, dairy, meat, pantry, etc.
    is_checked: bool = False
    added_by: Optional[str] = None  # user who added this item
    from_recipe: Optional[str] = None  # meal_id if from a recipe
    quantity: Optional[str] = None  # "2 lbs", "1 cup", etc.
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GroceryList(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    week_start_date: str  # YYYY-MM-DD format
    items: List[GroceryItem] = Field(default_factory=list)
    collaborators: List[str] = Field(default_factory=list)  # email addresses or user IDs
    created_by: Optional[str] = None
    is_shared: bool = False
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GroceryListCreate(BaseModel):
    name: str
    week_start_date: str
    auto_generate: bool = True  # Whether to auto-populate from meal plans

class GroceryItemCreate(BaseModel):
    name: str
    category: Optional[str] = None
    quantity: Optional[str] = None
    notes: Optional[str] = None

class GroceryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    is_checked: Optional[bool] = None
    quantity: Optional[str] = None
    notes: Optional[str] = None

class ShareGroceryListRequest(BaseModel):
    collaborator_email: str
    permission: str = "edit"  # view, edit

class WeeklyGroceryGenerate(BaseModel):
    week_start_date: str
    merge_duplicates: bool = True
    organize_by_category: bool = True

class MealPlanCopy(BaseModel):
    source_week_start: str  # YYYY-MM-DD
    target_week_start: str  # YYYY-MM-DD
    overwrite_existing: bool = False

class MonthlyMealPlanCopy(BaseModel):
    source_month: str  # YYYY-MM
    target_month: str  # YYYY-MM
    overwrite_existing: bool = False

class DateRangeQuery(BaseModel):
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD

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
    # Validate required fields with detailed error messages
    if not meal_input.name or not meal_input.name.strip():
        raise HTTPException(status_code=422, detail="Meal name is required and cannot be empty")
    if not meal_input.ingredients or len(meal_input.ingredients) == 0:
        raise HTTPException(status_code=422, detail="At least one ingredient is required")
    
    # Check if ingredients list contains only empty strings
    valid_ingredients = [ing.strip() for ing in meal_input.ingredients if ing.strip()]
    if len(valid_ingredients) == 0:
        raise HTTPException(status_code=422, detail="At least one valid ingredient is required")
    
    # Recipe is optional but if provided should not be empty
    if meal_input.recipe and not meal_input.recipe.strip():
        raise HTTPException(status_code=422, detail="Recipe cannot be empty if provided")
    
    # Update ingredient usage counts
    for ingredient_name in valid_ingredients:
        try:
            await create_or_increment_ingredient(IngredientCreate(name=ingredient_name))
        except Exception as e:
            logger.warning(f"Failed to update ingredient usage for '{ingredient_name}': {str(e)}")
    
    meal_dict = meal_input.dict()
    # Update ingredients to only include non-empty ones
    meal_dict['ingredients'] = valid_ingredients
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
    
    # Validate required fields with detailed error messages  
    if not meal_input.name or not meal_input.name.strip():
        raise HTTPException(status_code=422, detail="Meal name is required and cannot be empty")
    if not meal_input.ingredients or len(meal_input.ingredients) == 0:
        raise HTTPException(status_code=422, detail="At least one ingredient is required")
    
    # Check if ingredients list contains only empty strings
    valid_ingredients = [ing.strip() for ing in meal_input.ingredients if ing.strip()]
    if len(valid_ingredients) == 0:
        raise HTTPException(status_code=422, detail="At least one valid ingredient is required")
    
    # Recipe is optional but if provided should not be empty
    if meal_input.recipe and not meal_input.recipe.strip():
        raise HTTPException(status_code=422, detail="Recipe cannot be empty if provided")
    
    meal_dict = meal_input.dict()
    # Update ingredients to only include non-empty ones
    meal_dict['ingredients'] = valid_ingredients
    updated_meal = Meal(id=meal_id, **meal_dict)
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

# Ingredient endpoints
@api_router.post("/ingredients/search", response_model=List[Ingredient])
async def search_ingredients(search: IngredientSearch):
    """Search for ingredients based on query"""
    try:
        # Create a case-insensitive regex pattern
        pattern = {"$regex": search.query.strip(), "$options": "i"}
        
        # Search in ingredients collection
        query = {"name": pattern}
        
        # Sort by usage_count (descending) and then by name
        ingredients = await db.ingredients.find(query).sort([
            ("usage_count", -1),  # Most used first
            ("is_common", -1),    # Common ingredients first for equal usage
            ("name", 1)           # Alphabetical for same usage/common status
        ]).limit(search.limit).to_list(search.limit)
        
        return [Ingredient(**parse_from_mongo(ingredient)) for ingredient in ingredients]
        
    except Exception as e:
        logger.error(f"Failed to search ingredients: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search ingredients")

@api_router.post("/ingredients", response_model=Ingredient)
async def create_or_increment_ingredient(ingredient_input: IngredientCreate):
    """Create a new ingredient or increment usage count if it exists"""
    try:
        # Validate ingredient name
        if not ingredient_input.name or not ingredient_input.name.strip():
            raise HTTPException(status_code=422, detail="Ingredient name is required")
        
        ingredient_name = ingredient_input.name.strip().title()  # Normalize name
        
        # Check if ingredient already exists (case-insensitive)
        existing = await db.ingredients.find_one({
            "name": {"$regex": f"^{ingredient_name}$", "$options": "i"}
        })
        
        if existing:
            # Increment usage count
            await db.ingredients.update_one(
                {"id": existing["id"]},
                {"$inc": {"usage_count": 1}}
            )
            existing["usage_count"] += 1
            return Ingredient(**parse_from_mongo(existing))
        else:
            # Create new ingredient
            new_ingredient = Ingredient(
                name=ingredient_name,
                category=ingredient_input.category,
                is_common=False,
                usage_count=1
            )
            
            ingredient_data = prepare_for_mongo(new_ingredient.dict())
            await db.ingredients.insert_one(ingredient_data)
            return new_ingredient
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create/increment ingredient: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create ingredient")

@api_router.get("/ingredients/popular", response_model=List[Ingredient])
async def get_popular_ingredients(limit: int = 20):
    """Get most popular/frequently used ingredients"""
    try:
        ingredients = await db.ingredients.find().sort([
            ("usage_count", -1),
            ("is_common", -1),
            ("name", 1)
        ]).limit(limit).to_list(limit)
        
        return [Ingredient(**parse_from_mongo(ingredient)) for ingredient in ingredients]
        
    except Exception as e:
        logger.error(f"Failed to get popular ingredients: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get popular ingredients")

@api_router.post("/ingredients/seed")
async def seed_common_ingredients():
    """Seed the database with common ingredients (admin function)"""
    try:
        seeded_count = 0
        
        for ingredient_name in COMMON_INGREDIENTS:
            # Check if ingredient already exists
            existing = await db.ingredients.find_one({
                "name": {"$regex": f"^{ingredient_name}$", "$options": "i"}
            })
            
            if not existing:
                # Categorize ingredients (simple categorization)
                category = None
                if ingredient_name.lower() in ["salt", "black pepper", "cumin", "paprika", "oregano", "thyme", "basil", "parsley", "bay leaves", "ginger"]:
                    category = "spice"
                elif ingredient_name.lower() in ["chicken breast", "ground beef", "salmon", "shrimp", "tuna", "cod", "beef steak", "pork chops", "bacon", "ham"]:
                    category = "protein"
                elif ingredient_name.lower() in ["carrots", "potatoes", "bell peppers", "mushrooms", "spinach", "broccoli", "lettuce", "cucumber", "green beans", "zucchini", "eggplant", "corn", "peas", "celery", "avocado"]:
                    category = "vegetable"
                elif ingredient_name.lower() in ["milk", "butter", "cheese", "heavy cream", "yogurt", "parmesan cheese", "mozzarella cheese", "cheddar cheese"]:
                    category = "dairy"
                elif ingredient_name.lower() in ["apples", "bananas", "strawberries", "blueberries", "oranges", "lemons", "limes"]:
                    category = "fruit"
                elif ingredient_name.lower() in ["flour", "sugar", "rice", "pasta", "bread", "brown sugar"]:
                    category = "grain"
                elif ingredient_name.lower() in ["olive oil", "coconut oil", "sesame oil"]:
                    category = "oil"
                elif ingredient_name.lower() in ["chicken stock", "vegetable stock", "soy sauce", "vinegar", "honey"]:
                    category = "condiment"
                elif ingredient_name.lower() in ["almonds", "walnuts", "pine nuts", "cashews", "peanuts"]:
                    category = "nut"
                
                ingredient = Ingredient(
                    name=ingredient_name,
                    category=category,
                    is_common=True,
                    usage_count=0
                )
                
                ingredient_data = prepare_for_mongo(ingredient.dict())
                await db.ingredients.insert_one(ingredient_data)
                seeded_count += 1
        
        return {"message": f"Seeded {seeded_count} common ingredients"}
        
    except Exception as e:
        logger.error(f"Failed to seed ingredients: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to seed ingredients")

# Grocery List endpoints
@api_router.post("/grocery-lists", response_model=GroceryList)
async def create_grocery_list(grocery_list_input: GroceryListCreate):
    """Create a new grocery list, optionally auto-populated from meal plans"""
    try:
        grocery_list = GroceryList(
            name=grocery_list_input.name,
            week_start_date=grocery_list_input.week_start_date
        )
        
        if grocery_list_input.auto_generate:
            # Get meal plans for the week
            from datetime import datetime, timedelta
            start_date = datetime.fromisoformat(grocery_list_input.week_start_date).date()
            end_date = start_date + timedelta(days=6)
            
            # Fetch meal plans for the week
            meal_plans = await db.meal_plans.find({
                "date": {
                    "$gte": start_date.isoformat(),
                    "$lte": end_date.isoformat()
                }
            }).to_list(1000)
            
            # Collect all meal IDs from the week
            meal_ids = set()
            for plan in meal_plans:
                for slot in ['breakfast', 'morning_snack', 'lunch', 'dinner', 'evening_snack']:
                    if plan.get(slot):
                        meal_ids.add(plan[slot])
            
            # Get all meals for the week
            meals = await db.meals.find({"id": {"$in": list(meal_ids)}}).to_list(1000)
            
            # Collect all ingredients with categorization
            ingredient_count = {}
            for meal in meals:
                for ingredient_name in meal.get('ingredients', []):
                    # Find ingredient category from ingredients database
                    ingredient_doc = await db.ingredients.find_one({
                        "name": {"$regex": f"^{ingredient_name}$", "$options": "i"}
                    })
                    
                    category = "other"
                    if ingredient_doc:
                        category = ingredient_doc.get('category', 'other')
                    
                    # Count occurrences and group by category
                    key = (ingredient_name, category)
                    if key not in ingredient_count:
                        ingredient_count[key] = {
                            'count': 0,
                            'recipes': []
                        }
                    ingredient_count[key]['count'] += 1
                    ingredient_count[key]['recipes'].append(meal.get('name', 'Unknown Recipe'))
            
            # Create grocery items from ingredients
            for (ingredient_name, category), data in ingredient_count.items():
                quantity_note = f"Used in {data['count']} recipe{'s' if data['count'] > 1 else ''}"
                recipe_note = f"For: {', '.join(set(data['recipes'][:3]))}"  # Show max 3 recipes
                if len(data['recipes']) > 3:
                    recipe_note += f" +{len(data['recipes']) - 3} more"
                
                grocery_item = GroceryItem(
                    name=ingredient_name,
                    category=category if category != 'other' else categorize_ingredient(ingredient_name),
                    quantity=quantity_note if data['count'] > 1 else None,
                    notes=recipe_note,
                    from_recipe="auto_generated"
                )
                grocery_list.items.append(grocery_item)
        
        # Sort items by category for better organization
        category_order = ["produce", "dairy", "protein", "grain", "spice", "condiment", "oil", "fruit", "nut", "other"]
        grocery_list.items.sort(key=lambda x: (
            category_order.index(x.category) if x.category in category_order else len(category_order),
            x.name.lower()
        ))
        
        # Save to database
        grocery_data = prepare_for_mongo(grocery_list.dict())
        await db.grocery_lists.insert_one(grocery_data)
        
        return grocery_list
        
    except Exception as e:
        logger.error(f"Failed to create grocery list: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create grocery list")

@api_router.get("/grocery-lists", response_model=List[GroceryList])
async def get_grocery_lists():
    """Get all grocery lists"""
    try:
        grocery_lists = await db.grocery_lists.find().sort("created_at", -1).to_list(1000)
        return [GroceryList(**parse_from_mongo(gl)) for gl in grocery_lists]
    except Exception as e:
        logger.error(f"Failed to get grocery lists: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get grocery lists")

@api_router.get("/grocery-lists/{list_id}", response_model=GroceryList)
async def get_grocery_list(list_id: str):
    """Get a specific grocery list"""
    try:
        grocery_list = await db.grocery_lists.find_one({"id": list_id})
        if not grocery_list:
            raise HTTPException(status_code=404, detail="Grocery list not found")
        return GroceryList(**parse_from_mongo(grocery_list))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get grocery list: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get grocery list")

@api_router.put("/grocery-lists/{list_id}/items/{item_id}", response_model=GroceryList)
async def update_grocery_item(list_id: str, item_id: str, item_update: GroceryItemUpdate):
    """Update a specific grocery item"""
    try:
        grocery_list = await db.grocery_lists.find_one({"id": list_id})
        if not grocery_list:
            raise HTTPException(status_code=404, detail="Grocery list not found")
        
        # Find and update the item
        items = grocery_list.get('items', [])
        item_found = False
        for item in items:
            if item.get('id') == item_id:
                # Update item fields
                if item_update.name is not None:
                    item['name'] = item_update.name
                if item_update.category is not None:
                    item['category'] = item_update.category
                if item_update.is_checked is not None:
                    item['is_checked'] = item_update.is_checked
                if item_update.quantity is not None:
                    item['quantity'] = item_update.quantity
                if item_update.notes is not None:
                    item['notes'] = item_update.notes
                item_found = True
                break
        
        if not item_found:
            raise HTTPException(status_code=404, detail="Grocery item not found")
        
        # Update last_updated timestamp
        grocery_list['last_updated'] = datetime.now(timezone.utc).isoformat()
        
        # Save to database
        await db.grocery_lists.replace_one({"id": list_id}, prepare_for_mongo(grocery_list))
        
        return GroceryList(**parse_from_mongo(grocery_list))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update grocery item: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update grocery item")

@api_router.post("/grocery-lists/{list_id}/items", response_model=GroceryList)
async def add_grocery_item(list_id: str, item_input: GroceryItemCreate):
    """Add a new item to grocery list"""
    try:
        grocery_list = await db.grocery_lists.find_one({"id": list_id})
        if not grocery_list:
            raise HTTPException(status_code=404, detail="Grocery list not found")
        
        # Create new grocery item
        new_item = GroceryItem(
            name=item_input.name,
            category=item_input.category or categorize_ingredient(item_input.name),
            quantity=item_input.quantity,
            notes=item_input.notes,
            added_by="user"
        )
        
        # Add to items list
        if 'items' not in grocery_list:
            grocery_list['items'] = []
        grocery_list['items'].append(prepare_for_mongo(new_item.dict()))
        
        # Update last_updated timestamp
        grocery_list['last_updated'] = datetime.now(timezone.utc).isoformat()
        
        # Save to database
        await db.grocery_lists.replace_one({"id": list_id}, prepare_for_mongo(grocery_list))
        
        return GroceryList(**parse_from_mongo(grocery_list))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to add grocery item: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add grocery item")

@api_router.delete("/grocery-lists/{list_id}/items/{item_id}", response_model=GroceryList)
async def delete_grocery_item(list_id: str, item_id: str):
    """Delete a grocery item"""
    try:
        grocery_list = await db.grocery_lists.find_one({"id": list_id})
        if not grocery_list:
            raise HTTPException(status_code=404, detail="Grocery list not found")
        
        # Filter out the item to delete
        items = grocery_list.get('items', [])
        grocery_list['items'] = [item for item in items if item.get('id') != item_id]
        
        # Update last_updated timestamp
        grocery_list['last_updated'] = datetime.now(timezone.utc).isoformat()
        
        # Save to database
        await db.grocery_lists.replace_one({"id": list_id}, prepare_for_mongo(grocery_list))
        
        return GroceryList(**parse_from_mongo(grocery_list))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete grocery item: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete grocery item")

def categorize_ingredient(ingredient_name: str) -> str:
    """Helper function to categorize ingredients"""
    name_lower = ingredient_name.lower()
    
    if any(word in name_lower for word in ["tomato", "lettuce", "spinach", "carrot", "pepper", "onion", "garlic", "cucumber", "broccoli", "celery", "mushroom", "avocado", "potato"]):
        return "produce"
    elif any(word in name_lower for word in ["milk", "cheese", "butter", "cream", "yogurt"]):
        return "dairy"
    elif any(word in name_lower for word in ["chicken", "beef", "pork", "fish", "salmon", "shrimp", "egg"]):
        return "protein"
    elif any(word in name_lower for word in ["flour", "rice", "pasta", "bread", "oat", "quinoa"]):
        return "grain"
    elif any(word in name_lower for word in ["salt", "pepper", "basil", "oregano", "thyme", "cumin", "paprika"]):
        return "spice"
    elif any(word in name_lower for word in ["oil", "vinegar", "sauce", "stock"]):
        return "condiment"
    elif any(word in name_lower for word in ["apple", "banana", "berry", "orange", "lemon", "lime"]):
        return "fruit"
    else:
        return "other"

@api_router.post("/suggest-recipe", response_model=AIRecipeSuggestion)
async def suggest_recipe_with_ai(request: RecipeSuggestionRequest):
    """Generate AI recipe suggestions based on user prompt"""
    try:
        # Validate required prompt
        if not request.prompt or not request.prompt.strip():
            raise HTTPException(status_code=422, detail="Recipe prompt is required and cannot be empty")
            
        # Get the API key from environment
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        # Initialize the LLM chat
        chat = LlmChat(
            api_key=api_key,
            session_id=f"recipe-suggestion-{uuid.uuid4()}",
            system_message="""You are a professional chef and recipe creator. Generate detailed, practical recipes based on user requests. 

Your response must be a valid JSON object with the following structure:
{
    "name": "Recipe Name",
    "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"],
    "recipe": "Step-by-step cooking instructions...",
    "suggested_family_preferences": ["dad", "mom", "brother", "sister", "baby", "grandpa", "grandma"],
    "cuisine_type": "Italian/Asian/Mexican/American/etc or null",
    "difficulty_level": "easy/medium/hard",
    "cooking_time": "X minutes/hours"
}

Guidelines:
1. Create realistic, achievable recipes
2. Provide clear step-by-step instructions
3. Suggest family preferences based on typical appeal (kids usually like simpler foods, adults might enjoy more complex flavors)
4. Include appropriate difficulty and time estimates
5. Make ingredients specific and measurable
6. Only respond with valid JSON, no additional text
7. ALWAYS include at least 3 ingredients and detailed cooking instructions
8. Recipe name must be descriptive and not empty"""
        ).with_model("openai", "gpt-4o-mini")
        
        # Build the prompt based on request
        prompt_parts = [f"Create a recipe for: {request.prompt.strip()}"]
        
        if request.dietary_preferences:
            prompt_parts.append(f"Dietary requirements: {', '.join(request.dietary_preferences)}")
            
        if request.cuisine_type:
            prompt_parts.append(f"Cuisine style: {request.cuisine_type}")
            
        if request.difficulty_level:
            prompt_parts.append(f"Difficulty level: {request.difficulty_level}")
        
        full_prompt = ". ".join(prompt_parts)
        
        # Create user message
        user_message = UserMessage(text=full_prompt)
        
        # Get AI response
        response = await chat.send_message(user_message)
        
        # Parse the JSON response
        try:
            recipe_data = json.loads(response)
            
            # Validate AI response has required fields
            if not recipe_data.get('name') or not recipe_data.get('name').strip():
                raise HTTPException(status_code=500, detail="AI generated recipe without a valid name")
            if not recipe_data.get('ingredients') or len(recipe_data.get('ingredients', [])) == 0:
                raise HTTPException(status_code=500, detail="AI generated recipe without ingredients")
            
            return AIRecipeSuggestion(**recipe_data)
        except json.JSONDecodeError as e:
            # If JSON parsing fails, try to extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                recipe_data = json.loads(json_match.group())
                
                # Validate extracted response
                if not recipe_data.get('name') or not recipe_data.get('name').strip():
                    raise HTTPException(status_code=500, detail="AI generated recipe without a valid name")
                if not recipe_data.get('ingredients') or len(recipe_data.get('ingredients', [])) == 0:
                    raise HTTPException(status_code=500, detail="AI generated recipe without ingredients")
                    
                return AIRecipeSuggestion(**recipe_data)
            else:
                raise HTTPException(status_code=500, detail="Failed to parse AI response")
                
    except HTTPException:
        raise  # Re-raise validation errors
    except Exception as e:
        logger.error(f"AI recipe suggestion error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recipe suggestion: {str(e)}")

@api_router.post("/create-meal-from-suggestion", response_model=Meal)
async def create_meal_from_ai_suggestion(suggestion: AIRecipeSuggestion):
    """Create a meal from AI recipe suggestion"""
    try:
        # Validate required fields with detailed error messages
        if not suggestion.name or not suggestion.name.strip():
            raise HTTPException(status_code=422, detail="Meal name is required and cannot be empty")
        if not suggestion.ingredients or len(suggestion.ingredients) == 0:
            raise HTTPException(status_code=422, detail="At least one ingredient is required")
            
        # Check if ingredients list contains only empty strings
        valid_ingredients = [ing.strip() for ing in suggestion.ingredients if ing.strip()]
        if len(valid_ingredients) == 0:
            raise HTTPException(status_code=422, detail="At least one valid ingredient is required")
            
        # Recipe is optional but if provided should not be empty
        if suggestion.recipe and not suggestion.recipe.strip():
            raise HTTPException(status_code=422, detail="Recipe cannot be empty if provided")
        
        # Create meal from AI suggestion with validated ingredients
        meal_obj = Meal(
            name=suggestion.name.strip(),
            ingredients=valid_ingredients,
            recipe=suggestion.recipe.strip() if suggestion.recipe else "",
            family_preferences=suggestion.suggested_family_preferences or []
        )
        
        meal_data = prepare_for_mongo(meal_obj.dict())
        await db.meals.insert_one(meal_data)
        return meal_obj
        
    except HTTPException:
        raise  # Re-raise validation errors
    except Exception as e:
        logger.error(f"Failed to create meal from suggestion: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create meal from suggestion")

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