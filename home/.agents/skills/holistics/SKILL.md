---
name: holistics
description: >
  Interact with Holistics Business Intelligence API for data analytics, reporting, and dashboard management.
  Use this skill whenever the user wants to: work with Holistics dashboards, export reports or data,
  manage data schedules and alerts, query datasets programmatically, manage users/groups/permissions,
  work with AML (Analytics Modeling Language) projects, check dependencies of dashboards/datasets/models,
  or automate any Holistics operations.
  Trigger this skill when users mention: Holistics, BI dashboards, data schedules, data alerts,
  report exports, dataset queries, AML publishing, embedded analytics, dashboard dependencies,
  upstream dependencies, downstream dependencies, impact analysis, or any Holistics-specific terms
  like "dashboard widget", "data source", "query report", "data model", or "shareable link".
---

# Holistics API Skill

This skill enables programmatic interaction with the Holistics Business Intelligence platform via its REST API v2.

## Quick Start

### Authentication

All API requests require the `X-Holistics-Key` header with a valid API key:

```bash
curl -X GET \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Holistics-Key: YOUR_API_KEY" \
  https://secure.holistics.io/api/v2/users/me
```

### Data Center Regions

Choose the correct base URL for your data center:

| Region | Base URL |
|--------|----------|
| Asia-Pacific (APAC) | `https://secure.holistics.io/api/v2` |
| Europe (EU) | `https://eu.holistics.io/api/v2` |
| United States (US) | `https://us.holistics.io/api/v2` |
| Internal BI | `https://bi.holistics.io/api/v2` |

## Core Capabilities

### 1. Dashboards & Reporting
- List and retrieve dashboards
- Export dashboard widgets to CSV, XLSX, or PDF
- Preload dashboards for caching
- Build URLs with preset filter states
- Clone canvas dashboards

### 2. Data Schedules
- Create automated data delivery schedules
- Send reports via Email, Slack, SFTP, or Google Sheets
- Execute schedules on-demand
- Manage schedule settings and recipients

### 3. Data Alerts
- Set up conditional notifications
- Monitor data for threshold conditions
- Send alerts via Email, Slack, or Webhooks

### 4. Data Querying
- Run queries against datasets
- Generate SQL from dataset queries
- Apply filters, aggregations, and transformations
- Paginate large result sets

### 5. User & Group Management
- Invite and manage users
- Create and manage groups
- Assign roles and permissions
- Configure user attributes for row-level security

### 6. Development (AML)
- Publish AML projects to production
- Validate AML code before deployment

### 7. Dependency Analysis
- Find upstream dependencies (what a dashboard depends on: datasets, models, data sources)
- Find downstream dependencies (what objects depend on a dataset or model)
- Identify schedules and alerts attached to dashboards
- Perform impact analysis before modifying shared data objects

## API Patterns

### Async Operations (Jobs)

Many operations return an `AsyncResult` containing a `job_id`. Poll for status:

```bash
# Initial operation returns job info
POST /data_schedules/123/submit_execute
# Response: { "job": { "id": 456, "status": "queued" } }

# Poll for completion
GET /jobs/456
# Response: { "job": { "id": 456, "status": "success" } }

# Get result data
GET /jobs/456/result
```

Job statuses: `created`, `queued`, `running`, `success`, `failure`, `cancelled`, `cancelling`

### Pagination

List endpoints support cursor-based pagination:

```bash
GET /dashboards?limit=20
# Response includes: { "next_cursor": "abc123", "prev_cursor": null }

GET /dashboards?limit=20&after=abc123
```

### Filtering with Conditions

Many endpoints accept filter conditions:

```json
{
  "field": "orders.status",
  "operator": "is",
  "values": ["completed", "shipped"]
}
```

Supported operators:
- Equality: `is`, `is_not`, `is_null`, `not_null`
- Comparison: `greater_than`, `less_than`, `between`
- String: `contains`, `does_not_contain`, `starts_with`, `ends_with`
- Boolean: `is_true`, `is_false`
- Date: `last`, `next`, `before`, `after`, `matches`

## Common Workflows

### Export Dashboard Widget to CSV

```bash
# 1. Submit export job
POST /dashboard_widgets/123/submit_export
Content-Type: application/json
{
  "output": "csv",
  "dashboard_filter_conditions": []
}
# Response: { "job": { "id": 789 } }

# 2. Poll until complete
GET /jobs/789
# Wait for status: "success"

# 3. Download file
GET /exports/download?job_id=789
# Redirects to S3 download URL
```

### Query Dataset Programmatically

```bash
POST /data_sets/456/submit_query
Content-Type: application/json
{
  "query": {
    "metrics": [
      { "id": "total_revenue", "field": "orders.revenue", "aggregation": "sum" }
    ],
    "dimensions": [
      { "id": "order_date", "field": "orders.created_at", "transformation": "datetrunc month" }
    ],
    "filters": [
      { "field": "orders.status", "operator": "is", "values": ["completed"] }
    ],
    "order": [
      { "id": "order_date", "order": "asc" }
    ],
    "limit": 1000
  }
}
```

### Create Email Schedule

```bash
POST /data_schedules
Content-Type: application/json
{
  "data_schedule": {
    "title": "Daily Sales Report",
    "source_type": "Dashboard",
    "source_id": 123,
    "dest": {
      "type": "EmailDest",
      "recipients": ["team@example.com"],
      "title": "Daily Sales Report - {{ today }}",
      "options": { "body_text": "Please find attached today's sales report." }
    },
    "schedule": {
      "repeat": "0 9 * * *",
      "paused": false
    },
    "output": "pdf"
  }
}
```

### Check Dashboard Dependencies

Finding what a dashboard depends on (upstream) and what depends on it (downstream) requires traversing the object graph since dashboards contain widgets that reference query reports, which in turn reference datasets and models.

#### Upstream Dependencies (What the Dashboard Uses)

To find what data sources, datasets, and models a dashboard depends on:

1. **Get the dashboard** via `GET /dashboards/{id}` - extract the `widgets` array containing `id`, `source_id`, and `source_type` for each widget

2. **For each widget**, call `GET /dashboard_widgets/{id}?include_report=true` to get:
   - `query_report.data_set_id` - the dataset used
   - `query_report.data_source_id` - the underlying data source
   - `query_report.viz_setting.fields` - contains `path_hash.model_id` references showing which models are queried

3. **Get dataset details** via `GET /data_sets/{id}?include_models=true` to see all available models in the dataset

4. **Get data source info** via `GET /data_sources/{id}` to see the database type and connection

#### Downstream Dependencies (What Uses the Same Data)

The `/dependencies/downstream_dependencies` endpoint finds objects that depend on a given data object:

```
GET /dependencies/downstream_dependencies?type={type}&id={id}
```

**Parameters:**
- `type` (required): `DataSource`, `DataSet`, or `DataModel` (Dashboard is NOT supported)
- `id` (required): The object ID

**Response:**
```json
{
  "dependants": {
    "data_model_ids": [1, 2, 3],
    "data_set_ids": [5, 6],
    "dashboard_ids": [10, 11, 12],
    "query_report_ids": [20, 21],
    "dashboard_widget_ids": [30, 31, 32]
  }
}
```

Use this to find all dashboards and widgets that share the same underlying dataset.

#### Schedules and Alerts Using the Dashboard

To find automation dependencies:

1. **List schedules** via `GET /data_schedules?limit=100` and filter for entries where `source_id` equals the dashboard ID and `source_type` is `"Dashboard"`

2. **List alerts** via `GET /data_alerts?limit=100` and filter for entries where `source_id` equals the dashboard ID

3. **Get details** for each matching schedule/alert to see destination type (Email, Slack, Google Sheets, etc.) and schedule frequency

#### Workflow Summary

```
Dashboard URL → Extract ID → GET /dashboards/{id}
                                    ↓
                              widgets[]
                                    ↓
              GET /dashboard_widgets/{id}?include_report=true
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
            data_set_id                    data_source_id
                    ↓                               ↓
    GET /data_sets/{id}?include_models=true    GET /data_sources/{id}
                    ↓
    GET /dependencies/downstream_dependencies?type=DataSet&id={id}
                    ↓
            dependants.dashboard_widget_ids (other widgets using same data)

    GET /data_schedules → filter by source_id (schedules sending this dashboard)
    GET /data_alerts → filter by source_id (alerts monitoring this dashboard)
```

## Reference Documentation

For detailed endpoint documentation, read the appropriate reference file:

- **Dashboards, Widgets & Reports**: `dashboards.md`
- **Data Schedules**: `schedules.md`
- **Data Alerts**: `alerts.md`
- **Datasets, Models & Data Sources**: `datasets.md`
- **Users & Groups**: `users.md`
- **Development, Dependencies & AML**: `development.md` (includes `/dependencies/downstream_dependencies` endpoint)
- **Jobs & Exports**: `jobs.md`

## Error Handling

API errors return standard HTTP status codes:

| Code | Meaning |
|------|---------|
| 400 | Invalid parameters |
| 401 | Unauthorized (invalid/missing API key) |
| 403 | Permission denied |
| 404 | Resource not found |
| 422 | Invalid operation |
| 429 | Rate limit exceeded |

Error response format:
```json
{
  "error": "PermissionDeniedError",
  "message": "You don't have permission to access this resource"
}
```

## Tips for Success

1. **Always check job status** - Most data operations are async. Poll the job endpoint until completion.

2. **Use appropriate region** - Ensure you're calling the correct regional endpoint for your account.

3. **Handle pagination** - List endpoints are paginated. Use cursors to retrieve all results.

4. **Cache preloading** - Use dashboard preloading for frequently accessed dashboards to improve performance.

5. **Filter at source** - Apply filters in API calls rather than filtering results client-side.

6. **Monitor rate limits** - Watch for 429 responses and implement exponential backoff.
