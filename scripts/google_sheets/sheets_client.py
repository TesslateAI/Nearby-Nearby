"""
Google Sheets client for the NearbyNearby project tracker spreadsheet.

CLI usage:
    python -m scripts.google_sheets.sheets_client <command> [options]

Run with --help for full command list, or see README.md next to this file.
"""

import json
import re
import sys
from pathlib import Path
from typing import Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# If modifying scopes, delete token.json to re-authenticate.
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

SPREADSHEET_ID = "1TXnwzQaY1RH7qWUCcFZzzlWMnrlAzBmwt7PekR8JrZg"

SHEETS = {
    "PLAN": 1764392651,
    "Feature Implementation List": 0,
    "Edge Cases Causing Failures": 2034527177,
}

# Short aliases for CLI convenience
SHEET_ALIASES = {
    "plan": "PLAN",
    "features": "Feature Implementation List",
    "impl": "Feature Implementation List",
    "tests": "Feature Implementation List",
    "edge": "Edge Cases Causing Failures",
    "bugs": "Edge Cases Causing Failures",
    "edgecases": "Edge Cases Causing Failures",
}

_ROOT = Path(__file__).resolve().parent.parent.parent
_CREDENTIALS_PATH = _ROOT / "client_secret_228719498959-kdb6ki6rasgd44mt210sqoiilgm1b5l2.apps.googleusercontent.com.json"
_TOKEN_PATH = _ROOT / "token.json"


def _resolve_sheet_name(name: str) -> str:
    """Resolve a sheet name or alias to the canonical sheet name."""
    if name in SHEETS:
        return name
    lower = name.lower().replace(" ", "").replace("-", "").replace("_", "")
    if lower in SHEET_ALIASES:
        return SHEET_ALIASES[lower]
    for key in SHEETS:
        if key.lower().startswith(name.lower()):
            return key
    raise ValueError(
        f"Unknown sheet '{name}'. Valid: {list(SHEETS.keys())} "
        f"or aliases: {list(SHEET_ALIASES.keys())}"
    )


def _col_index_to_letter(index: int) -> str:
    """Convert 0-based column index to A1 letter(s). 0->A, 25->Z, 26->AA."""
    result = ""
    while True:
        result = chr(ord("A") + index % 26) + result
        index = index // 26 - 1
        if index < 0:
            break
    return result


def _get_credentials() -> Credentials:
    """Authenticate via OAuth2. Opens browser on first run, caches token after."""
    creds = None
    if _TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(_TOKEN_PATH), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not _CREDENTIALS_PATH.exists():
                print(f"ERROR: Credentials file not found at {_CREDENTIALS_PATH}")
                print("Download OAuth client JSON from Google Cloud Console.")
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(
                str(_CREDENTIALS_PATH), SCOPES
            )
            creds = flow.run_local_server(port=0)
        _TOKEN_PATH.write_text(creds.to_json())
    return creds


class SheetsClient:
    """Read/write interface to the NearbyNearby project tracker spreadsheet."""

    def __init__(self):
        creds = _get_credentials()
        service = build("sheets", "v4", credentials=creds)
        self._sheets = service.spreadsheets()

    # ── Metadata ─────────────────────────────────────────────────────

    def list_sheets(self) -> list[dict]:
        """List all sheet tabs with their names, gids, and dimensions.

        Returns:
            List of dicts with keys: name, gid, rows, cols.
        """
        meta = self._sheets.get(
            spreadsheetId=SPREADSHEET_ID,
            fields="sheets.properties",
        ).execute()
        result = []
        for s in meta.get("sheets", []):
            p = s["properties"]
            result.append({
                "name": p["title"],
                "gid": p["sheetId"],
                "rows": p.get("gridProperties", {}).get("rowCount", 0),
                "cols": p.get("gridProperties", {}).get("columnCount", 0),
            })
        return result

    def headers(self, sheet_name: str) -> list[str]:
        """Get the header row (row 1) of a sheet.

        Args:
            sheet_name: Sheet name or alias.

        Returns:
            List of column header strings.
        """
        sheet_name = _resolve_sheet_name(sheet_name)
        rows = self._sheets.values().get(
            spreadsheetId=SPREADSHEET_ID,
            range=f"'{sheet_name}'!1:1",
        ).execute()
        return rows.get("values", [[]])[0]

    # ── Read ─────────────────────────────────────────────────────────

    def read_sheet(
        self,
        sheet_name: str,
        range_suffix: str = "",
    ) -> list[list[str]]:
        """Read all data from a sheet (or a specific A1 range).

        Args:
            sheet_name: Sheet name or alias.
            range_suffix: Optional A1 range, e.g. "A1:H10". If empty, reads all.

        Returns:
            List of rows (each row is a list of cell value strings).
        """
        sheet_name = _resolve_sheet_name(sheet_name)
        range_str = f"'{sheet_name}'"
        if range_suffix:
            range_str += f"!{range_suffix}"
        result = self._sheets.values().get(
            spreadsheetId=SPREADSHEET_ID,
            range=range_str,
        ).execute()
        return result.get("values", [])

    def read_as_dicts(
        self,
        sheet_name: str,
        range_suffix: str = "",
    ) -> list[dict]:
        """Read sheet data as a list of dicts keyed by header names.

        Args:
            sheet_name: Sheet name or alias.
            range_suffix: Optional A1 range.

        Returns:
            List of dicts. Empty cells become "".
        """
        rows = self.read_sheet(sheet_name, range_suffix)
        if not rows:
            return []
        hdrs = rows[0]
        return [
            dict(zip(hdrs, r + [""] * (len(hdrs) - len(r))))
            for r in rows[1:]
        ]

    def get_row(self, sheet_name: str, row_number: int) -> list[str]:
        """Get a single row by its 1-based row number.

        Args:
            sheet_name: Sheet name or alias.
            row_number: 1-based row number.

        Returns:
            List of cell values for that row.
        """
        sheet_name = _resolve_sheet_name(sheet_name)
        result = self._sheets.values().get(
            spreadsheetId=SPREADSHEET_ID,
            range=f"'{sheet_name}'!{row_number}:{row_number}",
        ).execute()
        vals = result.get("values", [])
        return vals[0] if vals else []

    def get_column(self, sheet_name: str, col: str) -> list[str]:
        """Get all values in a single column.

        Args:
            sheet_name: Sheet name or alias.
            col: Column letter (e.g. "A") or header name (e.g. "Status").

        Returns:
            List of values (including header as first element).
        """
        sheet_name = _resolve_sheet_name(sheet_name)
        # If col is a header name, resolve to letter
        if len(col) > 2 or not col.isalpha():
            hdrs = self.headers(sheet_name)
            for i, h in enumerate(hdrs):
                if h.lower() == col.lower():
                    col = _col_index_to_letter(i)
                    break
            else:
                raise ValueError(f"Column '{col}' not found. Headers: {hdrs}")
        result = self._sheets.values().get(
            spreadsheetId=SPREADSHEET_ID,
            range=f"'{sheet_name}'!{col}:{col}",
        ).execute()
        return [r[0] if r else "" for r in result.get("values", [])]

    def count_rows(self, sheet_name: str) -> int:
        """Count data rows (excluding header).

        Args:
            sheet_name: Sheet name or alias.

        Returns:
            Number of data rows.
        """
        rows = self.read_sheet(sheet_name)
        return max(0, len(rows) - 1)

    # ── Search / Filter (grep-like) ──────────────────────────────────

    def grep(
        self,
        sheet_name: str,
        pattern: str,
        column: str = "",
        case_sensitive: bool = False,
        fixed_string: bool = False,
    ) -> list[dict]:
        """Search for rows matching a pattern (like grep).

        Args:
            sheet_name: Sheet name or alias.
            pattern: Regex pattern or fixed string to search for.
            column: Optional column letter or header name to limit search to.
                    If empty, searches all columns.
            case_sensitive: Whether the search is case-sensitive (default: False).
            fixed_string: If True, treat pattern as literal string, not regex.

        Returns:
            List of matching rows as dicts with headers as keys.
            Each dict also has a "_row" key with the 1-based sheet row number.
        """
        rows = self.read_sheet(sheet_name)
        if not rows:
            return []

        sheet_name = _resolve_sheet_name(sheet_name)
        hdrs = rows[0]

        # Resolve column filter
        col_idx = None
        if column:
            if column.isalpha() and len(column) <= 2:
                col_idx = 0
                for ch in column.upper():
                    col_idx = col_idx * 26 + (ord(ch) - ord("A"))
            else:
                for i, h in enumerate(hdrs):
                    if h.lower() == column.lower():
                        col_idx = i
                        break
                else:
                    raise ValueError(f"Column '{column}' not found. Headers: {hdrs}")

        flags = 0 if case_sensitive else re.IGNORECASE
        if fixed_string:
            pattern = re.escape(pattern)
        compiled = re.compile(pattern, flags)

        results = []
        for row_idx, row in enumerate(rows[1:], start=2):
            padded = row + [""] * (len(hdrs) - len(row))
            cells_to_search = [padded[col_idx]] if col_idx is not None else padded
            if any(compiled.search(cell) for cell in cells_to_search):
                d = dict(zip(hdrs, padded))
                d["_row"] = row_idx
                results.append(d)

        return results

    def find(
        self,
        sheet_name: str,
        column: str,
        value: str,
    ) -> list[dict]:
        """Find rows where a column exactly equals a value.

        Args:
            sheet_name: Sheet name or alias.
            column: Column letter or header name.
            value: Exact value to match (case-insensitive).

        Returns:
            List of matching rows as dicts with "_row" key.
        """
        return self.grep(
            sheet_name, f"^{re.escape(value)}$",
            column=column, case_sensitive=False
        )

    def filter_rows(
        self,
        sheet_name: str,
        filters: dict[str, str],
    ) -> list[dict]:
        """Filter rows by multiple column=value conditions (AND logic).

        Args:
            sheet_name: Sheet name or alias.
            filters: Dict of {column_name: value} pairs. All must match.

        Returns:
            List of matching rows as dicts with "_row" key.
        """
        all_rows = self.read_as_dicts(sheet_name)
        if not all_rows:
            return []

        results = []
        for i, row in enumerate(all_rows, start=2):
            match = True
            for col, val in filters.items():
                cell = ""
                for k in row:
                    if k.lower() == col.lower():
                        cell = row[k]
                        break
                if cell.lower() != val.lower():
                    match = False
                    break
            if match:
                row["_row"] = i
                results.append(row)
        return results

    def summary(self, sheet_name: str, column: str) -> dict[str, int]:
        """Count occurrences of each unique value in a column (like value_counts).

        Args:
            sheet_name: Sheet name or alias.
            column: Column letter or header name.

        Returns:
            Dict of {value: count}, sorted by count descending.
        """
        vals = self.get_column(sheet_name, column)
        if not vals:
            return {}
        # Skip header
        data = vals[1:]
        counts: dict[str, int] = {}
        for v in data:
            v = v.strip()
            if v:
                counts[v] = counts.get(v, 0) + 1
        return dict(sorted(counts.items(), key=lambda x: -x[1]))

    # ── Write ────────────────────────────────────────────────────────

    def update_cells(
        self,
        sheet_name: str,
        range_suffix: str,
        values: list[list[str]],
    ) -> dict:
        """Update specific cells in a sheet.

        Args:
            sheet_name: Sheet name or alias.
            range_suffix: A1 notation, e.g. "H2" or "H2:H5".
            values: 2D list of values to write.

        Returns:
            API response with updatedCells count.
        """
        sheet_name = _resolve_sheet_name(sheet_name)
        result = self._sheets.values().update(
            spreadsheetId=SPREADSHEET_ID,
            range=f"'{sheet_name}'!{range_suffix}",
            valueInputOption="USER_ENTERED",
            body={"values": values},
        ).execute()
        return result

    def update_row(
        self,
        sheet_name: str,
        row_number: int,
        values: dict[str, str],
    ) -> dict:
        """Update specific columns in a row by header name.

        Args:
            sheet_name: Sheet name or alias.
            row_number: 1-based row number (2 = first data row).
            values: Dict of {header_name: new_value}.

        Returns:
            API response.
        """
        sheet_name = _resolve_sheet_name(sheet_name)
        hdrs = self.headers(sheet_name)
        result = None
        for col_name, val in values.items():
            col_idx = None
            for i, h in enumerate(hdrs):
                if h.lower() == col_name.lower():
                    col_idx = i
                    break
            if col_idx is None:
                raise ValueError(f"Column '{col_name}' not found. Headers: {hdrs}")
            col_letter = _col_index_to_letter(col_idx)
            result = self.update_cells(
                sheet_name, f"{col_letter}{row_number}", [[val]]
            )
        return result

    def append_rows(
        self,
        sheet_name: str,
        rows: list[list[str]],
    ) -> dict:
        """Append rows to the bottom of a sheet.

        Args:
            sheet_name: Sheet name or alias.
            rows: List of rows (each row is a list of cell values).

        Returns:
            API response.
        """
        sheet_name = _resolve_sheet_name(sheet_name)
        result = self._sheets.values().append(
            spreadsheetId=SPREADSHEET_ID,
            range=f"'{sheet_name}'",
            valueInputOption="USER_ENTERED",
            insertDataOption="INSERT_ROWS",
            body={"values": rows},
        ).execute()
        return result

    def clear_range(
        self,
        sheet_name: str,
        range_suffix: str,
    ) -> dict:
        """Clear cell contents in a range (keeps formatting).

        Args:
            sheet_name: Sheet name or alias.
            range_suffix: A1 range to clear, e.g. "H2:H10".

        Returns:
            API response.
        """
        sheet_name = _resolve_sheet_name(sheet_name)
        result = self._sheets.values().clear(
            spreadsheetId=SPREADSHEET_ID,
            range=f"'{sheet_name}'!{range_suffix}",
        ).execute()
        return result

    def batch_update_cells(
        self,
        updates: list[dict],
    ) -> dict:
        """Update multiple ranges in one API call.

        Args:
            updates: List of dicts with keys: sheet, range, values.
                     e.g. [{"sheet": "PLAN", "range": "H2", "values": [["Done"]]}]

        Returns:
            API response.
        """
        data = []
        for u in updates:
            sn = _resolve_sheet_name(u["sheet"])
            data.append({
                "range": f"'{sn}'!{u['range']}",
                "values": u["values"],
            })
        result = self._sheets.values().batchUpdate(
            spreadsheetId=SPREADSHEET_ID,
            body={"valueInputOption": "USER_ENTERED", "data": data},
        ).execute()
        return result

    # ── Row operations ───────────────────────────────────────────────

    def insert_rows(
        self,
        sheet_name: str,
        after_row: int,
        count: int = 1,
    ) -> dict:
        """Insert empty rows after a given row number.

        Args:
            sheet_name: Sheet name or alias.
            after_row: Insert after this 1-based row number.
            count: Number of rows to insert.

        Returns:
            API response.
        """
        sheet_name = _resolve_sheet_name(sheet_name)
        gid = SHEETS[sheet_name]
        result = self._sheets.batchUpdate(
            spreadsheetId=SPREADSHEET_ID,
            body={"requests": [{
                "insertDimension": {
                    "range": {
                        "sheetId": gid,
                        "dimension": "ROWS",
                        "startIndex": after_row,
                        "endIndex": after_row + count,
                    },
                    "inheritFromBefore": True,
                }
            }]},
        ).execute()
        return result

    def delete_rows(
        self,
        sheet_name: str,
        start_row: int,
        end_row: int,
    ) -> dict:
        """Delete rows from start_row to end_row (1-based, inclusive).

        Args:
            sheet_name: Sheet name or alias.
            start_row: First row to delete (1-based).
            end_row: Last row to delete (1-based, inclusive).

        Returns:
            API response.
        """
        sheet_name = _resolve_sheet_name(sheet_name)
        gid = SHEETS[sheet_name]
        result = self._sheets.batchUpdate(
            spreadsheetId=SPREADSHEET_ID,
            body={"requests": [{
                "deleteDimension": {
                    "range": {
                        "sheetId": gid,
                        "dimension": "ROWS",
                        "startIndex": start_row - 1,
                        "endIndex": end_row,
                    }
                }
            }]},
        ).execute()
        return result

    # ── PLAN-specific helpers ────────────────────────────────────────

    def get_task_by_number(self, task_number: int) -> Optional[dict]:
        """Get a single task from PLAN by Task # column.

        Returns:
            Dict with headers as keys + "_row", or None if not found.
        """
        rows = self.read_sheet("PLAN")
        if not rows:
            return None
        hdrs = rows[0]
        for row_idx, row in enumerate(rows[1:], start=2):
            if row and row[0] == str(task_number):
                d = dict(zip(hdrs, row + [""] * (len(hdrs) - len(row))))
                d["_row"] = row_idx
                return d
        return None

    def update_task_status(
        self,
        task_number: int,
        status: str,
        notes: str = "",
    ) -> Optional[dict]:
        """Update Status (and optionally Notes) of a PLAN task.

        Args:
            task_number: Task number (column A).
            status: New status (e.g. "In Progress", "Complete", "Not Started").
            notes: Optional notes for column M.

        Returns:
            API response, or None if not found.
        """
        rows = self.read_sheet("PLAN")
        if not rows:
            return None
        hdrs = rows[0]
        status_col = notes_col = None
        for i, h in enumerate(hdrs):
            if h == "Status":
                status_col = i
            if h == "Notes":
                notes_col = i
        if status_col is None:
            raise ValueError("Could not find 'Status' column")

        for row_idx, row in enumerate(rows[1:], start=2):
            if row and row[0] == str(task_number):
                col_letter = _col_index_to_letter(status_col)
                result = self.update_cells("PLAN", f"{col_letter}{row_idx}", [[status]])
                if notes and notes_col is not None:
                    nl = _col_index_to_letter(notes_col)
                    self.update_cells("PLAN", f"{nl}{row_idx}", [[notes]])
                return result
        return None

    def tasks_by_status(self, status: str) -> list[dict]:
        """Get all PLAN tasks matching a status."""
        return self.find("PLAN", "Status", status)

    def tasks_by_assignee(self, assignee: str) -> list[dict]:
        """Get all PLAN tasks assigned to someone."""
        return self.grep("PLAN", assignee, column="Assigned To")

    def tasks_by_priority(self, priority: str) -> list[dict]:
        """Get all PLAN tasks matching a priority (e.g. 'P0', 'P1')."""
        return self.grep("PLAN", priority, column="Priority")

    def tasks_by_category(self, category: str) -> list[dict]:
        """Get all PLAN tasks in a category."""
        return self.grep("PLAN", category, column="Category")

    def tasks_blocked_by(self, task_number: int) -> list[dict]:
        """Find tasks that depend on a given task number."""
        return self.grep("PLAN", rf"\b{task_number}\b", column="Dependencies")

    def next_task_number(self) -> int:
        """Get the next available task number for PLAN."""
        col = self.get_column("PLAN", "A")
        nums = [int(v) for v in col[1:] if v.isdigit()]
        return max(nums) + 1 if nums else 1

    # ── Edge Cases helper ────────────────────────────────────────────

    def add_edge_case(
        self,
        description: str,
        location: str,
        test_method: str,
        notes: str = "",
        link: str = "",
    ) -> dict:
        """Add a new bug to Edge Cases Causing Failures."""
        return self.append_rows(
            "Edge Cases Causing Failures",
            [[description, location, test_method, notes, link]],
        )


# ── CLI ──────────────────────────────────────────────────────────────

def _fmt_table(rows: list[dict], columns: list[str] = None) -> str:
    """Format dicts as an aligned text table."""
    if not rows:
        return "(no results)"
    if columns:
        rows = [{k: r.get(k, "") for k in columns} for r in rows]
    keys = [k for k in rows[0] if k != "_row"]
    widths = {k: len(k) for k in keys}
    for r in rows:
        for k in keys:
            widths[k] = max(widths[k], len(str(r.get(k, ""))))
    # Cap column widths
    for k in widths:
        widths[k] = min(widths[k], 50)

    header = "  ".join(k.ljust(widths[k])[:widths[k]] for k in keys)
    sep = "  ".join("-" * widths[k] for k in keys)
    lines = [header, sep]
    for r in rows:
        line = "  ".join(
            str(r.get(k, "")).ljust(widths[k])[:widths[k]] for k in keys
        )
        lines.append(line)
    return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(
        prog="sheets",
        description="NearbyNearby Google Sheets CLI — read, search, and update the project tracker.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
sheet aliases:
  plan         → PLAN
  features     → Feature Implementation List
  impl         → Feature Implementation List
  tests        → Feature Implementation List
  edge / bugs  → Edge Cases Causing Failures

examples:
  sheets cat plan                           # Print entire PLAN sheet
  sheets cat plan --range A1:D5             # Print specific range
  sheets head plan                          # First 10 rows
  sheets head plan -n 20                    # First 20 rows
  sheets tail plan                          # Last 10 rows
  sheets row plan 5                         # Get row 5
  sheets col plan Status                    # Get entire Status column
  sheets headers plan                       # Show column headers
  sheets count plan                         # Count data rows
  sheets info                               # List all sheets with dimensions
  sheets grep plan "HTTP 500"               # Search all columns
  sheets grep plan "Manav" -c "Assigned To" # Search specific column
  sheets grep plan "P0" -c Priority         # Find all P0 tasks
  sheets find plan Status "Not Started"     # Exact match on column
  sheets filter plan Status="Not Started" "Assigned To"=Manav
  sheets summary plan Status                # Count by status
  sheets summary plan "Assigned To"         # Count by assignee
  sheets task 1                             # Get task #1 as JSON
  sheets status 1 "In Progress"            # Update task status
  sheets status 1 "Complete" -n "Done in commit abc"
  sheets blocked-by 1                       # Tasks depending on task 1
  sheets next-task                          # Next available task number
  sheets set plan 5 Status="In Progress" Notes="WIP"
  sheets append plan "113,,NEW,Title,Desc,Manav,P1,Not Started"
  sheets clear plan H5:H10                  # Clear cell contents
  sheets batch '[ {"sheet":"plan","range":"H2","values":[["Done"]]} ]'
  sheets add-bug "Button X broken" "Detail page" "Click button X"
""",
    )

    sub = parser.add_subparsers(dest="command")

    # ── cat (read entire sheet) ──
    p = sub.add_parser("cat", help="Print entire sheet (or range)")
    p.add_argument("sheet", help="Sheet name or alias")
    p.add_argument("--range", "-r", default="", help="A1 range (e.g. A1:D5)")
    p.add_argument("--json", "-j", action="store_true", help="Output as JSON")
    p.add_argument("--tsv", action="store_true", help="Output as TSV (default)")
    p.add_argument("--columns", "-C", nargs="*", help="Only show these columns")

    # ── head ──
    p = sub.add_parser("head", help="Show first N rows")
    p.add_argument("sheet", help="Sheet name or alias")
    p.add_argument("-n", type=int, default=10, help="Number of rows (default: 10)")
    p.add_argument("--json", "-j", action="store_true")

    # ── tail ──
    p = sub.add_parser("tail", help="Show last N rows")
    p.add_argument("sheet", help="Sheet name or alias")
    p.add_argument("-n", type=int, default=10, help="Number of rows (default: 10)")
    p.add_argument("--json", "-j", action="store_true")

    # ── row ──
    p = sub.add_parser("row", help="Get a specific row by number")
    p.add_argument("sheet", help="Sheet name or alias")
    p.add_argument("row_number", type=int, help="1-based row number")
    p.add_argument("--json", "-j", action="store_true")

    # ── col ──
    p = sub.add_parser("col", help="Get all values in a column")
    p.add_argument("sheet", help="Sheet name or alias")
    p.add_argument("column", help="Column letter (A) or header name (Status)")

    # ── headers ──
    p = sub.add_parser("headers", help="Show column headers with letters")
    p.add_argument("sheet", help="Sheet name or alias")

    # ── count ──
    p = sub.add_parser("count", help="Count data rows (excluding header)")
    p.add_argument("sheet", help="Sheet name or alias")

    # ── info ──
    sub.add_parser("info", help="List all sheets with dimensions")

    # ── grep ──
    p = sub.add_parser("grep", help="Search rows by regex pattern")
    p.add_argument("sheet", help="Sheet name or alias")
    p.add_argument("pattern", help="Regex pattern to search for")
    p.add_argument("--column", "-c", default="", help="Limit search to this column")
    p.add_argument("--case-sensitive", "-s", action="store_true")
    p.add_argument("--fixed", "-F", action="store_true", help="Fixed string (not regex)")
    p.add_argument("--json", "-j", action="store_true")
    p.add_argument("--columns", "-C", nargs="*", help="Only show these columns in output")
    p.add_argument("--count", action="store_true", help="Only print match count")

    # ── find ──
    p = sub.add_parser("find", help="Find rows where column exactly equals value")
    p.add_argument("sheet", help="Sheet name or alias")
    p.add_argument("column", help="Column letter or header name")
    p.add_argument("value", help="Exact value to match")
    p.add_argument("--json", "-j", action="store_true")

    # ── filter ──
    p = sub.add_parser("filter", help="Filter rows by multiple column=value conditions (AND)")
    p.add_argument("sheet", help="Sheet name or alias")
    p.add_argument("conditions", nargs="+", help='Conditions as Col=Value (e.g. Status="Not Started")')
    p.add_argument("--json", "-j", action="store_true")

    # ── summary ──
    p = sub.add_parser("summary", help="Count unique values in a column")
    p.add_argument("sheet", help="Sheet name or alias")
    p.add_argument("column", help="Column letter or header name")

    # ── task ──
    p = sub.add_parser("task", help="Get a PLAN task by number")
    p.add_argument("task_number", type=int)

    # ── status ──
    p = sub.add_parser("status", help="Update a PLAN task's status")
    p.add_argument("task_number", type=int)
    p.add_argument("new_status")
    p.add_argument("--notes", "-n", default="")

    # ── blocked-by ──
    p = sub.add_parser("blocked-by", help="Find tasks depending on a task number")
    p.add_argument("task_number", type=int)
    p.add_argument("--json", "-j", action="store_true")

    # ── next-task ──
    sub.add_parser("next-task", help="Show next available task number")

    # ── set (update row by header names) ──
    p = sub.add_parser("set", help="Update columns in a row by header name")
    p.add_argument("sheet", help="Sheet name or alias")
    p.add_argument("row_number", type=int, help="1-based row number")
    p.add_argument("values", nargs="+", help='Column=Value pairs (e.g. Status="In Progress")')

    # ── append ──
    p = sub.add_parser("append", help="Append a row (comma-separated values)")
    p.add_argument("sheet", help="Sheet name or alias")
    p.add_argument("values", help="Comma-separated values for the new row")

    # ── clear ──
    p = sub.add_parser("clear", help="Clear cell contents in a range")
    p.add_argument("sheet", help="Sheet name or alias")
    p.add_argument("range", help="A1 range to clear (e.g. H5:H10)")

    # ── batch ──
    p = sub.add_parser("batch", help="Batch update multiple ranges (JSON input)")
    p.add_argument("updates_json", help='JSON array: [{"sheet":"plan","range":"H2","values":[["Done"]]}]')

    # ── add-bug ──
    p = sub.add_parser("add-bug", help="Add an edge case / bug report")
    p.add_argument("description", help="What the bug is")
    p.add_argument("location", help="Where in the app")
    p.add_argument("test_method", help="How to reproduce")
    p.add_argument("--notes", "-n", default="")
    p.add_argument("--link", "-l", default="")

    # ── insert-rows ──
    p = sub.add_parser("insert-rows", help="Insert empty rows after a row number")
    p.add_argument("sheet", help="Sheet name or alias")
    p.add_argument("after_row", type=int, help="Insert after this row number")
    p.add_argument("--count", type=int, default=1, help="Number of rows (default: 1)")

    # ── delete-rows ──
    p = sub.add_parser("delete-rows", help="Delete rows (inclusive range)")
    p.add_argument("sheet", help="Sheet name or alias")
    p.add_argument("start_row", type=int, help="First row to delete")
    p.add_argument("end_row", type=int, help="Last row to delete")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        return

    client = SheetsClient()

    # ── Dispatch ──

    if args.command == "cat":
        rows = client.read_sheet(args.sheet, args.range)
        if not rows:
            print("(empty)")
            return
        if args.json:
            data = _rows_to_dicts(rows)
            if args.columns:
                data = [{k: d.get(k, "") for k in args.columns} for d in data]
            print(json.dumps(data, indent=2))
        else:
            if args.columns:
                hdrs = rows[0]
                idxs = []
                for c in args.columns:
                    for i, h in enumerate(hdrs):
                        if h.lower() == c.lower():
                            idxs.append(i)
                            break
                for row in rows:
                    padded = row + [""] * (len(hdrs) - len(row))
                    print("\t".join(padded[i] for i in idxs))
            else:
                for row in rows:
                    print("\t".join(row))

    elif args.command == "head":
        rows = client.read_sheet(args.sheet)
        if not rows:
            print("(empty)")
            return
        subset = rows[:args.n + 1]  # +1 for header
        if args.json:
            print(json.dumps(_rows_to_dicts(subset), indent=2))
        else:
            dicts = _rows_to_dicts(subset)
            print(_fmt_table(dicts))

    elif args.command == "tail":
        rows = client.read_sheet(args.sheet)
        if not rows:
            print("(empty)")
            return
        subset = [rows[0]] + rows[-(args.n):]
        if args.json:
            print(json.dumps(_rows_to_dicts(subset), indent=2))
        else:
            dicts = _rows_to_dicts(subset)
            print(_fmt_table(dicts))

    elif args.command == "row":
        if args.json:
            rows = client.read_sheet(args.sheet)
            if rows and args.row_number <= len(rows):
                hdrs = rows[0]
                row = rows[args.row_number - 1]
                padded = row + [""] * (len(hdrs) - len(row))
                print(json.dumps(dict(zip(hdrs, padded)), indent=2))
            else:
                print(f"Row {args.row_number} not found")
        else:
            row = client.get_row(args.sheet, args.row_number)
            if row:
                hdrs = client.headers(args.sheet)
                for h, v in zip(hdrs, row):
                    print(f"{h}: {v}")
            else:
                print(f"Row {args.row_number} not found")

    elif args.command == "col":
        vals = client.get_column(args.sheet, args.column)
        for v in vals:
            print(v)

    elif args.command == "headers":
        hdrs = client.headers(args.sheet)
        for i, h in enumerate(hdrs):
            print(f"  {_col_index_to_letter(i)}: {h}")

    elif args.command == "count":
        n = client.count_rows(args.sheet)
        print(n)

    elif args.command == "info":
        sheets = client.list_sheets()
        for s in sheets:
            alias_str = ""
            for alias, full in SHEET_ALIASES.items():
                if full == s["name"]:
                    alias_str = f" (alias: {alias})"
                    break
            print(f"  {s['name']}{alias_str}")
            print(f"    gid={s['gid']}  rows={s['rows']}  cols={s['cols']}")

    elif args.command == "grep":
        results = client.grep(
            args.sheet, args.pattern,
            column=args.column,
            case_sensitive=args.case_sensitive,
            fixed_string=args.fixed,
        )
        if args.count:
            print(len(results))
        elif args.json:
            print(json.dumps(results, indent=2))
        else:
            print(_fmt_table(results, args.columns))

    elif args.command == "find":
        results = client.find(args.sheet, args.column, args.value)
        if args.json:
            print(json.dumps(results, indent=2))
        else:
            print(_fmt_table(results))

    elif args.command == "filter":
        filters = {}
        for cond in args.conditions:
            if "=" not in cond:
                print(f"Invalid condition: {cond} (must be Column=Value)")
                return
            k, v = cond.split("=", 1)
            filters[k.strip().strip('"').strip("'")] = v.strip().strip('"').strip("'")
        results = client.filter_rows(args.sheet, filters)
        if args.json:
            print(json.dumps(results, indent=2))
        else:
            print(_fmt_table(results))

    elif args.command == "summary":
        counts = client.summary(args.sheet, args.column)
        total = sum(counts.values())
        for val, count in counts.items():
            pct = f"{count/total*100:.0f}%" if total else "0%"
            print(f"  {val}: {count} ({pct})")
        print(f"  ---")
        print(f"  Total: {total}")

    elif args.command == "task":
        task = client.get_task_by_number(args.task_number)
        if task:
            print(json.dumps(task, indent=2))
        else:
            print(f"Task {args.task_number} not found")

    elif args.command == "status":
        result = client.update_task_status(args.task_number, args.new_status, args.notes)
        if result:
            print(f"Task {args.task_number} -> '{args.new_status}'")
        else:
            print(f"Task {args.task_number} not found")

    elif args.command == "blocked-by":
        results = client.tasks_blocked_by(args.task_number)
        if args.json:
            print(json.dumps(results, indent=2))
        elif results:
            print(f"Tasks depending on task #{args.task_number}:")
            print(_fmt_table(results, ["Task #", "Task Title", "Status", "Dependencies"]))
        else:
            print(f"No tasks depend on task #{args.task_number}")

    elif args.command == "next-task":
        print(client.next_task_number())

    elif args.command == "set":
        vals = {}
        for pair in args.values:
            if "=" not in pair:
                print(f"Invalid: {pair} (must be Column=Value)")
                return
            k, v = pair.split("=", 1)
            vals[k.strip().strip('"').strip("'")] = v.strip().strip('"').strip("'")
        client.update_row(args.sheet, args.row_number, vals)
        print(f"Row {args.row_number} updated")

    elif args.command == "append":
        row = [v.strip() for v in args.values.split(",")]
        client.append_rows(args.sheet, [row])
        print(f"Row appended to {_resolve_sheet_name(args.sheet)}")

    elif args.command == "clear":
        client.clear_range(args.sheet, args.range)
        print(f"Cleared {args.range}")

    elif args.command == "batch":
        updates = json.loads(args.updates_json)
        result = client.batch_update_cells(updates)
        print(f"Updated {result.get('totalUpdatedCells', '?')} cells")

    elif args.command == "add-bug":
        client.add_edge_case(
            args.description, args.location, args.test_method,
            args.notes, args.link,
        )
        print("Edge case added")

    elif args.command == "insert-rows":
        client.insert_rows(args.sheet, args.after_row, args.count)
        print(f"Inserted {args.count} row(s) after row {args.after_row}")

    elif args.command == "delete-rows":
        client.delete_rows(args.sheet, args.start_row, args.end_row)
        print(f"Deleted rows {args.start_row}-{args.end_row}")


def _rows_to_dicts(rows):
    if not rows:
        return []
    hdrs = rows[0]
    return [
        dict(zip(hdrs, r + [""] * (len(hdrs) - len(r))))
        for r in rows[1:]
    ]


if __name__ == "__main__":
    main()
