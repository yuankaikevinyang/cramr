# Set the API URL (using localhost since it's running on the same server)
API_URL="http://localhost:8080/admin/delete-old-entries"

# Log file for tracking cleanup operations
LOG_FILE="/home/ubuntu/backend/cleanup.log"

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Get current timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Starting event cleanup..." >> "$LOG_FILE"

# Call the cleanup endpoint
RESPONSE=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json")

# Check if the request was successful
if [ $? -eq 0 ]; then
    echo "[$TIMESTAMP] Cleanup completed successfully: $RESPONSE" >> "$LOG_FILE"
else
    echo "[$TIMESTAMP] Cleanup failed with error code: $?" >> "$LOG_FILE"
fi

echo "[$TIMESTAMP] Cleanup script finished" >> "$LOG_FILE"
echo "----------------------------------------" >> "$LOG_FILE"
