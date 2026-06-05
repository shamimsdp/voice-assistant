.PHONY: help install dev backend frontend db-up db-down migrate test lint clean

help:
	@echo ""
	@echo "Bangladesh Medical Voice Assistant — Dev Commands"
	@echo "================================================="
	@echo "  make install     Install all dependencies"
	@echo "  make dev         Start everything (backend + frontend + db)"
	@echo "  make backend     Start only the FastAPI backend"
	@echo "  make frontend    Start only the Next.js frontend"
	@echo "  make db-up       Start PostgreSQL + Redis via Docker"
	@echo "  make db-down     Stop Docker services"
	@echo "  make migrate     Run Alembic database migrations"
	@echo "  make test        Run backend tests"
	@echo "  make lint        Lint backend + frontend code"
	@echo "  make tunnel      Start ngrok tunnel (for Twilio webhooks)"
	@echo "  make clean       Remove caches and build artifacts"
	@echo ""

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

dev: db-up
	@echo "Starting backend and frontend..."
	@start cmd /k "cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
	@start cmd /k "cd frontend && npm run dev"
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"
	@echo "API Docs: http://localhost:8000/docs"

backend:
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm run dev

db-up:
	docker-compose up -d postgres redis
	@echo "Waiting for postgres..."
	@timeout /t 3 /nobreak > nul
	@echo "Database ready."

db-down:
	docker-compose down

migrate:
	cd backend && alembic upgrade head

migrate-create:
	cd backend && alembic revision --autogenerate -m "$(msg)"

test:
	cd backend && pytest tests/ -v --tb=short

test-cov:
	cd backend && pytest tests/ --cov=. --cov-report=html

lint:
	cd backend && ruff check . && black --check .
	cd frontend && npm run lint

format:
	cd backend && black . && ruff check --fix .

tunnel:
	ngrok http 8000

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	cd frontend && rm -rf .next node_modules/.cache 2>/dev/null || true
