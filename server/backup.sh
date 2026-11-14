#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/family-tree}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/family-tree}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
install -d -m 700 "$BACKUP_DIR"
cd "$APP_DIR"
docker compose exec -T db pg_dump -U familytree -d familytree -Fc > "$BACKUP_DIR/family-tree-$STAMP.dump"
chmod 600 "$BACKUP_DIR/family-tree-$STAMP.dump"
find "$BACKUP_DIR" -type f -name 'family-tree-*.dump' -mtime +14 -delete
