# Data Sets & Querying API Reference

Query datasets programmatically to retrieve data from your Holistics models.

## Get Data Set
```
GET /data_sets/{id}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| include_models | boolean | Include data model details |
| include_reports | boolean | Include query report details |

**Response:**
```json
{
  "data_set": {
    "id": 123,
    "name": "E-commerce Dataset",
    "label": "E-commerce",
    "description": "Orders and products data",
    "owner_id": 1,
    "owner": "admin@example.com",
    "tenant_id": 1,
    "data_source_id": 5,
    "category_id": 10,
    "uname": "ecommerce_dataset",
    "from_aml": true,
    "project_id": 1,
    "tags": ["sales", "products"],
    "data_models": [
      {
        "id": 456,
        "data_source_id": 5,
        "name": "orders",
        "label": "Orders",
        "category_id": 10,
        "table_name": "public.orders",
        "fields": [
          {"id": 1, "name": "id", "label": "Order ID", "type": "number"},
          {"id": 2, "name": "created_at", "label": "Created At", "type": "datetime"},
          {"id": 3, "name": "revenue", "label": "Revenue", "type": "number"}
        ],
        "dimensions": [
          {"id": 1, "name": "id", "label": "Order ID", "type": "number"}
        ],
        "measures": [
          {"id": 3, "name": "revenue", "label": "Revenue", "type": "number"}
        ]
      }
    ],
    "related_joins": [
      {
        "id": 789,
        "name": "orders_to_products",
        "link_type": "many_to_one",
        "join_on": "orders.product_id = products.id",
        "data_source_id": 5,
        "source_model_id": 456,
        "dest_model_id": 457
      }
    ],
    "permission": {
      "can_crud": true,
      "can_read": true
    }
  }
}
```

## Delete Data Set
```
DELETE /data_sets/{id}
```

**Note:** AML-created datasets must be deleted from Development, not via API.

## Submit Query
```
POST /data_sets/{id}/submit_query
```

Run a query against a dataset to retrieve data.

**Request Body:**
```json
{
  "query": {
    "metrics": [
      {
        "id": "total_revenue",
        "field": "orders.revenue",
        "aggregation": "sum"
      },
      {
        "id": "order_count",
        "field": "orders.id",
        "aggregation": "count"
      }
    ],
    "dimensions": [
      {
        "id": "order_month",
        "field": "orders.created_at",
        "transformation": "datetrunc month"
      },
      {
        "id": "product_category",
        "field": "products.category"
      }
    ],
    "filters": [
      {
        "field": "orders.status",
        "operator": "is",
        "values": ["completed"]
      },
      {
        "field": "orders.created_at",
        "operator": "after",
        "values": ["2024-01-01"]
      }
    ],
    "order": [
      { "id": "order_month", "order": "desc" },
      { "id": "total_revenue", "order": "desc" }
    ],
    "limit": 1000,
    "page": 1,
    "page_size": 100,
    "timezone": "America/New_York",
    "bust_cache": false
  }
}
```

**Response (Sync):**
```json
{
  "type": "DataModel.execute_model_query",
  "data": {
    "values": [
      ["2024-03", "Electronics", "45000", "150"],
      ["2024-03", "Clothing", "32000", "280"],
      ["2024-02", "Electronics", "42000", "145"]
    ],
    "meta": {
      "page": 1,
      "page_size": 100,
      "num_rows": 3
    },
    "fields": ["Order Month", "Category", "Total Revenue", "Order Count"]
  }
}
```

**Response (Async):** Returns `AsyncResult` with job ID for large queries.

## Generate SQL
```
POST /data_sets/{id}/generate_sql
```

Get the SQL that would be executed for a query (without running it).

**Request Body:** Same as `submit_query`

**Response:**
```json
{
  "sql": "SELECT DATE_TRUNC('month', orders.created_at) AS order_month, products.category AS product_category, SUM(orders.revenue) AS total_revenue, COUNT(orders.id) AS order_count FROM orders JOIN products ON orders.product_id = products.id WHERE orders.status = 'completed' AND orders.created_at > '2024-01-01' GROUP BY 1, 2 ORDER BY 1 DESC, 3 DESC LIMIT 1000"
}
```

---

## Query Structure

### Metrics

Metrics are aggregated values.

```json
{
  "id": "unique_id",
  "field": "model_name.field_name",
  "aggregation": "sum"
}
```

**Aggregation types:**
| Aggregation | Description |
|-------------|-------------|
| `sum` | Sum of values |
| `avg` | Average |
| `max` | Maximum |
| `min` | Minimum |
| `count` | Count of rows |
| `count distinct` | Unique count |
| `median` | Median value |
| `stdev` | Standard deviation |
| `stdevp` | Population std dev |
| `var` | Variance |
| `varp` | Population variance |
| `running sum` | Cumulative sum |
| `running avg` | Cumulative average |
| `running max` | Cumulative max |
| `running min` | Cumulative min |
| `custom` | Custom expression |

### Dimensions

Dimensions are grouping fields.

```json
{
  "id": "unique_id",
  "field": "model_name.field_name",
  "transformation": "datetrunc month"
}
```

**Date transformations:**
| Transformation | Description |
|----------------|-------------|
| `datetrunc year` | Group by year |
| `datetrunc quarter` | Group by quarter |
| `datetrunc month` | Group by month |
| `datetrunc week` | Group by week |
| `datetrunc day` | Group by day |
| `datetrunc hour` | Group by hour |
| `datetrunc minute` | Group by minute |

### Filters

Filters restrict the data returned.

```json
{
  "field": "model_name.field_name",
  "modifier": null,
  "operator": "is",
  "values": ["value1", "value2"]
}
```

**Filter operators:**

| Operator | Values | Description |
|----------|--------|-------------|
| `is` | 1+ values | Equals any value |
| `is_not` | 1+ values | Not equals any |
| `is_null` | [] | Is null |
| `not_null` | [] | Is not null |
| `greater_than` | [number] | > value |
| `less_than` | [number] | < value |
| `between` | [min, max] | Between range |
| `contains` | [string] | Contains text |
| `does_not_contain` | [string] | Not contains |
| `starts_with` | [string] | Starts with |
| `ends_with` | [string] | Ends with |
| `is_true` | [] | Boolean true |
| `is_false` | [] | Boolean false |
| `last` | [N, unit] | Last N days/weeks/months |
| `next` | [N, unit] | Next N days/weeks/months |
| `before` | [date] | Before date |
| `after` | [date] | After date |
| `matches` | [preset] | Date preset |

**Date filter examples:**
```json
// Last 7 days
{ "field": "orders.created_at", "operator": "last", "values": [7, "day"] }

// Last 3 months
{ "field": "orders.created_at", "operator": "last", "values": [3, "month"] }

// This year
{ "field": "orders.created_at", "operator": "matches", "values": ["this year"] }

// Last week
{ "field": "orders.created_at", "operator": "matches", "values": ["last week"] }

// After specific date
{ "field": "orders.created_at", "operator": "after", "values": ["2024-01-01"] }
```

### Order By

Sort results by metrics or dimensions.

```json
{
  "order": [
    { "id": "dimension_or_metric_id", "order": "asc" },
    { "id": "another_id", "order": "desc" }
  ]
}
```

### Pagination

```json
{
  "limit": 1000,
  "page": 1,
  "page_size": 100
}
```

- `limit`: Maximum total rows (1-1,000,000)
- `page`: Current page (1-based)
- `page_size`: Rows per page (max 1000, -1 for all)

### Other Options

```json
{
  "timezone": "America/New_York",
  "bust_cache": false
}
```

- `timezone`: IANA timezone (e.g., "America/New_York", "Asia/Singapore")
- `bust_cache`: Force fresh query (ignore cache)

---

## Data Models

### List Data Models
```
GET /data_models
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| project_id | integer | Yes | AML Project ID |
| branch_name | string | No | Branch name (ignored if commit_oid provided) |
| commit_oid | string | No | Specific commit |

**Response:**
```json
{
  "data_models": [
    {
      "id": 123,
      "name": "orders",
      "label": "Orders",
      "data_set_id": 456,
      "data_source_id": 789,
      "model_type": "query",
      "fields": [
        {
          "id": 1,
          "name": "id",
          "label": "Order ID",
          "category": "dimension"
        },
        {
          "id": 2,
          "name": "revenue",
          "label": "Revenue",
          "category": "measure"
        }
      ]
    }
  ]
}
```

---

## Data Sources

### Get Data Source
```
GET /data_sources/{id}
```

**Response:**
```json
{
  "data_source": {
    "id": 123,
    "name": "Production Database",
    "dbtype": "postgresql",
    "settings": {
      "require_ssl": true,
      "query_timeout": 300,
      "enable_schema_info": true,
      "timezone": "UTC"
    },
    "is_sample": false,
    "is_default": true
  }
}
```

### Update Data Source
```
PUT /data_sources/{id}
```

**Request Body:**
```json
{
  "data_source": {
    "name": "Production DB (Updated)",
    "settings": {
      "query_timeout": 600
    }
  }
}
```

### Delete Data Source
```
DELETE /data_sources/{id}
```

### Bust Exploration Cache
```
POST /data_sources/{id}/bust_exploration_cache
```

Invalidate all cached exploration/report results for this data source.

**Response:** Returns `AsyncResult` with job ID.

**Note:** This does not affect Model Storage persistence. Results will only be as fresh as persisted data.

### Upload dbt Manifest
```
POST /data_sources/upload_dbt_manifest
```

Upload a dbt manifest file to sync dbt metadata with Holistics.

**Note:** This endpoint is used for dbt integration. Contact Holistics support for usage details.
