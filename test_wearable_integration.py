#!/usr/bin/env python3
"""
Test script for wearable device integration
This script demonstrates how to use the wearable device API endpoints
"""

import requests
import json
import time
from datetime import datetime, timedelta
import random

# Configuration
BASE_URL = "http://localhost:5000"
USERNAME = "test_user"
PASSWORD = "test_password"

class WearableIntegrationTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.cookies.clear()
        self.user_id = None
        
    def register_and_login(self):
        """Register a test user and login"""
        print("🔐 Registering and logging in...")
        
        # Register
        register_data = {
            "username": USERNAME,
            "password": PASSWORD
        }
        
        response = self.session.post(f"{BASE_URL}/api/auth/register", json=register_data)
        if response.status_code == 201:
            print("✅ User registered successfully")
        elif response.status_code == 400 and "already exists" in response.text:
            print("ℹ️  User already exists, proceeding to login")
        else:
            print(f"❌ Registration failed: {response.text}")
            return False
        
        # Login
        response = self.session.post(f"{BASE_URL}/api/auth/login", json=register_data)
        if response.status_code == 200:
            print("✅ Login successful")
            return True
        else:
            print(f"❌ Login failed: {response.text}")
            return False
    
    def setup_profile(self):
        """Set up a test user profile"""
        print("👤 Setting up user profile...")
        
        profile_data = {
            "full_name": "Test User",
            "age": 30,
            "gender": "Other",
            "medical_history": "No significant medical history",
            "allergies": "None",
            "current_medications": "None",
            "health_goals": "Improve fitness and maintain healthy lifestyle"
        }
        
        response = self.session.put(f"{BASE_URL}/api/profile", json=profile_data)
        if response.status_code == 200:
            print("✅ Profile updated successfully")
            return True
        else:
            print(f"❌ Profile update failed: {response.text}")
            return False
    
    def add_wearable_devices(self):
        """Add some test wearable devices"""
        print("⌚ Adding wearable devices...")
        
        devices = [
            {
                "device_name": "Fitbit Charge 5",
                "device_type": "fitness_tracker",
                "device_model": "Charge 5"
            },
            {
                "device_name": "Apple Watch Series 9",
                "device_type": "smartwatch",
                "device_model": "Series 9"
            },
            {
                "device_name": "Polar H10",
                "device_type": "heart_monitor",
                "device_model": "H10"
            }
        ]
        
        device_ids = []
        for device in devices:
            response = self.session.post(f"{BASE_URL}/api/wearables/devices", json=device)
            if response.status_code == 201:
                device_id = response.json()["device_id"]
                device_ids.append(device_id)
                print(f"✅ Added device: {device['device_name']}")
            else:
                print(f"❌ Failed to add device {device['device_name']}: {response.text}")
        
        return device_ids
    
    def create_health_goals(self):
        """Create some health goals"""
        print("🎯 Creating health goals...")
        
        goals = [
            {
                "goal_type": "daily_steps",
                "target_value": 10000,
                "unit": "steps",
                "target_date": (datetime.now() + timedelta(days=30)).isoformat()
            },
            {
                "goal_type": "sleep_hours",
                "target_value": 8,
                "unit": "hours",
                "target_date": (datetime.now() + timedelta(days=14)).isoformat()
            },
            {
                "goal_type": "active_minutes",
                "target_value": 30,
                "unit": "minutes",
                "target_date": (datetime.now() + timedelta(days=21)).isoformat()
            }
        ]
        
        for goal in goals:
            response = self.session.post(f"{BASE_URL}/api/wearables/goals", json=goal)
            if response.status_code == 201:
                print(f"✅ Created goal: {goal['goal_type']}")
            else:
                print(f"❌ Failed to create goal {goal['goal_type']}: {response.text}")
    
    def simulate_wearable_data(self, device_ids):
        """Simulate wearable device data for the last 7 days"""
        print("📊 Simulating wearable device data...")
        
        # Generate data for the last 7 days
        for i in range(7):
            date = datetime.now() - timedelta(days=i)
            
            # Generate different metrics for each day
            metrics = [
                {
                    "device_id": device_ids[0] if device_ids else None,
                    "metric_type": "steps",
                    "value": random.randint(8000, 15000),
                    "unit": "steps",
                    "recorded_at": date.isoformat()
                },
                {
                    "device_id": device_ids[1] if len(device_ids) > 1 else None,
                    "metric_type": "heart_rate_avg",
                    "value": random.randint(60, 100),
                    "unit": "bpm",
                    "recorded_at": date.isoformat()
                },
                {
                    "device_id": device_ids[0] if device_ids else None,
                    "metric_type": "calories_burned",
                    "value": random.randint(1800, 2500),
                    "unit": "cal",
                    "recorded_at": date.isoformat()
                },
                {
                    "device_id": device_ids[1] if len(device_ids) > 1 else None,
                    "metric_type": "sleep_duration",
                    "value": round(random.uniform(6.5, 8.5), 1),
                    "unit": "hours",
                    "recorded_at": date.isoformat()
                },
                {
                    "device_id": device_ids[0] if device_ids else None,
                    "metric_type": "active_minutes",
                    "value": random.randint(20, 60),
                    "unit": "minutes",
                    "recorded_at": date.isoformat()
                }
            ]
            
            for metric in metrics:
                response = self.session.post(f"{BASE_URL}/api/wearables/metrics", json=metric)
                if response.status_code == 201:
                    print(f"✅ Recorded {metric['metric_type']} for {date.strftime('%Y-%m-%d')}")
                else:
                    print(f"❌ Failed to record {metric['metric_type']}: {response.text}")
    
    def test_chat_with_wearable_data(self):
        """Test chat functionality with wearable data context"""
        print("💬 Testing chat with wearable data context...")
        
        test_messages = [
            "How am I doing with my daily steps goal?",
            "What's my average heart rate been like?",
            "Am I getting enough sleep?",
            "Give me some health advice based on my recent activity"
        ]
        
        for message in test_messages:
            print(f"\n🤔 Asking: {message}")
            response = self.session.post(f"{BASE_URL}/api/chat", json={"message": message})
            if response.status_code == 200:
                ai_response = response.json()["response"]
                print(f"🤖 AI Response: {ai_response[:200]}...")
            else:
                print(f"❌ Chat failed: {response.text}")
    
    def get_analytics(self):
        """Get health analytics"""
        print("📈 Getting health analytics...")
        
        response = self.session.get(f"{BASE_URL}/api/wearables/analytics?days=7")
        if response.status_code == 200:
            analytics = response.json()["analytics"]
            print("📊 Health Analytics Summary:")
            for analytic in analytics:
                print(f"  {analytic['metric_type']}: Avg {analytic['average']} {analytic['unit']} (Range: {analytic['minimum']}-{analytic['maximum']})")
        else:
            print(f"❌ Failed to get analytics: {response.text}")
    
    def run_full_test(self):
        """Run the complete wearable integration test"""
        print("🚀 Starting Wearable Device Integration Test")
        print("=" * 50)
        
        # Step 1: Authentication
        if not self.register_and_login():
            return False
        
        # Step 2: Setup profile
        if not self.setup_profile():
            return False
        
        # Step 3: Add devices
        device_ids = self.add_wearable_devices()
        
        # Step 4: Create goals
        self.create_health_goals()
        
        # Step 5: Simulate data
        self.simulate_wearable_data(device_ids)
        
        # Step 6: Test chat
        self.test_chat_with_wearable_data()
        
        # Step 7: Get analytics
        self.get_analytics()
        
        print("\n" + "=" * 50)
        print("✅ Wearable Device Integration Test Completed!")
        print("\nYou can now:")
        print("1. Visit http://localhost:3000 and login with the test user")
        print("2. Navigate to the Wearables page to see your devices")
        print("3. Check the Analytics page for health insights")
        print("4. Use the Chat page to ask health questions with wearable context")
        
        return True

if __name__ == "__main__":
    tester = WearableIntegrationTester()
    tester.run_full_test()