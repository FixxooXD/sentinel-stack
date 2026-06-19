import asyncio
import httpx
import time

async def ping_site(client: httpx.AsyncClient, name: str, url: str):
    start_time = time.perf_counter()
    try:
        response = await client.head(url, timeout=5.0)
        latency = round((time.perf_counter() - start_time) * 1000, 2)
        print(f"[{name}] Status: {response.status_code}| Latency: {latency}ms")
        return response.status_code
    except httpx.RequestError as exec:
        print(f"[{name}] Error: {exec}")
        return 500

async def main():
    sites = {
        "Google": "https://www.google.com",
        "GitHub": "https://www.github.com",
        "StackOverflow": "https://stackoverflow.com",
        "NonExistent": "https://nonexistent.example.com"
    }
    async with httpx.AsyncClient() as client:
        tasks = [ping_site(client, name, url) for name, url in sites.items()]
        await asyncio.gather(*tasks)
    if __name__ == "__main__":
        asyncio.run(main())