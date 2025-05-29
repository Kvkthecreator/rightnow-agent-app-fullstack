📁 SSOT: user-library Domain – File Management System

🧠 Overview

The user-library is a persistent file management domain within our app that allows users to upload, label, and manage reusable creative assets. It supports contextual labeling for AI agent interpretation and is separate from ephemeral task-specific uploads.

🔧 System Design Summary

Feature	Description
Domain Name	user-library
Bucket Name	user-library (Supabase Storage)
Supabase Table	user_files
Upload Limit	100MB per user (total, across all files)
Labeling	Required label + optional note for each file
Use Cases	Persistent reference materials for profile creation or future agent tasks
UI Access	Accessible via dedicated page in sidebar nav (e.g., “Library”)
Agent Compatibility	Files (and their labels/notes) can be referenced in agent prompts
🗃️ Supabase Table: user_files

Field	Type	Description
id	UUID (PK)	Auto-generated file identifier
user_id	UUID	Owner of the file (FK to users)
file_url	Text	Public URL of the file
file_name	Text	Original filename (for download or display)
label	Text	Short label/title (required)
note	Text (nullable)	Longer context or explanation for AI agents or self-reference
size_bytes	Integer	File size in bytes
created_at	Timestamp with time zone	Upload timestamp
📤 Upload Rules

Allowed types: Images, PDFs, videos, and other assets used in strategic or creative tasks
Max file size per upload: 5MB
Total quota per user: 100MB
On upload:
File is stored in Supabase bucket user-library
A new row is inserted into user_files
Requires a label and allows a note
🧠 Agent Contextual Use

Agents receive file context like:

File: "Competitor Ad"  
Note: "Use this image for visual tone inspiration for a similar Instagram post."
→ Injected into the prompt alongside user instructions.

This allows agents to reason over file intent, not just the file content.

🧭 Future Considerations

Feature	Status	Notes
Edit labels/notes	✅ Planned	Will support inline editing from the Library UI
Delete file (UI + storage)	✅ Planned	Deletes from both Supabase bucket and user_files DB table
Usage analytics	⏳ Later	Track if/when a file was used in a task or referenced by an agent
Folder/tag system	⏳ Later	Optional grouping system for better organization (e.g., “Logo”, “Inspo”)
🖼️ UI Design Snapshot

Each uploaded file shows:

Image/file preview
Label (bold, always shown)
Context note (light, truncated unless expanded)
Upload size
Delete/edit button
✅ Conclusion

The user-library is the persistent, user-managed creative asset system for our platform. It complements the instant, throwaway uploads used in task-brief flows. All agents and UI components should treat this library as the source of truth for reusable files, with label + note used to guide AI interpretation and maintain long-term clarity.

Let me know when you’re ready and I’ll guide you through step-by-step implementation (bucket setup, DB schema, upload UI, and nav integration).