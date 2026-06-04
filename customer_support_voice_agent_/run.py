import os
import socket
import subprocess
import sys
import time
import webbrowser
HOST = "127.0.0.1"
PORT = 5000
STARTUP_TIMEOUT_SECONDS = 20


def wait_for_server(host: str, port: int, timeout_seconds: int) -> bool:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            with socket.create_connection((host, port), timeout=1):
                return True
        except OSError:
            time.sleep(0.25)
    return False

def main():
    base = os.path.dirname(os.path.abspath(__file__))
    app  = os.path.join(base, "app.py")

    if not os.path.exists(app):
        print("[run.py] ERROR: app.py not found. Place run.py in the same folder.")
        sys.exit(1)

    print(f"[run.py] Starting Voice RAG Agent → http://{HOST}:{PORT}")
    print("[run.py] Press Ctrl+C to stop.\n")

    try:
        proc = subprocess.Popen([sys.executable, app], cwd=base)
        if wait_for_server(HOST, PORT, STARTUP_TIMEOUT_SECONDS):
            webbrowser.open(f"http://{HOST}:{PORT}")
        else:
            print(f"[run.py] ERROR: Server did not start on http://{HOST}:{PORT} within {STARTUP_TIMEOUT_SECONDS} seconds.")
            proc.terminate()
            sys.exit(1)

        proc.wait()
    except KeyboardInterrupt:
        print("\n[run.py] Stopped.")

if __name__ == "__main__":
    main()
