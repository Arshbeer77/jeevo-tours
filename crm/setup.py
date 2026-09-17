#!/usr/bin/env python3
"""
Jeevo Tours CRM - Getting Started Guide
Interactive setup wizard for first-time users
"""

import os
import sys
import subprocess
import platform

def print_header(text):
    """Print a formatted header"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70 + "\n")

def print_step(step, text):
    """Print a step indicator"""
    print(f"[Step {step}] {text}")

def run_command(command, description):
    """Run a shell command and handle errors"""
    print(f"\n🔄 {description}...")
    try:
        if platform.system() == "Windows":
            result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        else:
            result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True, executable='/bin/bash')
        print(f"✅ {description} - Success!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Failed!")
        print(f"Error: {e.stderr}")
        return False

def check_python():
    """Check if Python is installed"""
    try:
        version = sys.version_info
        if version.major >= 3 and version.minor >= 9:
            print(f"✅ Python {version.major}.{version.minor}.{version.micro} detected")
            return True
        else:
            print(f"❌ Python version {version.major}.{version.minor} is too old")
            print("   Please install Python 3.9 or higher")
            return False
    except Exception as e:
        print(f"❌ Python check failed: {e}")
        return False

def main():
    """Main setup wizard"""
    os_name = platform.system()

    print_header("🕉 Jeevo Tours CRM - Setup Wizard")

    print("Welcome! This wizard will help you set up your CRM system.")
    print(f"Detected OS: {os_name}")
    print(f"Current Directory: {os.getcwd()}")

    # Step 1: Check Python
    print_header("Step 1: Checking Python Installation")
    if not check_python():
        print("\n❌ Setup cannot continue without Python 3.9+")
        print("Visit: https://www.python.org/downloads/")
        sys.exit(1)

    # Step 2: Install dependencies
    print_header("Step 2: Installing Dependencies")
    print("This will install FastAPI, SQLAlchemy, and other required packages...")

    if input("\nProceed with installation? (y/n): ").lower() != 'y':
        print("Setup cancelled.")
        sys.exit(0)

    if not run_command("pip install -r requirements.txt", "Installing packages"):
        print("\n❌ Failed to install dependencies")
        print("Try running manually: pip install -r requirements.txt")
        sys.exit(1)

    # Step 3: Initialize database
    print_header("Step 3: Initializing Database")
    print("Creating SQLite database and tables...")

    if not run_command("python database.py", "Database initialization"):
        print("\n❌ Failed to initialize database")
        sys.exit(1)

    # Step 4: Instructions to start
    print_header("Step 4: Setup Complete! 🎉")

    print("Your Jeevo Tours CRM is ready to use!\n")
    print("📝 Next Steps:\n")
    print("1. Start the server:")
    if os_name == "Windows":
        print("   → start.bat")
        print("   or")
        print("   → python main.py\n")
    else:
        print("   → python main.py\n")

    print("2. Access the admin dashboard:")
    print("   → http://localhost:8000/admin\n")

    print("3. View API documentation:")
    print("   → http://localhost:8000/docs\n")

    print("4. (Optional) Add sample test data:")
    print("   → python test_data.py\n")

    print("=" * 70)
    print()

    # Ask if user wants to start server now
    if input("Would you like to start the server now? (y/n): ").lower() == 'y':
        print_header("Starting Jeevo Tours CRM Server")
        print("Server will start at: http://localhost:8000")
        print("Press CTRL+C to stop the server\n")
        print("=" * 70 + "\n")

        try:
            subprocess.run([sys.executable, "main.py"])
        except KeyboardInterrupt:
            print("\n\n✋ Server stopped by user")
            print("To restart, run: python main.py")
    else:
        print("👋 Setup complete! Run 'python main.py' when you're ready to start.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n✋ Setup cancelled by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
