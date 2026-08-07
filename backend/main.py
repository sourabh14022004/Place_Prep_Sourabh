from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

origins = [
    settings.STUDENT_PORTAL_URL,
    settings.FACULTY_PORTAL_URL,
    settings.ADMIN_PORTAL_URL,
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "status": "healthy",
        "service": "PlacePrep Express Backend Primary",
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}
