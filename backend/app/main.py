from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Adaptive Customer Service API")

# Configurar CORS para los frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Frontend User
        "http://localhost:3001",  # Frontend Admin
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}