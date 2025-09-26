import React, { useState, useEffect } from "react";
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Edit2, Trash2, ChefHat, Sparkles, Loader2, X, Search, ShoppingCart, Share2, Check, Users, ChevronLeft, ChevronRight, Copy, Calendar, Clock, CalendarDays, Filter, Table } from 'lucide-react';
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
import { Checkbox } from "./components/ui/checkbox";
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

// Calendar Components
function YearCalendar({ selectedDate, onDateSelect, mealPlans, currentYear, onYearChange }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDateKey = (year, month, day) => {
    const date = new Date(year, month, day);
    return date.toISOString().split('T')[0];
  };

  const hasMealPlan = (dateKey) => {
    const plan = mealPlans[dateKey];
    return plan && (plan.breakfast || plan.morning_snack || plan.lunch || plan.dinner || plan.evening_snack);
  };

  const getMealCount = (dateKey) => {
    const plan = mealPlans[dateKey];
    if (!plan) return 0;
    let count = 0;
    if (plan.breakfast) count++;
    if (plan.morning_snack) count++;
    if (plan.lunch) count++;
    if (plan.dinner) count++;
    if (plan.evening_snack) count++;
    return count;
  };

  const renderCalendarMonth = (monthIndex) => {
    const daysInMonth = getDaysInMonth(currentYear, monthIndex);
    const firstDay = getFirstDayOfMonth(currentYear, monthIndex);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(currentYear, monthIndex, day);
      const isSelected = dateKey === selectedDate;
      const hasPlans = hasMealPlan(dateKey);
      const mealCount = getMealCount(dateKey);
      const isToday = dateKey === new Date().toISOString().split('T')[0];

      days.push(
        <div
          key={day}
          className={`calendar-day ${isSelected ? 'selected' : ''} ${hasPlans ? 'has-meals' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => onDateSelect(dateKey)}
          data-testid={`calendar-day-${dateKey}`}
        >
          <span className="day-number">{day}</span>
          {hasPlans && (
            <div className="meal-indicators">
              <Badge variant="secondary" className="meal-count">
                {mealCount}
              </Badge>
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={monthIndex} className="calendar-month">
        <h3 className="month-title">{months[monthIndex]}</h3>
        <div className="calendar-grid">
          <div className="calendar-header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}
          </div>
          <div className="calendar-days">
            {days}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="year-calendar">
      <div className="calendar-nav">
        <Button
          variant="outline"
          onClick={() => onYearChange(currentYear - 1)}
          data-testid="prev-year"
        >
          <ChevronLeft className="w-4 h-4" />
          {currentYear - 1}
        </Button>
        <h2 className="calendar-year">{currentYear}</h2>
        <Button
          variant="outline"
          onClick={() => onYearChange(currentYear + 1)}
          data-testid="next-year"
        >
          {currentYear + 1}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="calendar-months">
        {months.map((_, index) => renderCalendarMonth(index))}
      </div>
    </div>
  );
}

function DayDetailModal({ selectedDate, mealPlan, meals, onClose, onMealAssign, onMealRemove, familyMembers }) {
  if (!selectedDate) return null;

  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMealById = (mealId) => {
    return meals.find(meal => meal.id === mealId);
  };

  const MEAL_SLOTS = [
    { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { key: 'morning_snack', label: 'Morning Snack', icon: '☕' },
    { key: 'lunch', label: 'Lunch', icon: '🥗' },
    { key: 'dinner', label: 'Dinner', icon: '🍽️' },
    { key: 'evening_snack', label: 'Evening Snack', icon: '🍪' }
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {formatDateDisplay(selectedDate)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="day-detail-content">
          {MEAL_SLOTS.map(slot => {
            const assignedMealId = mealPlan?.[slot.key];
            const assignedMeal = assignedMealId ? getMealById(assignedMealId) : null;

            return (
              <div key={slot.key} className="meal-slot-detail">
                <div className="slot-header">
                  <span className="slot-icon">{slot.icon}</span>
                  <h4>{slot.label}</h4>
                </div>
                
                {assignedMeal ? (
                  <div className="assigned-meal-detail">
                    <div className="meal-info">
                      <h5>{assignedMeal.name}</h5>
                      <div className="meal-ingredients">
                        {assignedMeal.ingredients.slice(0, 3).join(', ')}
                        {assignedMeal.ingredients.length > 3 && '...'}
                      </div>
                      {assignedMeal.family_preferences.length > 0 && (
                        <div className="family-preferences">
                          {assignedMeal.family_preferences.map(member => (
                            <span key={member} className="family-emoji">
                              {getFamilyEmoji(member)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMealRemove(selectedDate, slot.key)}
                      data-testid={`remove-${slot.key}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="empty-meal-slot">
                    <Select onValueChange={(mealId) => onMealAssign(selectedDate, slot.key, mealId)}>
                      <SelectTrigger data-testid={`assign-${slot.key}`}>
                        <SelectValue placeholder="Select a meal..." />
                      </SelectTrigger>
                      <SelectContent>
                        {meals.map(meal => (
                          <SelectItem key={meal.id} value={meal.id}>
                            <div className="meal-option">
                              <span>{meal.name}</span>
                              {meal.family_preferences.length > 0 && (
                                <div className="meal-option-emojis">
                                  {meal.family_preferences.slice(0, 3).map(member => (
                                    <span key={member}>{getFamilyEmoji(member)}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DateRangeFilter({ onFilterApply, onViewChange, currentView }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const handleApplyFilter = () => {
    if (!fromDate || !toDate) {
      toast.error('Please select both from and to dates');
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      toast.error('From date must be before to date');
      return;
    }
    onFilterApply(fromDate, toDate);
  };

  const handleClearFilter = () => {
    setFromDate('');
    setToDate('');
    onFilterApply(null, null);
  };

  return (
    <div className="date-range-filter">
      <div className="view-toggle">
        <Button
          variant={currentView === 'calendar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewChange('calendar')}
          data-testid="calendar-view"
        >
          <CalendarDays className="w-4 h-4 mr-2" />
          Calendar
        </Button>
        <Button
          variant={currentView === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewChange('table')}
          data-testid="table-view"
        >
          <Table className="w-4 h-4 mr-2" />
          Table
        </Button>
      </div>

      {currentView === 'table' && (
        <div className="filter-controls">
          <div className="date-inputs">
            <div className="date-input-group">
              <Label>From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                data-testid="from-date"
              />
            </div>
            <div className="date-input-group">
              <Label>To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                data-testid="to-date"
              />
            </div>
          </div>
          <div className="filter-actions">
            <Button
              onClick={handleApplyFilter}
              disabled={!fromDate || !toDate}
              data-testid="apply-filter"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filter
            </Button>
            <Button
              variant="outline"
              onClick={handleClearFilter}
              data-testid="clear-filter"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TableMealPlanView({ mealPlans, meals, fromDate, toDate }) {
  const getMealById = (mealId) => {
    return meals.find(meal => meal.id === mealId);
  };

  const generateDateRange = (start, end) => {
    const dates = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }
    return dates;
  };

  const groupDatesByWeek = (dates) => {
    const weeks = [];
    let currentWeek = [];
    
    dates.forEach(date => {
      const dayOfWeek = new Date(date).getDay();
      
      if (dayOfWeek === 0 && currentWeek.length > 0) { // Sunday, start new week
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentWeek.push(date);
    });
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  if (!fromDate || !toDate) {
    return (
      <div className="table-empty-state">
        <Table className="w-16 h-16 text-orange-300" />
        <h3>Select Date Range</h3>
        <p>Choose from and to dates to view meal plans in table format</p>
      </div>
    );
  }

  const dateRange = generateDateRange(fromDate, toDate);
  const weeks = groupDatesByWeek(dateRange);

  const MEAL_SLOTS = [
    { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { key: 'morning_snack', label: 'Morning Snack', icon: '☕' },
    { key: 'lunch', label: 'Lunch', icon: '🥗' },
    { key: 'dinner', label: 'Dinner', icon: '🍽️' },
    { key: 'evening_snack', label: 'Evening Snack', icon: '🍪' }
  ];

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="table-meal-plan-view">
      <div className="table-header">
        <h3>
          Meal Plans: {new Date(fromDate).toLocaleDateString()} - {new Date(toDate).toLocaleDateString()}
        </h3>
        <p>{dateRange.length} days • {weeks.length} weeks</p>
      </div>

      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="week-table">
          <h4 className="week-title">
            Week {weekIndex + 1}: {new Date(week[0]).toLocaleDateString()} - {new Date(week[week.length - 1]).toLocaleDateString()}
          </h4>
          
          <div className="meal-plan-table">
            <table>
              <thead>
                <tr>
                  <th className="meal-slot-header">Meal</th>
                  {week.map(date => {
                    const dayName = DAYS[new Date(date).getDay()];
                    const dayDate = new Date(date).getDate();
                    return (
                      <th key={date} className="day-header">
                        <div>{dayName}</div>
                        <div className="day-date">{dayDate}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {MEAL_SLOTS.map(slot => (
                  <tr key={slot.key}>
                    <td className="meal-slot-label">
                      <span className="slot-icon">{slot.icon}</span>
                      {slot.label}
                    </td>
                    {week.map(date => {
                      const mealPlan = mealPlans[date];
                      const mealId = mealPlan?.[slot.key];
                      const meal = mealId ? getMealById(mealId) : null;
                      
                      return (
                        <td key={`${date}-${slot.key}`} className="meal-cell">
                          {meal ? (
                            <div className="table-meal">
                              <div className="meal-name">{meal.name}</div>
                              {meal.family_preferences.length > 0 && (
                                <div className="table-family-prefs">
                                  {meal.family_preferences.map(member => (
                                    <span key={member} className="table-family-emoji">
                                      {getFamilyEmoji(member)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="empty-meal-cell">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
function WeekNavigator({ currentWeekStart, onWeekChange, availableWeeks }) {
  const formatWeekDisplay = (weekStartDate) => {
    const date = new Date(weekStartDate);
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 6);
    
    return `${date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })} - ${endDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })}`;
  };

  const navigateWeek = (direction) => {
    const currentDate = new Date(currentWeekStart);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    onWeekChange(newDate.toISOString().split('T')[0]);
  };

  const isCurrentWeek = () => {
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    return currentWeekStart === monday.toISOString().split('T')[0];
  };

  return (
    <div className="week-navigator">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigateWeek(-1)}
        className="nav-button"
        data-testid="prev-week"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>
      
      <div className="week-display">
        <div className="week-date-range">
          {formatWeekDisplay(currentWeekStart)}
        </div>
        {isCurrentWeek() && (
          <Badge variant="secondary" className="current-week-badge">
            This Week
          </Badge>
        )}
        {availableWeeks.includes(currentWeekStart) && (
          <Badge variant="default" className="has-meals-badge">
            <Clock className="w-3 h-3 mr-1" />
            Has Meals
          </Badge>
        )}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigateWeek(1)}
        className="nav-button"
        data-testid="next-week"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

function CopyMealPlanDialog({ currentWeekStart, availableWeeks, onCopyComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyMode, setCopyMode] = useState('week'); // 'week' or 'month'
  const [sourceWeek, setSourceWeek] = useState('');
  const [sourceMonth, setSourceMonth] = useState('');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]);

  useEffect(() => {
    if (isOpen && copyMode === 'month') {
      loadAvailableMonths();
    }
  }, [isOpen, copyMode]);

  const loadAvailableMonths = async () => {
    try {
      const response = await axios.get(`${API}/meal-plans/months-with-plans`);
      setAvailableMonths(response.data);
    } catch (error) {
      console.error('Failed to load available months:', error);
    }
  };

  const handleCopyWeek = async () => {
    if (!sourceWeek) {
      toast.error('Please select a source week');
      return;
    }

    try {
      setCopying(true);
      const response = await axios.post(`${API}/meal-plans/copy-week`, {
        source_week_start: sourceWeek,
        target_week_start: currentWeekStart,
        overwrite_existing: overwriteExisting
      });
      
      toast.success(response.data.message);
      setIsOpen(false);
      onCopyComplete();
    } catch (error) {
      console.error('Failed to copy week:', error);
      toast.error('Failed to copy meal plans');
    } finally {
      setCopying(false);
    }
  };

  const handleCopyMonth = async () => {
    if (!sourceMonth) {
      toast.error('Please select a source month');
      return;
    }

    const currentMonth = currentWeekStart.substring(0, 7); // Get YYYY-MM from current week

    try {
      setCopying(true);
      const response = await axios.post(`${API}/meal-plans/copy-month`, {
        source_month: sourceMonth,
        target_month: currentMonth,
        overwrite_existing: overwriteExisting
      });
      
      toast.success(response.data.message);
      setIsOpen(false);
      onCopyComplete();
    } catch (error) {
      console.error('Failed to copy month:', error);
      toast.error('Failed to copy meal plans');
    } finally {
      setCopying(false);
    }
  };

  const formatWeekOption = (weekStart) => {
    const date = new Date(weekStart);
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 6);
    
    return `${date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })} - ${endDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })}`;
  };

  const formatMonthOption = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="copy-meal-plan-button">
          <Copy className="w-4 h-4 mr-2" />
          Copy Plans
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Copy Meal Plans</DialogTitle>
        </DialogHeader>
        
        <div className="copy-meal-plan-form">
          <div className="copy-mode-selector">
            <Label>Copy From</Label>
            <div className="mode-buttons">
              <Button
                variant={copyMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCopyMode('week')}
                data-testid="copy-mode-week"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Previous Week
              </Button>
              <Button
                variant={copyMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCopyMode('month')}
                data-testid="copy-mode-month"
              >
                <Clock className="w-4 h-4 mr-2" />
                Previous Month
              </Button>
            </div>
          </div>

          {copyMode === 'week' ? (
            <div className="form-group">
              <Label>Select Source Week</Label>
              <Select value={sourceWeek} onValueChange={setSourceWeek}>
                <SelectTrigger data-testid="source-week-select">
                  <SelectValue placeholder="Choose week to copy from..." />
                </SelectTrigger>
                <SelectContent>
                  {availableWeeks
                    .filter(week => week !== currentWeekStart)
                    .map(week => (
                      <SelectItem key={week} value={week}>
                        {formatWeekOption(week)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="form-group">
              <Label>Select Source Month</Label>
              <Select value={sourceMonth} onValueChange={setSourceMonth}>
                <SelectTrigger data-testid="source-month-select">
                  <SelectValue placeholder="Choose month to copy from..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths
                    .filter(month => month !== currentWeekStart.substring(0, 7))
                    .map(month => (
                      <SelectItem key={month} value={month}>
                        {formatMonthOption(month)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="form-group">
            <div className="checkbox-group">
              <Checkbox
                id="overwrite-existing"
                checked={overwriteExisting}
                onCheckedChange={setOverwriteExisting}
                data-testid="overwrite-checkbox"
              />
              <Label htmlFor="overwrite-existing">
                Overwrite existing meal plans
              </Label>
            </div>
            <p className="checkbox-help">
              If unchecked, will only copy to empty days
            </p>
          </div>

          <div className="form-actions">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={copying}
            >
              Cancel
            </Button>
            <Button
              onClick={copyMode === 'week' ? handleCopyWeek : handleCopyMonth}
              disabled={copying || (!sourceWeek && !sourceMonth)}
              data-testid="copy-confirm-button"
            >
              {copying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Copying...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy {copyMode === 'week' ? 'Week' : 'Month'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function GroceryListPage({ weekDates, onBack }) {
  const [groceryLists, setGroceryLists] = useState([]);
  const [currentList, setCurrentList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    loadGroceryLists();
  }, []);

  const loadGroceryLists = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/grocery-lists`);
      setGroceryLists(response.data);
      
      // If there's a list for current week, select it
      const currentWeekList = response.data.find(list => list.week_start_date === weekDates[0]);
      if (currentWeekList) {
        setCurrentList(currentWeekList);
      }
    } catch (error) {
      console.error('Failed to load grocery lists:', error);
      toast.error('Failed to load grocery lists');
    } finally {
      setLoading(false);
    }
  };

  const createWeeklyGroceryList = async () => {
    try {
      setIsCreating(true);
      const response = await axios.post(`${API}/grocery-lists`, {
        name: `Grocery List - Week of ${new Date(weekDates[0]).toLocaleDateString()}`,
        week_start_date: weekDates[0],
        auto_generate: true
      });
      
      setCurrentList(response.data);
      setGroceryLists(prev => [response.data, ...prev]);
      toast.success('Grocery list generated from your meal plan!');
    } catch (error) {
      console.error('Failed to create grocery list:', error);
      toast.error('Failed to create grocery list');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleItemCheck = async (itemId, isChecked) => {
    if (!currentList) return;

    try {
      const response = await axios.put(`${API}/grocery-lists/${currentList.id}/items/${itemId}`, {
        is_checked: isChecked
      });
      
      setCurrentList(response.data);
      
      // Update in the lists array as well
      setGroceryLists(prev => prev.map(list => 
        list.id === currentList.id ? response.data : list
      ));
    } catch (error) {
      console.error('Failed to update grocery item:', error);
      toast.error('Failed to update item');
    }
  };

  const addCustomItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !currentList) return;

    try {
      const response = await axios.post(`${API}/grocery-lists/${currentList.id}/items`, {
        name: newItemName.trim(),
        category: null,
        quantity: null,
        notes: 'Added manually'
      });
      
      setCurrentList(response.data);
      setGroceryLists(prev => prev.map(list => 
        list.id === currentList.id ? response.data : list
      ));
      setNewItemName('');
      toast.success('Item added to grocery list!');
    } catch (error) {
      console.error('Failed to add grocery item:', error);
      toast.error('Failed to add item');
    }
  };

  const deleteItem = async (itemId) => {
    if (!currentList) return;

    try {
      const response = await axios.delete(`${API}/grocery-lists/${currentList.id}/items/${itemId}`);
      
      setCurrentList(response.data);
      setGroceryLists(prev => prev.map(list => 
        list.id === currentList.id ? response.data : list
      ));
      toast.success('Item removed from list');
    } catch (error) {
      console.error('Failed to delete grocery item:', error);
      toast.error('Failed to remove item');
    }
  };

  // Group items by category
  const groupedItems = currentList?.items?.reduce((groups, item) => {
    const category = item.category || 'other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
    return groups;
  }, {}) || {};

  const categoryDisplayNames = {
    produce: '🥬 Produce',
    dairy: '🥛 Dairy',
    protein: '🥩 Meat & Protein',
    grain: '🍞 Grains & Bread',
    spice: '🧂 Spices & Seasonings',
    condiment: '🍯 Condiments & Sauces',
    fruit: '🍎 Fruits',
    other: '📦 Other Items'
  };

  if (loading) {
    return (
      <div className="grocery-loading">
        <ShoppingCart className="w-8 h-8 animate-bounce" />
        <p>Loading your Happy Gut grocery lists...</p>
      </div>
    );
  }

  return (
    <div className="grocery-list-page">
      <div className="grocery-header">
        <div className="grocery-header-content">
          <Button
            variant="outline"
            onClick={onBack}
            className="back-button"
            data-testid="back-to-planner"
          >
            ← Back to Planner
          </Button>
          
          <h1 className="grocery-title">
            <ShoppingCart className="w-8 h-8" />
            Grocery Lists
          </h1>
          
          <div className="grocery-actions">
            {currentList && (
              <Button
                variant="outline"
                onClick={() => setShowShareDialog(true)}
                data-testid="share-list-button"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share List
              </Button>
            )}
            
            {!currentList && (
              <Button
                onClick={createWeeklyGroceryList}
                disabled={isCreating}
                data-testid="create-grocery-list"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Weekly List
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grocery-content">
        {!currentList ? (
          <div className="empty-grocery-state">
            <ShoppingCart className="w-16 h-16 text-orange-300" />
            <h2>No Grocery List Yet</h2>
            <p>Generate a grocery list from your weekly meal plan to get started!</p>
            <Button
              onClick={createWeeklyGroceryList}
              disabled={isCreating}
              size="lg"
              data-testid="empty-state-create"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating List...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Generate Weekly Grocery List
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="grocery-list-container">
            <div className="grocery-list-header">
              <div className="list-info">
                <h2>{currentList.name}</h2>
                <p>{currentList.items?.length || 0} items total • {currentList.items?.filter(item => item.is_checked).length || 0} completed</p>
              </div>
              
              <form onSubmit={addCustomItem} className="add-item-form">
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Add custom item..."
                  className="add-item-input"
                  data-testid="add-item-input"
                />
                <Button type="submit" size="sm" data-testid="add-item-button">
                  <Plus className="w-4 h-4" />
                </Button>
              </form>
            </div>

            <div className="grocery-categories" data-testid="grocery-categories">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="grocery-category">
                  <h3 className="category-header">
                    {categoryDisplayNames[category] || `📦 ${category}`}
                    <Badge variant="secondary" className="item-count">
                      {items.length}
                    </Badge>
                  </h3>
                  
                  <div className="grocery-items">
                    {items.map(item => (
                      <GroceryListItem
                        key={item.id}
                        item={item}
                        onToggleCheck={toggleItemCheck}
                        onDelete={deleteItem}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Grocery List</DialogTitle>
          </DialogHeader>
          <div className="share-options">
            <p>Share "{currentList?.name}" with family members or friends:</p>
            <div className="share-methods">
              <Button variant="outline" className="share-method">
                <Users className="w-4 h-4 mr-2" />
                Invite Collaborators
              </Button>
              <Button variant="outline" className="share-method">
                📱 Copy Link
              </Button>
              <Button variant="outline" className="share-method">
                📧 Email List
              </Button>
            </div>
            <p className="share-note">
              Collaborators can check off items and add new ones in real-time.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GroceryListItem({ item, onToggleCheck, onDelete }) {
  const [isChecked, setIsChecked] = useState(item.is_checked);

  const handleToggle = (checked) => {
    setIsChecked(checked);
    onToggleCheck(item.id, checked);
  };

  return (
    <div className={`grocery-item ${isChecked ? 'checked' : ''}`} data-testid={`grocery-item-${item.id}`}>
      <div className="item-main">
        <Checkbox
          checked={isChecked}
          onCheckedChange={handleToggle}
          className="item-checkbox"
          data-testid={`checkbox-${item.id}`}
        />
        
        <div className="item-details">
          <span className={`item-name ${isChecked ? 'line-through' : ''}`}>
            {item.name}
          </span>
          {item.quantity && (
            <span className="item-quantity">{item.quantity}</span>
          )}
          {item.notes && (
            <span className="item-notes">{item.notes}</span>
          )}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(item.id)}
        className="delete-item-btn"
        data-testid={`delete-item-${item.id}`}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
function IngredientSearchInput({ ingredients, onIngredientsChange, required = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced search function
  useEffect(() => {
    const searchIngredients = async () => {
      if (searchTerm.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        setIsSearching(true);
        const response = await axios.post(`${API}/ingredients/search`, {
          query: searchTerm,
          limit: 10
        });
        setSuggestions(response.data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Failed to search ingredients:', error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchIngredients, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleAddIngredient = async (ingredientName) => {
    const trimmedName = ingredientName.trim();
    if (!trimmedName || ingredients.includes(trimmedName)) return;

    try {
      // Add to backend database and increment usage count
      await axios.post(`${API}/ingredients`, {
        name: trimmedName,
        category: null
      });

      // Add to local ingredient list
      onIngredientsChange([...ingredients, trimmedName]);
      setSearchTerm('');
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Failed to add ingredient:', error);
      // Still add locally even if backend fails
      onIngredientsChange([...ingredients, trimmedName]);
      setSearchTerm('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleRemoveIngredient = (index) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    onIngredientsChange(newIngredients);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleAddIngredient(suggestions[0].name);
      } else if (searchTerm.trim()) {
        handleAddIngredient(searchTerm);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSearchTerm('');
    }
  };

  return (
    <div className="ingredient-search-container">
      <div className="ingredient-search-input-wrapper">
        <div className="search-input-container">
          <Search className="search-icon" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type to search ingredients..."
            className="ingredient-search-input"
            data-testid="ingredient-search-input"
          />
          {isSearching && (
            <Loader2 className="search-loading-icon animate-spin" />
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="ingredient-suggestions" data-testid="ingredient-suggestions">
            {suggestions.map((ingredient) => (
              <button
                key={ingredient.id}
                type="button"
                className="ingredient-suggestion-item"
                onClick={() => handleAddIngredient(ingredient.name)}
                data-testid={`suggestion-${ingredient.name}`}
              >
                <span className="suggestion-name">{ingredient.name}</span>
                {ingredient.category && (
                  <Badge variant="outline" className="suggestion-category">
                    {ingredient.category}
                  </Badge>
                )}
                {ingredient.is_common && (
                  <Badge variant="secondary" className="suggestion-common">
                    Common
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {ingredients.length > 0 && (
        <div className="selected-ingredients">
          <Label>Selected Ingredients ({ingredients.length})</Label>
          <div className="ingredient-tags" data-testid="selected-ingredients">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="ingredient-tag">
                <span>{ingredient}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(index)}
                  className="remove-ingredient-btn"
                  data-testid={`remove-ingredient-${index}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {required && ingredients.length === 0 && (
        <div className="error-message">
          At least one ingredient is required
        </div>
      )}
    </div>
  );
}
function AIRecipeSuggestionForm({ onSuggest, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    prompt: '',
    dietary_preferences: [],
    cuisine_type: '',
    difficulty_level: ''
  });

  const dietaryOptions = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'low-carb', 
    'keto', 'paleo', 'low-sodium', 'high-protein', 'nut-free'
  ];

  const cuisineOptions = [
    'Italian', 'Asian', 'Mexican', 'American', 'Mediterranean', 
    'Indian', 'French', 'Chinese', 'Thai', 'Japanese'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.prompt.trim()) {
      toast.error("Please describe what kind of recipe you want");
      return;
    }
    onSuggest(formData);
  };

  const toggleDietaryPreference = (preference) => {
    setFormData(prev => ({
      ...prev,
      dietary_preferences: prev.dietary_preferences.includes(preference)
        ? prev.dietary_preferences.filter(p => p !== preference)
        : [...prev.dietary_preferences, preference]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="ai-suggestion-form">
      <div className="form-group">
        <Label htmlFor="recipe-prompt">
          What would you like to cook? <span className="required-asterisk">*</span>
        </Label>
        <Textarea
          id="recipe-prompt"
          value={formData.prompt}
          onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
          placeholder="E.g., healthy chicken dinner, quick vegetarian pasta, birthday cake for kids..."
          rows={3}
          data-testid="recipe-prompt-input"
          required
          className={!formData.prompt.trim() ? 'error-border' : ''}
        />
      </div>

      <div className="form-group">
        <Label>Dietary Preferences (optional)</Label>
        <div className="dietary-preferences-grid">
          {dietaryOptions.map(option => (
            <button
              key={option}
              type="button"
              className={`dietary-button ${formData.dietary_preferences.includes(option) ? 'selected' : ''}`}
              onClick={() => toggleDietaryPreference(option)}
              data-testid={`dietary-${option}-button`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <Label htmlFor="cuisine-type">Cuisine Type (optional)</Label>
          <Select 
            value={formData.cuisine_type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, cuisine_type: value }))}
          >
            <SelectTrigger data-testid="cuisine-select">
              <SelectValue placeholder="Select cuisine" />
            </SelectTrigger>
            <SelectContent>
              {cuisineOptions.map(cuisine => (
                <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="form-group">
          <Label htmlFor="difficulty-level">Difficulty (optional)</Label>
          <Select 
            value={formData.difficulty_level} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
          >
            <SelectTrigger data-testid="difficulty-select">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="form-actions">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} data-testid="generate-recipe-button">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Recipe
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// AI Recipe Preview Component
function AIRecipePreview({ suggestion, onAccept, onRegenerate, onCancel, familyMembers }) {
  return (
    <div className="ai-recipe-preview">
      <div className="recipe-header">
        <h3 className="recipe-title">{suggestion.name}</h3>
        {suggestion.cuisine_type && (
          <Badge variant="secondary" className="cuisine-badge">
            {suggestion.cuisine_type}
          </Badge>
        )}
        {suggestion.difficulty_level && (
          <Badge variant="outline" className="difficulty-badge">
            {suggestion.difficulty_level}
          </Badge>
        )}
        {suggestion.cooking_time && (
          <Badge variant="outline" className="time-badge">
            {suggestion.cooking_time}
          </Badge>
        )}
      </div>

      <div className="recipe-content">
        <div className="ingredients-section">
          <h4>Ingredients:</h4>
          <ul className="ingredients-list">
            {suggestion.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>

        <div className="recipe-section">
          <h4>Instructions:</h4>
          <p className="recipe-text">{suggestion.recipe}</p>
        </div>

        {suggestion.suggested_family_preferences.length > 0 && (
          <div className="suggested-preferences">
            <h4>Suggested Family Favorites:</h4>
            <div className="family-emojis">
              {suggestion.suggested_family_preferences.map(member => (
                <span key={member} className="family-emoji-suggestion">
                  {getFamilyEmoji(member)}
                  <span className="emoji-label">{member}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="preview-actions">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="outline" onClick={onRegenerate}>
          <Sparkles className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button onClick={onAccept} data-testid="accept-ai-recipe-button">
          <Plus className="w-4 h-4 mr-2" />
          Add to My Meals
        </Button>
      </div>
    </div>
  );
}

// Meal Form Component  
function MealForm({ meal, onSave, onCancel, familyMembers }) {
  const [formData, setFormData] = useState({
    name: meal?.name || '',
    ingredients: meal?.ingredients || [],
    recipe: meal?.recipe || '',
    family_preferences: meal?.family_preferences || []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    const errors = [];
    if (!formData.name.trim()) {
      errors.push("Meal name is required");
    }
    if (!formData.ingredients || formData.ingredients.length === 0) {
      errors.push("At least one ingredient is required");
    }
    
    // Show error for first validation failure
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    
    // Optional validation for recipe
    if (!formData.recipe.trim()) {
      toast.error("Please enter a recipe");
      return;
    }

    onSave({
      ...formData,
      ingredients: formData.ingredients // No need to filter as IngredientSearchInput handles this
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
        <Label htmlFor="meal-name">
          Meal Name <span className="required-asterisk">*</span>
        </Label>
        <Input
          id="meal-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter meal name"
          data-testid="meal-name-input"
          required
          className={!formData.name.trim() ? 'error-border' : ''}
        />
      </div>
      
      <div className="form-group">
        <Label>
          Ingredients <span className="required-asterisk">*</span>
        </Label>
        <IngredientSearchInput
          ingredients={formData.ingredients}
          onIngredientsChange={(ingredients) => setFormData(prev => ({ ...prev, ingredients }))}
          required={true}
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

// Get week dates from a start date
function getWeekDatesFromStart(startDate) {
  const monday = new Date(startDate);
  
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
  const [isAISuggestionOpen, setIsAISuggestionOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentView, setCurrentView] = useState('calendar'); // 'calendar' or 'table' or 'grocery'
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Load data when year changes
  useEffect(() => {
    if (!loading) {
      loadYearData();
    }
  }, [currentYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load meals, family members, and current year meal plans
      const [mealsRes, familyRes] = await Promise.all([
        axios.get(`${API}/meals`),
        axios.get(`${API}/family-members`)
      ]);

      setMeals(mealsRes.data);
      setFamilyMembers(familyRes.data);
      
      // Load current year meal plans
      await loadYearData();

    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadYearData = async () => {
    try {
      // Load all meal plans for the current year
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;
      
      const plansRes = await axios.get(`${API}/meal-plans`, {
        params: { start_date: startDate, end_date: endDate }
      });
      
      // Convert meal plans array to object keyed by date
      const plansObj = {};
      plansRes.data.forEach(plan => {
        plansObj[plan.date] = plan;
      });
      setMealPlans(plansObj);

    } catch (error) {
      console.error('Failed to load year data:', error);
      toast.error('Failed to load year data');
    }
  };

  const loadDateRangeData = async (start, end) => {
    try {
      const plansRes = await axios.get(`${API}/meal-plans`, {
        params: { start_date: start, end_date: end }
      });
      
      // Convert meal plans array to object keyed by date
      const plansObj = {};
      plansRes.data.forEach(plan => {
        plansObj[plan.date] = plan;
      });
      setMealPlans(plansObj);

    } catch (error) {
      console.error('Failed to load date range data:', error);
      toast.error('Failed to load date range data');
    }
  };

  const handleDateRangeFilter = async (from, to) => {
    setFromDate(from);
    setToDate(to);
    if (from && to) {
      await loadDateRangeData(from, to);
      setCurrentView('table');
    } else {
      setCurrentView('calendar');
      await loadYearData();
    }
  };

  const handleYearChange = (newYear) => {
    setCurrentYear(newYear);
    setSelectedDate(null);
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

  const handleMealRemove = async (date, slot) => {
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

  const handleAIRecipeSuggestion = async (requestData) => {
    try {
      setAiLoading(true);
      const response = await axios.post(`${API}/suggest-recipe`, requestData);
      setAiSuggestion(response.data);
      toast.success('Recipe suggestion generated!');
    } catch (error) {
      console.error('Failed to generate recipe suggestion:', error);
      toast.error('Failed to generate recipe suggestion');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptAISuggestion = async (suggestion) => {
    try {
      const response = await axios.post(`${API}/create-meal-from-suggestion`, suggestion);
      setMeals(prev => [...prev, response.data]);
      setAiSuggestion(null);
      setIsAISuggestionOpen(false);
      toast.success('AI recipe added to your meals!');
    } catch (error) {
      console.error('Failed to create meal from AI suggestion:', error);
      toast.error('Failed to add AI recipe');
    }
  };

  const handleRegenerateAISuggestion = () => {
    setAiSuggestion(null);
    // Keep the modal open for user to try again
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
        <p>Loading your Happy Gut meal planner...</p>
      </div>
    );
  }

  // Show grocery list page
  if (currentView === 'grocery') {
    return (
      <div className="App">
        <Toaster richColors position="top-right" />
        <GroceryListPage 
          weekDates={[]} // Not used in new calendar view
          onBack={() => setCurrentView('calendar')} 
        />
      </div>
    );
  }

  // Show main meal planner with calendar/table view
  return (
    <div className="App">
      <Toaster richColors position="top-right" />
      
      <div className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <ChefHat className="w-8 h-8" />
            Happy Gut
          </h1>
          <div className="header-actions">
            <Button
              variant="outline"
              onClick={() => setCurrentView('grocery')}
              data-testid="grocery-list-button"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Grocery List
            </Button>
            
            <Dialog open={isAISuggestionOpen} onOpenChange={setIsAISuggestionOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="ai-suggest-button">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Recipe Ideas
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>AI Recipe Suggestions</DialogTitle>
                </DialogHeader>
                {!aiSuggestion ? (
                  <AIRecipeSuggestionForm
                    onSuggest={handleAIRecipeSuggestion}
                    onCancel={() => setIsAISuggestionOpen(false)}
                    isLoading={aiLoading}
                  />
                ) : (
                  <AIRecipePreview
                    suggestion={aiSuggestion}
                    onAccept={handleAcceptAISuggestion}
                    onRegenerate={handleRegenerateAISuggestion}
                    onCancel={() => {
                      setAiSuggestion(null);
                      setIsAISuggestionOpen(false);
                    }}
                    familyMembers={familyMembers}
                  />
                )}
              </DialogContent>
            </Dialog>
            
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
      </div>

      <div className="app-content">
        <DndContext 
          collisionDetection={closestCenter}
          onDragStart={(event) => setActiveId(event.active.id)}
          onDragEnd={() => setActiveId(null)}
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

          {/* Main Calendar/Table View */}
          <div className="main-planner-view">
            <DateRangeFilter
              onFilterApply={handleDateRangeFilter}
              onViewChange={setCurrentView}
              currentView={currentView}
            />
            
            {currentView === 'calendar' ? (
              <YearCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                mealPlans={mealPlans}
                currentYear={currentYear}
                onYearChange={handleYearChange}
              />
            ) : (
              <TableMealPlanView
                mealPlans={mealPlans}
                meals={meals}
                fromDate={fromDate}
                toDate={toDate}
              />
            )}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeId ? (
              <DraggableMealCard 
                meal={meals.find(m => m.id === activeId)} 
                isDragging={true}
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Day Detail Modal */}
        {selectedDate && (
          <DayDetailModal
            selectedDate={selectedDate}
            mealPlan={mealPlans[selectedDate]}
            meals={meals}
            onClose={() => setSelectedDate(null)}
            onMealAssign={handleMealDrop}
            onMealRemove={handleMealRemove}
            familyMembers={familyMembers}
          />
        )}

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