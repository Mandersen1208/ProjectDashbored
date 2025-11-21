# ProjectDashbored Frontend

Angular frontend application with PrimeNG for the JobHunter application.

## Features

- Job search interface with PrimeNG components
- Real-time job search results from backend API
- Responsive design with PrimeFlex
- PrimeNG data table with pagination, sorting, and filtering
- Modern UI with Lara Light Blue theme

## Prerequisites

- Node.js 20 or higher
- npm

## Development Setup

1. Install dependencies:
```bash
npm install --legacy-peer-deps
```

2. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:4200`. The backend API should be running on `http://localhost:8080`.

## Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Docker Deployment

Build and run with Docker:

```bash
# From the project root directory
docker-compose up -d frontend
```

The frontend will be available at `http://localhost:4200`.

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── job-search/          # Job search component
│   │   ├── models/                  # TypeScript interfaces
│   │   │   ├── job.model.ts
│   │   │   ├── search-params.model.ts
│   │   │   └── job-search-response.model.ts
│   │   ├── services/
│   │   │   └── job-search.service.ts # API service
│   │   ├── app.ts                   # Root component
│   │   ├── app.html                 # Root template
│   │   └── app.config.ts            # App configuration
│   ├── styles.scss                  # Global styles
│   └── index.html
├── proxy.conf.json                  # Development proxy config
├── nginx.conf                       # Production nginx config
└── Dockerfile                       # Multi-stage Docker build
```

## API Integration

The frontend communicates with the Spring Boot backend through:

- **Development**: Proxy configuration (`proxy.conf.json`) forwards `/api/*` to `http://localhost:8080`
- **Production**: Nginx configuration (`nginx.conf`) proxies `/api/*` to the backend container

## PrimeNG Components Used

- **Menubar**: Application navigation
- **Card**: Content containers
- **InputText**: Text input fields
- **Button**: Action buttons with loading states
- **Table**: Data display with sorting and pagination
- **Tag**: Status badges

## Customization

### Theme

To change the PrimeNG theme, edit `src/styles.scss`:

```scss
@import "primeng/resources/themes/lara-light-blue/theme.css";
```

Available themes: lara-light-blue, lara-dark-blue, md-light-indigo, bootstrap4-light-blue, etc.

### Colors

Edit CSS variables in `src/styles.scss`:

```scss
:root {
  --primary-color: #3B82F6;
  --surface-ground: #f8f9fa;
}
```

## Backend API Endpoint

The application expects the following endpoint:

- `GET /api/jobs/search?query={query}&location={location}`

## Troubleshooting

### Peer dependency conflicts

If you encounter peer dependency issues during installation, use:
```bash
npm install --legacy-peer-deps
```

### Backend connection issues

Ensure the Spring Boot backend is running on port 8080 before starting the frontend.

### Docker networking

The frontend container connects to the backend via the `jobhunter-network` Docker network.
