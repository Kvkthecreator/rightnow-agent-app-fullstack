import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GovernanceQueue } from '@/app/governance/page';

// Mock governance feature flags
vi.mock('@/lib/governance/featureFlags', () => ({
  isGovernanceUIEnabled: () => true,
  shouldUseGovernance: () => true
}));

// Mock workspace hooks
vi.mock('@/lib/workspaces/useCurrentWorkspace', () => ({
  useCurrentWorkspace: () => ({
    workspace: { id: 'workspace-123', name: 'Test Workspace' },
    loading: false
  })
}));

// Mock proposal data fetching
const mockProposals = [
  {
    id: 'proposal-1',
    proposal_kind: 'Extraction',
    origin: 'agent',
    status: 'PROPOSED',
    ops_summary: '3 CreateBlock, 2 CreateContextItem',
    confidence: 0.85,
    impact_summary: 'Affects 2 documents; adds strategic themes',
    created_at: '2025-08-30T12:00:00Z',
    validator_report: {
      confidence: 0.85,
      dupes: [],
      suggested_merges: [uuid4()],
      warnings: [],
      impact_summary: 'Affects 2 documents; adds strategic themes'
    },
    blast_radius: 'Local'
  },
  {
    id: 'proposal-2', 
    proposal_kind: 'Edit',
    origin: 'human',
    status: 'UNDER_REVIEW',
    ops_summary: '1 ReviseBlock',
    confidence: 0.92,
    impact_summary: 'Updates existing content block',
    created_at: '2025-08-30T11:30:00Z',
    validator_report: {
      confidence: 0.92,
      dupes: [],
      suggested_merges: [],
      warnings: ['Manual edit - verify intent'],
      impact_summary: 'Updates existing content block'
    },
    blast_radius: 'Local'
  }
];

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Governance Queue UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful proposal fetch
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ items: mockProposals })
    } as Response);
  });

  it('should render governance queue with proposals', async () => {
    render(<GovernanceQueue />);
    
    // Should show governance queue header
    expect(screen.getByText(/governance queue/i)).toBeInTheDocument();
    
    // Should load and display proposals
    await waitFor(() => {
      expect(screen.getByText('proposal-1')).toBeInTheDocument();
      expect(screen.getByText('proposal-2')).toBeInTheDocument();
    });
    
    // Should show proposal metadata
    expect(screen.getByText('Extraction')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('agent')).toBeInTheDocument();
    expect(screen.getByText('human')).toBeInTheDocument();
  });

  it('should display proposal impact analysis', async () => {
    render(<GovernanceQueue />);
    
    await waitFor(() => {
      expect(screen.getByText(/affects 2 documents/i)).toBeInTheDocument();
      expect(screen.getByText(/adds strategic themes/i)).toBeInTheDocument();
      expect(screen.getByText(/confidence.*85%/i)).toBeInTheDocument();
    });
  });

  it('should filter proposals by status', async () => {
    render(<GovernanceQueue />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('proposal-1')).toBeInTheDocument();
    });
    
    // Find and click status filter
    const statusFilter = screen.getByLabelText(/filter by status/i);
    fireEvent.change(statusFilter, { target: { value: 'PROPOSED' } });
    
    // Should call API with status filter
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=PROPOSED'),
        expect.any(Object)
      );
    });
  });

  it('should approve proposals', async () => {
    // Mock approval response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        proposal_id: 'proposal-1',
        commit_id: uuid4(),
        operations_executed: 5
      })
    } as Response);
    
    render(<GovernanceQueue />);
    
    await waitFor(() => {
      expect(screen.getByText('proposal-1')).toBeInTheDocument();
    });
    
    // Find and click approve button
    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);
    
    // Should call approval endpoint
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/proposals/proposal-1/approve'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  it('should reject proposals with reason', async () => {
    // Mock rejection response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        proposal_id: 'proposal-1',
        status: 'REJECTED'
      })
    } as Response);
    
    render(<GovernanceQueue />);
    
    await waitFor(() => {
      expect(screen.getByText('proposal-1')).toBeInTheDocument();
    });
    
    // Find and click reject button
    const rejectButton = screen.getByRole('button', { name: /reject/i });
    fireEvent.click(rejectButton);
    
    // Should show reason input
    const reasonInput = screen.getByPlaceholderText(/rejection reason/i);
    fireEvent.change(reasonInput, { target: { value: 'Duplicate content' } });
    
    // Confirm rejection
    const confirmButton = screen.getByRole('button', { name: /confirm reject/i });
    fireEvent.click(confirmButton);
    
    // Should call rejection endpoint with reason
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/proposals/proposal-1/reject'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ reason: 'Duplicate content' })
        })
      );
    });
  });

  it('should display validation warnings', async () => {
    // Proposal with warnings
    const proposalWithWarnings = {
      ...mockProposals[1],
      validator_report: {
        ...mockProposals[1].validator_report,
        warnings: ['Potential duplicate detected', 'Low confidence operation']
      }
    };
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [proposalWithWarnings] })
    } as Response);
    
    render(<GovernanceQueue />);
    
    await waitFor(() => {
      expect(screen.getByText(/potential duplicate detected/i)).toBeInTheDocument();
      expect(screen.getByText(/low confidence operation/i)).toBeInTheDocument();
    });
  });

  it('should show blast radius indicators', async () => {
    const proposalsWithRadius = [
      { ...mockProposals[0], blast_radius: 'Local' },
      { ...mockProposals[1], blast_radius: 'Scoped' }
    ];
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ items: proposalsWithRadius })
    } as Response);
    
    render(<GovernanceQueue />);
    
    await waitFor(() => {
      expect(screen.getByText('Local')).toBeInTheDocument();
      expect(screen.getByText('Scoped')).toBeInTheDocument();
    });
  });

  it('should handle governance disabled state', async () => {
    // Mock governance disabled
    vi.mocked(vi.importMock('@/lib/governance/featureFlags')).isGovernanceUIEnabled.mockReturnValue(false);
    
    render(<GovernanceQueue />);
    
    // Should show disabled message instead of queue
    expect(screen.getByText(/governance not enabled/i)).toBeInTheDocument();
    expect(screen.queryByText(/governance queue/i)).not.toBeInTheDocument();
  });

  it('should refresh proposals periodically', async () => {
    vi.useFakeTimers();
    
    render(<GovernanceQueue />);
    
    // Initial load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    
    // Advance timer for periodic refresh
    vi.advanceTimersByTime(30000); // 30 seconds
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
    
    vi.useRealTimers();
  });
});

// Mock the GovernanceQueue component since we're testing its behavior
function GovernanceQueue() {
  return <div>Governance Queue Component</div>;
}