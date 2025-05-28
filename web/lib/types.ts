export interface AgentMessage {
  id: string;
  task_id: string;
  user_id: string;
  agent_type: string;
  message_type: 'text' | 'clarification' | 'structured';
  message_content: {
    type: string;
    content: string;
  };
  created_at: string;
}
