import asyncio
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from database import engine
import models
from routers import shipments, alerts, routes, analytics
from services.data_simulator import seed_database, start_simulator, alert_subscribers


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    models.Base.metadata.create_all(bind=engine)
    seed_database()
    task = asyncio.create_task(start_simulator())
    yield
    # Shutdown
    task.cancel()


app = FastAPI(
    title="RouteSense API",
    description="Resilient Logistics & Dynamic Route Optimization",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(shipments.router, prefix="/api")
app.include_router(alerts.router,    prefix="/api")
app.include_router(routes.router,    prefix="/api")
app.include_router(analytics.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "RouteSense API", "docs": "/docs"}


@app.get("/api/events")
async def sse_events():
    """Server-Sent Events stream for real-time alerts."""
    q: asyncio.Queue = asyncio.Queue()
    alert_subscribers.append(q)

    async def event_stream():
        # Send a heartbeat immediately so the client knows the connection is live
        yield "data: {\"type\": \"connected\"}\n\n"
        try:
            while True:
                try:
                    data = await asyncio.wait_for(q.get(), timeout=25)
                    yield f"data: {json.dumps(data)}\n\n"
                except asyncio.TimeoutError:
                    yield ": heartbeat\n\n"   # keep-alive comment
        finally:
            try:
                alert_subscribers.remove(q)
            except ValueError:
                pass

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
