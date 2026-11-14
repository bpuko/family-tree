# Модель данных aymakh

Статус: проект модели, этап 0. Физические таблицы ещё не создавались.

## ER-диаграмма

```mermaid
erDiagram
  users ||--o{ tree_memberships : participates
  trees ||--o{ tree_memberships : includes
  users ||--o{ trees : owns
  trees ||--o{ persons : contains
  trees ||--o{ relationships : contains
  persons ||--o{ relationships : endpoint
  trees ||--o{ partnerships : contains
  persons ||--o{ partnerships : partner
  trees ||--o{ events : records
  trees ||--o{ sources : cites
  persons ||--o{ event_participants : attends
  events ||--o{ event_participants : has
  events ||--o{ citations : supports
  persons ||--o{ citations : supports
  relationships ||--o{ citations : supports
  sources ||--o{ citations : cited
  trees ||--o{ media_assets : stores
  trees ||--o{ albums : groups
  media_assets }o--o{ persons : depicts
  media_assets }o--o{ events : documents
  trees ||--o{ invitations : invites
  trees ||--o{ audit_log : records
  trees ||--o{ outbox_events : queues

  users {
    uuid id PK
    text email UK
    text display_name
    text password_hash
    timestamptz email_verified_at
    timestamptz deleted_at
  }
  trees {
    uuid id PK
    uuid owner_user_id FK
    text name
    text description
    text status
    jsonb settings
    bigint version
  }
  tree_memberships {
    uuid tree_id PK,FK
    uuid user_id PK,FK
    text role
    timestamptz revoked_at
  }
  persons {
    uuid id PK
    uuid tree_id FK
    text given_name
    text surname
    text maiden_name
    text sex
    jsonb alternate_names
    text biography
    bigint version
  }
  relationships {
    uuid id PK
    uuid tree_id FK
    uuid from_person_id FK
    uuid to_person_id FK
    text type
    text certainty
    date_range valid_dates
    bigint version
  }
  partnerships {
    uuid id PK
    uuid tree_id FK
    text type
    text certainty
    date_range start_dates
    date_range end_dates
  }
  events {
    uuid id PK
    uuid tree_id FK
    text type
    text title
    date_range event_dates
    text place_name
    text description
  }
  sources {
    uuid id PK
    uuid tree_id FK
    text title
    text source_type
    text archive_reference
    text url
    text excerpt
    text reliability
  }
  citations {
    uuid id PK
    uuid tree_id FK
    uuid source_id FK
    text claim_type
    uuid claim_id
    text note
  }
  media_assets {
    uuid id PK
    uuid tree_id FK
    text object_key UK
    text media_type
    text checksum
    bigint byte_size
    timestamptz deleted_at
  }
  albums {
    uuid id PK
    uuid tree_id FK
    text name
  }
  invitations {
    uuid id PK
    uuid tree_id FK
    text email
    text role
    text token_hash
    timestamptz expires_at
    timestamptz revoked_at
  }
  audit_log {
    uuid id PK
    uuid tree_id FK
    uuid actor_user_id FK
    text action
    jsonb metadata
    timestamptz created_at
  }
  outbox_events {
    uuid id PK
    uuid tree_id FK
    text event_type
    jsonb payload
    timestamptz available_at
    timestamptz processed_at
  }
```

## Правила проектирования

- Все записи, принадлежащие дереву, имеют обязательный `tree_id`; внешние ключи между ними составные (`tree_id`, `id`), чтобы нельзя было связать записи разных деревьев.
- Уникальные ограничения и индексы для таких записей включают `tree_id`. Внешние ссылки не принимаются без проверки принадлежности тому же дереву.
- `tree_memberships` хранит одну текущую роль участника: `owner`, `manager`, `editor`, `contributor`, `viewer`. Владелец дерева должен быть согласован с активным членством владельца; передача владения — отдельная атомарная операция.
- Даты представлены структурой `date_range`: нижняя и верхняя границы, точность (день/месяц/год/диапазон/примерно/историческое/неизвестно), исходная строка. Нельзя превращать неизвестную дату в выдуманное значение.
- `relationships` — направленные типизированные отношения между людьми, включая биологических/приёмных родителей и опекунов. Не ограничивать число родителей. `partnerships` хранит пары и интервалы; несколько браков разрешены. Дети выводятся из отношений, а не из дублирующего списка.
- Самоссылки запрещены. Для родительских типов запрещаются циклы; проверка выполняется в серверном доменном сервисе и защищается от параллельных изменений. Предположительные отношения сохраняют `certainty` отдельно от типа.
- События, участники событий, источники и цитаты являются отдельными сущностями. Связи цитат с фактами должны иметь целостность; окончательная схема может использовать отдельные таблицы связей по типам утверждений вместо полиморфного `claim_id`.
- Фото и документы имеют метаданные в PostgreSQL, содержимое — только в приватном S3-хранилище. Удаление сначала помечает объект для корзины; физическая очистка — отдельная политика после окна восстановления.
- История изменений и outbox append-only по возможности. Для аккаунтов, приглашений и сессий секреты хранятся только в виде стойких хэшей/безопасных секретов.

## Индексы и поиск

Планируются составные индексы с `tree_id` для отношений, событий, участников, медиа и источников; уникальность email; GIN для полнотекстовой проекции и `pg_trgm` для частичного/нечёткого поиска. Поисковая проекция строится worker-ом из outbox; каждый запрос ограничивается разрешёнными деревьями и повторно фильтруется авторизацией.

## RLS

RLS включается после появления транзакционного репозитория и тестов на реальном PostgreSQL. Политики проверяют `tree_id` через активное членство и роль. Контекст пользователя выставляется через `SET LOCAL` внутри транзакции. Нельзя полагаться на RLS, если подключение может работать с привилегированной ролью или контекст задан вне транзакции. Миграционный и операционный доступ отделяется от роли API.

## Миграция от MVP

Текущая таблица `family_tree(id=1, members jsonb)` не переносится автоматически при создании целевых таблиц. Сначала нужен форматный анализ существующего JSON, резервная копия, dry-run, отчёт по каждому человеку и связям, затем отдельное подтверждение и сверка. Оригинал сохраняется до успешного тестового восстановления и проверки результата.
