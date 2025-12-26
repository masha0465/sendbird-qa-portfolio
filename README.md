# Sendbird QA Portfolio

Sendbird Platform API 및 JavaScript SDK 테스트 자동화 포트폴리오입니다.

![CI Status](https://github.com/masha0465/sendbird-qa-portfolio/actions/workflows/test.yml/badge.svg)

## Summary

| Test Suite | Framework | Test Cases | Pass Rate |
|------------|-----------|------------|-----------|
| Platform API | Playwright + TypeScript | 80 | 100% |
| JavaScript SDK | Cypress | 22 | 100% |
| **Total** | | **102** | **100%** |

## Project Structure

```
sendbird-qa-portfolio/
├── .github/
│   └── workflows/
│       └── test.yml                 # GitHub Actions CI
├── api-tests/                       # Platform API Tests (Playwright)
│   ├── tests/
│   │   ├── users.spec.ts            # User API (16 TC)
│   │   ├── open-channels.spec.ts    # Open Channel API (12 TC)
│   │   ├── group-channels.spec.ts   # Group Channel API (12 TC)
│   │   ├── messages.spec.ts         # Message API (22 TC)
│   │   └── moderation.spec.ts       # Moderation API (18 TC)
│   ├── playwright.config.ts
│   └── package.json
├── sdk-tests/
│   └── javascript/                  # JavaScript SDK Tests (Cypress)
│       ├── cypress/
│       │   └── e2e/
│       │       └── sendbird-sdk.cy.js   # SDK Tests (22 TC)
│       ├── public/
│       │   ├── index.html
│       │   └── sendbird.min.js
│       ├── cypress.config.js
│       └── package.json
└── README.md
```

## Test Categories

### Platform API Tests (80 TC)

| Category | TCs | Description |
|----------|-----|-------------|
| User Management | 16 | Create, Read, Update, Delete, Block users |
| Open Channels | 12 | Channel CRUD, participant management |
| Group Channels | 12 | Channel CRUD, member invite/leave |
| Messages | 22 | Send, update, delete, file, reactions |
| Moderation | 18 | Ban, mute, freeze, report |

### JavaScript SDK Tests (22 TC)

| Category | TCs | Description |
|----------|-----|-------------|
| Connection | 5 | Init, connect, disconnect, auto-create user, performance |
| Open Channels | 6 | Create, enter, exit, list, get by URL |
| Group Channels | 4 | Create, list, get by URL |
| Messages | 6 | Send (text/Korean/emoji), update, list, performance |
| State Transition | 1 | Full lifecycle flow |

## Tech Stack

- **API Testing**: Playwright + TypeScript
- **SDK Testing**: Cypress + JavaScript
- **CI/CD**: GitHub Actions
- **Language Support**: English, Korean, Emoji

## Key Features Tested

### Functional Testing
- ✅ User authentication & management
- ✅ Channel creation (Open/Group)
- ✅ Real-time messaging
- ✅ Message CRUD operations
- ✅ Korean & emoji support
- ✅ Moderation features (ban, mute, freeze)

### Performance Testing
- ✅ API response time < 2 seconds
- ✅ SDK connection time < 3 seconds
- ✅ Message send time < 2 seconds

### Error Handling
- ✅ Invalid parameters (400)
- ✅ Authentication failures (401)
- ✅ Resource not found (404)

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### API Tests (Playwright)

```bash
cd api-tests
npm install
npx playwright install chromium

# Run tests
npx playwright test

# Run with report
npx playwright test --reporter=html
```

### SDK Tests (Cypress)

```bash
cd sdk-tests/javascript
npm install

# Run tests (headless)
npx cypress run

# Run with UI
npx cypress open
```

## CI/CD Pipeline

GitHub Actions 워크플로우 트리거:

| Trigger | Description |
|---------|-------------|
| `push` | main/develop 브랜치 push |
| `pull_request` | main 브랜치 PR |
| `workflow_dispatch` | 수동 실행 |

### Workflow Jobs

1. **api-tests**: Platform API 테스트 (Playwright)
2. **sdk-tests**: JavaScript SDK 테스트 (Cypress)
3. **test-summary**: 결과 요약 리포트

## Environment Variables

GitHub Secrets에 설정:

| Secret | Description |
|--------|-------------|
| `SENDBIRD_APP_ID` | Sendbird Application ID |
| `SENDBIRD_API_TOKEN` | Sendbird API Token |

## Test Execution Results

### Latest Run
- **Date**: 2025-12-26
- **Total**: 102 Test Cases
- **Pass Rate**: 100%

## Author

**김선아 (Masha)**

- QA Engineer with 9+ years experience
- ISTQB Advanced Level Test Manager
- Test Automation: Playwright, Cypress, Python
- CI/CD: GitHub Actions, GitLab CI

## License

This project is for portfolio demonstration purposes.
