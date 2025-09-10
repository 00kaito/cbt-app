# Docker Deployment Guide

This guide explains how to run MindBridge using Docker and Docker Compose for both development and production environments.

## Prerequisites

- Docker Engine (20.10+)
- Docker Compose (2.0+)
- Git (to clone the repository)

## Quick Start (Development)

1. **Clone and setup**:
```bash
git clone <your-repository>
cd mindbridge
cp .env.docker .env
# Edit .env with your configuration
```

2. **Start the application**:
```bash
# Start database and app
docker-compose up -d

# Run database migrations
docker-compose --profile tools run migrate

# View logs
docker-compose logs -f app
```

3. **Access the application**:
- Application: http://localhost:5000
- Database: localhost:5432 (if needed for debugging)

## Production Deployment

1. **Prepare environment**:
```bash
cp .env.docker .env
# Update .env with secure production values:
# - Strong POSTGRES_PASSWORD
# - Secure SESSION_SECRET (32+ characters)
# - Valid OPENAI_API_KEY (optional)
```

2. **Deploy with production config**:
```bash
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml --profile tools run migrate

# Check health
docker-compose -f docker-compose.prod.yml ps
```

## Configuration

### Environment Variables

**Required**:
- `POSTGRES_PASSWORD`: Secure database password
- `SESSION_SECRET`: Secure session encryption key (32+ characters)

**Optional**:
- `OPENAI_API_KEY`: For AI therapy analysis features
- `POSTGRES_DB`: Database name (default: mindbridge)
- `POSTGRES_USER`: Database user (default: mindbridge_user)

### Security Considerations

**Production Checklist**:
- [ ] Use strong, unique passwords for database
- [ ] Set secure SESSION_SECRET (generate with `openssl rand -base64 32`)
- [ ] Enable SSL/TLS termination (via reverse proxy)
- [ ] Configure firewall rules
- [ ] Regular database backups
- [ ] Monitor container logs

## Common Operations

### Database Management

```bash
# Backup database
docker-compose exec database pg_dump -U postgres mindbridge > backup.sql

# Restore database
docker-compose exec -T database psql -U postgres mindbridge < backup.sql

# Connect to database
docker-compose exec database psql -U postgres mindbridge

# View database logs
docker-compose logs database
```

### Application Management

```bash
# View application logs
docker-compose logs -f app

# Restart application only
docker-compose restart app

# Update application
docker-compose build app
docker-compose up -d app

# Scale application (if needed)
docker-compose up -d --scale app=2
```

### Health Monitoring

```bash
# Check service health
docker-compose ps

# Health check endpoint
curl http://localhost:5000/api/health

# Resource usage
docker stats
```

## Troubleshooting

### Common Issues

**Database Connection Errors**:
```bash
# Check database is running
docker-compose ps database

# Check database logs
docker-compose logs database

# Verify connection from app
docker-compose exec app node -e "console.log(process.env.DATABASE_URL)"
```

**Migration Failures**:
```bash
# Run migrations manually
docker-compose --profile tools run migrate

# Check migration logs
docker-compose logs migrate

# Reset database (DANGER: loses all data)
docker-compose down -v
docker-compose up -d database
docker-compose --profile tools run migrate
```

**Application Won't Start**:
```bash
# Check application logs
docker-compose logs app

# Verify environment variables
docker-compose exec app env | grep -E "(DATABASE_URL|SESSION_SECRET)"

# Test build locally
docker build -t mindbridge-test .
docker run --rm mindbridge-test npm --version
```

## Development Tips

### Local Development with Docker

```bash
# Development with file watching (if supported)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Connect to running container
docker-compose exec app sh

# Run npm commands
docker-compose exec app npm run check
docker-compose exec app npm run db:push
```

### Database Development

```bash
# Access database shell
docker-compose exec database psql -U postgres mindbridge

# View all tables
docker-compose exec database psql -U postgres mindbridge -c "\dt"

# Export schema
docker-compose exec database pg_dump -U postgres --schema-only mindbridge > schema.sql
```

## Maintenance

### Regular Tasks

**Weekly**:
- Check container health: `docker-compose ps`
- Review logs for errors: `docker-compose logs --since 7d`
- Monitor disk usage: `docker system df`

**Monthly**:
- Update base images: `docker-compose pull && docker-compose up -d`
- Clean unused images: `docker image prune`
- Backup database

**As Needed**:
- Review and rotate secrets
- Update application dependencies
- Scale services based on usage

### Monitoring

Consider integrating with monitoring tools:
- **Logging**: ELK stack, Fluentd, or similar
- **Metrics**: Prometheus + Grafana
- **Health Checks**: Automated monitoring of `/api/health` endpoint
- **Backups**: Automated database backup solutions