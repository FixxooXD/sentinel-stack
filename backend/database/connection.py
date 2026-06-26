from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/sentinelstack"

engine = create_async_engine(
    DATABASE_URL,
    echo=True,  
)

class Base(DeclarativeBase):
    pass

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  
)

async def get_db():
    """
    Yields an active asynchronous database session to a route,
    and automatically closes it when the web request finishes.
    """
    async with AsyncSessionLocal() as session:
        yield session