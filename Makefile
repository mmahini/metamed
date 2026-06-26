.PHONY: help up down build logs shell-backend shell-db migrate makemigrations test-backend lint-backend

help:
	@echo "متامد — دستورات Make"
	@echo ""
	@echo "  make up              راه‌اندازی همه سرویس‌ها"
	@echo "  make down            توقف همه سرویس‌ها"
	@echo "  make build           ساخت مجدد image ها"
	@echo "  make logs            نمایش لاگ‌ها"
	@echo "  make migrate         اجرای migrate"
	@echo "  make makemigrations  ساخت migration جدید"
	@echo "  make shell-backend   شل Django"
	@echo "  make shell-db        شل MySQL"
	@echo "  make test-backend    اجرای تست‌های بک‌اند"
	@echo "  make lint-backend    بررسی کد بک‌اند"

up:
	docker compose up

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

shell-backend:
	docker compose exec backend python manage.py shell

shell-db:
	docker compose exec db mysql -u metamed -pmetamed metamed

migrate:
	docker compose exec backend python manage.py migrate

makemigrations:
	docker compose exec backend python manage.py makemigrations

test-backend:
	docker compose exec backend python manage.py test

lint-backend:
	docker compose exec backend python -m flake8 .

createsuperuser:
	docker compose exec backend python manage.py createsuperuser
