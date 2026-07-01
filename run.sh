#!/bin/bash
# Script to run the exercise questionnaire and automatically launch the stats website

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "==========================================="
echo "🏋️  Starting Exercise Questionnaire..."
echo "==========================================="

# Run the questionnaire using python3
python3 "$DIR/src/main.py"

# If the questionnaire ran successfully (without error or cancellation)
if [ $? -eq 0 ]; then
    echo ""
    echo "==========================================="
    echo "📊 Starting Visualization Server..."
    echo "==========================================="
    
    # Kill any existing process running on port 8080
    EXISTING_PID=$(lsof -ti :8080)
    if [ ! -z "$EXISTING_PID" ]; then
        echo "Killing existing server on port 8080 (PID: $EXISTING_PID)..."
        kill -9 $EXISTING_PID
    fi
    
    # Start the server in the background
    python3 "$DIR/src/server.py" &
    SERVER_PID=$!
    
    # Wait a moment to ensure the server starts up
    sleep 1.5
    
    # Open the browser automatically (macOS command)
    echo "Opening http://127.0.0.1:8080 in your default browser..."
    open "http://127.0.0.1:8080"
    
    echo "Server is running (PID: $SERVER_PID)."
    echo "Press Ctrl+C to stop the server and exit."
    
    # Trap Ctrl+C (SIGINT) to kill the server when exiting
    trap "echo '\nShutting down server...'; kill $SERVER_PID; exit 0" SIGINT
    
    # Wait for the server process
    wait $SERVER_PID
else
    echo "Questionnaire cancelled or encountered an error."
fi
