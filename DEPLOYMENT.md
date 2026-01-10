# ProjectDashbored - Deployment Guide

## 📦 Deployment Overview

This guide covers deploying ProjectDashbored (JobHunter) to production environments.

---

## 🔧 Prerequisites

### Required Software
- **Docker** & **Docker Compose** (v2.0+)
- **Java 23** (for building backend JAR)
- **Node.js 18+** (for building frontend)
- **Maven 3.9+** (for backend build)

### Required Credentials
- **Adzuna API** credentials (app_id and api_key)
  - Get at: https://developer.adzuna.com/
- **PostgreSQL** database
- **Redis** for caching
- **JWT Secret** (generate with: `openssl rand -base64 64`)

---

## 🐳 Docker Deployment (Recommended)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/ProjectDashbored.git
cd ProjectDashbored
```

### 2. Configure Environment

#### Backend Configuration
Create `backend/src/main/resources/local.properties`:

```properties
# Adzuna API Configuration
adzuna.base-url=https://api.adzuna.com/v1/api/jobs/us/search/1
adzuna.api-id=YOUR_ADZUNA_API_ID
adzuna.api-key=YOUR_ADZUNA_API_KEY

# Database Configuration (Docker)
spring.datasource.url=jdbc:postgresql://postgres:5432/JobHunterDb2
spring.datasource.username=admin
spring.datasource.password=CHANGE_ME_IN_PRODUCTION

# JWT Configuration
app.jwt.secret=YOUR_GENERATED_SECRET_HERE
app.jwt.expiration-ms=86400000
```

**Important**:
- Use `postgres:5432` (Docker internal network) for database host
- Generate secure JWT secret: `openssl rand -base64 64`
- Change database password for production

#### Email Configuration (Optional)
Create `backend/.env`:

```bash
# Email Configuration
EMAIL_ENABLED=true

# SMTP Settings
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Email From Address
EMAIL_FROM=noreply@jobhunter.com
```

### 3. Build Application

#### Option A: Let Docker Build
```bash
docker-compose up -d --build
```

#### Option B: Pre-build Locally (Faster)
```bash
# Build backend JAR
cd backend
./mvnw clean package -DskipTests
cd ..

# Build frontend
cd project-dashboard-frontend
npm install
npm run build
cd ..

# Start containers
docker-compose up -d
```

### 4. Initialize Database

Database schema is automatically initialized from `init/schema.sql` on first start.

Verify database is ready:
```bash
docker-compose logs postgres | grep "database system is ready"
```

### 5. Verify Deployment

Check all services are running:
```bash
docker-compose ps
```

Expected output:
```
NAME                     STATUS      PORTS
projectdashbored-postgres-1   Up      0.0.0.0:5433->5432/tcp
projectdashbored-redis-1      Up      0.0.0.0:6379->6379/tcp
projectdashbored-backend-1    Up      0.0.0.0:8080->8080/tcp
projectdashbored-frontend-1   Up      0.0.0.0:3000->80/tcp
```

### 6. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/actuator/health

---

## 🔐 Security Hardening

### 1. Change Default Passwords
```bash
# Generate secure database password
openssl rand -hex 32

# Update in docker-compose.yml:
# - POSTGRES_PASSWORD environment variable
# - local.properties datasource password
```

### 2. Generate JWT Secret
```bash
# Generate 512-bit secret
openssl rand -base64 64
```

Update `local.properties`:
```properties
app.jwt.secret=<generated_secret_here>
```

### 3. Environment Variables
For production, use environment variables instead of `local.properties`:

```bash
# Set environment variables
export ADZUNA_API_ID=your_id
export ADZUNA_API_KEY=your_key
export DB_PASSWORD=secure_password
export JWT_SECRET=generated_secret
```

Update `docker-compose.yml` to use env vars:
```yaml
backend:
  environment:
    - ADZUNA_API_ID=${ADZUNA_API_ID}
    - ADZUNA_API_KEY=${ADZUNA_API_KEY}
    - SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}
    - APP_JWT_SECRET=${JWT_SECRET}
```

### 4. HTTPS Configuration

#### Option A: Nginx Reverse Proxy
Create `nginx.conf`:
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Option B: Cloudflare SSL
Use Cloudflare for SSL termination (easier setup).

### 5. Firewall Rules
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 5432/tcp   # Block direct DB access
sudo ufw deny 6379/tcp   # Block direct Redis access
sudo ufw enable
```

---

## 📊 Monitoring & Logging

### 1. View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 backend
```

### 2. Application Metrics
Spring Boot Actuator endpoints:
- Health: http://localhost:8080/actuator/health
- Metrics: http://localhost:8080/actuator/metrics
- Info: http://localhost:8080/actuator/info

### 3. Database Monitoring
```bash
# Connect to PostgreSQL
docker exec -it projectdashbored-postgres-1 psql -U admin -d JobHunterDb2

# Check job count
SELECT COUNT(*) FROM jobs;

# Check recent jobs
SELECT title, source, date_found
FROM jobs
ORDER BY date_found DESC
LIMIT 10;
```

### 4. Redis Monitoring
```bash
# Connect to Redis
docker exec -it projectdashbored-redis-1 redis-cli

# Check cache keys
KEYS *

# Check cache stats
INFO stats

# Monitor cache hits/misses
MONITOR
```

---

## 🔄 Maintenance Tasks

### Database Backups
```bash
# Backup database
docker exec projectdashbored-postgres-1 pg_dump -U admin JobHunterDb2 > backup_$(date +%Y%m%d).sql

# Restore database
docker exec -i projectdashbored-postgres-1 psql -U admin JobHunterDb2 < backup_20260110.sql
```

### Clear Redis Cache
```bash
# Clear all caches
docker exec projectdashbored-redis-1 redis-cli FLUSHDB

# Clear specific cache
docker exec projectdashbored-redis-1 redis-cli DEL "jobSearch::*"
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Or with pre-build
cd backend && ./mvnw clean package -DskipTests && cd ..
cd project-dashboard-frontend && npm run build && cd ..
docker-compose up -d --build
```

### Clean Up Old Data
```sql
-- Delete jobs older than 30 days
DELETE FROM jobs
WHERE date_found < NOW() - INTERVAL '30 days';

-- Vacuum database
VACUUM ANALYZE;
```

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready
docker-compose logs postgres

# 2. Missing local.properties
ls backend/src/main/resources/local.properties

# 3. Port conflict
lsof -i :8080
```

### Database Connection Errors
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
docker exec -it projectdashbored-postgres-1 psql -U admin -d JobHunterDb2

# Check connection string in local.properties
# For Docker: jdbc:postgresql://postgres:5432/JobHunterDb2
# For local: jdbc:postgresql://localhost:5433/JobHunterDb2
```

### Frontend Build Fails
```bash
# Clear node_modules and rebuild
cd project-dashboard-frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Redis Connection Errors
```bash
# Check Redis is running
docker exec projectdashbored-redis-1 redis-cli ping
# Expected: PONG

# Restart Redis
docker-compose restart redis
```

### Job Search Returns 0 Results
```bash
# Check if jobs are in database
docker exec -it projectdashbored-postgres-1 psql -U admin -d JobHunterDb2 -c "SELECT COUNT(*) FROM jobs;"

# Clear Redis cache
docker exec projectdashbored-redis-1 redis-cli FLUSHDB

# Check Adzuna API credentials
docker-compose logs backend | grep -i adzuna

# Test Adzuna API directly
curl "https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=YOUR_ID&app_key=YOUR_KEY&results_per_page=1&what=developer"
```

---

## 📈 Performance Optimization

### 1. Increase Connection Pool Size
Edit `application.properties`:
```properties
# For high traffic
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=10
```

### 2. Tune JVM Settings
Edit `docker-compose.yml`:
```yaml
backend:
  environment:
    - JAVA_OPTS=-Xmx2g -Xms1g -XX:+UseG1GC
```

### 3. Redis Persistence
Edit `docker-compose.yml`:
```yaml
redis:
  command: redis-server --appendonly yes
```

### 4. Database Indexing
Already optimized with indexes on:
- `jobs.external_id` (unique)
- `jobs.company_id`, `jobs.location_id`, `jobs.category_id`
- `locations.latitude`, `locations.longitude`

---

## 🔄 Scaling

### Horizontal Scaling (Multiple Backend Instances)
```yaml
backend:
  deploy:
    replicas: 3
  environment:
    - SERVER_PORT=8080
```

Add load balancer (Nginx):
```nginx
upstream backend {
    server backend:8080;
    server backend:8080;
    server backend:8080;
}
```

### Database Replication
Use PostgreSQL read replicas for read-heavy workloads.

---

## 📦 Production Checklist

Before going live:

- [ ] Change all default passwords
- [ ] Generate secure JWT secret (512-bit)
- [ ] Configure HTTPS/SSL
- [ ] Set up database backups (daily)
- [ ] Configure monitoring/alerting
- [ ] Set up log aggregation
- [ ] Test disaster recovery plan
- [ ] Document runbook for common issues
- [ ] Set up firewall rules
- [ ] Configure rate limiting (API gateway)
- [ ] Test under load (stress testing)
- [ ] Set up CI/CD pipeline
- [ ] Configure domain name and DNS
- [ ] Test email notifications (if enabled)
- [ ] Review CORS settings for production domain

---

## 🆘 Support

**Issues**: https://github.com/yourusername/ProjectDashbored/issues

**Documentation**:
- `README.md` - Project overview and setup
- `CLAUDE.md` - Architecture and codebase guide
- `CHANGES.md` - Recent updates and fixes
- `docs/EMAIL_SETUP.md` - Email configuration guide

---

**Last Updated**: 2026-01-10
**Version**: 1.0.0
**Status**: Production Ready
