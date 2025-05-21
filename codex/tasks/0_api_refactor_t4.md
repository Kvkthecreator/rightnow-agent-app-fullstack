## 

## **Task 4: ProfileBuilder Refactor and Integration**

**Prompt:**

> Create profilebuilder_task.py in agent_tasks/.Move all FastAPI route/logic from profilebuilder.py (the POST endpoint that handles the multi-step Q&A for profile creation) into profilebuilder_task.py.Remove (delete) profilebuilder_agent.py if it is not called by any endpoint—we are standardizing on the custom logic, not the agent.Update any imports/usage of the old files to the new location.Migrate any utility functions to shared middleware/util modules if they are generic (e.g., output payload building).Commit with message: "refactor: migrate and clean up ProfileBuilder logic"
> 

**Pre-req:**

None, just ensure previous commit is pushed.