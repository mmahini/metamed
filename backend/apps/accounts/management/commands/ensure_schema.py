import os

from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Create the configured Postgres schema (DATABASE_SCHEMA) if it does not exist."

    def handle(self, *args, **options):
        schema = os.getenv("DATABASE_SCHEMA", "").strip()
        if not schema:
            self.stdout.write("DATABASE_SCHEMA not set — nothing to do.")
            return
        if connection.vendor != "postgresql":
            self.stdout.write(f"DB vendor is {connection.vendor} — schema creation skipped.")
            return
        with connection.cursor() as cursor:
            cursor.execute(f'CREATE SCHEMA IF NOT EXISTS "{schema}"')
        self.stdout.write(self.style.SUCCESS(f'Schema "{schema}" ensured.'))
