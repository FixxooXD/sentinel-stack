from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/path/{target}")
def read_item(target: str):
    return {"target": target}

import time
import httpx
from fastapi import FastAPI

app = FastAPI()

@app.get("/path/{target}")
async def check_site(target: str):
    # Construct a valid URL from the path parameter
    url = f"https://{target}"
    
    start_time = time.perf_counter()
    
    async with httpx.AsyncClient() as client:
        try:
            # High-performance industry standard: Use HEAD, not GET
            response = await client.head(url, timeout=5.0)
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            
            return {
                "target": target,
                "status": "ONLINE",
                "http_status": response.status_code,
                "latency_ms": latency_ms
            }
        except httpx.RequestError:
            return {
                "target": target,
                "status": "OFFLINE",
                "http_status": 500,
                "latency_ms": None
            }