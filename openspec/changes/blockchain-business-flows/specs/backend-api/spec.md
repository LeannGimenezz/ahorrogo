# Delta for Backend API

## ADDED Requirements

### Requirement: Unified Business Transactions API
The system MUST expose business endpoints for deposit, receive, swap and send.

#### Scenario: User requests receive info
- GIVEN an authenticated user
- WHEN `GET /api/v1/business/receive` is called
- THEN the system SHALL return alias, wallet address and QR payload

#### Scenario: User executes swap intent
- GIVEN an authenticated user
- WHEN `POST /api/v1/business/swap/execute` is called
- THEN the system SHALL persist a swap transaction record with status and quote fields

### Requirement: Business Contract Orchestration
The system MUST support contract records for P2P protected purchase, rental guarantee and timelock goals.

#### Scenario: Create rental guarantee contract
- GIVEN an authenticated user with a vault
- WHEN `POST /api/v1/business/contracts/rental-guarantee` is called
- THEN the system SHALL store contract metadata and summary

#### Scenario: Approve/release contract lifecycle
- GIVEN a contract owned by the user
- WHEN approve/release endpoints are called
- THEN the system SHALL update status and transaction references

### Requirement: Motivation Suggestions
The system SHOULD return actionable motivation for vault acceleration.

#### Scenario: Weekly extra suggestion
- GIVEN a vault and a weekly extra amount
- WHEN `GET /api/v1/business/vaults/{id}/motivation` is called
- THEN the system SHALL return days_saved and a user-friendly recommendation message
