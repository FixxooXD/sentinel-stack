from http import client

from fastapi import FastAPI, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession

import time
import httpx
from pydantic import HttpUrl

from database.connection import get_db
from database.models import UptimeLog

app = FastAPI(title="Sentinel Stack Engine")

@app.get("/check")
async def check_site_status(url: HttpUrl = Query(..., description="The full URL of the website to monitor")):
    target_Url = str(url)
    
    start_time = time.perf_counter()

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(target_Url, timeout=5.0)

            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            
            return {
                "url": url,
                "status": "ONLINE",
                "http_status": response.status_code,
                "latency_ms": latency_ms
            }
    except httpx.RequestError as error:
        return {
            "url": url,
            "status": "OFFLINE",
            "http_status": 500,
            "latency_ms": None,
            "error_message": f"Could not reach server: {type(error).__name__}"
        }


@app.get("/path/{target}")
async def check_site(target: str, db: AsyncSession = Depends(get_db)):
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
            http_code = response.status_code
            status_state = "ONLINE"
            
        except httpx.RequestError:
            return {
                "target": target,
                "status": "OFFLINE",
                "http_status": 500,
                "latency_ms": None
            }
    log_entry = UptimeLog(
        target=target,
        status=status_state,
        http_status=http_code,
        latency_ms=latency_ms
    )
    db.add(log_entry)
    await db.commit()

    return {
        "target": target,
        "status": status_state,
        "http_status": http_code,
        "latency_ms": latency_ms,
        "saved_to_db": True
    }