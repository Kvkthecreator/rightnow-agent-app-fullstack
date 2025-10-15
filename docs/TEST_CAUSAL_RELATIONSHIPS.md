# Test Case: Causal Relationship Formation

**Purpose:** Demonstrate V3.1 P2 semantic inference with real causal content

## Test Memories to Add

Add these 3 memories sequentially through the "Add Memory" modal in production.

### Memory 1: Problem (PROBLEM semantic type)

```
User Churn Problem

We're seeing 40% of free tier users churn after hitting the 30 messages/day limit.

User feedback:
- "I hit my limit while brainstorming and lost my flow"
- "30 messages isn't enough for serious product work"
- "Had to wait until tomorrow to continue my conversation"

This is directly impacting our north-star metric (Daily Active Conversations) because users stop engaging when they hit limits.
```

**Expected P1 Result:**
- semantic_type: `problem` or `issue`
- Embedding generated
- 1-2 blocks created

---

### Memory 2: Solution (ACTION/SOLUTION semantic type)

```
Increase Free Tier Limit Proposal

Proposal: Increase free tier from 30 to 50 messages/day

Rationale:
- Reduces churn at the critical engagement moment
- Still keeps premium tiers valuable (unlimited vs 50/day)
- Cost increase is minimal (~0.7¢ per additional 20 messages)

Implementation:
- Update tier limits in backend config
- Add soft limit warning at 40 messages (10 left)
- A/B test with 25% of free tier users first

Expected impact:
- 15-20% reduction in free tier churn
- Better conversion to Plus tier (users who don't churn are more likely to upgrade)
```

**Expected P1 Result:**
- semantic_type: `action` or `solution`
- Embedding generated
- 2-3 blocks created

**Expected P2 Result:**
- Relationship inferred: Memory 2 **ADDRESSES** Memory 1
- Confidence: >0.85 (high confidence)
- State: ACCEPTED (auto-approved)
- Reasoning: "Solution directly mitigates the churn problem caused by message limits"

---

### Memory 3: Evidence (METRIC/FINDING semantic type)

```
A/B Test Results: 50 Messages Free Tier

Test Details:
- Duration: 2 weeks
- Sample: 10,000 free tier users (25% test group)
- Test group: 50 messages/day limit
- Control group: 30 messages/day limit

Results:
- Test group churn: 25% (vs 40% control) = 37.5% reduction
- Test group conversion to Plus: 8.2% (vs 6.1% control) = 34% increase
- Average messages used (test): 38/day (only 12% hit new limit)
- Cost increase: $0.68 per test user per month

Conclusion: 50 messages/day significantly reduces churn AND increases conversion. ROI positive.
```

**Expected P1 Result:**
- semantic_type: `metric` or `finding`
- Embedding generated
- 3-4 blocks created (multiple metrics)

**Expected P2 Results:**
1. **Memory 3 SUPPORTS Memory 2**
   - Confidence: >0.90 (very high)
   - State: ACCEPTED
   - Reasoning: "A/B test data provides empirical evidence for the proposed solution"

2. **Memory 3 SUPPORTS Memory 1** (indirectly)
   - Confidence: 0.75-0.85 (medium-high)
   - State: ACCEPTED or PROPOSED
   - Reasoning: "Test results confirm the churn problem exists and quantify its magnitude"

---

## Expected Final Graph

```
┌─────────────┐
│  Problem    │
│  (Memory 1) │
│  Churn at   │
│  30 msg/day │
└──────┬──────┘
       │
       │ ADDRESSED BY
       │ (confidence: 0.87)
       ↓
┌─────────────┐
│  Solution   │
│  (Memory 2) │
│  Increase   │
│  to 50/day  │
└──────┬──────┘
       │
       │ SUPPORTED BY
       │ (confidence: 0.92)
       ↓
┌─────────────┐
│  Evidence   │
│  (Memory 3) │
│  A/B test   │
│  results    │
└─────────────┘
```

---

## How to Test

### Step 1: Add Memory 1
1. Go to basket `/memory` page
2. Click "Add thought"
3. Paste Memory 1 content
4. Click "Add Memory"
5. Wait for processing modal (2 seconds auto-close)
6. Check logs for:
   ```
   P1 completed: total_blocks=X
   P2 Graph: No relationship proposals found (expected - only 1 memory)
   ```

### Step 2: Add Memory 2
1. Click "Add thought" again
2. Paste Memory 2 content
3. Click "Add Memory"
4. Check logs for:
   ```
   P2 Graph: Inferring relationships for block...
   Found X candidates for addresses, verifying with LLM...
   Inferred 1 relationship proposals
   Created 1 semantic relationships (accepted: 1)
   ```

### Step 3: Add Memory 3
1. Click "Add thought" again
2. Paste Memory 3 content
3. Check logs for:
   ```
   P2 Graph: Inferring relationships for block...
   Found X candidates for supports, verifying with LLM...
   Inferred 2 relationship proposals
   Created 2 semantic relationships (accepted: 2)
   ```

### Step 4: Verify Relationships
Query the database to see created relationships:

```sql
SELECT
  r.id,
  r.relationship_type,
  r.confidence_score,
  r.state,
  r.inference_method,
  r.metadata->>'reasoning' as reasoning,
  from_block.title as from_title,
  to_block.title as to_title
FROM substrate_relationships r
JOIN blocks from_block ON r.from_block_id = from_block.id
JOIN blocks to_block ON r.to_block_id = to_block.id
WHERE from_block.basket_id = 'YOUR_BASKET_ID'
  OR to_block.basket_id = 'YOUR_BASKET_ID'
ORDER BY r.created_at DESC;
```

**Expected output:**
```
| relationship_type | confidence | state    | from_title         | to_title           |
|-------------------|------------|----------|--------------------|---------------------|
| supports          | 0.92       | ACCEPTED | A/B Test Results   | Increase Free Tier  |
| supports          | 0.78       | ACCEPTED | A/B Test Results   | User Churn Problem  |
| addresses         | 0.87       | ACCEPTED | Increase Free Tier | User Churn Problem  |
```

---

## Success Criteria

✅ P1 extracts substrate correctly (problem, solution, evidence)
✅ P2 infers 3 causal relationships
✅ All relationships have confidence >= 0.70
✅ "ADDRESSES" relationship found (solution → problem)
✅ "SUPPORTS" relationships found (evidence → solution, evidence → problem)
✅ LLM verification provides reasoning for each
✅ High confidence relationships (>0.90) auto-accepted
✅ Processing completes in <90 seconds total

---

## What This Proves

1. **Semantic search works** - P2 finds relevant candidates via vector similarity
2. **LLM verification works** - gpt-4o-mini correctly identifies causal relationships
3. **Ontology is sound** - "addresses", "supports" types map to real product thinking
4. **Confidence scoring works** - High-quality relationships get high scores
5. **Auto-approval works** - High confidence bypasses governance queue

---

## Alternative Test Case: Contradictory Evidence

If you want to test the "CONTRADICTS" relationship type, add this as Memory 4:

```
Re-analysis: Free Tier Limit Change

After reviewing Q3 data more carefully, I found:
- The "churn reduction" in our A/B test was actually due to seasonal variance
- When normalized for July summer traffic patterns, churn difference is only 8% (not 37.5%)
- Cost analysis was incomplete - didn't include infrastructure scaling costs
- Actual cost increase: $2.40/user/month (3.5x our initial estimate)

Recommendation: Don't increase free tier limit. Focus on improving first-time user experience instead.
```

**Expected P2 Result:**
- Memory 4 **CONTRADICTS** Memory 3 (confidence: 0.85-0.90)
- Reasoning: "New analysis directly challenges the validity of the A/B test results"

---

*Test Status: Ready to Run*
*Expected Duration: 5-10 minutes*
*Risk Level: Low (production safe)*
