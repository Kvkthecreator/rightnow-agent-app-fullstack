# Unified Onboarding Flow Migration

## Overview
We've migrated from a separate `/welcome` page onboarding flow to a unified in-memory experience where onboarding happens contextually within the memory page.

## Changes Made

### 1. Removed Legacy Components
- ❌ `/app/welcome` directory
- ❌ `OnboardingDashboard` component
- ❌ `OnboardingGate` redirect component
- ❌ `resolveUserLanding` logic
- ❌ Environment variables: `ONBOARDING_ENABLED`, `ONBOARDING_MODE`

### 2. Simplified Flow
```
Before: Login → Check → /welcome → Onboarding → /memory
After:  Login → /memory → Contextual Onboarding (if needed)
```

### 3. New Components
- ✅ `OnboardingPanel` - Expandable panel shown in memory page
- ✅ Unified memory redirect - Always lands users on their basket

### 4. Key Benefits
- **Single UI paradigm** - Users learn the interface while onboarding
- **No redirect loops** - Linear flow without circular dependencies
- **Progressive disclosure** - Onboarding as a layer, not a gate
- **Canon aligned** - Memory-first from the start

### 5. Database Fixes
- Fixed column names: `context_type` → `type`, `content_text` → `content`

### 6. User Experience
- New users see expandable onboarding panel on memory page
- Can minimize to "Complete Later" 
- Collects: Name, Current Focus, Aspiration, Memory Import (optional)
- Creates identity genesis marker on completion

## API Endpoints
- `/api/onboarding/complete` - Still used, works with unified flow
- `/api/baskets/resolve` - Simplified, no longer checks onboarding

## Migration Complete ✅
The system now provides a streamlined, unified experience that gets users productive immediately while offering contextual onboarding.