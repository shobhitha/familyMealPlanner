import React, { useState, useEffect } from "react";
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Edit2, Trash2, ChefHat, Sparkles, Loader2 } from 'lucide-react';
import axios from "axios";
import "./App.css";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { toast, Toaster } from "./components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Days of the week
const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' }, 
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

// Meal slots
const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { key: 'morning_snack', label: 'Morning Snack', icon: '☕' },
  { key: 'lunch', label: 'Lunch', icon: '🥗' },
  { key: 'dinner', label: 'Dinner', icon: '🍽️' },
  { key: 'evening_snack', label: 'Evening Snack', icon: '🍪' }
];

// Draggable Meal Card Component
function DraggableMealCard({ meal, isDragging = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: meal.id,
    data: { type: 'meal', meal }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`meal-card ${isDragging ? 'dragging' : ''}`}
      data-testid={`meal-card-${meal.id}`}
    >
      <div className="meal-name">{meal.name}</div>
      <div className="meal-ingredients">
        {meal.ingredients.slice(0, 3).join(', ')}
        {meal.ingredients.length > 3 && '...'}
      </div>
      {meal.family_preferences.length > 0 && (
        <div className="family-preferences">
          {meal.family_preferences.map(member => (
            <span key={member} className="family-emoji">
              {getFamilyEmoji(member)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Droppable Meal Slot Component
function DroppableMealSlot({ date, slot, meal, onMealDrop, onRemoveMeal }) {
  const handleDrop = (mealId) => {
    onMealDrop(date, slot.key, mealId);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemoveMeal(date, slot.key);
  };

  return (
    <div 
      className="meal-slot"
      data-testid={`meal-slot-${date}-${slot.key}`}
      onDrop={(e) => {
        e.preventDefault();
        const mealId = e.dataTransfer.getData('text/plain');
        if (mealId) handleDrop(mealId);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="slot-header">
        <span className="slot-icon">{slot.icon}</span>
        <span className="slot-label">{slot.label}</span>
      </div>
      {meal ? (
        <div className="assigned-meal">
          <div className="meal-info">
            <div className="meal-name">{meal.name}</div>
            <div className="meal-ingredients-mini">
              {meal.ingredients.slice(0, 2).join(', ')}
              {meal.ingredients.length > 2 && '...'}
            </div>
          </div>
          {meal.family_preferences.length > 0 && (
            <div className="family-preferences-mini">
              {meal.family_preferences.map(member => (
                <span key={member} className="family-emoji-mini">
                  {getFamilyEmoji(member)}
                </span>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            className="remove-btn"
            data-testid={`remove-meal-${date}-${slot.key}`}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <div className="empty-slot">Drop meal here</div>
      )}
    </div>
  );
}

// Meal Form Component
function MealForm({ meal, onSave, onCancel, familyMembers }) {
  const [formData, setFormData] = useState({
    name: meal?.name || '',
    ingredients: meal?.ingredients?.join('\n') || '',
    recipe: meal?.recipe || '',
    family_preferences: meal?.family_preferences || []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter a meal name");
      return;
    }
    if (!formData.ingredients.trim()) {
      toast.error("Please enter ingredients");
      return;
    }
    if (!formData.recipe.trim()) {
      toast.error("Please enter a recipe");
      return;
    }

    onSave({
      ...formData,
      ingredients: formData.ingredients.split('\n').filter(ing => ing.trim())
    });
  };

  const toggleFamilyPreference = (member) => {
    setFormData(prev => {
      const newPreferences = prev.family_preferences.includes(member)
        ? prev.family_preferences.filter(m => m !== member)
        : [...prev.family_preferences, member];
      return {
        ...prev,
        family_preferences: newPreferences
      };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="meal-form">
      <div className="form-group">
        <Label htmlFor="meal-name">Meal Name</Label>
        <Input
          id="meal-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter meal name"
          data-testid="meal-name-input"
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="ingredients">Ingredients (one per line)</Label>
        <Textarea
          id="ingredients"
          value={formData.ingredients}
          onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
          placeholder="Chicken breast&#10;Olive oil&#10;Salt and pepper"
          rows={4}
          data-testid="ingredients-input"
        />
      </div>

      <div className="form-group">
        <Label htmlFor="recipe">Recipe</Label>
        <Textarea
          id="recipe"
          value={formData.recipe}
          onChange={(e) => setFormData(prev => ({ ...prev, recipe: e.target.value }))}
          placeholder="Detailed cooking instructions..."
          rows={6}
          data-testid="recipe-input"
        />
      </div>

      <div className="form-group">
        <Label>Family Preferences</Label>
        <div className="family-selector">
          {Object.entries(familyMembers).map(([key, emoji]) => (
            <button
              key={key}
              type="button"
              className={`family-button ${formData.family_preferences.includes(key) ? 'selected' : ''}`}
              onClick={() => toggleFamilyPreference(key)}
              data-testid={`family-${key}-button`}
            >
              <span className="family-emoji">{emoji}</span>
              <span className="family-label">{key}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" data-testid="save-meal-button">
          {meal ? 'Update Meal' : 'Create Meal'}
        </Button>
      </div>
    </form>
  );
}

// Helper function to get family emoji
function getFamilyEmoji(member) {
  const familyMap = {
    'dad': '👨‍💼',
    'mom': '👩‍💼',
    'brother': '👦',
    'sister': '👧',
    'baby': '👶',
    'grandpa': '👴',
    'grandma': '👵'
  };
  return familyMap[member] || '👤';
}

// Get current week dates
function getCurrentWeekDates() {
  const today = new Date();
  const monday = new Date(today);
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDates.push(date.toISOString().split('T')[0]);
  }
  
  return weekDates;
}

// Main App Component
function App() {
  const [meals, setMeals] = useState([]);
  const [mealPlans, setMealPlans] = useState({});
  const [familyMembers, setFamilyMembers] = useState({});
  const [isCreateMealOpen, setIsCreateMealOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [weekDates, setWeekDates] = useState(getCurrentWeekDates());
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load meals, meal plans, and family members
      const [mealsRes, plansRes, familyRes] = await Promise.all([
        axios.get(`${API}/meals`),
        axios.get(`${API}/meal-plans?week_start=${weekDates[0]}`),
        axios.get(`${API}/family-members`)
      ]);

      setMeals(mealsRes.data);
      setFamilyMembers(familyRes.data);
      
      // Convert meal plans array to object keyed by date
      const plansObj = {};
      plansRes.data.forEach(plan => {
        plansObj[plan.date] = plan;
      });
      setMealPlans(plansObj);

    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeal = async (mealData) => {
    try {
      const response = await axios.post(`${API}/meals`, mealData);
      setMeals(prev => [...prev, response.data]);
      setIsCreateMealOpen(false);
      toast.success('Meal created successfully!');
    } catch (error) {
      console.error('Failed to create meal:', error);
      toast.error('Failed to create meal');
    }
  };

  const handleUpdateMeal = async (mealData) => {
    try {
      const response = await axios.put(`${API}/meals/${editingMeal.id}`, mealData);
      setMeals(prev => prev.map(meal => 
        meal.id === editingMeal.id ? response.data : meal
      ));
      setEditingMeal(null);
      toast.success('Meal updated successfully!');
    } catch (error) {
      console.error('Failed to update meal:', error);
      toast.error('Failed to update meal');
    }
  };

  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm('Are you sure you want to delete this meal?')) return;
    
    try {
      await axios.delete(`${API}/meals/${mealId}`);
      setMeals(prev => prev.filter(meal => meal.id !== mealId));
      toast.success('Meal deleted successfully!');
    } catch (error) {
      console.error('Failed to delete meal:', error);
      toast.error('Failed to delete meal');
    }
  };

  const handleMealDrop = async (date, slot, mealId) => {
    try {
      await axios.put(`${API}/meal-plans/${date}`, {
        meal_slot: slot,
        meal_id: mealId
      });
      
      // Update local state
      setMealPlans(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          [slot]: mealId
        }
      }));
      
      toast.success('Meal assigned successfully!');
    } catch (error) {
      console.error('Failed to update meal plan:', error);
      toast.error('Failed to assign meal');
    }
  };

  const handleRemoveMeal = async (date, slot) => {
    try {
      await axios.put(`${API}/meal-plans/${date}`, {
        meal_slot: slot,
        meal_id: null
      });
      
      // Update local state
      setMealPlans(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          [slot]: null
        }
      }));
      
      toast.success('Meal removed successfully!');
    } catch (error) {
      console.error('Failed to remove meal:', error);
      toast.error('Failed to remove meal');
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    
    const { active, over } = event;
    if (!over) return;

    // Check if dropping on a meal slot
    if (over.id.includes('slot-')) {
      const [, date, slot] = over.id.split('-');
      handleMealDrop(date, slot, active.id);
    }
  };

  const getMealById = (mealId) => {
    return meals.find(meal => meal.id === mealId);
  };

  const getAssignedMeal = (date, slot) => {
    const plan = mealPlans[date];
    if (!plan || !plan[slot]) return null;
    return getMealById(plan[slot]);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <ChefHat className="w-8 h-8 animate-spin" />
        <p>Loading your meal planner...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Toaster richColors position="top-right" />
      
      <div className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <ChefHat className="w-8 h-8" />
            Family Meal Planner
          </h1>
          <Dialog open={isCreateMealOpen} onOpenChange={setIsCreateMealOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-meal-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Meal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Meal</DialogTitle>
              </DialogHeader>
              <MealForm
                familyMembers={familyMembers}
                onSave={handleCreateMeal}
                onCancel={() => setIsCreateMealOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="app-content">
        <DndContext 
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Meals Sidebar */}
          <div className="meals-sidebar">
            <h2>Available Meals</h2>
            <div className="meals-list" data-testid="meals-list">
              <SortableContext items={meals.map(m => m.id)}>
                {meals.map(meal => (
                  <div key={meal.id} className="meal-item">
                    <DraggableMealCard meal={meal} />
                    <div className="meal-actions">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingMeal(meal)}
                        data-testid={`edit-meal-${meal.id}`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMeal(meal.id)}
                        data-testid={`delete-meal-${meal.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </SortableContext>
            </div>
          </div>

          {/* Weekly Planner */}
          <div className="weekly-planner">
            <h2>Weekly Meal Plan</h2>
            <div className="week-grid" data-testid="week-grid">
              {DAYS.map((day, dayIndex) => (
                <div key={day.key} className="day-column">
                  <div className="day-header">
                    <h3>{day.label}</h3>
                    <span className="day-date">
                      {new Date(weekDates[dayIndex]).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="meal-slots">
                    {MEAL_SLOTS.map(slot => (
                      <DroppableMealSlot
                        key={`${weekDates[dayIndex]}-${slot.key}`}
                        date={weekDates[dayIndex]}
                        slot={slot}
                        meal={getAssignedMeal(weekDates[dayIndex], slot.key)}
                        onMealDrop={handleMealDrop}
                        onRemoveMeal={handleRemoveMeal}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeId ? (
              <DraggableMealCard 
                meal={getMealById(activeId)} 
                isDragging={true}
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Edit Meal Dialog */}
        <Dialog open={editingMeal !== null} onOpenChange={(open) => !open && setEditingMeal(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Meal</DialogTitle>
            </DialogHeader>
            {editingMeal && (
              <MealForm
                meal={editingMeal}
                familyMembers={familyMembers}
                onSave={handleUpdateMeal}
                onCancel={() => setEditingMeal(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;