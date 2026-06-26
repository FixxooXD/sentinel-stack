import asyncio
import time
import httpx
from sqlalchemy import select
from database.connection import AsyncSessionLocal
from database.models import UptimeLog, MonitoringTarget

async def monitor_targets_list():
    """
    Continuous background daemon loop that fetches monitoring targets,
    executes concurrent asynchronous network checks, and persists telemetry.
    """
    
    
    # We share a single HTTP client instance to take advantage of connection pooling
    async with httpx.AsyncClient() as client:
        while True:
            # print(f"\n⏱️  [DAEMON] Starting automated monitoring cycle for {len(TARGET_REGISTRY)} nodes...")
            
            # Open a fresh database session pipeline for this specific cycle
            async with AsyncSessionLocal() as db:

                query = select(MonitoringTarget).where(MonitoringTarget.active == True)
                print(f"🔍 [DAEMON] Fetching active monitoring .{MonitoringTarget}")
                result = await db.execute(query)
                active_targets = result.scalars().all()
             
                if not active_targets:
                    print(f"⚠️  [DAEMON] No active monitoring targets found in database. Sleeping...")
                else:
                    print(f"\n⏱️  [DAEMON] Starting automated monitoring cycle for {len(active_targets)} registered nodes...")
                    
                    for target_record in active_targets:
                        url = target_record.url
                        display_name = url.replace("https://", "").replace("http://", "")

                        start_time = time.perf_counter()

                        try:
                            response = await client.head(url, timeout=5.0)
                            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
                            status_state = "ONLINE"
                            http_code = response.status_code
                        except httpx.RequestError:
                            latency_ms = None
                            status_state = "OFFLINE"
                            http_code = 500
                    
                    # Package metrics into our SQLAlchemy database structure
                        log_entry = UptimeLog(
                            target_id=target_record.id,
                            target=url,
                            status=status_state,
                            http_status=http_code,
                            latency_ms=latency_ms
                        )
                        db.add(log_entry)
                    # Loop ends here!
                    
                #Executes ONCE after ALL targets are pinged
                    await db.commit()
                    print(f"💾 [DAEMON] Database snapshot committed successfully at {time.strftime('%X')}.")
            
                    
                
            # Yield control back to the core event loop for 60 seconds
            print("💤 [DAEMON] Sleeping for 60 seconds...\n")
            await asyncio.sleep(60)     