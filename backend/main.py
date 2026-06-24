import time
import httpx
from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from contextlib import asynccontextmanager

# Import our database connection logic and schema blueprints
from database.connection import get_db
from database.models import UptimeLog, MonitoringTarget
from pinger import monitor_targets_list


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager that initializes the background monitoring daemon
    when the application starts and ensures graceful shutdown.
    """
    # Start the background monitoring task as a concurrent asyncio task
    monitoring_task = asyncio.create_task(monitor_targets_list())
    
    print("🚀 SentinelStack Engine is up and running! Background monitoring has started.")
    
    yield  # The boundary line. The application stays running right here.
    
    # Everything written HERE executes when you shut down the server
    monitoring_task.cancel()
    print("🛑 SentinelStack Engine is shutting down. Background monitoring has stopped.")

app = FastAPI(title="SentinelStack Engine", lifespan=lifespan)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request validation schema for target registry
class TargetCreate(BaseModel):
    name: str
    url: str


# --- ROUTE 1: FETCH ENTIRE LOG HISTORY ---
# CRITICAL: This static path MUST be defined BEFORE any dynamic path parameters!
@app.get("/history")
async def get_ping_history(db: AsyncSession = Depends(get_db)):
    """
    Fetches the entire time-series history of server pings 
    stored inside the PostgreSQL database.
    """
    # 1. Prepare a select statement ordered by the newest records first
    query = select(UptimeLog).order_by(UptimeLog.timestamp.desc())
    
    # 2. Execute the query using our async connection session pipe
    result = await db.execute(query)
    
    # 3. Extract the clean Python objects out of the database rows
    logs = result.scalars().all()

    targets = (await db.execute(select(MonitoringTarget))).scalars().all()
    
    return {
        "total_records": len(logs),
        "history": logs,
        "targets": targets
    }


# --- ROUTE 2: REGISTER CONTINUOUS TARGETS ---
@app.post("/targets")
async def add_monitoring_target(payload: TargetCreate, db: AsyncSession = Depends(get_db)):
    """
    Registers a new corporate domain or API endpoint into 
    the system monitoring registry list.
    """

# 1. Map incoming JSON data to our MonitoringTarget table blueprint
    new_target = MonitoringTarget(
        name=payload.name,
        url=payload.url
    )

    db.add(new_target)
    await db.commit()

    return {
        "message": f"Successfully registered {payload.name} for continuous monitoring",
        "monitoring_url": payload.url,
        "active": True
    }


# --- ROUTE 3: TRIGGER INDIVIDUAL AD-HOC PING ---
@app.get("/ping/{target}")
async def monitor_endpoint(target: str, db: AsyncSession = Depends(get_db)):
    """
    Asynchronously evaluates the health of a target domain,
    logs the telemetry metrics into PostgreSQL, and returns JSON.
    """
    url = f"https://{target}"
    start_time = time.perf_counter()
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.head(url, timeout=5.0)
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            status_state = "ONLINE"
            http_code = response.status_code
            
        except httpx.RequestError as exc:
            latency_ms = None
            status_state = "OFFLINE"
            http_code = 500

    log_entry = UptimeLog(
        target=target,
        status=status_state,
        http_status=http_code,
        latency_ms=latency_ms
    )
    
    db.add(log_entry)
    await db.commit()
    
    print(f"\n[DATABASE SUCCESS] Permanently saved ping row for {target} to PostgreSQL!\n")
    
    return {
        "target": target,
        "status": status_state,
        "http_status": http_code,
        "latency_ms": latency_ms,
        "saved_to_db": True
    }