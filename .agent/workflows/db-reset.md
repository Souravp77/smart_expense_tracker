---
description: Database initialization and reset
---

1. Initialize database (non-destructive if schema exists):
   `python scripts/init_db.py`
2. Destructive database reset (wipes all data and recreates schema):
   `python scripts/init_db.py --reset`
