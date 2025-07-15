# Deployment Guide

## Development Environment

### Quick Start
```bash
# Copy environment file
cp .envexample .env

# Edit .env with your development settings
# Make sure VITE_API_BASE_URL is empty for development

# Start development services
docker-compose up -d

# Access application
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

### Development Environment Variables
```bash
ENVIRONMENT=development
VITE_API_BASE_URL=
DATABASE_URL=postgresql://nearby:nearby@db/nearbynearby
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Production Environment

### Prerequisites
1. **External Database**: Use AWS RDS or similar managed PostgreSQL with PostGIS
2. **Domain/IP**: Your production domain or EC2 IP address
3. **SSL Certificate**: For HTTPS (recommended with nginx reverse proxy)

### Production Deployment Steps

1. **Prepare Environment File**
```bash
cp .envexample .env.prod
```

2. **Configure Production Variables**
```bash
# Security
SECRET_KEY=your_32_character_secret_generated_with_openssl_rand
ENVIRONMENT=production

# Database (External RDS)
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/database
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=very_secure_production_password
POSTGRES_DB=your_database_name

# Networking
ALLOWED_ORIGINS=http://your-domain.com:5173
ALLOWED_HOSTS=your-domain.com
PRODUCTION_DOMAIN=your-domain.com
VITE_API_BASE_URL=http://your-domain.com:8000/api
```

3. **Deploy with Production Compose**
```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Access application
# - Frontend: http://your-domain.com:5173
# - Backend API: http://your-domain.com:8000
```

### EC2 Deployment Example
```bash
# For EC2 with IP 13.221.240.69
ALLOWED_ORIGINS=http://13.221.240.69:5173
ALLOWED_HOSTS=13.221.240.69
PRODUCTION_DOMAIN=13.221.240.69
VITE_API_BASE_URL=http://13.221.240.69:8000/api
```

## Security Considerations

### Production Checklist
- [ ] Use external managed database (RDS)
- [ ] Set strong SECRET_KEY (32+ characters)
- [ ] Configure proper CORS origins
- [ ] Use HTTPS with reverse proxy
- [ ] Set up proper firewall rules
- [ ] Regular security updates
- [ ] Database backups
- [ ] Log monitoring

### Recommended Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8000/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

### Common Issues
1. **400 Errors**: Check VITE_API_BASE_URL configuration
2. **CORS Errors**: Verify ALLOWED_ORIGINS includes your frontend URL
3. **Database Connection**: Ensure DATABASE_URL is correct and accessible
4. **Build Failures**: Check build logs and environment variables

### Useful Commands
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs frontend

# Restart specific service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build

# Clean rebuild
docker-compose down
docker system prune -f
docker-compose up -d --build
```
