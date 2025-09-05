# Backend Deployment Guide

## Quick Deploy
To deploy the backend with your latest changes:

```bash
cd api
./deploy-docker.sh
```

That's it! The script will:
1. Copy your latest code to the server
2. Force a complete rebuild (no caching issues)
3. Start the containers
4. Test that the API is working

## What Changed
- **No more manual file copying** - Script handles everything
- **Forces complete rebuild** - `--no-cache` ensures new code is deployed
- **Automatic testing** - Verifies the API is working after deployment
- **Cleanup** - Removes old images to prevent conflicts

## Troubleshooting
If deployment fails:
1. Check your `.env` file has the correct variables
2. Make sure your SSH key is working
3. Run the script again - it's designed to be idempotent

## Manual Steps (if needed)
If the script fails, you can manually:
```bash
# SSH to server
ssh -i ~/.ssh/your-key.pem ubuntu@your-server-ip

# Navigate to backend
cd ~/backend

# Force rebuild and restart
sudo docker-compose down
sudo docker system prune -f
sudo docker-compose build --no-cache
sudo docker-compose up -d
```
