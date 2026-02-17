# Google Sheets CLI & API

Read, search, filter, and update the NearbyNearby project tracker spreadsheet from the command line or Python.

**Spreadsheet**: [NearbyNearby Project Tracker](https://docs.google.com/spreadsheets/d/1TXnwzQaY1RH7qWUCcFZzzlWMnrlAzBmwt7PekR8JrZg/edit)

**Script**: `scripts/google_sheets/sheets_client.py`

---

## Sheets

| Sheet | Alias(es) | GID | Contents |
|---|---|---|---|
| `PLAN` | `plan` | `1764392651` | 186 tasks — priority, status, assignments, dependencies, dates, PR# |
| `Feature Implementation List` | `features`, `impl`, `tests` | `0` | 500+ test cases by feature area |
| `Edge Cases Causing Failures` | `edge`, `bugs`, `edgecases` | `2034527177` | Bug log with reproduction steps |

---

## Setup (one-time)

```bash
pip install -r scripts/google_sheets/requirements.txt
```

First run opens a browser for Google OAuth. After that, `token.json` is cached.

---

## CLI Quick Reference

All commands use: `python -m scripts.google_sheets.sheets_client <command> [args]`

Shortened as `sheets` below for readability.

### Reading Data

| Command | What it does |
|---|---|
| `sheets cat plan` | Print entire PLAN sheet (TSV) |
| `sheets cat plan --json` | Print as JSON array of objects |
| `sheets cat plan --range A1:D5` | Print specific cell range |
| `sheets cat plan --columns "Task #" "Task Title" Status` | Only show specific columns |
| `sheets head plan` | First 10 data rows (formatted table) |
| `sheets head plan -n 20` | First 20 rows |
| `sheets tail plan` | Last 10 rows |
| `sheets tail bugs` | Last 10 edge cases |
| `sheets row plan 5` | Show row 5 as key:value pairs |
| `sheets row plan 5 --json` | Show row 5 as JSON |
| `sheets col plan Status` | Print all values in the Status column |
| `sheets col plan A` | Print all values in column A |
| `sheets headers plan` | List column headers with their letter |
| `sheets count plan` | Count data rows (excluding header) |
| `sheets info` | List all sheets with row/col counts |

### Searching (grep / find / filter)

| Command | What it does |
|---|---|
| `sheets grep plan "HTTP 500"` | Search all columns for "HTTP 500" |
| `sheets grep plan "Manav" -c "Assigned To"` | Search only Assigned To column |
| `sheets grep plan "P0" -c Priority` | All P0 priority tasks |
| `sheets grep plan "parking" --count` | Just print the match count |
| `sheets grep plan "fix\|bug" -c "Task Title"` | Regex OR search |
| `sheets grep plan "NN-57" -c Ticket --json` | Output matches as JSON |
| `sheets grep plan "restroom" -C "Task #" "Task Title" Status` | Show only specific columns in results |
| `sheets grep plan "Photo" -F` | Fixed string search (no regex) |
| `sheets grep plan "photo" -s` | Case-sensitive search |
| `sheets find plan Status "Not Started"` | Exact match: Status = "Not Started" |
| `sheets find plan "Assigned To" Manav` | Exact match: assigned to Manav |
| `sheets filter plan Status="Not Started" "Assigned To"=Manav` | AND filter: both conditions must match |
| `sheets filter plan Priority=P1 Category="Admin Backend"` | Multi-condition filter |
| `sheets summary plan Status` | Count by status (with percentages) |
| `sheets summary plan "Assigned To"` | Count by assignee |
| `sheets summary plan Priority` | Count by priority |
| `sheets summary plan Category` | Count by category |

### PLAN Task Shortcuts

| Command | What it does |
|---|---|
| `sheets task 1` | Get task #1 as JSON |
| `sheets task 55` | Get task #55 as JSON |
| `sheets status 1 "In Progress"` | Set task 1 status to "In Progress" |
| `sheets status 1 "Complete" -n "Fixed in commit abc123"` | Set status + notes |
| `sheets blocked-by 1` | Find tasks that depend on task #1 |
| `sheets blocked-by 2` | Find tasks that depend on task #2 |
| `sheets next-task` | Show next available task number (e.g. 113) |

### Writing Data

| Command | What it does |
|---|---|
| `sheets set plan 5 Status="In Progress"` | Update one column in row 5 |
| `sheets set plan 5 Status="Complete" Notes="Done"` | Update multiple columns |
| `sheets append plan "113,,NEW,New task,Description,Manav,P1,Not Started"` | Append a new row |
| `sheets clear plan H5:H10` | Clear cell contents (keeps formatting) |
| `sheets batch '[{"sheet":"plan","range":"H2","values":[["Done"]]},{"sheet":"plan","range":"H3","values":[["Done"]]}]'` | Batch update multiple cells at once |

### Edge Cases / Bugs

| Command | What it does |
|---|---|
| `sheets cat bugs` | List all edge cases |
| `sheets add-bug "Button X broken" "Detail page" "Click button X"` | Add a new bug |
| `sheets add-bug "Crash on save" "POI form" "Fill form, click save" -n "Only on mobile" -l "https://jira/NN-99"` | Add bug with notes + Jira link |

### Row Operations

| Command | What it does |
|---|---|
| `sheets insert-rows plan 50` | Insert 1 empty row after row 50 |
| `sheets insert-rows plan 50 --count 3` | Insert 3 empty rows after row 50 |
| `sheets delete-rows plan 50 52` | Delete rows 50-52 (inclusive) |

---

## Python API Reference

```python
from scripts.google_sheets.sheets_client import SheetsClient
client = SheetsClient()
```

### Metadata

```python
# List all sheets with dimensions
client.list_sheets()
# [{"name": "PLAN", "gid": 1764392651, "rows": 200, "cols": 13}, ...]

# Get column headers
client.headers("PLAN")
# ["Task #", "Ticket", "Category", "Task Title", ...]
```

### Reading

```python
# Read entire sheet as raw rows
rows = client.read_sheet("PLAN")           # Returns list[list[str]]
rows = client.read_sheet("plan", "A1:D5")  # Aliases work too

# Read as list of dicts (header-keyed)
tasks = client.read_as_dicts("PLAN")
# [{"Task #": "1", "Ticket": "NN-55 / NN-4", "Status": "Not Started", ...}, ...]

# Get single row by number
row = client.get_row("PLAN", 5)            # Returns list[str]

# Get all values in a column (by letter or header name)
statuses = client.get_column("PLAN", "Status")   # By header name
statuses = client.get_column("PLAN", "H")        # By letter

# Count data rows
n = client.count_rows("PLAN")                    # 112
```

### Searching

```python
# Grep — regex search across all columns or a specific column
results = client.grep("PLAN", "HTTP 500")
results = client.grep("PLAN", "parking", column="Task Title")
results = client.grep("PLAN", "P0", column="Priority", case_sensitive=True)
results = client.grep("PLAN", "special chars ()", fixed_string=True)
# Returns: [{"Task #": "1", ..., "_row": 2}, ...]

# Find — exact match on a column
results = client.find("PLAN", "Status", "Not Started")

# Filter — multiple column=value conditions (AND)
results = client.filter_rows("PLAN", {
    "Status": "Not Started",
    "Assigned To": "Manav",
    "Priority": "P1",
})

# Summary — count unique values in a column
counts = client.summary("PLAN", "Status")
# {"Not Started": 100, "In Progress": 8, "Complete": 4}

counts = client.summary("PLAN", "Assigned To")
# {"Manav": 60, "Robert": 40, "Rhonda": 12}
```

### Writing

```python
# Update specific cells
client.update_cells("PLAN", "H2", [["In Progress"]])
client.update_cells("PLAN", "H2:H4", [["Done"], ["Done"], ["In Progress"]])

# Update row by header names
client.update_row("PLAN", 5, {"Status": "Complete", "Notes": "Fixed"})

# Append rows
client.append_rows("PLAN", [["113", "", "NEW", "Task title", "Description"]])

# Clear range (keeps formatting)
client.clear_range("PLAN", "H5:H10")

# Batch update — multiple ranges in one API call
client.batch_update_cells([
    {"sheet": "PLAN", "range": "H2", "values": [["Done"]]},
    {"sheet": "PLAN", "range": "H3", "values": [["Done"]]},
    {"sheet": "PLAN", "range": "M2", "values": [["Fixed in commit abc"]]},
])
```

### Row Operations

```python
# Insert empty rows
client.insert_rows("PLAN", after_row=50, count=3)

# Delete rows (1-based, inclusive)
client.delete_rows("PLAN", start_row=50, end_row=52)
```

### PLAN Task Helpers

```python
# Get task by number
task = client.get_task_by_number(1)
# {"Task #": "1", "Status": "Not Started", ..., "_row": 2}

# Update task status (with optional notes)
client.update_task_status(1, "In Progress")
client.update_task_status(1, "Complete", notes="Fixed in commit abc123")

# Query tasks
client.tasks_by_status("Not Started")     # All not-started tasks
client.tasks_by_assignee("Manav")          # All Manav's tasks
client.tasks_by_priority("P0")             # All P0 tasks
client.tasks_by_category("CRITICAL BLOCKER")
client.tasks_blocked_by(1)                 # Tasks depending on task 1
client.next_task_number()                  # 113
```

### Edge Case Helpers

```python
client.add_edge_case(
    description="Button X does nothing on click",
    location="BusinessDetail page, action bar",
    test_method="Navigate to any business, click Button X",
    notes="Only on mobile Safari",
    link="https://jira/browse/NN-99",
)
```

---

## PLAN Sheet Column Reference

| Col | Letter | Type | Description |
|---|---|---|---|
| Task # | A | int | Sequential ID (1-186) |
| Ticket | B | str | Jira ticket (e.g. NN-57, NN-46) |
| Category | C | str | CRITICAL BLOCKER, Admin Backend, Business Free, Trails, Parks, Events Backend, etc. |
| Task Title | D | str | Short task name |
| Description | E | str | Full description |
| Assigned To | F | str | Manav, Robert, or Rhonda |
| Priority | G | str | P0 - Critical, P0, P1, P2, P3 |
| Status | H | str | Not Started, In Progress, Complete, Validation, Needs Rework, Blocked |
| Start Date | I | date | Planned start (M/D/YYYY) |
| Due Date | J | date | Planned due (M/D/YYYY) |
| Week | K | str | Sprint grouping (e.g. "Week 1 (Feb 5-7)") |
| Dependencies | L | str | Space-separated task numbers that must complete first |
| Notes | M | str | Additional context |
| PR# | N | int | Pull request number where work was completed |

## Edge Cases Sheet Column Reference

| Col | Letter | Description |
|---|---|---|
| Description | A | What the bug/edge case is |
| Location | B | Where in the app it occurs |
| Test Method | C | Steps to reproduce |
| Notes | D | Additional context |
| Link to Jira ticket | E | Jira link |

---

## Coding Agent Workflow

When a coding agent picks up a task:

```python
from scripts.google_sheets.sheets_client import SheetsClient
client = SheetsClient()

# 1. Read the task
task = client.get_task_by_number(5)
print(task["Description"])     # What to do
print(task["Dependencies"])    # What must be done first

# 2. Check dependencies are complete
for dep in task["Dependencies"].split():
    dep_task = client.get_task_by_number(int(dep))
    if dep_task["Status"] != "Complete":
        print(f"BLOCKED: Task {dep} is still {dep_task['Status']}")

# 3. Mark in progress
client.update_task_status(5, "In Progress")

# 4. Do the work...

# 5. If a bug is found during implementation, log it
client.add_edge_case(
    description="Save fails when field X is empty",
    location="POI form, save handler",
    test_method="Leave field X empty, click save",
)

# 6. Mark complete
client.update_task_status(5, "Complete", notes="Fixed in commit abc123")

# 7. Check what's unblocked now
newly_available = client.tasks_blocked_by(5)
for t in newly_available:
    print(f"Task {t['Task #']} is now unblocked: {t['Task Title']}")
```

### Quick Status Check (CLI)

```bash
# What's the overall progress?
python -m scripts.google_sheets.sheets_client summary plan Status

# What's left for Manav?
python -m scripts.google_sheets.sheets_client filter plan "Assigned To"=Manav Status="Not Started"

# What critical blockers remain?
python -m scripts.google_sheets.sheets_client filter plan Category="CRITICAL BLOCKER" Status="Not Started"

# What depends on the POI save fix (task 1)?
python -m scripts.google_sheets.sheets_client blocked-by 1
```
