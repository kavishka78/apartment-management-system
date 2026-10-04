import os
import sys
import subprocess
import time

def run_all_agents():
    # Base directory where agent folders are located
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # Define all agent microservices to run (folder name, port, main python file)
    agents = [
        {
            "name": "Maintenance Triage Agent",
            "dir": os.path.join(base_dir, "maintainance-agent"),
            "file": "main.py",
            "port": 8000
        },
        {
            "name": "Payment Assistant Agent",
            "dir": os.path.join(base_dir, "payment-agent"),
            "file": "main.py",
            "port": 8001
        },
        {
            "name": "Facility & Parking Agent",
            "dir": os.path.join(base_dir, "venv", "Agents", "FacilityAgent"),
            "file": "main.py",
            "port": 8002
        }
    ]

    processes = []

    print("Starting All Agentic AI Microservices...")

    try:
        for agent in agents:
            print(f"--> Launching {agent['name']} on Port {agent['port']}...")
            
            # Prepare environment variables for child process (ensure ports don't conflict)
            env = os.environ.copy()
            env["AI_PORT"] = str(agent["port"])
            env["PORT"] = str(agent["port"])

            # Command to launch FastAPI app using uvicorn (or python main.py)
            cmd = [
                sys.executable, "-m", "uvicorn", 
                "main:app", 
                "--host", "0.0.0.0", 
                "--port", str(agent["port"])
            ]

            # Start child process in background
            p = subprocess.Popen(
                cmd,
                cwd=agent["dir"],
                env=env
            )
            processes.append((agent['name'], p))
            time.sleep(1)

        print("\nAll AI Agents are currently running!")

        # Keep parent script running to monitor child agent processes
        for name, proc in processes:
            proc.wait()

    except KeyboardInterrupt:
        print("\nShutdown requested. Terminating all running AI agents...")
        for name, proc in processes:
            print(f"--> Stopping {name}...")
            proc.terminate()
        print("Done! All services stopped cleanly.")

if __name__ == "__main__":
    run_all_agents()
