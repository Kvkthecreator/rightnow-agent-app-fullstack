# Testing Architecture v1.4.0 - Canon Compliant

**Unified, streamlined testing ecosystem aligned with YARNNN Canon v1.4.0**

## Philosophy

Our testing architecture mirrors our canonical system architecture:
- **No ambiguity**: Each test suite has a single, clear purpose
- **Canon validation**: Tests validate actual agent processing, not just HTTP endpoints  
- **Clean separation**: Canon compliance vs API contracts vs user journeys
- **First principles**: Tests validate the Four Sacred Principles in practice

## Test Structure

```
tests/
├── canon-v1.4/          # Canon v1.4.0 compliance validation
├── api-contracts/       # HTTP API correctness 
├── integration/         # End-to-end user journeys
└── setup/              # Test infrastructure
```

## Test Suites

### 1. Canon v1.4.0 Tests (`tests/canon-v1.4/`)

**Purpose**: Validate canonical agent processing and Sacred Principles

**What these tests do:**
- Test actual agent pipeline processing (P0→P1→P2→P3)
- Validate Sacred Principles enforcement
- Verify async intelligence model works
- Confirm queue-based processing compliance
- Check workspace isolation and security boundaries

**Key tests:**
- `agent-pipeline.spec.ts` - Core pipeline processing validation
- `async-intelligence.spec.ts` - Pure Supabase async model validation

**Run with**: `npm run test:canon`

### 2. API Contract Tests (`tests/api-contracts/`)

**Purpose**: Validate HTTP API correctness (separate from canon compliance)

**What these tests do:**
- Test HTTP endpoints return correct responses
- Validate request/response schemas
- Check error handling and status codes
- Verify authentication requirements

**Key tests:**
- `dumps.spec.ts` - Dumps API contract validation
- (Future: `baskets.spec.ts`, `documents.spec.ts`, etc.)

**Run with**: `npm run test:contracts`

### 3. Integration Tests (`tests/integration/`)

**Purpose**: End-to-end user journey validation

**What these tests do:**
- Test complete user workflows
- Validate UI behavior and interactions
- Confirm data flows through entire system
- Test real user scenarios

**Run with**: `npm run test:integration`

## Key Patterns

### Canon Testing Pattern
```typescript
test('Sacred Principle: Agent Intelligence is Mandatory', async ({ request }) => {
  // 1. Trigger canonical processing via sacred write path
  const response = await request.post('/api/dumps/new', { 
    data: dumpData,
    headers: { 'x-playwright-test': 'true' }
  });
  
  // 2. Wait for agent processing (async by design)
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 3. Verify agent processing created substrate
  const blocks = await request.get('/api/baskets/123/blocks');
  expect(blocks.length).toBeGreaterThan(0); // Agent created substrate
});
```

### API Contract Pattern
```typescript
test('POST /api/dumps/new - successful creation', async ({ request }) => {
  const response = await request.post('/api/dumps/new', { data: validData });
  
  expect(response.ok()).toBeTruthy();
  expect(result).toHaveProperty('dump_id');
  expect(result.dump_id).toMatch(UUID_REGEX);
});
```

## Test Authentication

### Canon Tests
- Use **test auth bypass** (`x-playwright-test: true` header)
- Bypass RLS with service role client
- Focus on agent processing, not auth flows

### Integration Tests  
- Use **real authentication** with stored sessions
- Test actual user auth flows
- Validate workspace isolation

## Running Tests

```bash
# All canon compliance tests
npm run test:canon

# All API contract tests  
npm run test:contracts

# All integration tests
npm run test:integration

# All tests
npm run test:all

# Specific test file
npx playwright test tests/canon-v1.4/agent-pipeline.spec.ts
```

## Test Environment

- **Development**: Uses local backend + frontend
- **CI/CD**: Isolated test environment with test data
- **Test Database**: Separate workspace with predictable test data

## Success Criteria

### Canon Tests ✅
- All Sacred Principles validated
- Agent processing pipeline works end-to-end  
- Queue processor health confirmed
- Workspace isolation enforced

### API Tests ✅
- All endpoints return correct HTTP responses
- Request/response schemas validated
- Error handling confirmed

### Integration Tests
- User journeys work end-to-end
- UI reflects canonical backend state
- No client-side data synthesis

## Migration from Legacy Tests

**OLD**: `tests/canon/` - Mixed API + canon validation  
**NEW**: Separated into purpose-built suites

**Why changed:**
- Legacy tests validated HTTP endpoints, not agent processing
- Ambiguous purpose led to false confidence
- New tests validate actual canonical implementation

---

## Canon v1.4.0 Alignment

This testing architecture directly validates:

✅ **Sacred Principle #1**: Capture is Sacred  
✅ **Sacred Principle #2**: All Substrates are Peers  
✅ **Sacred Principle #3**: Narrative is Deliberate  
✅ **Sacred Principle #4**: Agent Intelligence is Mandatory  

✅ **5th Architectural Pillar**: Pure Supabase Async Intelligence Model

**Result**: Complete confidence in canonical implementation for UX scaffolding work.