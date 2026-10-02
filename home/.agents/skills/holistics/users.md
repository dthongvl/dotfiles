# Users & Groups API Reference

Manage users, groups, and permissions in your Holistics workspace.

## Users

### List Users
```
GET /users
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| before | string | Cursor for pagination |
| after | string | Cursor for pagination |
| limit | integer | Max items to return |
| search_term | string | Search by email, name, initials, or group name |
| status | string | Filter: `active`, `deleted`, `pending` |
| statuses | array | Filter by multiple statuses |
| ids | array | Filter by user IDs |
| role | string | Filter: `admin`, `analyst`, `explorer`, `viewer` |
| has_authentication_token | boolean | Users with API keys |
| exclude_deleted | boolean | Exclude deleted users |
| sort | string | `natural`, `id_asc`, `id_desc`, `name_asc`, `name_desc` |

**Response:**
```json
{
  "counters": {
    "total": 50,
    "by_role": {
      "admin": 2,
      "analyst": 10,
      "explorer": 15,
      "viewer": 23
    }
  },
  "users": [
    {
      "id": 123,
      "email": "john@example.com",
      "name": "John Doe",
      "initials": "JD",
      "role": "analyst",
      "is_deleted": false,
      "is_activated": true,
      "has_authentication_token": true,
      "allow_authentication_token": true,
      "enable_export_data": true,
      "current_sign_in_at": "2024-01-15T10:30:00Z",
      "last_sign_in_at": "2024-01-14T09:00:00Z",
      "created_at": "2023-06-01T08:00:00Z",
      "title": "Data Analyst",
      "job_title": "Senior Analyst",
      "group_ids": [1, 5, 10]
    }
  ],
  "groups": {
    "1": { "id": 1, "name": "Analytics Team" },
    "5": { "id": 5, "name": "Sales" },
    "10": { "id": 10, "name": "All Users" }
  },
  "next_cursor": "abc123"
}
```

### Get Current User
```
GET /users/me
```

Returns the currently authenticated user.

**Response:**
```json
{
  "user": {
    "id": 123,
    "email": "john@example.com",
    "name": "John Doe",
    "initials": "JD",
    "role": "analyst",
    "is_deleted": false,
    "is_activated": true,
    "has_authentication_token": true,
    "allow_authentication_token": true,
    "enable_export_data": true,
    "current_sign_in_at": "2024-01-15T10:30:00Z",
    "last_sign_in_at": "2024-01-14T09:00:00Z",
    "created_at": "2023-06-01T08:00:00Z",
    "title": "Data Analyst",
    "job_title": "Senior Analyst",
    "settings": {
      "personal": {
        "ai": {
          "auto_generate_charts": true,
          "include_past_conversations": false
        }
      }
    }
  }
}
```

### Update User
```
PUT /users/{id}
```

**Request Body:**
```json
{
  "user": {
    "name": "John Smith",
    "title": "Lead Analyst",
    "job_title": "Principal Data Analyst",
    "role": "analyst",
    "allow_authentication_token": true,
    "enable_export_data": true,
    "group_ids": [1, 5, 10],
    "settings": {
      "timezone": "America/New_York"
    }
  }
}
```

### Delete User (Soft Delete)
```
DELETE /users/{id}
```

Revokes access but retains user ownership of resources.

### Restore Deleted User
```
POST /users/{id}/restore
```

### Invite Users
```
POST /users/invite
```

**Request Body:**
```json
{
  "emails": ["new.user@example.com", "another.user@example.com"],
  "role": "explorer",
  "allow_authentication_token": false,
  "enable_export_data": true,
  "group_ids": [1, 5],
  "message": "Welcome to our Holistics workspace!"
}
```

**Response:** Returns `AsyncResult` with job ID.

### Resend Invitation
```
POST /users/{id}/resend_invite
```

Resend invitation email to a pending user.

**Response:** Returns `AsyncResult` with job ID.

### Revoke API Key
```
POST /users/{id}/revoke_authentication_token
```

Invalidates the user's API key.

### Check Email Usage
```
GET /users/check_holistics_user?email=user@example.com
```

**Response:**
```json
{
  "is_already_user": true
}
```

---

## User Roles

| Role | Description |
|------|-------------|
| `admin` | Full access, manage users and settings |
| `growth_admin` | Admin with usage-based billing |
| `analyst` | Create and manage reports/dashboards |
| `explorer` | Explore data, create personal reports |
| `viewer` | View-only access |

---

## Groups

### List Groups
```
GET /groups
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| before | string | Cursor for pagination |
| after | string | Cursor for pagination |
| limit | integer | Max items to return |
| sort | string | `natural`, `id_asc`, `id_desc` |
| include_users | boolean | Include user details |

**Response:**
```json
{
  "groups": [
    {
      "id": 1,
      "name": "Analytics Team",
      "user_ids": [123, 456, 789]
    }
  ],
  "users": {
    "123": {
      "id": 123,
      "email": "john@example.com",
      "name": "John Doe",
      "initials": "JD",
      "role": "analyst",
      "is_deleted": false,
      "is_activated": true
    },
    "456": {
      "id": 456,
      "email": "jane@example.com",
      "name": "Jane Smith",
      "initials": "JS",
      "role": "explorer",
      "is_deleted": false,
      "is_activated": true
    }
  },
  "next_cursor": "abc123"
}
```

### Get Group
```
GET /groups/{id}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| include_users | boolean | Include user information |

### Create Group
```
POST /groups
```

**Request Body:**
```json
{
  "group": {
    "name": "Marketing Team"
  }
}
```

### Update Group
```
PUT /groups/{id}
```

**Request Body:**
```json
{
  "group": {
    "name": "Marketing & Growth Team"
  }
}
```

### Delete Group
```
DELETE /groups/{id}
```

### Add User to Group
```
POST /groups/{id}/add_user/{user_id}
```

### Remove User from Group
```
POST /groups/{id}/remove_user/{user_id}
```

---

## User Attributes

User Attributes enable row-level security based on user properties.

### List User Attributes
```
GET /user_attributes
```

**Response:**
```json
{
  "user_attributes": [
    {
      "id": 1,
      "name": "h_email",
      "attribute_type": "text",
      "label": "Email",
      "description": "User's email address",
      "is_system_attribute": true
    },
    {
      "id": 2,
      "name": "region",
      "attribute_type": "text",
      "label": "Region",
      "description": "User's assigned region",
      "is_system_attribute": false
    }
  ]
}
```

### Create User Attribute
```
POST /user_attributes
```

**Request Body:**
```json
{
  "user_attribute": {
    "name": "department",
    "attribute_type": "text",
    "label": "Department",
    "description": "User's department for data access control"
  }
}
```

### Update User Attribute
```
PUT /user_attributes/{id}
```

### Delete User Attribute
```
DELETE /user_attributes/{id}
```

### List User Attribute Entries
```
GET /user_attribute_entries
```

Get attribute values for a user or group.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| subject_type | string | Yes | `User` or `Group` |
| subject_id | integer | Yes | User or Group ID |

**Response:**
```json
{
  "user_attribute_entries": [
    {
      "user_attribute_id": 2,
      "input_type": "manual",
      "subject_type": "User",
      "subject_id": 123
    }
  ]
}
```

### Set User Attribute Entries
```
PUT /user_attribute_entries
```

**Request Body (by attribute name):**
```json
{
  "user_attribute_entries": [
    {
      "user_attribute_name": "region",
      "input_type": "manual",
      "values": ["APAC", "EMEA"],
      "subject_type": "User",
      "subject_id": 123
    }
  ]
}
```

**Request Body (by attribute ID):**
```json
{
  "user_attribute_entries": [
    {
      "user_attribute_id": 2,
      "input_type": "manual",
      "values": ["APAC", "EMEA"],
      "subject_type": "User",
      "subject_id": 123
    }
  ]
}
```

**Input types:**
- `manual` - Manually set values
- `inherit` - Inherit from group
- `all` - All values (superuser access)

### Upsert User Attribute Entries
```
PUT /user_attribute_entries/upsert
```

Create or update attribute entries in a single operation.

**Request Body:**
```json
{
  "user_attribute_entries": [
    {
      "user_attribute_name": "region",
      "input_type": "manual",
      "values": ["APAC", "EMEA"],
      "subject_type": "User",
      "subject_id": 123
    }
  ]
}
```

### Compute User Attribute Values
```
GET /user_attribute_entries/computed_values
```

Get the effective attribute values for a user (after inheritance).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| user_id | integer | Yes | User ID |
| user_attribute_name | string | No | Specific attribute |
| user_attribute_id | integer | No | Specific attribute ID |

**Response:**
```json
{
  "computed_attribute_values": [
    {
      "user_attribute_id": 2,
      "values": ["APAC", "EMEA"]
    }
  ]
}
```

---

## Shareable Links

Public links for sharing dashboards without authentication.

### List Shareable Links
```
GET /shareable_links
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| sort | string | `natural`, `id_asc`, `id_desc` |
| resource_type | string | `Dashboard` |
| resource_id | integer | Dashboard ID |

### Create Shareable Link
```
POST /shareable_links
```

**Request Body:**
```json
{
  "shareable_link": {
    "resource_type": "Dashboard",
    "resource_id": 123,
    "description": "Public sales dashboard",
    "settings": {
      "hide_filters": false,
      "hide_export": true
    }
  }
}
```

### Get Shareable Link
```
GET /shareable_links/{id}
```

### Update Shareable Link
```
PUT /shareable_links/{id}
```

### Delete Shareable Link
```
DELETE /shareable_links/{id}
```
