/**
 * Thinking Partner Types
 *
 * Types for TP chat interface, state management, and work lifecycle visualization.
 */

// ============================================================================
// TP State & Phases
// ============================================================================

/**
 * TP state phases for visual state morphing in LiveContextPane
 */
export type TPPhase =
  | 'idle'           // TP is idle, showing substrate overview
  | 'planning'       // TP is planning multi-step workflow (steps_planner tool)
  | 'delegating'     // TP is delegating to specialized agent (agent_orchestration tool)
  | 'executing'      // Agent is executing work (work_ticket running)
  | 'reviewing'      // TP is reviewing work outputs
  | 'responding';    // TP is formulating response

/**
 * TP state for ambient co-presence visualization
 */
export interface TPState {
  phase: TPPhase;

  // Planning phase
  plan?: WorkflowPlan;

  // Delegating phase
  selectedAgent?: AgentDelegation;

  // Executing phase
  workTicket?: WorkTicketStatus;

  // Reviewing phase
  outputs?: WorkOutput[];

  // Meta
  lastAction?: string;
  timestamp: string;
}

/**
 * Workflow plan from steps_planner tool
 */
export interface WorkflowPlan {
  steps: WorkflowStep[];
  estimatedDuration?: string;
  dependencies: string[];
}

export interface WorkflowStep {
  stepNumber: number;
  description: string;
  agent: 'research' | 'content' | 'reporting';
  dependencies: number[];  // Step numbers this depends on
  status: 'pending' | 'running' | 'completed' | 'failed';
}

/**
 * Agent delegation info
 */
export interface AgentDelegation {
  agentType: 'research' | 'content' | 'reporting';
  task: string;
  parameters?: Record<string, any>;
  status: 'pending' | 'running' | 'completed';
}

/**
 * Work ticket execution status
 */
export interface WorkTicketStatus {
  id: string;
  agentType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: {
    currentStep?: string;
    completedSteps?: number;
    totalSteps?: number;
  };
  startedAt?: string;
  completedAt?: string;
}

/**
 * Work output from agent or TP
 */
export interface WorkOutput {
  id: string;
  outputType: string;
  title: string;
  body?: string;
  confidence?: number;
  metadata?: Record<string, any>;
  sourceBlockIds?: string[];
  createdAt: string;
}

// ============================================================================
// Chat Messages
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system';

export interface TPMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;

  // TP assistant messages may include actions taken
  actionsTaken?: string[];

  // TP may emit work outputs inline
  workOutputs?: WorkOutput[];

  // User messages may trigger state changes
  triggeredPhase?: TPPhase;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface TPChatRequest {
  basket_id: string;
  message: string;
  claude_session_id?: string | null;
}

export interface TPChatResponse {
  message: string;
  claude_session_id: string;
  session_id?: string;
  work_outputs: WorkOutput[];
  actions_taken: string[];
}

export interface TPSession {
  session_id: string;
  claude_session_id?: string;
  basket_id: string;
  workspace_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Chat UI State
// ============================================================================

export interface ChatState {
  messages: TPMessage[];
  isLoading: boolean;
  error?: string;
  sessionId?: string;
  claudeSessionId?: string;
}
