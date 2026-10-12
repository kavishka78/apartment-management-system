import os
import sys
import subprocess
import time

def run_all_agents():
    # Base directory where agent folders are located
    base_dir = os.path.dirname(os.path.abspath(__file__))
    local_python = os.path.join(base_dir, ".venv", "Scripts", "python.exe") if os.name == "nt" else os.path.join(base_dir, ".venv", "bin", "python")
    python_executable = local_python if os.path.isfile(local_python) else sys.executable
    if os.path.abspath(python_executable) != os.path.abspath(sys.executable):
        raise SystemExit(subprocess.call([python_executable, os.path.abspath(__file__)]))
    from dotenv import load_dotenv, dotenv_values
    load_dotenv(os.path.join(base_dir, ".env"))
    # Facility's LangChain client uses GOOGLE_API_KEY; the other agents use GEMINI_API_KEY.
    if os.getenv("GEMINI_API_KEY") and not os.getenv("GOOGLE_API_KEY"):
        os.environ["GOOGLE_API_KEY"] = os.environ["GEMINI_API_KEY"]

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
        },
        {
            "name": "Resident Onboarding Assistant",
            "dir": os.path.join(base_dir, "onboarding-agent"),
            "file": "main.py",
            "port": 8003
        }
    ]

    processes = []

    print("Starting All Agentic AI Microservices...")

    try:
        for agent in agents:
            print(f"--> Launching {agent['name']} on Port {agent['port']}...")
            
            # Prepare environment variables for child process (ensure ports don't conflict)
            env = os.environ.copy()
            # Each agent's own settings override the shared local defaults.
            env.update({key: value for key, value in dotenv_values(os.path.join(agent["dir"], ".env")).items() if value is not None})
            env["AI_PORT"] = str(agent["port"])
            env["PORT"] = str(agent["port"])

            # Command to launch FastAPI app using uvicorn (or python main.py)
            cmd = [
                python_executable, "-m", "uvicorn",
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

        print("\nAgent processes launched. Check each agent's startup messages.")

        # Keep parent script running to monitor child agent processes
        while True:
            for name, proc in processes:
                if proc.poll() is not None:
                    raise RuntimeError(f"{name} exited with code {proc.returncode}. Check its error above.")
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nShutdown requested. Terminating all running AI agents...")
    finally:
        for name, proc in processes:
            if proc.poll() is None:
                print(f"--> Stopping {name}...")
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proc.kill()
                    proc.wait()

if __name__ == "__main__":
    run_all_agents()
