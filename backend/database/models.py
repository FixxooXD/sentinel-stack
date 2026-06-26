from ast import List
from datetime import datetime
from sqlalchemy import ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.orm import relationship
from database.connection import Base  # Import the base from connection.py to ensure proper metadata registration

class Base(DeclarativeBase):
    pass

class UptimeLog(Base):
    __tablename__ = "uptime_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    target: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    http_status: Mapped[int] = mapped_column(Integer, nullable=False)
    # Foreign Key Link with PostgreSQL native Cascade constraints
    target_id: Mapped[int] = mapped_column(
        ForeignKey("monitoring_targets.id", ondelete="CASCADE"), 
        nullable=False
    )
    target: Mapped[str] = mapped_column(String, nullable=False)
    latency_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    # Many-to-1 Inverse Relationship: Points straight back to a single parent target configuration
    target_rel: Mapped["MonitoringTarget"] = relationship("MonitoringTarget", back_populates="logs")

    
class MonitoringTarget(Base):
    __tablename__ = "monitoring_targets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(255), nullable=False)
    active: Mapped[bool] = mapped_column(nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    # 1-to-Many Relationship: Returns a Python List of typed UptimeLog objects
    logs: Mapped[list["UptimeLog"]] = relationship(
        "UptimeLog", 
        back_populates="target_rel", 
        cascade="all, delete-orphan"  # Wipes out child logs on target delete
    )