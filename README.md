# Quality Defect Tracking System (Frontend-only)

This repository contains the **frontend-only** version of a quality defect tracking application.

## Key behavior

- **No backend / no API calls**
- **No fetch()**
- All defects, corrective actions, workflow status, and analytics are persisted in **browser localStorage**.
- Images are stored as **base64 data URLs** (note: large images may exceed browser storage limits).

## Run locally

```bash
cd quality_frontend
npm install
npm run dev
```

Then open: http://localhost:3000

## Data storage

- localStorage key: `qdt:v1`
- If storage is missing or corrupted, the app auto-seeds one sample defect to demonstrate the workflow.
"
