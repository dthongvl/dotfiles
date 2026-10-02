# Jobs & Exports API Reference

Many Holistics operations are asynchronous and return a Job ID. Use these APIs to track job status and retrieve results.

## Jobs

### List Jobs
```
GET /jobs
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| ids | array | Yes | Job IDs (max 100). Format: `ids[]=1&ids[]=2` |
| include_data_source_stats | boolean | No | Include query statistics |
| include_source | boolean | No | Include source object info |

**Response:**
```json
{
  "jobs": [
    {
      "id": 123,
      "user_id": 1,
      "status": "success",
      "start_time": "2024-01-15T10:00:05Z",
      "end_time": "2024-01-15T10:00:30Z",
      "cancellable": false,
      "last_error_log": null,
      "existing_job_id": null,
      "data_source_stats": [
        {
          "id": "XoBDpSVo2mMsHiQHNrPtEtfnozm",
          "cost": "1681980",
          "cost_unit": "B"
        }
      ],
      "source": {
        "type": "Dashboard",
        "id": "456",
        "action": "view_viz",
        "details": {
          "block_id": "v1",
          "block_type": "VizBlock",
          "block_display_title": "Revenue Chart"
        }
      }
    }
  ]
}
```

**Note:** `data_source_stats` is only available for jobs running on Data Sources with Holistics Canal enabled (BigQuery, Athena). Shows query cost/bytes processed.

### Get Job
```
GET /jobs/{id}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| include_data_source_stats | boolean | Include query statistics |
| include_source | boolean | Include source object info |

**Response:**
```json
{
  "job": {
    "id": 123,
    "status": "running",
    "type": "DataSchedule.deliver",
    "created_at": "2024-01-15T10:00:00Z",
    "started_at": "2024-01-15T10:00:05Z",
    "finished_at": null,
    "error_message": null
  }
}
```

### Job Statuses

| Status | Description |
|--------|-------------|
| `created` | Job created, not yet queued |
| `queued` | Waiting in queue |
| `running` | Currently executing |
| `success` | Completed successfully |
| `failure` | Failed with error |
| `cancelled` | Cancelled by user |
| `cancelling` | Cancellation in progress |
| `already_existed` | Duplicate job (result available) |

### Get Job Logs
```
GET /jobs/{id}/logs
```

Retrieve execution logs for debugging.

**Response:**
```json
{
  "job_logs": [
    {
      "timestamp": "2024-01-15T10:00:05Z",
      "level": "info",
      "message": "Starting data schedule execution"
    },
    {
      "timestamp": "2024-01-15T10:00:10Z",
      "level": "info",
      "message": "Executing query on dataset 123"
    },
    {
      "timestamp": "2024-01-15T10:00:25Z",
      "level": "info",
      "message": "Generating PDF export"
    }
  ]
}
```

### Get Job Result
```
GET /jobs/{id}/result
```

Retrieve the result data of a completed job.

**Response varies by job type:**

**Query Result:**
```json
{
  "type": "DataModel.execute_model_query",
  "data": {
    "values": [
      ["2024-01", "10000"],
      ["2024-02", "12000"]
    ],
    "meta": {
      "page": 1,
      "page_size": 100,
      "num_rows": 2
    },
    "fields": ["Month", "Revenue"]
  }
}
```

**Deploy/Publish Result (Success):**
```json
{
  "type": "AmlStudio::Publish.call",
  "data": null
}
```

**Deploy/Publish Result (Failure):**
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

**Error types:** `syntax_error`, `dataset_mapping`, `dashboard_mapping`, `dashboard_deployment`, `aml_server_error`

---

## Exports

### Download Exported File
```
GET /exports/download
```

Download the file from a completed export job.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| job_id | integer | Yes | Export job ID |

**Response:**
- Status 302: Redirects to S3 download URL
- Status 422: Job not ready or not an export job

**Workflow:**
1. Submit an export job (e.g., `POST /dashboard_widgets/{id}/submit_export`)
2. Poll `GET /jobs/{job_id}` until `status` is `success`
3. Download via `GET /exports/download?job_id={job_id}`

**Example with cURL:**
```bash
# Follow redirects to download
curl -L -o report.csv \
  -H "X-Holistics-Key: YOUR_API_KEY" \
  "https://secure.holistics.io/api/v2/exports/download?job_id=123"
```

---

## Job Queues

### List Job Queues
```
GET /job_queues
```

View queue status and worker availability.

**Response:**
```json
{
  "job_queues": [
    {
      "name": "default",
      "total_workers": 10,
      "busy_workers": 3
    },
    {
      "name": "export",
      "total_workers": 5,
      "busy_workers": 2
    }
  ]
}
```

---

## Async Operations Reference

### Operations that Return AsyncResult

| Endpoint | Job Type | Description |
|----------|----------|-------------|
| `POST /data_schedules/{id}/submit_execute` | DataSchedule.deliver | Execute schedule |
| `POST /data_schedules/submit_execute` | DataSchedule.deliver | Test schedule |
| `POST /data_alerts/{id}/submit_execute` | DataAlert.deliver | Execute alert |
| `POST /data_alerts/submit_execute` | DataAlert.deliver | Test alert |
| `POST /dashboard_widgets/{id}/submit_export` | Export | Export widget |
| `POST /dashboards/{id}/submit_preload` | Dashboard.preload | Preload dashboard |
| `POST /dashboards/{id}/clone_canvas_dashboard` | Dashboard.clone | Clone dashboard |
| `POST /data_sets/{id}/submit_query` | DataModel.execute | Query dataset (large) |
| `POST /data_sources/{id}/bust_exploration_cache` | Cache.bust | Clear cache |
| `POST /aml_studio/projects/submit_publish` | AmlStudio::Publish | Deploy AML |
| `POST /aml_studio/projects/submit_validate` | AmlStudio::Validate | Validate AML |
| `POST /users/invite` | User.invite | Invite users |
| `POST /tags/submit_add_object_tags` | Tags.add | Add tags |
| `POST /tags/submit_remove_object_tags` | Tags.remove | Remove tags |

### Polling Pattern

```python
import time
import requests

def wait_for_job(api_key, job_id, timeout=300, poll_interval=2):
    """Poll a job until completion or timeout."""
    base_url = "https://secure.holistics.io/api/v2"
    headers = {"X-Holistics-Key": api_key}
    
    start_time = time.time()
    
    while True:
        if time.time() - start_time > timeout:
            raise TimeoutError(f"Job {job_id} timed out")
        
        response = requests.get(
            f"{base_url}/jobs/{job_id}",
            headers=headers
        )
        job = response.json()["job"]
        
        if job["status"] == "success":
            return job
        elif job["status"] == "failure":
            raise Exception(f"Job failed: {job.get('error_message')}")
        elif job["status"] in ["cancelled", "cancelling"]:
            raise Exception("Job was cancelled")
        
        time.sleep(poll_interval)
```

### Exponential Backoff

For production use, implement exponential backoff:

```python
def wait_for_job_with_backoff(api_key, job_id, max_wait=300):
    """Poll with exponential backoff."""
    base_url = "https://secure.holistics.io/api/v2"
    headers = {"X-Holistics-Key": api_key}
    
    wait_time = 1  # Start with 1 second
    total_waited = 0
    
    while total_waited < max_wait:
        response = requests.get(
            f"{base_url}/jobs/{job_id}",
            headers=headers
        )
        job = response.json()["job"]
        
        if job["status"] in ["success", "failure", "cancelled"]:
            return job
        
        time.sleep(wait_time)
        total_waited += wait_time
        wait_time = min(wait_time * 2, 30)  # Max 30 seconds between polls
    
    raise TimeoutError(f"Job {job_id} did not complete within {max_wait}s")
```

---

## Error Handling

### Job Errors

When a job fails, check the `error_message` field:

```json
{
  "job": {
    "id": 123,
    "status": "failure",
    "error_message": "Query execution timeout after 300 seconds"
  }
}
```

For detailed error information, call `GET /jobs/{id}/result`:

```json
{
  "type": "DataModel.execute_model_query",
  "data": {
    "error": "Query execution failed",
    "details": "Column 'invalid_field' does not exist in model 'orders'"
  }
}
```

### Export Errors

Export download returns 422 if:
- Job is not complete (status != success)
- Job is not an export job
- Export file has expired

```json
{
  "error": "InvalidOperationError",
  "message": "Export job is not ready. Current status: running"
}
```
