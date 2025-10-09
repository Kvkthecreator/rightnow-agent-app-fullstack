# YARNNN AI Integration Architecture

```
           Claude / Anthropic                OpenAI (ChatGPT)
                   |                                  |
                   v                                  v
        +-------------------+            +-----------------------+
        | @yarnnn/anthropic |            |   @yarnnn/openai-apps |
        |      (adapter)    |            |        (adapter)      |
        +---------+---------+            +-----------+-----------+
                  \                        /
                   \                      /
                    v                    v
             +-------------------------------+
             |   @yarnnn/integration-core     |
             |  (tool schemas + HTTP client)  |
             +-------------------------------+
                             |
                             v
                    YARNNN Backend API
```

- The **core** package owns protocol-neutral logic: tool schemas, input validation, 
  backend request helpers, and shared types.
- Each **adapter** wires that core into a specific host:
  - `@yarnnn/anthropic-mcp` exposes the tools over the Model Context Protocol (stdio or HTTP/SSE).
  - `@yarnnn/openai-apps` (scaffold) will wrap the same tools with the OpenAI Apps SDK once OAuth and UI wiring are complete.
- Both adapters call the same backend endpoints (`/api/mcp/...`), keeping the service contract identical regardless of AI platform.
