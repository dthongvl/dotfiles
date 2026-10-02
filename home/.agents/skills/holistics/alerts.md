# Data Alerts API Reference

Data Alerts send automatic notifications when your data meets certain conditions.

## List Data Alerts
```
GET /data_alerts
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| before | string | Cursor for pagination |
| after | string | Cursor for pagination |
| limit | integer | Max items to return |
| search_term | string | Search by title |
| dest_type | string | Filter: `EmailDest`, `SlackDest` |
| source_type | string | Filter: `DashboardWidget`, `VizBlock` |
| source_id | integer/string | Filter by source ID |

**Response:**
```json
{
  "data_alerts": [
    {
      "id": 123,
      "title": "Low Inventory Alert",
      "source_type": "DashboardWidget",
      "source_id": 456,
      "dest": {
        "type": "EmailDest",
        "recipients": ["inventory@example.com"]
      },
      "schedule": {
        "repeat": "0 */4 * * *",
        "paused": false
      },
      "viz_conditions": [
        {
          "id": 1,
          "field_path": { "model": "products", "field": "stock_count" },
          "aggregation": "sum",
          "condition": {
            "operator": "less_than",
            "values": [100]
          }
        }
      ]
    }
  ],
  "next_cursor": "abc123"
}
```

## Get Data Alert
```
GET /data_alerts/{id}
```

## Create Data Alert
```
POST /data_alerts
```

### Email Alert Example
```json
{
  "data_alert": {
    "title": "Revenue Drop Alert",
    "source_type": "DashboardWidget",
    "source_id": 456,
    "dest": {
      "type": "EmailDest",
      "title": "⚠️ Revenue Alert - {{ today }}",
      "recipients": ["finance@example.com", "ceo@example.com"],
      "options": {
        "body_text": "Daily revenue has dropped below the threshold."
      }
    },
    "schedule": {
      "repeat": "0 18 * * *",
      "paused": false
    },
    "viz_conditions": [
      {
        "field_path": { "model": "orders", "field": "revenue" },
        "aggregation": "sum",
        "condition": {
          "operator": "less_than",
          "values": [10000]
        }
      }
    ],
    "dynamic_filter_presets": [
      {
        "dynamic_filter_id": 101,
        "condition": {
          "operator": "matches",
          "values": ["today"]
        }
      }
    ]
  }
}
```

### Slack Alert Example
```json
{
  "data_alert": {
    "title": "High Error Rate Alert",
    "source_type": "DashboardWidget",
    "source_id": 789,
    "dest": {
      "type": "SlackDest",
      "title": "🚨 Error Rate Alert",
      "message": "Error rate has exceeded 5%",
      "slack_channels": [
        { "id": "C01234567", "name": "engineering-alerts" }
      ]
    },
    "schedule": {
      "repeat": "*/15 * * * *",
      "paused": false
    },
    "viz_conditions": [
      {
        "field_path": { "model": "logs", "field": "error_rate" },
        "aggregation": "avg",
        "condition": {
          "operator": "greater_than",
          "values": [0.05]
        }
      }
    ]
  }
}
```

### Webhook Alert Example
```json
{
  "data_alert": {
    "title": "Order Threshold Alert",
    "source_type": "DashboardWidget",
    "source_id": 456,
    "dest": {
      "type": "WebhookDest",
      "endpoint": "https://api.example.com/webhooks/alerts"
    },
    "schedule": {
      "repeat": "0 * * * *",
      "paused": false
    },
    "viz_conditions": [
      {
        "field_path": { "model": "orders", "field": "id" },
        "aggregation": "count",
        "condition": {
          "operator": "greater_than",
          "values": [1000]
        }
      }
    ]
  }
}
```

## Update Data Alert
```
PUT /data_alerts/{id}
```

Same structure as create. Only include fields you want to update.

## Delete Data Alert
```
DELETE /data_alerts/{id}
```

## Execute Data Alert
```
POST /data_alerts/{id}/submit_execute
```

Trigger immediate evaluation and notification (if conditions met).

**Response:** Returns `AsyncResult` with job ID.

## Execute Test Data Alert
```
POST /data_alerts/submit_execute
```

Test an alert configuration without saving it.

**Request Body:**
```json
{
  "test_data_alert": {
    "title": "Test Alert",
    "source_type": "DashboardWidget",
    "source_id": 456,
    "dest": {
      "type": "EmailDest",
      "recipients": ["test@example.com"]
    },
    "schedule": {
      "repeat": "0 * * * *",
      "paused": false
    },
    "viz_conditions": [
      {
        "field_path": {"model": "orders", "field": "revenue"},
        "aggregation": "sum",
        "condition": {"operator": "less_than", "values": [1000]}
      }
    ]
  }
}
```

---

## Alert Conditions

### Viz Condition Structure

```json
{
  "field_path": {
    "model": "model_name",
    "field": "field_name"
  },
  "aggregation": "sum",
  "transformation": null,
  "condition": {
    "operator": "greater_than",
    "values": [1000]
  }
}
```

### Aggregation Types

| Aggregation | Description |
|-------------|-------------|
| `sum` | Sum of values |
| `avg` | Average of values |
| `max` | Maximum value |
| `min` | Minimum value |
| `count` | Count of records |
| `count distinct` | Count of unique values |
| `median` | Median value |
| `stdev` | Standard deviation |
| `stdevp` | Population standard deviation |
| `var` | Variance |
| `varp` | Population variance |
| `running sum` | Cumulative sum |
| `running avg` | Cumulative average |
| `running max` | Cumulative maximum |
| `running min` | Cumulative minimum |
| `custom` | Custom aggregation |

### Transformation Types (for dates)

| Transformation | Description |
|----------------|-------------|
| `datetrunc year` | Truncate to year |
| `datetrunc quarter` | Truncate to quarter |
| `datetrunc month` | Truncate to month |
| `datetrunc week` | Truncate to week |
| `datetrunc day` | Truncate to day |
| `datetrunc hour` | Truncate to hour |
| `datetrunc minute` | Truncate to minute |

### Condition Operators

**Numeric conditions:**
- `greater_than` - Value > threshold
- `less_than` - Value < threshold
- `between` - Value between two thresholds
- `is` - Value equals
- `is_not` - Value not equals

**Example: Revenue drops below $10,000:**
```json
{
  "field_path": { "model": "orders", "field": "revenue" },
  "aggregation": "sum",
  "condition": {
    "operator": "less_than",
    "values": [10000]
  }
}
```

**Example: Error rate exceeds 5%:**
```json
{
  "field_path": { "model": "events", "field": "error_rate" },
  "aggregation": "avg",
  "condition": {
    "operator": "greater_than",
    "values": [0.05]
  }
}
```

**Example: Order count between 100 and 500:**
```json
{
  "field_path": { "model": "orders", "field": "id" },
  "aggregation": "count",
  "condition": {
    "operator": "between",
    "values": [100, 500]
  }
}
```

---

## Alert Behavior

1. **Evaluation:** Alert runs on the configured schedule
2. **Condition Check:** All `viz_conditions` are evaluated (AND logic)
3. **Notification:** If ALL conditions are met, notification is sent
4. **No Match:** If conditions aren't met, no notification is sent

### Multiple Conditions

All conditions must be true for the alert to trigger:

```json
{
  "viz_conditions": [
    {
      "field_path": { "model": "orders", "field": "revenue" },
      "aggregation": "sum",
      "condition": { "operator": "less_than", "values": [10000] }
    },
    {
      "field_path": { "model": "orders", "field": "id" },
      "aggregation": "count",
      "condition": { "operator": "greater_than", "values": [0] }
    }
  ]
}
```

This alert triggers when revenue is below $10,000 AND there is at least 1 order.
