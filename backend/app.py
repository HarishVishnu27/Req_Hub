from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.auth_routes import auth_router
from backend.routes.ticket_routes import ticket_router
from backend.routes.admin_routes import admin_router
from backend.routes.admin_users_routes import admin_users_router

app = FastAPI(title="Ticketing System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(ticket_router, prefix="/tickets", tags=["Tickets"])
app.include_router(admin_router, prefix="/admin", tags=["Admin"])
app.include_router(admin_users_router, prefix="/admin", tags=["Admin Users"])

@app.on_event("startup")
async def startup_event():
    print("Starting the Ticketing System Server 🚀...")