# Data Schedules API Reference

Data Schedules enable automated delivery of dashboards and reports via email, Slack, SFTP, or Azure Data Lake.

## List Data Schedules
```
GET /data_schedules
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| before | string | Cursor for pagination |
| after | string | Cursor for pagination |
| limit | integer | Max items to return |
| search_term | string | Search by title |
| sort | string | `id_asc`, `id_desc`, `title_asc`, `title_desc`, `destination_asc`, `destination_desc` |
| dest_type | string | Filter: `EmailDest`, `SlackDest`, `Adls2Dest`, `SftpDest` |
| source_type | string | Filter: `QueryReport`, `Dashboard` |
| source_id | integer | Filter by source ID |

**Response:**
```json
{
  "data_schedules": [
    {
      "id": 123,
      "title": "Daily Sales Report",
      "source_type": "Dashboard",
      "source_id": 456,
      "dest": {
        "type": "EmailDest",
        "recipients": ["team@example.com"],
        "title": "Daily Sales Report"
      },
      "schedule": {
        "repeat": "0 9 * * *",
        "paused": false
      },
      "output": "pdf"
    }
  ],
  "next_cursor": "abc123"
}
```

## Get Data Schedule
```
GET /data_schedules/{id}
```

## Create Data Schedule
```
POST /data_schedules
```

### Email Destination Example
```json
{
  "data_schedule": {
    "title": "Weekly Sales Summary",
    "source_type": "Dashboard",
    "source_id": 123,
    "dest": {
      "type": "EmailDest",
      "title": "Weekly Sales - {{ today }}",
      "recipients": ["sales@example.com", "manager@example.com"],
      "options": {
        "body_text": "Please find attached the weekly sales summary."
      }
    },
    "schedule": {
      "repeat": "0 8 * * 1",
      "paused": false
    },
    "output": "pdf",
    "dynamic_filter_presets": [
      {
        "dynamic_filter_id": 101,
        "condition": {
          "operator": "matches",
          "values": ["last week"]
        }
      }
    ]
  }
}
```

### Slack Destination Example
```json
{
  "data_schedule": {
    "title": "Daily KPIs",
    "source_type": "Dashboard",
    "source_id": 123,
    "dest": {
      "type": "SlackDest",
      "title": "Daily KPIs Update",
      "message": "Here are today's key metrics",
      "slack_channels": [
        { "id": "C01234567", "name": "analytics" }
      ]
    },
    "schedule": {
      "repeat": "0 9 * * 1-5",
      "paused": false
    },
    "output": "png"
  }
}
```

### SFTP Destination Example
```json
{
  "data_schedule": {
    "title": "Data Export",
    "source_type": "DashboardWidget",
    "source_id": 789,
    "dest": {
      "type": "SftpDest",
      "host": "sftp.example.com",
      "port": 22,
      "username": "datauser",
      "password": "secret",
      "path": "/exports/daily/",
      "filename": "export_{{ today }}.csv"
    },
    "schedule": {
      "repeat": "0 2 * * *",
      "paused": false
    },
    "output": "csv"
  }
}
```

### Google Sheets Destination Example
```json
{
  "data_schedule": {
    "title": "Weekly Data Sync",
    "source_type": "DashboardWidget",
    "source_id": 789,
    "dest": {
      "type": "GsheetDest",
      "sheet_url": "https://docs.google.com/spreadsheets/d/abc123/edit",
      "sheet_title": "Data Export"
    },
    "schedule": {
      "repeat": "0 3 * * 1",
      "paused": false
    }
  }
}
```

## Update Data Schedule
```
PUT /data_schedules/{id}
```

Same structure as create. Only include fields you want to update.

## Delete Data Schedule
```
DELETE /data_schedules/{id}
```

## Execute Data Schedule
```
POST /data_schedules/{id}/submit_execute
```

Trigger immediate execution of a schedule.

**Response:** Returns `AsyncResult` with job ID.

## Execute Test Data Schedule
```
POST /data_schedules/submit_execute
```

Test a schedule configuration without saving it.

**Request Body:**
```json
{
  "test_data_schedule": {
    "id": null,
    "title": "Test Schedule",
    "source_type": "Dashboard",
    "source_id": 123,
    "dest": {
      "type": "EmailDest",
      "recipients": ["test@example.com"]
    },
    "schedule": {
      "repeat": "0 9 * * *",
      "paused": false
    },
    "output": "pdf"
  }
}
```

---

## Schedule Configuration

### Crontab Expression

The `repeat` field uses crontab syntax:
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6, Sunday = 0)
│ │ │ │ │
* * * * *
```

**Examples:**
- `0 9 * * *` - Every day at 9:00 AM
- `0 9 * * 1-5` - Weekdays at 9:00 AM
- `0 8 * * 1` - Every Monday at 8:00 AM
- `0 0 1 * *` - First day of each month at midnight
- `30 14 * * *` - Every day at 2:30 PM

**Tip:** Avoid scheduling at exact hours (e.g., 9:00) to prevent database overload and email spam filters. Use offset times like 9:01 or 9:05.

### Output Formats

| Format | Description |
|--------|-------------|
| `pdf` | PDF document |
| `csv` | CSV file |
| `xlsx` | Excel spreadsheet |
| `png` | PNG image |
| `inline` | Inline content (for email/Slack) |

### Dynamic Variables in Titles

Use these variables in `title` and `filename` fields:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{ today }}` | Current date | 2024-01-15 |
| `{{ yesterday }}` | Previous date | 2024-01-14 |
| `{{ now }}` | Current datetime | 2024-01-15 09:00:00 |

### Filter Presets

Apply filters when the schedule executes:

```json
{
  "dynamic_filter_presets": [
    {
      "dynamic_filter_id": 101,
      "condition": {
        "operator": "matches",
        "values": ["last week"]
      }
    },
    {
      "dynamic_filter_id": 102,
      "condition": {
        "operator": "is",
        "values": ["completed"]
      }
    }
  ]
}
```

---

## Source Types

### Dashboard
Exports the entire dashboard as PDF or PNG.

```json
{
  "source_type": "Dashboard",
  "source_id": 123
}
```

### DashboardWidget
Exports a specific widget. Supports CSV, XLSX, PDF.

```json
{
  "source_type": "DashboardWidget",
  "source_id": 456
}
```

### QueryReport
Exports a query report. Supports CSV, XLSX, PDF.

```json
{
  "source_type": "QueryReport",
  "source_id": 789
}
```
