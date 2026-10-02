# Dashboards & Widgets API Reference

## Dashboards

### List Dashboards
```
GET /dashboards
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| before | string | Cursor for pagination (get items before this) |
| after | string | Cursor for pagination (get items after this) |
| limit | integer | Max items to return (default varies) |
| sort | string | Sort order: `natural`, `id_asc`, `id_desc` |
| include_embed_info | boolean | Include embed information |

**Response:**
```json
{
  "dashboards": [
    {
      "id": 123,
      "owner_id": 1,
      "title": "Sales Dashboard",
      "category_id": 5,
      "version": 4,
      "url": "https://secure.holistics.io/dashboards/123",
      "tags": ["sales", "weekly"],
      "dynamic_filters": [
        {
          "id": 1,
          "uname": "date_filter",
          "order": 0,
          "definition": {
            "label": "Date Range",
            "filter_type": "date",
            "input_type": "single_select",
            "default_condition": {"operator": "matches", "values": ["last 7 days"]}
          },
          "mappings": []
        }
      ],
      "widgets": [
        {
          "id": 456,
          "source_id": 789,
          "source_type": "QueryReport",
          "source_title": "Revenue Chart",
          "permissions": {"can_explore": true, "can_export": true, "can_export_data": true}
        }
      ],
      "embed_info": {
        "hash_code": "abc123xyz",
        "secret_key": "sk_live_xxxxx"
      }
    }
  ],
  "next_cursor": "abc123",
  "prev_cursor": null
}
```

### Get Dashboard
```
GET /dashboards/{id}
```

**Response:**
```json
{
  "dashboard": {
    "id": 123,
    "owner_id": 1,
    "title": "Sales Dashboard",
    "category_id": 5,
    "version": 4,
    "dynamic_filters": [
      {
        "id": 1,
        "order": 0,
        "uname": "date_filter",
        "permissions": {"read": true, "crud": true, "use": true},
        "drillthrough_enabled": false,
        "definition": {
          "label": "Date Range",
          "filter_type": "date",
          "input_type": "single_select",
          "is_sharable": true,
          "default_condition": {"operator": "matches", "values": ["last 7 days"]},
          "filter_source": {
            "source_type": "DmFieldFilterSource",
            "data_set_id": 456,
            "field_path": {"field_name": "created_at", "model_id": 789}
          }
        },
        "mappings": [
          {
            "id": 100,
            "viz_conditionable_id": 456,
            "viz_conditionable_type": "DashboardWidget",
            "field_path": {"field_name": "created_at", "model_id": 789},
            "aggregation": null,
            "permissions": {"crud": true}
          }
        ]
      }
    ],
    "widgets": [
      {
        "id": 456,
        "source_id": 789,
        "source_type": "QueryReport",
        "source_title": "Revenue by Month",
        "permissions": {
          "can_explore": true,
          "can_export": true,
          "can_export_data": true
        }
      }
    ]
  }
}
```

### Delete Dashboard
```
DELETE /dashboards/{id}
```

**Response:**
```json
{
  "message": "Dashboard was deleted successfully."
}
```

### Build Dashboard URL with Preset Filters
```
POST /dashboards/{id}/build_url
```

Build a URL with pre-applied filter states.

**Request Body:**
```json
{
  "filter_states": [
    {
      "dynamic_filter_id": 101,
      "condition": {
        "operator": "is",
        "values": ["completed", "shipped"]
      }
    }
  ]
}
```

**Response:**
```json
{
  "dashboard_url": "https://secure.holistics.io/dashboards/123?fstate_hash=xyz789",
  "fstate_hash": "xyz789"
}
```

### Preload Dashboard
```
POST /dashboards/{id}/submit_preload
```

Execute all widgets and cache results for faster loading.

**Request Body:**
```json
{
  "dashboard_filter_conditions": [
    {
      "dynamic_filter_id": 101,
      "condition": {
        "operator": "matches",
        "values": ["last week"]
      }
    }
  ],
  "bust_cache": false
}
```

**Response:** Returns `AsyncResult` with job ID.

### List Dashboard Metadata
```
GET /dashboards/list_metadata
```

Get lightweight metadata for all accessible dashboards.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| version | integer/array | Filter by dashboard version(s) |
| permission_action | string | Filter by permission: `create`, `read`, `update`, `destroy` |

**Response:**
```json
{
  "dashboards_metadata": [
    {
      "id": 123,
      "title": "Sales Dashboard",
      "uname": "sales_dashboard",
      "project_id": 1,
      "version": 4
    }
  ]
}
```

### Clone Canvas Dashboard
```
POST /dashboards/{id}/clone_canvas_dashboard
```

**Request Body:**
```json
{
  "category_type": "personal",
  "category_id": null,
  "new_uname": "sales_dashboard_copy",
  "new_title": "Sales Dashboard (Copy)"
}
```

**Response:** Returns `AsyncResult` with job ID.

---

## Dashboard Widgets

### Get Dashboard Widget
```
GET /dashboard_widgets/{id}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| include_dashboard | boolean | Include parent dashboard info |
| include_report | boolean | Include report details |
| include_url | boolean | Include widget and dashboard URLs |

**Response:**
```json
{
  "dashboard_widget": {
    "id": 456,
    "source_id": 789,
    "source_type": "QueryReport",
    "source_title": "Revenue by Month",
    "permissions": {
      "can_explore": true,
      "can_export": true,
      "can_export_data": true
    },
    "url": "https://secure.holistics.io/widgets/456",
    "dashboard": {
      "id": 123,
      "owner_id": 1,
      "title": "Sales Dashboard",
      "category_id": 5,
      "version": 4,
      "url": "https://secure.holistics.io/dashboards/123",
      "tags": ["sales"],
      "dynamic_filters": [],
      "widgets": []
    },
    "query_report": {
      "id": 789,
      "title": "Revenue by Month",
      "data_set_id": 456,
      "data_source_id": 10,
      "owner_id": 1,
      "category_id": 5,
      "is_adhoc": false,
      "viz_setting": {
        "viz_type": "line_chart",
        "source_id": 456,
        "fields": {
          "x_axis": [{"field": "orders.created_at", "transformation": "datetrunc month"}],
          "y_axis": [{"field": "orders.revenue", "aggregation": "sum"}]
        },
        "settings": {"show_legend": true, "show_data_labels": false},
        "format": {},
        "filters": [],
        "hashid": "abc123"
      }
    }
  }
}
```

**Source Types:**
| Type | Description |
|------|-------------|
| `QueryReport` | A saved query report visualization |
| `QueryMetric` | A metric widget |
| `Text` | A text/markdown widget |
| `VizBlock` | An AML-defined visualization block |

### Delete Dashboard Widget
```
DELETE /dashboard_widgets/{id}
```

**Response:**
```json
{
  "message": "Dashboard Widget was deleted successfully."
}
```

### Export Dashboard Widget
```
POST /dashboard_widgets/{id}/submit_export
```

Export widget data to CSV, XLSX, or PDF.

**Request Body:**
```json
{
  "output": "csv",
  "dashboard_filter_conditions": [
    {
      "dynamic_filter_id": 101,
      "condition": {
        "operator": "is",
        "values": ["2024"]
      }
    }
  ]
}
```

**Response:** Returns `AsyncResult` with job ID.

**Output formats:** `csv`, `xlsx`, `pdf`

**Export Workflow:**
1. Call `submit_export` to start the job
2. Poll `GET /jobs/{job_id}` until status is `success`
3. Download via `GET /exports/download?job_id={job_id}`

---

## Dynamic Filters

Dashboards support dynamic filters that can be applied via API.

### Filter Types
- `number` - Numeric values
- `string` - Text values
- `date` - Date/datetime values
- `boolean` - True/false values
- `pop` - Period over period comparison
- `date_drill` - Date granularity drilling

### Filter Condition Structure
```json
{
  "dynamic_filter_id": 101,
  "condition": {
    "operator": "is",
    "values": ["value1", "value2"]
  }
}
```

### Common Filter Operators

**For all types:**
- `is` - Equals any of the values
- `is_not` - Not equals any of the values
- `is_null` - Value is null (values: [])
- `not_null` - Value is not null (values: [])

**For numbers:**
- `greater_than` - Greater than value
- `less_than` - Less than value
- `between` - Between two values

**For strings:**
- `contains` - Contains substring
- `does_not_contain` - Does not contain substring
- `starts_with` - Starts with string
- `ends_with` - Ends with string

**For dates:**
- `last` - Last N days/weeks/months
- `next` - Next N days/weeks/months
- `before` - Before date
- `after` - After date
- `matches` - Matches preset (e.g., "last week", "this month")

**For booleans:**
- `is_true` - Value is true
- `is_false` - Value is false

### Skip Default Filter
To skip a filter's default value:
```json
{
  "dynamic_filter_id": 101,
  "condition": {
    "operator": "none",
    "values": []
  }
}
```

---

## Query Reports

Query Reports are saved visualizations that can be embedded in dashboards as widgets.

### Get Query Report
```
GET /query_reports/{id}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| include_data_set | boolean | Include dataset details |

**Response:**
```json
{
  "query_report": {
    "id": 123,
    "title": "Monthly Revenue",
    "data_set_id": 456,
    "data_source_id": 789,
    "owner_id": 1,
    "category_id": 10,
    "is_adhoc": false,
    "viz_setting": {
      "viz_type": "line_chart",
      "source_id": 456,
      "fields": {
        "x_axis": [{"field": "orders.created_at", "transformation": "datetrunc month"}],
        "y_axis": [{"field": "orders.revenue", "aggregation": "sum"}],
        "legend": [{"field": "products.category"}]
      },
      "settings": {
        "show_legend": true,
        "show_data_labels": false,
        "legend_position": "bottom"
      },
      "format": {
        "orders.revenue": {"type": "currency", "currency": "USD"}
      },
      "filters": [
        {"field": "orders.status", "operator": "is", "values": ["completed"]}
      ],
      "hashid": "abc123",
      "custom_chart_id": null
    },
    "data_set": {
      "id": 456,
      "name": "E-commerce Dataset",
      "uname": "ecommerce_dataset"
    }
  }
}
```

### Viz Setting Structure

The `viz_setting` object defines how data is visualized:

| Field | Type | Description |
|-------|------|-------------|
| `viz_type` | string | Visualization type (see below) |
| `source_id` | integer | Dataset ID |
| `fields` | object | Field mappings for axes, legends, etc. |
| `settings` | object | Chart-specific display settings |
| `format` | object | Field formatting rules |
| `filters` | array | Inline filters applied to this report |
| `hashid` | string | Unique hash identifier |
| `adhoc_fields` | array | Calculated fields defined in the report |
| `custom_chart_id` | integer | Custom chart template ID (if applicable) |

### Visualization Types

| Type | Description |
|------|-------------|
| `data_table` | Tabular data display |
| `line_chart` | Line chart |
| `area_chart` | Area chart |
| `bar_chart` | Horizontal bar chart |
| `column_chart` | Vertical column chart |
| `pie_chart` | Pie/donut chart |
| `scatter_chart` | Scatter plot |
| `bubble_chart` | Bubble chart |
| `combination_chart` | Mixed chart types |
| `pivot_table` | Pivot table |
| `metric_kpi` | Single metric KPI |
| `metric_sheet` | Multiple metrics display |
| `funnel_chart` | Funnel visualization |
| `pyramid_chart` | Pyramid chart |
| `heatmap` | Heatmap |
| `retention_heatmap` | Retention cohort heatmap |
| `geo_heatmap` | Geographic heatmap |
| `filled_map` | Choropleth map |
| `point_map` | Point-based map |
| `radar_chart` | Radar/spider chart |
| `solid_gauge` | Gauge chart |
| `wordcloud` | Word cloud |
