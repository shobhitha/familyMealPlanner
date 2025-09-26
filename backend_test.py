import requests
import sys
import json
from datetime import datetime, date, timedelta

class MealPlannerAPITester:
    def __init__(self, base_url="https://recipe-ai-14.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_meal_ids = []
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                if response.text:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success and response.text:
                try:
                    return success, response.json()
                except:
                    return success, response.text
            return success, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_family_members(self):
        """Test family members endpoint"""
        success, response = self.run_test(
            "Get Family Members",
            "GET",
            "family-members",
            200
        )
        
        if success:
            expected_members = ['dad', 'mom', 'brother', 'sister', 'baby', 'grandpa', 'grandma']
            if isinstance(response, dict):
                found_members = list(response.keys())
                missing = [m for m in expected_members if m not in found_members]
                if missing:
                    self.log_test("Family Members Content", False, f"Missing: {missing}")
                else:
                    self.log_test("Family Members Content", True)
        
        return success

    def test_create_meal(self):
        """Test meal creation"""
        test_meal = {
            "name": "Test Grilled Chicken",
            "ingredients": ["Chicken breast", "Olive oil", "Salt", "Pepper", "Garlic"],
            "recipe": "1. Season chicken with salt and pepper. 2. Heat olive oil in pan. 3. Cook chicken 6-7 minutes per side.",
            "family_preferences": ["dad", "mom"]
        }
        
        success, response = self.run_test(
            "Create Meal",
            "POST",
            "meals",
            200,
            data=test_meal
        )
        
        if success and isinstance(response, dict) and 'id' in response:
            self.created_meal_ids.append(response['id'])
            # Verify meal data
            if (response.get('name') == test_meal['name'] and 
                response.get('ingredients') == test_meal['ingredients']):
                self.log_test("Meal Creation Data Validation", True)
            else:
                self.log_test("Meal Creation Data Validation", False, "Data mismatch")
        
        return success, response

    def test_get_meals(self):
        """Test getting all meals"""
        success, response = self.run_test(
            "Get All Meals",
            "GET",
            "meals",
            200
        )
        
        if success and isinstance(response, list):
            self.log_test("Meals List Format", True, f"Found {len(response)} meals")
        elif success:
            self.log_test("Meals List Format", False, "Response is not a list")
        
        return success, response

    def test_get_meal_by_id(self, meal_id):
        """Test getting specific meal"""
        success, response = self.run_test(
            "Get Meal by ID",
            "GET",
            f"meals/{meal_id}",
            200
        )
        
        if success and isinstance(response, dict):
            if response.get('id') == meal_id:
                self.log_test("Meal ID Match", True)
            else:
                self.log_test("Meal ID Match", False, f"Expected {meal_id}, got {response.get('id')}")
        
        return success, response

    def test_update_meal(self, meal_id):
        """Test meal update"""
        updated_meal = {
            "name": "Updated Grilled Chicken",
            "ingredients": ["Chicken breast", "Olive oil", "Salt", "Pepper", "Garlic", "Herbs"],
            "recipe": "Updated recipe with herbs for better flavor.",
            "family_preferences": ["dad", "mom", "brother"]
        }
        
        success, response = self.run_test(
            "Update Meal",
            "PUT",
            f"meals/{meal_id}",
            200,
            data=updated_meal
        )
        
        if success and isinstance(response, dict):
            if response.get('name') == updated_meal['name']:
                self.log_test("Meal Update Validation", True)
            else:
                self.log_test("Meal Update Validation", False, "Update data mismatch")
        
        return success

    def test_meal_plans(self):
        """Test meal planning functionality"""
        # Get current date
        today = date.today()
        test_date = today.isoformat()
        
        # Test getting meal plans
        success, response = self.run_test(
            "Get Meal Plans",
            "GET",
            "meal-plans",
            200
        )
        
        if success and isinstance(response, list):
            self.log_test("Meal Plans List Format", True)
        
        # Test getting meal plan by date (should return empty plan)
        success, response = self.run_test(
            "Get Meal Plan by Date",
            "GET",
            f"meal-plans/{test_date}",
            200
        )
        
        # Test creating meal plan
        if self.created_meal_ids:
            meal_plan = {
                "date": test_date,
                "breakfast": self.created_meal_ids[0],
                "lunch": self.created_meal_ids[0]
            }
            
            success, response = self.run_test(
                "Create Meal Plan",
                "POST",
                "meal-plans",
                200,
                data=meal_plan
            )
            
            # Test updating meal plan slot
            if success:
                update_data = {
                    "meal_slot": "dinner",
                    "meal_id": self.created_meal_ids[0]
                }
                
                success, response = self.run_test(
                    "Update Meal Plan Slot",
                    "PUT",
                    f"meal-plans/{test_date}",
                    200,
                    data=update_data
                )
                
                # Test removing meal from slot
                remove_data = {
                    "meal_slot": "dinner",
                    "meal_id": None
                }
                
                success, response = self.run_test(
                    "Remove Meal from Slot",
                    "PUT",
                    f"meal-plans/{test_date}",
                    200,
                    data=remove_data
                )

    def test_delete_meal(self, meal_id):
        """Test meal deletion"""
        success, response = self.run_test(
            "Delete Meal",
            "DELETE",
            f"meals/{meal_id}",
            200
        )
        
        if success:
            # Verify meal is deleted by trying to get it
            success_get, _ = self.run_test(
                "Verify Meal Deleted",
                "GET",
                f"meals/{meal_id}",
                404
            )
        
        return success

    def test_error_handling(self):
        """Test error handling"""
        # Test getting non-existent meal
        self.run_test(
            "Get Non-existent Meal",
            "GET",
            "meals/non-existent-id",
            404
        )
        
        # Test creating meal with invalid data
        invalid_meal = {
            "name": "",  # Empty name
            "ingredients": [],
            "recipe": ""
        }
        
        # This might return 422 (validation error) or 400 (bad request)
        success, response = self.run_test(
            "Create Invalid Meal",
            "POST",
            "meals",
            422,  # Pydantic validation error
            data=invalid_meal
        )
        
        # If 422 didn't work, try 400
        if not success:
            self.run_test(
                "Create Invalid Meal (400)",
                "POST",
                "meals",
                400,
                data=invalid_meal
            )

    def run_all_tests(self):
        """Run all tests"""
        print("🧪 Starting Meal Planner API Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test family members
        self.test_family_members()
        
        # Test meal CRUD operations
        meal_created, meal_data = self.test_create_meal()
        
        if meal_created and self.created_meal_ids:
            meal_id = self.created_meal_ids[0]
            
            # Test getting meals
            self.test_get_meals()
            
            # Test getting specific meal
            self.test_get_meal_by_id(meal_id)
            
            # Test updating meal
            self.test_update_meal(meal_id)
            
            # Test meal planning
            self.test_meal_plans()
            
            # Test meal deletion (do this last)
            self.test_delete_meal(meal_id)
        
        # Test error handling
        self.test_error_handling()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary:")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    tester = MealPlannerAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())