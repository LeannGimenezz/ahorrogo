# Tasks: Blockchain Business Flows API

## Phase 1: Foundation
- [x] 1.1 Add business schemas to `backend/app/models/schemas.py`.
- [x] 1.2 Create persistence migration `backend/migrations/002_business_transactions_contracts.sql`.

## Phase 2: Core API
- [x] 2.1 Create `backend/app/services/business_contract_service.py`.
- [x] 2.2 Create `backend/app/api/v1/business.py` with deposit/receive/swap/send flows.
- [x] 2.3 Add contract lifecycle endpoints (create/approve/release/release-rules/list).
- [x] 2.4 Add vault motivation endpoint.

## Phase 3: Integration
- [x] 3.1 Register router in `backend/app/api/v1/router.py`.

## Phase 4: Verification
- [x] 4.1 Run syntax verification for modified backend files.
- [x] 4.2 Run endpoint-level integration tests against live Supabase + RSK.
