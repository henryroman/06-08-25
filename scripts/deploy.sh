#!/bin/bash

echo " Deploying Heavenly Nails Website Builder Template..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "[INFO] "
}

print_success() {
    echo -e "[SUCCESS] "
}

print_warning() {
    echo -e "[WARNING] "
}

print_error() {
    echo -e "[ERROR] "
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_warning "Please create .env file with your API keys and database IDs"
    print_warning "Copy .env.example to .env and fill in your values"
    exit 1
fi

# Load environment variables
export 

# Check required environment variables
required_vars=("NOTION_TOKEN" "NOTION_CUSTOMERS_DB_ID" "NOTION_APPOINTMENTS_DB_ID")
for var in ""; do
    if [ -z "" ]; then
        print_error "Required environment variable  is not set"
        exit 1
    fi
done

print_status "Installing dependencies..."
npm install
if [ False -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

print_status "Building project with Google Places integration..."
npm run build
if [ False -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi

# Create PM2 ecosystem file
print_status "Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'demo-heavenly-nails',
    script: './dist/server/entry.mjs',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NOTION_TOKEN: '',
      NOTION_CUSTOMERS_DB_ID: '',
      NOTION_APPOINTMENTS_DB_ID: '',
      GOOGLE_PLACES_API_KEY: '',
      BUSINESS_NAME: ''
    }
  }]
}
EOF

print_status "Managing PM2 process..."
# Stop and delete existing process if it exists
pm2 delete demo-heavenly-nails 2>/dev/null || true

# Start new process
pm2 start ecosystem.config.js
if [ False -ne 0 ]; then
    print_error "Failed to start PM2 process"
    exit 1
fi

# Save PM2 configuration
pm2 save

print_status "Creating Nginx configuration..."
# Create Nginx site configuration
sudo tee /etc/nginx/sites-available/demo-heavenly-nails.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name demo-heavenly-nails.yourdomain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade ;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host System.Management.Automation.Internal.Host.InternalHost;
        proxy_set_header X-Real-IP ;
        proxy_set_header X-Forwarded-For ;
        proxy_set_header X-Forwarded-Proto ;
        proxy_cache_bypass ;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site and test Nginx configuration
print_status "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/demo-heavenly-nails.conf /etc/nginx/sites-enabled/

print_status "Testing Nginx configuration..."
sudo nginx -t
if [ False -ne 0 ]; then
    print_error "Nginx configuration test failed"
    exit 1
fi

print_status "Reloading Nginx..."
sudo systemctl reload nginx
if [ False -ne 0 ]; then
    print_error "Failed to reload Nginx"
    exit 1
fi

# Check if application is running
print_status "Checking application status..."
sleep 5
curl -f http://localhost:3000 > /dev/null
if [ False -ne 0 ]; then
    print_warning "Application may not be responding on port 3000"
    print_status "PM2 status:"
    pm2 status
else
    print_success "Application is running successfully!"
fi

print_success "Deployment completed successfully!"
echo ""
echo " Site should be available at: http://demo-heavenly-nails.yourdomain.com"
echo " Check PM2 status: pm2 status"
echo " View PM2 logs: pm2 logs demo-heavenly-nails"
echo " Restart application: pm2 restart demo-heavenly-nails"
echo ""
print_status "Next steps:"
echo "1. Point your domain to this server"
echo "2. Setup SSL certificate with Let's Encrypt:"
echo "   sudo certbot --nginx -d demo-heavenly-nails.yourdomain.com"
echo "3. Test the booking system with your Notion database"
