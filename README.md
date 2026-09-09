# CRIMEWATCH — Crime & Safety Intelligence Platform

> **Understand Crime. Predict Risk. Build Safer Cities.**

A portfolio-level data analytics, geospatial analytics, and machine learning platform that transforms crime data into actionable intelligence through advanced analytics, interactive maps, and predictive risk insights.

**IMPORTANT:** All data in this platform is a **Synthetic Demo Dataset** — it is not real-world crime statistics.

---

## Project Overview

CRIMEWATCH is a full-stack intelligence platform built to demonstrate end-to-end data analytics capabilities: from database design and data cleaning to interactive visualization, geospatial analysis, and transparent machine-learning-based risk scoring.

### Problem Statement

Crime data is often complex, voluminous, and difficult to interpret. Decision-makers need tools that can:
- Aggregate and visualize crime patterns geographically and temporally
- Detect hotspots using clustering algorithms
- Calculate transparent risk scores from multiple factors
- Generate actionable reports for planning and resource allocation

CRIMEWATCH addresses these needs with a professional, production-quality interface.

---

## Features

- **Landing Page** — Futuristic command-center design with animated hero visualization
- **Authentication** — Supabase Auth with signup, login, password reset, and role-based access (ADMIN, ANALYST, VIEWER)
- **Dashboard** — KPI cards with trend indicators, interactive charts (trend, categories, severity, day/hour, top locations), and automated insights
- **Global Filter System** — Date range, crime type, severity, location, time range — affects all pages
- **Crime Explorer** — Paginated, sortable, searchable data table with column visibility, CSV/Excel export, and incident detail modal
- **Crime Map** — Interactive Leaflet map with severity-colored markers, popup details, layer modes (Normal, Heatmap, Hotspots, Risk Zones), and fullscreen
- **Hotspot Analysis** — DBSCAN clustering algorithm with hotspot cards showing incident count, dominant crime, peak time, and risk score
- **Analytics** — Temporal, geographic, category, severity, and comparative analytics with radar charts, radial bars, and trend visualizations
- **Risk Intelligence** — Transparent risk scoring with 6 weighted components, risk gauge, contributor analysis, and expandable methodology
- **Predictive Analytics** — Location/date/time/category-based risk prediction with confidence scoring and contributing factors
- **Safety Intelligence** — Route area analysis comparing historical risk between two locations
- **Reports** — 5 report types with CSV/Excel/JSON export, stored in database
- **Data Management** — CSV/Excel upload with validation, duplicate detection, coordinate validation, data quality indicators, and bulk import
- **Notifications** — In-app notification feed with mark read, mark all, and clear
- **Global Search** — Search incidents by ID, crime type, location, category
- **Settings** — Profile, theme (dark/light), notification preferences, data preferences
- **Responsive Design** — Full desktop command center, collapsible tablet sidebar, mobile navigation

---

## Architecture

```
Frontend (React + TypeScript + Vite)
├── Landing Page (public)
├── Auth Pages (login, register, forgot-password)
└── Dashboard (protected)
    ├── Dashboard — KPIs + charts + insights
    ├── Crime Explorer — data table
    ├── Crime Map — Leaflet interactive map
    ├── Analytics — advanced visualizations
    ├── Hotspots — DBSCAN clustering
    ├── Risk Intelligence — risk scoring
    ├── Predictions — predictive analytics
    ├── Reports — report generation
    ├── Data Management — CSV/Excel upload
    └── Settings — profile + preferences

Backend (Supabase)
├── PostgreSQL Database (8 tables)
├── Auth (email/password, role-based)
├── Row Level Security (per-table policies)
├── SECURITY DEFINER functions (role checks)
└── Auto-profile trigger on signup
```

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, CSS Variables |
| Animation | Framer Motion |
| Charts | Recharts |
| Maps | Leaflet, React-Leaflet, OpenStreetMap |
| Icons | Lucide React |
| Routing | React Router DOM |
| Backend | Supabase (PostgreSQL, Auth, RLS) |
| Data Processing | TypeScript analytics engine |
| ML/Clustering | DBSCAN (TypeScript implementation) |
| File Processing | PapaParse (CSV), SheetJS (Excel) |

---

## Database Schema

### Tables

1. **profiles** — Extends `auth.users` with role, full_name, theme, preferences
2. **crime_categories** — 10 crime types with severity weights
3. **locations** — 8 fictional districts with coordinates
4. **crime_incidents** — 10,000 synthetic incidents (core fact table)
5. **hotspots** — Geographic clusters with risk scores
6. **risk_scores** — Per-location risk with component breakdown
7. **reports** — User-generated reports (owner-scoped)
8. **notifications** — User notification feed (owner-scoped)

### Security

- RLS enabled on all tables
- `is_admin()` and `is_analyst_or_admin()` SECURITY DEFINER functions for policy checks
- profiles: readable by all authenticated, editable by owner
- Core data tables: readable by all authenticated, writable by ADMIN/ANALYST
- reports/notifications: owner-scoped CRUD
- Auto-profile creation trigger on user signup

---

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd crimewatch

# Install dependencies
npm install --legacy-peer-deps

# Run development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck
```

---

## Environment Variables

All Supabase environment variables are pre-configured. The `.env` file contains:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

See `.env.example` for the template.

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@crimewatch.io | CrimeWatch2026! |
| Analyst | analyst@crimewatch.io | CrimeWatch2026! |

You can also register a new account (defaults to VIEWER role).

---

## Dataset Format

The CSV/Excel upload expects these columns:

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| incident_id | text | Yes | Unique identifier |
| date | date | Yes | YYYY-MM-DD format |
| time | text | No | HH:MM format |
| crime_type | text | Yes | Crime type name |
| category | text | No | Defaults to crime_type |
| severity | text | Yes | Low, Medium, High, Critical |
| location | text | Yes | Location name |
| latitude | number | Yes | -90 to 90 |
| longitude | number | Yes | -180 to 180 |
| status | text | No | Open, Under Investigation, Closed, Arrested |

---

## Analytics Methodology

### Dashboard Analytics

All KPIs and charts are computed from the database in real-time:
- **Total Incidents**: Count of all filtered records
- **Incidents This Month**: Current calendar month count with month-over-month change
- **High Severity**: Count of High + Critical severity incidents
- **Crime Rate**: Incidents per 100 population equivalent
- **Risk Index**: Composite score (see Risk Score Methodology)

### Insight Engine

Automatically generates contextual insights based on filtered data:
- **Trend**: Compares last 3 months of data
- **Category**: Identifies dominant crime type and percentage
- **Geographic**: Compares top location density ratios
- **Severity**: Calculates high/critical percentage
- **Time**: Identifies peak hours and nighttime activity proportion

---

## Risk Score Methodology

The risk score (0-100) is calculated from six weighted components:

| Component | Weight | Description |
|-----------|--------|-------------|
| Crime Frequency | 25% | Total incidents relative to reference maximum (5,000) |
| Crime Severity | 20% | Average severity on 1-4 scale |
| Recent Activity | 20% | Incidents in last 30 days |
| Hotspot Density | 15% | Number of active hotspots in area |
| Nighttime Activity | 10% | Proportion of incidents 20:00-04:00 |
| Crime Trend | 10% | Recent vs earlier monthly average |

### Risk Levels

| Score Range | Level |
|-------------|-------|
| 0-20 | VERY LOW |
| 21-40 | LOW |
| 41-60 | MODERATE |
| 61-80 | HIGH |
| 81-100 | CRITICAL |

---

## ML Methodology

### DBSCAN Clustering

Hotspot detection uses a TypeScript implementation of DBSCAN (Density-Based Spatial Clustering of Applications with Noise):
- **eps**: 0.3 km (neighborhood radius)
- **minPts**: 10 (minimum points to form a cluster)
- **Distance**: Haversine formula (great-circle distance)

Clusters are ranked by incident count, with dominant crime type, average severity, peak time, and risk score computed per cluster.

### Predictive Analytics

The prediction engine filters historical incidents by location, time proximity (±3 hours), and seasonal match (same month), then applies the risk scoring algorithm to the filtered subset. Confidence is based on data volume available for the prediction context.

---

## API Documentation

The application uses Supabase's auto-generated REST API via the `@supabase/supabase-js` client. Key operations:

- `crime_incidents` — SELECT (paginated, filtered), INSERT (admin/analyst)
- `hotspots` — SELECT (all), INSERT/UPDATE/DELETE (admin/analyst)
- `risk_scores` — SELECT (all), INSERT/UPDATE/DELETE (admin/analyst)
- `reports` — SELECT/INSERT/UPDATE/DELETE (owner-scoped)
- `notifications` — SELECT/INSERT/UPDATE/DELETE (owner-scoped)
- `profiles` — SELECT (all authenticated), UPDATE (own profile)

---

## Limitations

- All data is **synthetic** — not real-world crime statistics
- Predictions are aggregate analytical estimates, not guaranteed outcomes
- The system does **not** predict individual criminal behavior
- The system does **not** use protected characteristics
- DBSCAN runs client-side on up to 3,000 points for performance
- No Python/FastAPI backend is deployed — ML is implemented in TypeScript
- Heatmap uses CircleMarker opacity overlay (not a true density heatmap library)

---

## Future Improvements

- Connect a Python FastAPI + Scikit-learn backend for advanced ML models
- Implement real-time crime feed via Supabase Realtime
- Add user-defined hotspot detection parameters
- Implement collaborative report sharing
- Add time-series forecasting (ARIMA, Prophet)
- Implement K-Means clustering alongside DBSCAN
- Add satellite imagery layer option for the map
- Implement data export to PDF with chart images
- Add multi-tenant organization support

---

## Ethical Statement

This system is designed for **aggregate crime-data analytics** only. It must not and does not:
- Identify people as criminals
- Predict individual criminal behavior
- Use protected characteristics for risk prediction
- Expose personally identifiable information
- Make discriminatory predictions
- Claim predictions are certain
- Present synthetic data as real statistics

All predictions include clear disclaimers stating they are analytical estimates based on historical patterns.

---

## License

This is a portfolio/demo project. All data is synthetic.
