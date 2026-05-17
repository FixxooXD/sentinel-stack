# SentinelStack: A High-Concurrency Distributed Service Monitor

SentinelStack is a production-grade, three-tier distributed service monitor designed to track the uptime, availability, and latency baselines of web applications and critical endpoints 24/7. Built to replace manual operations workflows, it leverages asynchronous concurrency to handle high-frequency polling with minimal resource overhead.

## 🚀 Core Features

- **Asynchronous Polling Engine:** Utilizes non-blocking I/O routines to handle hundreds of target pings simultaneously on a single CPU thread.
- **Three-Tier Architecture:** Completely decoupled layers (Presentation, Logic, Data) ensuring system resiliency and high availability.
- **Enterprise Observability:** Features structured multi-level telemetry logging (INFO, DEBUG, ERROR) for immediate failure detection.
- **Automated DevOps Pipeline:** Containerized with Docker and engineered for automated deployment to Azure via CI/CD workflows.

## 🏗️ Architecture & Tech Stack

### Tier 1: Presentation Layer

- **React:** A clean, responsive administrative dashboard focused purely on data visualization, tracking real-time status updates and latency trends without containing business math.

### Tier 2: Application Logic Layer

- **Python & FastAPI:** The high-performance core engine managing asynchronous networking, route authentication, error isolation, and operational metrics calculation.
- **uv:** Employed as a modern, ultra-fast project manager and dependency resolver to ensure reproducible environments.
- **HTTPX:** Leveraged for non-blocking HTTP client routines to dispatch concurrent `HEAD` network requests safely.

### Tier 3: Persistent Storage Layer

- **PostgreSQL:** Actively stores time-series metric snapshots, historical uptime logs, and compliance records, ensuring zero data persistence inside local app memory variables.

## 🛠️ Local Development Setup

### Prerequisites

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) (Modern Python package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/YOUR_USERNAME/sentinel-stack.git](https://github.com/YOUR_USERNAME/sentinel-stack.git)
   cd sentinel-stack/backend
   ```
