# Fixing 502 Bad Gateway Error on VPS

## Quick Diagnosis Steps

### 1. Check if containers are running
```bash
# SSH into your VPS first
ssh user@your-vps-ip

# Navigate to your project directory
cd /path/to/panel

# Check container status
docker-compose ps

# Or if using docker directly
docker ps -a
```

### 2. Check backend container logs
```bash
# View recent backend logs
docker-compose logs --tail=100 backend

# Follow logs in real-time
docker-compose logs -f backend
```

### 3. Check frontend/nginx logs
```bash
# Nginx error logs
docker-compose logs --tail=100 frontend

# Or if nginx is installed on the host
sudo tail -f /var/log/nginx/error.log
```

### 4. Test backend connectivity
```bash
# Test if backend is responding
docker-compose exec backend curl http://localhost:8000/api/auth/login/

# Test from frontend container
docker-compose exec frontend wget -O- http://backend:8000/api/auth/login/
```

## Common Fixes

### Fix 1: Restart all services
```bash
cd /path/to/panel
docker-compose down
docker-compose up -d
```

### Fix 2: Restart specific service
```bash
# Restart backend only
docker-compose restart backend

# Restart frontend only
docker-compose restart frontend

# Rebuild and restart (if code changed)
docker-compose up -d --build backend
```

### Fix 3: Check database connection
```bash
# Check if database is running
docker-compose ps db

# Check database logs
docker-compose logs --tail=50 db

# Test database connection
docker-compose exec db psql -U postgres -d panel -c "SELECT 1;"
```

### Fix 4: Verify environment variables
```bash
# Check if .env file exists
ls -la .env

# Check backend environment variables
docker-compose exec backend env | grep DB_

# Verify SECRET_KEY is set
docker-compose exec backend env | grep SECRET_KEY
```

### Fix 5: Check network connectivity
```bash
# Test if frontend can reach backend
docker-compose exec frontend ping -c 3 backend

# Check if backend port is accessible
docker-compose exec backend netstat -tlnp | grep 8000
```

### Fix 6: Rebuild containers (if code changed)
```bash
# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# Or rebuild specific service
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

## Production Deployment Checklist

### 1. Ensure all services are running
```bash
docker-compose ps
# All services should show "Up" status
```

### 2. Check resource usage
```bash
# Check container resource usage
docker stats --no-stream

# Check disk space
df -h

# Check memory
free -h
```

### 3. Verify nginx configuration
```bash
# If using host nginx, test configuration
sudo nginx -t

# Reload nginx if config changed
sudo systemctl reload nginx
# or
sudo service nginx reload
```

### 4. Check firewall/ports
```bash
# Check if ports are open
sudo netstat -tlnp | grep -E ':(80|443|3000|8000)'

# Or using ss
sudo ss -tlnp | grep -E ':(80|443|3000|8000)'
```

## Systemd Service (Alternative Setup)

If you're using systemd to manage Docker Compose:

```bash
# Check service status
sudo systemctl status panel

# Restart service
sudo systemctl restart panel

# View logs
sudo journalctl -u panel -f
```

## Emergency Recovery

### Complete restart
```bash
cd /path/to/panel

# Stop everything
docker-compose down

# Remove volumes (WARNING: This deletes data!)
# docker-compose down -v

# Start fresh
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Check for port conflicts
```bash
# Check what's using port 80/443/3000/8000
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3000
sudo lsof -i :8000
```

## Monitoring Commands

### Watch container status
```bash
watch -n 2 'docker-compose ps'
```

### Monitor logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Health checks
```bash
# Backend health (if endpoint exists)
curl http://localhost:8000/api/health/

# Frontend health
curl http://localhost:3000/health
```

## Common Issues and Solutions

### Issue: Backend container keeps restarting
**Solution:**
```bash
# Check logs for errors
docker-compose logs backend

# Common causes:
# - Database connection failed
# - Missing environment variables
# - Application errors
```

### Issue: Database connection refused
**Solution:**
```bash
# Ensure database is healthy
docker-compose ps db

# Wait for database to be ready
docker-compose up -d db
sleep 10
docker-compose up -d backend
```

### Issue: Port already in use
**Solution:**
```bash
# Find what's using the port
sudo lsof -i :8000

# Kill the process or change port in docker-compose.yml
```

### Issue: Out of memory
**Solution:**
```bash
# Check memory
free -h

# Restart containers to free memory
docker-compose restart

# Or increase swap space
```

## Automated Health Check Script

Create a script to check everything:

```bash
#!/bin/bash
# save as check_health.sh

echo "=== Container Status ==="
docker-compose ps

echo -e "\n=== Backend Health ==="
curl -f http://localhost:8000/api/health/ 2>/dev/null && echo "OK" || echo "FAILED"

echo -e "\n=== Frontend Health ==="
curl -f http://localhost:3000/health 2>/dev/null && echo "OK" || echo "FAILED"

echo -e "\n=== Database Connection ==="
docker-compose exec -T db pg_isready -U postgres && echo "OK" || echo "FAILED"

echo -e "\n=== Recent Backend Errors ==="
docker-compose logs --tail=5 backend | grep -i error || echo "No errors"
```

Make it executable:
```bash
chmod +x check_health.sh
./check_health.sh
```

