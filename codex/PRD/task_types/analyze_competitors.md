    │   └── analyze_competitors.md
    │       ## Task Type: Analyze Competitors
    │       - `id`: analyze_competitors
    │       - `agent_type`: competitor
    │       - `input_fields`:
    │         - `urls` (type: list of strings)
    │         - `niche` (optional, type: string)
    │       - `output_type`: structured
    │       - `tools`: WebSearchTool
    │       - `prompt_template`: Dynamic, based on URLs + niche
    │
    │       ## Example Output
    │       ```json
    │       {
    │         "type": "structured",
    │         "output_type": "competitor_report",
    │         "data": [ ... ]
    │       }
    │       ```