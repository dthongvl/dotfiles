# Development (AML) API Reference

Manage AML (Analytics Modeling Language) projects programmatically.

## Publish to Production
```
POST /aml_studio/projects/submit_publish
```

Deploy the AML project to production.

**Request Body:**
```json
{
  "object_mapping": {
    "datasets": {
      "123": "new_dataset_uname"
    }
  }
}
```

The `object_mapping` parameter associates deploying objects with orphan reporting objects during deployment.

**Response:** Returns `AsyncResult` with job ID.

### Checking Deployment Result

Poll the job to check deployment status:

```bash
GET /jobs/{job_id}
```

**Success Response:**
```json
{
  "job": {
    "id": 123,
    "status": "success",
    "type": "AmlStudio::Publish.call"
  }
}
```

**Failure Response:**
```json
{
  "job": {
    "id": 123,
    "status": "failure",
    "type": "AmlStudio::Publish.call"
  }
}
```

Get detailed failure information:

```bash
GET /jobs/{job_id}/result
```

**Failure Types:**

| Error Type | Description |
|------------|-------------|
| `syntax_error` | AML code has syntax errors |
| `dataset_mapping` | Dataset mapping conflicts |
| `dashboard_mapping` | Dashboard mapping issues |
| `dashboard_deployment` | Dashboard deployment failed |
| `aml_server_error` | Internal AML server error |

**Syntax Error Response:**
```json
{
  "type": "AmlStudio::Publish.call",
  "data": {
    "status": "error",
    "error_type": "syntax_error",
    "error_details": {
      "diagnostics": [
        {
          "category": "Error",
          "code": 1001,
          "message": "Unknown field 'invalid_field'",
          "file_path": "models/orders.aml",
          "start": 150,
          "end": 165
        }
      ]
    },
    "target_commit": "abc123def456"
  }
}
```

---

## Validate AML Project
```
POST /aml_studio/projects/submit_validate
```

Validate AML code without deploying.

**Request Body:**
```json
{
  "branch_name": "feature/new-model",
  "commit_oid": "abc123def456789"
}
```

Both `branch_name` and `commit_oid` are required.

**Response:** Returns `AsyncResult` with job ID.

### Checking Validation Result

```bash
GET /jobs/{job_id}/result
```

**Success Response:**
```json
{
  "type": "AmlStudio::RemoteObjectValidation.call",
  "data": null
}
```

**Failure Response:**
```json
{
  "type": "AmlStudio::RemoteObjectValidation.call",
  "data": {
    "status": "error",
    "errors": [
      {
        "file_path": "models/orders.aml",
        "message": "Field 'revenue' references unknown model 'products'",
        "line": 25,
        "column": 10
      }
    ]
  }
}
```

---

## Git Webhooks

Holistics supports webhook integrations with GitHub and GitLab for automated PR workflows.

### GitHub Webhook
```
POST /git_webhooks/github_event
```

Receives GitHub webhook events for pull requests and pushes.

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| X-GitHub-Event | Yes | Event type: `pull_request`, `push`, `ping` |
| X-GitHub-Hook-ID | Yes | Webhook ID |
| X-Hub-Signature-256 | Yes | HMAC signature for verification |

### GitLab Webhook
```
POST /git_webhooks/gitlab_event
```

Receives GitLab webhook events for merge requests and pushes.

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| X-Gitlab-Event | Yes | Event type |
| X-Gitlab-Token | Yes | Secret token for verification |

---

## Tags System

Organize content with tags defined in your AML project.

### List Production Tags
```
GET /tags
```

Returns all tags defined in your production `tags.aml` file.

**Response:**
```json
{
  "tags": [
    {
      "name": "sales",
      "description": "Sales-related dashboards and datasets",
      "color": "#4CAF50"
    },
    {
      "name": "finance",
      "description": "Financial reporting",
      "color": "#2196F3"
    }
  ]
}
```

### Add Tags to Object
```
POST /tags/submit_add_object_tags
```

**Request Body:**
```json
{
  "object_params": {
    "uname": "sales_dashboard",
    "type": "dashboard"
  },
  "tags": ["sales", "weekly"],
  "project_id": 1
}
```

Object types: `dataset`, `dashboard`

**Response:** Returns `AsyncResult` with job ID.

### Remove Tags from Object
```
POST /tags/submit_remove_object_tags
```

**Request Body:**
```json
{
  "object_params": {
    "uname": "sales_dashboard",
    "type": "dashboard"
  },
  "tags": ["weekly"],
  "project_id": 1
}
```

Pass an empty array to remove all tags:

```json
{
  "object_params": {
    "uname": "sales_dashboard",
    "type": "dashboard"
  },
  "tags": [],
  "project_id": 1
}
```

---

## Dependencies

### Get Downstream Dependencies
```
GET /dependencies/downstream_dependencies
```

Find objects that depend on a given object.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| type | string | Yes | `DataSource`, `DataSet`, `DataModel` |
| id | integer | Yes | Object ID |

**Response:**
```json
{
  "dependants": {
    "data_model_ids": [1, 2, 3],
    "data_set_ids": [5, 6],
    "dashboard_ids": [10, 11, 12],
    "query_report_ids": [20, 21]
  }
}
```

---

## Embedded Analytics

### Shorten Embed Token
```
POST /embed/{hashcode}/shorten_token
```

Create a shortened token for embed URLs that exceed browser limits.

**Parameters:**
| Name | In | Required | Description |
|------|------|----------|-------------|
| hashcode | path | Yes | Dashboard embed code |

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "shortened_token": "short_xyz123"
}
```

**Usage:** Replace the long token in your embed URL:
```
// Before
https://secure.holistics.io/embed/abc123?token=eyJhbGci...long_token

// After  
https://secure.holistics.io/embed/abc123?_token=short_xyz123
```

Note: Shortened tokens use `_token` parameter instead of `token`.

---

## Archivable Objects

### Get Recommended Archivable Objects
```
GET /tags/recommend_archivable_objects
```

Return a list of AML dashboards and datasets which have not been viewed for more than 30 days.

**Response:**
```json
{
  "archivable_objects": [
    {
      "id": 123,
      "title": "Old Dashboard",
      "type": "Dashboard",
      "description": "Legacy reporting dashboard",
      "tags": ["legacy", "sales"],
      "uname": "old_dashboard",
      "owner_name": "John Doe",
      "project_id": 1,
      "permissions": {
        "can_live_update": true,
        "can_edit": true
      },
      "last_viewed_at": "2024-01-15T10:00:00Z",
      "email_schedules_count": 2,
      "data_alerts_count": 0
    }
  ]
}
```

---

## Model Persistences

### Validate Custom DDL
```
POST /data_model_persistences/validate_ddl
```

Validate custom DDL for model persistence.

**Request Body:**
```json
{
  "ddl": "CREATE TABLE {{ table_name }} AS SELECT * FROM source_table"
}
```

**Success Response:**
```json
{
  "status": "success"
}
```

**Error Response:** Returns 422 with error details.
