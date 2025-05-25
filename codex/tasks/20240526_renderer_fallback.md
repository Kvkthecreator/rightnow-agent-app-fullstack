## codex/tasks/20240526_agent_output_normalization.md

# Title
Render agent errors gracefully in `RendererSwitch`

# Background
After Task 1, `output_json.data` is always an object, but may contain
`{ "error": "…" }`. The UI should show that message in a friendly card instead
of crashing.

# Desired Outcome
* When `data.error` exists (or `data` is still somehow a string), show a red
  notice card with the message.
* Otherwise continue rendering the specific renderer (`CompetitorTable`,
  `WeeklyPlanTable`, etc.).

# Implementation Steps
1. **Modify** `web/components/renderers/RendererSwitch.tsx`:
   ```tsx
   import { Card } from "@/components/ui/Card";

   interface Props {
     outputType: string;
     data: any;
   }

   export default function RendererSwitch({ outputType, data }: Props) {
     // ❶ fallback for errors or unexpected strings
     if (typeof data === "string" || (data && data.error)) {
       return (
         <Card className="p-6 text-red-600 whitespace-pre-wrap">
           {typeof data === "string" ? data : data.error}
         </Card>
       );
     }

     switch (outputType) {
       case "CompetitorTable":
         return <CompetitorTable rows={data.rows} />;
       ...
       default:
         return (
           <Card className="p-6 text-gray-500">
             No renderer for output type "{outputType}"
           </Card>
         );
     }
   }
(Optional) Update unit tests or Storybook stories for the new path.
Acceptance Criteria

Viewing a report whose data includes { "error": … } shows the red notice,
not “Unable to load report.”
Valid reports still render their tables/cards.
No React errors in console.