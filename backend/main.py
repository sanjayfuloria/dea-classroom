"""
DEA Classroom — FastAPI Backend
Endpoints: auth verification, DEA computation, dataset management, Python execution
"""

import os
import json
import io
import traceback
import contextlib
import sys
from typing import Optional, Any

import numpy as np
import pandas as pd
import firebase_admin
from firebase_admin import credentials, auth as fb_auth, firestore
from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from dea_engine.solver import run_dea, run_malmquist
from dea_engine.interpreter import interpret_results, interpret_malmquist
from data.datasets import list_datasets, get_dataset

load_dotenv()

# ── Firebase init ──────────────────────────────────────────────────────────────
sdk_path = os.getenv("FIREBASE_ADMIN_SDK_KEY", "./firebase-admin-key.json")
if not firebase_admin._apps:
    cred = credentials.Certificate(sdk_path)
    firebase_admin.initialize_app(cred)
db = firestore.client()

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="DEA Classroom API",
    description="Backend for the DEA teaching application — IFHE Hyderabad",
    version="1.0.0",
)

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth dependency ────────────────────────────────────────────────────────────
async def get_current_user(authorization: str = Header(...)) -> dict:
    try:
        token = authorization.replace("Bearer ", "")
        decoded = fb_auth.verify_id_token(token)
        uid = decoded["uid"]
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User profile not found")
        return {"uid": uid, **user_doc.to_dict()}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def require_faculty(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Faculty access required")
    return user


# ── Pydantic models ────────────────────────────────────────────────────────────
class DEARequest(BaseModel):
    dataset_id: Optional[str] = None  # builtin dataset id
    data: Optional[list[dict]] = None  # custom inline data
    dmu_col: str = "DMU"
    input_cols: list[str]
    output_cols: list[str]
    model: str = "CCR"        # CCR | BCC
    orientation: str = "input"  # input | output
    session_id: Optional[str] = None

class MalmquistRequest(BaseModel):
    data_period1: list[dict]
    data_period2: list[dict]
    dmu_col: str = "DMU"
    input_cols: list[str]
    output_cols: list[str]

class PythonExecRequest(BaseModel):
    code: str
    session_id: Optional[str] = None
    context: Optional[dict] = None  # injected variables (dataset, results)

class UserProfileCreate(BaseModel):
    name: str
    role: str  # "faculty" | "student"

class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None


# ── Health ─────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "app": "DEA Classroom API", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}


# ── User management ────────────────────────────────────────────────────────────
@app.post("/users/profile")
async def create_profile(body: UserProfileCreate, user: dict = Depends(get_current_user)):
    if body.role not in ["faculty", "student"]:
        raise HTTPException(400, "role must be 'faculty' or 'student'")
    db.collection("users").document(user["uid"]).set({
        "name": body.name,
        "role": body.role,
        "email": user.get("email", ""),
        "createdAt": firestore.SERVER_TIMESTAMP,
    })
    return {"success": True, "role": body.role}

@app.get("/users/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user


# ── Datasets ────────────────────────────────────────────────────────────────────
@app.get("/datasets")
async def list_all_datasets(user: dict = Depends(get_current_user)):
    builtin = list_datasets()
    # Also fetch user-uploaded datasets from Firestore
    uploaded = []
    q = db.collection("datasets").where("ownerId", "==", user["uid"])
    for doc in q.stream():
        d = doc.to_dict()
        uploaded.append({
            "id": doc.id,
            "name": d.get("name"),
            "description": d.get("description", ""),
            "sector": d.get("sector", "Custom"),
            "n_dmus": len(d.get("data", [])),
            "n_inputs": len(d.get("input_cols", [])),
            "n_outputs": len(d.get("output_cols", [])),
            "type": "uploaded",
        })
    return {"builtin": builtin, "uploaded": uploaded}

@app.get("/datasets/{dataset_id}")
async def get_dataset_detail(dataset_id: str, user: dict = Depends(get_current_user)):
    ds = get_dataset(dataset_id)
    if ds:
        return ds
    # Try Firestore
    doc = db.collection("datasets").document(dataset_id).get()
    if doc.exists:
        return {"id": doc.id, **doc.to_dict()}
    raise HTTPException(404, f"Dataset '{dataset_id}' not found")

@app.post("/datasets/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Accept CSV or Excel file, validate, store in Firestore."""
    content = await file.read()
    filename = file.filename.lower()
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(400, "Only CSV and Excel files are supported")
    except Exception as e:
        raise HTTPException(400, f"Could not parse file: {str(e)}")

    # Basic validation
    if df.empty:
        raise HTTPException(400, "File is empty")
    if len(df) < 3:
        raise HTTPException(400, "Need at least 3 DMUs for meaningful DEA analysis")
    if df.isnull().any().any():
        raise HTTPException(400, "File contains missing values. Please fill all cells before uploading.")

    records = df.to_dict(orient="records")
    cols = list(df.columns)

    doc_ref = db.collection("datasets").document()
    doc_ref.set({
        "name": file.filename,
        "description": f"Uploaded by {user.get('name', 'user')}",
        "ownerId": user["uid"],
        "type": "uploaded",
        "columns": cols,
        "data": records,
        "input_cols": [],  # user will select these in the UI
        "output_cols": [],
        "createdAt": firestore.SERVER_TIMESTAMP,
    })
    return {
        "id": doc_ref.id,
        "columns": cols,
        "n_rows": len(df),
        "preview": records[:5],
    }


# ── DEA Computation ────────────────────────────────────────────────────────────
@app.post("/dea/run")
async def run_dea_analysis(body: DEARequest, user: dict = Depends(get_current_user)):
    # ── Resolve data ──────────────────────────────────────────────────────
    if body.dataset_id:
        ds = get_dataset(body.dataset_id)
        if not ds:
            doc = db.collection("datasets").document(body.dataset_id).get()
            if not doc.exists:
                raise HTTPException(404, "Dataset not found")
            ds = doc.to_dict()
        raw_data = ds["data"]
    elif body.data:
        raw_data = body.data
    else:
        raise HTTPException(400, "Provide either dataset_id or inline data")

    # ── Build matrices ────────────────────────────────────────────────────
    try:
        df = pd.DataFrame(raw_data)
        dmu_names = df[body.dmu_col].astype(str).tolist()
        X = df[body.input_cols].values.astype(float)
        Y = df[body.output_cols].values.astype(float)
    except KeyError as e:
        raise HTTPException(400, f"Column not found: {e}")
    except Exception as e:
        raise HTTPException(400, f"Data error: {e}")

    if (X <= 0).any() or (Y <= 0).any():
        raise HTTPException(400, "All input and output values must be strictly positive (> 0)")

    # ── Run DEA ───────────────────────────────────────────────────────────
    results = run_dea(
        dmu_names=dmu_names,
        X=X, Y=Y,
        input_names=body.input_cols,
        output_names=body.output_cols,
        model=body.model,
        orientation=body.orientation,
    )

    # ── Interpret ─────────────────────────────────────────────────────────
    interpretation = interpret_results(results)

    # ── Save to Firestore ─────────────────────────────────────────────────
    session_data = {
        "userId": user["uid"],
        "userName": user.get("name", ""),
        "datasetId": body.dataset_id or "custom",
        "model": body.model,
        "orientation": body.orientation,
        "inputCols": body.input_cols,
        "outputCols": body.output_cols,
        "results": results,
        "interpretation": interpretation,
        "createdAt": firestore.SERVER_TIMESTAMP,
    }
    if body.session_id:
        db.collection("sessions").document(body.session_id).set(session_data)
        session_id = body.session_id
    else:
        ref = db.collection("sessions").document()
        ref.set(session_data)
        session_id = ref.id

    return {
        "session_id": session_id,
        "results": results,
        "interpretation": interpretation,
    }


@app.post("/dea/malmquist")
async def run_malmquist_analysis(body: MalmquistRequest, user: dict = Depends(get_current_user)):
    try:
        df1 = pd.DataFrame(body.data_period1)
        df2 = pd.DataFrame(body.data_period2)
        dmu_names = df1[body.dmu_col].astype(str).tolist()
        X1 = df1[body.input_cols].values.astype(float)
        Y1 = df1[body.output_cols].values.astype(float)
        X2 = df2[body.input_cols].values.astype(float)
        Y2 = df2[body.output_cols].values.astype(float)
    except Exception as e:
        raise HTTPException(400, f"Data error: {e}")

    results = run_malmquist(dmu_names, X1, Y1, X2, Y2, body.input_cols, body.output_cols)
    interpretation = interpret_malmquist(results)
    return {"results": results, "interpretation": interpretation}


# ── Python execution sandbox ────────────────────────────────────────────────────
SAFE_BUILTINS = {
    "print": print, "range": range, "len": len, "sum": sum,
    "min": min, "max": max, "abs": abs, "round": round,
    "sorted": sorted, "enumerate": enumerate, "zip": zip,
    "list": list, "dict": dict, "tuple": tuple, "set": set,
    "str": str, "int": int, "float": float, "bool": bool,
    "isinstance": isinstance, "type": type,
    "__import__": __import__,
}

ALLOWED_IMPORTS = {"numpy", "pandas", "scipy", "math", "json", "statistics"}

@app.post("/python/execute")
async def execute_python(body: PythonExecRequest, user: dict = Depends(get_current_user)):
    """
    Sandboxed Python execution in-browser.
    Provides: numpy, pandas, scipy, and the DEA engine.
    """
    import math, statistics

    # Set up namespace
    namespace = {
        "__builtins__": SAFE_BUILTINS,
        "np": np,
        "pd": pd,
        "math": math,
        "statistics": statistics,
        "run_dea": run_dea,
        "interpret_results": interpret_results,
        "run_malmquist": run_malmquist,
    }

    # Inject context variables (e.g., current dataset, last results)
    if body.context:
        namespace.update(body.context)

    # Capture stdout
    stdout_buffer = io.StringIO()
    error = None
    return_value = None

    try:
        with contextlib.redirect_stdout(stdout_buffer):
            # If code ends with an expression, capture its value
            lines = body.code.strip().split("\n")
            if lines:
                try:
                    # Try eval for last expression
                    exec("\n".join(lines[:-1]), namespace)
                    try:
                        return_value = eval(lines[-1], namespace)
                        if return_value is not None:
                            print(repr(return_value))
                    except SyntaxError:
                        exec(lines[-1], namespace)
                except Exception:
                    exec(body.code, namespace)
    except Exception as e:
        error = traceback.format_exc()

    output = stdout_buffer.getvalue()

    # Save to Firestore
    if body.session_id:
        db.collection("sessions").document(body.session_id).collection("python_history").add({
            "code": body.code,
            "output": output,
            "error": error,
            "userId": user["uid"],
            "timestamp": firestore.SERVER_TIMESTAMP,
        })

    return {
        "output": output,
        "error": error,
        "success": error is None,
    }


# ── Sessions (history) ─────────────────────────────────────────────────────────
@app.get("/sessions")
async def get_my_sessions(user: dict = Depends(get_current_user)):
    sessions = []
    q = db.collection("sessions").where("userId", "==", user["uid"]).order_by(
        "createdAt", direction=firestore.Query.DESCENDING
    ).limit(20)
    for doc in q.stream():
        d = doc.to_dict()
        sessions.append({
            "id": doc.id,
            "datasetId": d.get("datasetId"),
            "model": d.get("model"),
            "orientation": d.get("orientation"),
            "n_efficient": d.get("results", {}).get("summary", {}).get("n_efficient"),
            "mean_efficiency": d.get("results", {}).get("summary", {}).get("mean_efficiency"),
            "createdAt": str(d.get("createdAt", "")),
        })
    return sessions

@app.get("/sessions/{session_id}")
async def get_session(session_id: str, user: dict = Depends(get_current_user)):
    doc = db.collection("sessions").document(session_id).get()
    if not doc.exists:
        raise HTTPException(404, "Session not found")
    data = doc.to_dict()
    if data.get("userId") != user["uid"] and user.get("role") != "faculty":
        raise HTTPException(403, "Access denied")
    return {"id": doc.id, **data}


# ── Faculty: view student sessions ────────────────────────────────────────────
@app.get("/faculty/student-sessions")
async def get_all_student_sessions(faculty: dict = Depends(require_faculty)):
    sessions = []
    q = db.collection("sessions").order_by(
        "createdAt", direction=firestore.Query.DESCENDING
    ).limit(100)
    for doc in q.stream():
        d = doc.to_dict()
        sessions.append({
            "id": doc.id,
            "userId": d.get("userId"),
            "userName": d.get("userName", ""),
            "datasetId": d.get("datasetId"),
            "model": d.get("model"),
            "mean_efficiency": d.get("results", {}).get("summary", {}).get("mean_efficiency"),
            "createdAt": str(d.get("createdAt", "")),
        })
    return sessions

@app.get("/faculty/courses")
async def get_courses(faculty: dict = Depends(require_faculty)):
    courses = []
    q = db.collection("courses").where("facultyId", "==", faculty["uid"])
    for doc in q.stream():
        courses.append({"id": doc.id, **doc.to_dict()})
    return courses

@app.post("/faculty/courses")
async def create_course(body: CourseCreate, faculty: dict = Depends(require_faculty)):
    ref = db.collection("courses").document()
    ref.set({
        "title": body.title,
        "description": body.description or "",
        "facultyId": faculty["uid"],
        "enrolledStudents": [],
        "createdAt": firestore.SERVER_TIMESTAMP,
    })
    return {"id": ref.id, "title": body.title}
