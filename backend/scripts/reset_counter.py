"""
Reset ticket counters in MongoDB.

Because counters are stored per day (e.g., vm_counter_040226),
the simplest reset is to delete all counter documents.

Usage:
  python backend/scripts/reset_counters.py
"""

from backend.database import db

def main():
    col = db["counters"]
    result = col.delete_many({})
    print(f"Deleted {result.deleted_count} counter documents from 'counters' collection.")

if __name__ == "__main__":
    main()