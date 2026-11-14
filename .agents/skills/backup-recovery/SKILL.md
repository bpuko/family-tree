---
name: backup-recovery
description: Design, configure, or verify encrypted PostgreSQL and media backups and restore procedures for aymakh. Use for backup policy, disaster recovery, or restore drills.
---

# Backup and recovery

1. Read `BACKUP.md` if present and identify database, WAL, object storage, encryption keys, and recovery objectives.
2. Keep encrypted copies off the application VPS with documented retention and access controls. Back up media and database metadata consistently.
3. Include PostgreSQL base backups and WAL archiving when point-in-time recovery is required; monitor failures and available remote capacity.
4. Protect encryption keys separately from the backup objects and document authorized recovery access.
5. A backup is not verified until a restore drill succeeds in an isolated environment and data integrity checks pass.
6. Never overwrite production data during a restore drill. Use a separate target and preserve logs/results of the exercise.
7. Report recovery point/time evidence, failures, and the next drill date; do not claim recoverability based only on a successful backup command.
