#!/usr/bin/env python3
"""
Test script to verify create_test_user.py functionality
"""

import subprocess
import sys
import os

def run_command(cmd, description):
    """Run a command and return success status"""
    print(f"\n{'='*60}")
    print(f"Testing: {description}")
    print(f"Command: {cmd}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            cmd, 
            shell=True, 
            capture_output=True, 
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        
        print("STDOUT:")
        print(result.stdout)
        
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
        
        print(f"Return code: {result.returncode}")
        print(f"Success: {result.returncode == 0}")
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"Error running command: {e}")
        return False

def main():
    """Run various test scenarios"""
    print("🧪 Testing create_test_user.py script")
    
    tests = [
        # Test 1: Help command
        ("python create_test_user.py --help", "Help command"),
        
        # Test 2: Default user creation
        ("python create_test_user.py", "Default user creation"),
        
        # Test 3: Custom user creation
        ("python create_test_user.py --email admin@test.com --password admin123 --role admin", "Custom admin user"),
        
        # Test 4: Editor user creation
        ("python create_test_user.py --email editor@test.com --password editor123 --role editor", "Editor user creation"),
        
        # Test 5: Duplicate user (should show existing user info)
        ("python create_test_user.py --email test@nearbynearby.com", "Duplicate user check"),
        
        # Test 6: Invalid email
        ("python create_test_user.py --email invalid-email", "Invalid email validation"),
        
        # Test 7: Weak password
        ("python create_test_user.py --email test@example.com --password 123", "Weak password validation"),
        
        # Test 8: Verbose mode
        ("python create_test_user.py --email verbose@test.com --password verbose123 --verbose", "Verbose mode"),
    ]
    
    results = []
    for cmd, description in tests:
        success = run_command(cmd, description)
        results.append((description, success))
    
    # Summary
    print(f"\n{'='*60}")
    print("TEST SUMMARY")
    print(f"{'='*60}")
    
    passed = 0
    total = len(results)
    
    for description, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {description}")
        if success:
            passed += 1
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return 0
    else:
        print("💥 Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 