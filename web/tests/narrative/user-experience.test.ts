/**
 * User Experience Tests
 * End-to-end testing of the narrative user experience
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrategicActions } from '@/components/narrative/StrategicActions';
import { StrategicUnderstanding } from '@/components/narrative/StrategicUnderstanding';
import ProjectContext from '@/components/understanding/ProjectContext';
import InsightRefinement from '@/components/insights/InsightRefinement';
import { NarrativeNavigation } from '@/components/navigation/NarrativeNavigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('Narrative User Experience Flow', () => {
  describe('Strategic Partnership Feel', () => {
    test('creates feeling of AI partnership rather than tool usage', () => {
      const mockActions = [
        { type: 'capture_insight', label: 'Capture New Insight', enabled: true },
        { type: 'explore_discoveries', label: 'Explore My Discoveries', enabled: true }
      ];

      render(<StrategicActions basketId="test-123" actions={mockActions} />);
      
      // Should feel like collaboration, not tool usage
      expect(screen.getByText(/what we can do next/i)).toBeInTheDocument();
      expect(screen.getByText(/I can see.*next steps/i)).toBeInTheDocument();
      
      // Should NOT feel transactional
      expect(screen.queryByText(/execute/i)).toBeNull();
      expect(screen.queryByText(/perform.*operation/i)).toBeNull();
      expect(screen.queryByText(/run.*process/i)).toBeNull();
    });

    test('maintains conversational tone throughout interactions', async () => {
      const user = userEvent.setup();
      const mockOnCreate = jest.fn();

      render(
        <InsightRefinement 
          open={true} 
          onOpenChange={() => {}} 
          onCreate={mockOnCreate}
        />
      );
      
      // Dialog should use conversational language
      expect(screen.getByText(/capture new insight/i)).toBeInTheDocument();
      expect(screen.getByText(/share something you're thinking/i)).toBeInTheDocument();
      
      // Form fields should use natural language
      expect(screen.getByText(/what's your insight about/i)).toBeInTheDocument();
      expect(screen.getByText(/tell me more about this insight/i)).toBeInTheDocument();
      
      // Should NOT use technical form language
      expect(screen.queryByText(/input field/i)).toBeNull();
      expect(screen.queryByText(/data entry/i)).toBeNull();
      expect(screen.queryByText(/form submission/i)).toBeNull();
    });

    test('provides encouraging and supportive language', () => {
      const mockProps = {
        understanding: "I can see you're making great progress on your user experience improvements",
        themes: ['user experience', 'strategic planning'],
        confidence: 0.8
      };

      render(<StrategicUnderstanding {...mockProps} />);
      
      // Should use encouraging, supportive tone
      expect(screen.getByText(/great progress/i)).toBeInTheDocument();
      expect(screen.getByText(/what I understand about your work/i)).toBeInTheDocument();
      
      // Should NOT use cold, analytical language
      expect(screen.queryByText(/analysis complete/i)).toBeNull();
      expect(screen.queryByText(/processing finished/i)).toBeNull();
      expect(screen.queryByText(/data processed/i)).toBeNull();
    });
  });

  describe('Cognitive Load Reduction', () => {
    test('hides technical complexity by default', () => {
      const mockProps = {
        understanding: "I understand your project focuses on user experience",  
        themes: ['user-experience', 'api-integration', 'database-optimization'],
        confidence: 0.87,
        connectionCount: 15
      };

      render(<StrategicUnderstanding {...mockProps} />);
      
      // Should show narrative themes, not technical ones
      expect(screen.getByText(/user experience/i)).toBeInTheDocument();
      
      // Should hide technical details by default
      expect(screen.queryByText(/0\.87/)).toBeNull();
      expect(screen.queryByText(/connection.*count/i)).toBeNull();
      expect(screen.queryByText(/api-integration/i)).toBeNull();
    });

    test('reveals technical details only when requested', async () => {
      const mockProps = {
        understanding: "Test understanding",
        themes: ['user-experience'],
        confidence: 0.87,
        connectionCount: 15
      };

      render(<StrategicUnderstanding {...mockProps} />);
      
      // Technical details should be hidden initially
      expect(screen.queryByText(/0\.87/)).toBeNull();
      
      // Should have option to reveal technical details
      const technicalButton = screen.getByRole('button', { name: /technical/i });
      fireEvent.click(technicalButton);
      
      await waitFor(() => {
        expect(screen.getByText(/0\.87/)).toBeInTheDocument();
        expect(screen.getByText(/15/)).toBeInTheDocument();
      });
    });

    test('provides progressive complexity increase', async () => {
      const mockActions = [
        { type: 'capture_insight', label: 'Capture New Insight', enabled: true }
      ];

      render(<StrategicActions basketId="test-123" actions={mockActions} intelligentSuggestions={true} />);
      
      // Level 1: Simple story
      expect(screen.getByText(/clear next steps/i)).toBeInTheDocument();
      
      // Level 2: Reasoning (when clicked)
      const reasoningButton = screen.getByRole('button', { name: /how I know/i });
      fireEvent.click(reasoningButton);
      
      await waitFor(() => {
        expect(screen.getByText(/based on what you've shared/i)).toBeInTheDocument();
      });
      
      // Level 3: Technical details (when clicked)
      const technicalButton = screen.getByRole('button', { name: /technical/i });
      fireEvent.click(technicalButton);
      
      await waitFor(() => {
        // Should show technical substrate
        expect(screen.getByText(/actions/i)).toBeInTheDocument();
        expect(screen.getByText(/actionTypes/i)).toBeInTheDocument();
      });
    });
  });

  describe('Natural Language Navigation', () => {
    test('uses conversational navigation labels', () => {
      render(<NarrativeNavigation basketId="test-123" currentTab="dashboard" />);
      
      // Should use narrative navigation labels
      expect(screen.getByText(/strategic intelligence/i)).toBeInTheDocument();
      expect(screen.getByText(/insights.*ideas/i)).toBeInTheDocument();
      expect(screen.getByText(/my understanding/i)).toBeInTheDocument();
      expect(screen.getByText(/project knowledge/i)).toBeInTheDocument();
      
      // Should NOT use technical labels
      expect(screen.queryByText(/^dashboard$/i)).toBeNull();
      expect(screen.queryByText(/^blocks$/i)).toBeNull();
      expect(screen.queryByText(/^context$/i)).toBeNull();
      expect(screen.queryByText(/^memory$/i)).toBeNull();
    });

    test('provides helpful descriptions for navigation options', () => {
      render(<NarrativeNavigation basketId="test-123" showDescriptions={true} variant="sidebar" />);
      
      // Should show helpful descriptions
      expect(screen.getByText(/your project overview and AI partnership/i)).toBeInTheDocument();
      expect(screen.getByText(/captured insights, ideas, and discoveries/i)).toBeInTheDocument();
      expect(screen.getByText(/what I know about your project/i)).toBeInTheDocument();
    });
  });

  describe('Intelligent Guidance', () => {
    test('provides contextual next step suggestions', () => {
      const mockActions = [
        { type: 'capture_insight', label: 'Capture New Insight', enabled: true, primary: true },
        { type: 'explore_discoveries', label: 'Explore My Discoveries', enabled: true }
      ];

      render(<StrategicActions basketId="test-123" actions={mockActions} intelligentSuggestions={true} />);
      
      // Should provide intelligent guidance
      expect(screen.getByText(/clear next steps.*move your project forward/i)).toBeInTheDocument();
      
      // Should prioritize most relevant actions
      const primaryButton = screen.getByRole('button', { name: /capture new insight/i });
      expect(primaryButton).toHaveClass(/default/); // Primary variant
    });

    test('provides helpful action descriptions on hover', async () => {
      const user = userEvent.setup();
      const mockActions = [
        { 
          type: 'capture_insight', 
          label: 'Capture New Insight', 
          enabled: true,
          description: 'Share something new you\'re thinking about'
        }
      ];

      render(<StrategicActions basketId="test-123" actions={mockActions} />);
      
      const actionButton = screen.getByRole('button', { name: /capture new insight/i });
      
      // Hover should show description
      await user.hover(actionButton);
      
      await waitFor(() => {
        expect(screen.getByText(/share something new you're thinking/i)).toBeInTheDocument();
      });
    });
  });

  describe('Knowledge Context Understanding', () => {
    test('transforms technical context into knowledge narrative', () => {
      const mockContextItems = [
        {
          id: '1',
          title: 'API Documentation',
          summary: 'Technical specifications for REST API endpoints',
          updated_at: new Date().toISOString()
        },
        {
          id: '2', 
          title: 'User Research Findings',
          summary: 'Interview insights from 12 user sessions',
          updated_at: new Date().toISOString()
        }
      ];

      render(<ProjectContext items={mockContextItems} />);
      
      // Should present as knowledge, not technical context
      expect(screen.getByText(/what I know about your project/i)).toBeInTheDocument();
      
      // Should categorize and present knowledge types naturally
      expect(screen.getByText(/API Documentation/i)).toBeInTheDocument();
      expect(screen.getByText(/User Research Findings/i)).toBeInTheDocument();
      
      // Should provide knowledge-based actions
      expect(screen.getByRole('button', { name: /add knowledge/i })).toBeInTheDocument();
    });

    test('shows knowledge connections and relationships', () => {
      const mockContextItems = [
        {
          id: '1',
          title: 'User Research',
          summary: 'Research findings',
          connections_count: 5,
          updated_at: new Date().toISOString()
        }
      ];

      render(<ProjectContext items={mockContextItems} />);
      
      // Should show connections in a meaningful way
      expect(screen.getByText(/5/)).toBeInTheDocument();
      
      // Should NOT use technical language for connections
      expect(screen.queryByText(/relationships/i)).toBeNull();
      expect(screen.queryByText(/graph/i)).toBeNull();
      expect(screen.queryByText(/nodes/i)).toBeNull();
    });
  });

  describe('Empty State Experience', () => {
    test('provides encouraging empty state messaging', () => {
      render(<ProjectContext items={[]} />);
      
      // Should be encouraging, not empty
      expect(screen.getByText(/no project knowledge yet/i)).toBeInTheDocument();
      expect(screen.getByText(/share documents.*help me understand/i)).toBeInTheDocument();
      
      // Should provide clear next step
      expect(screen.getByRole('button', { name: /share knowledge/i })).toBeInTheDocument();
      
      // Should NOT be cold or technical
      expect(screen.queryByText(/no data/i)).toBeNull();
      expect(screen.queryByText(/empty result/i)).toBeNull();
      expect(screen.queryByText(/no records found/i)).toBeNull();
    });
  });
});

describe('Accessibility and Usability', () => {
  test('maintains accessibility standards across narrative components', () => {
    const mockActions = [
      { type: 'capture_insight', label: 'Capture New Insight', enabled: true }
    ];

    render(<StrategicActions basketId="test-123" actions={mockActions} />);
    
    // Should have proper heading structure
    expect(screen.getByRole('heading', { name: /what we can do next/i })).toBeInTheDocument();
    
    // Should have accessible buttons
    const actionButton = screen.getByRole('button', { name: /capture new insight/i });
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('provides keyboard navigation support', async () => {
    const user = userEvent.setup();
    const mockActions = [
      { type: 'capture_insight', label: 'Capture New Insight', enabled: true },
      { type: 'explore_discoveries', label: 'Explore My Discoveries', enabled: true }
    ];

    render(<StrategicActions basketId="test-123" actions={mockActions} />);
    
    // Should support tab navigation
    await user.tab();
    
    const firstAction = screen.getByRole('button', { name: /capture new insight/i });
    expect(firstAction).toHaveFocus();
    
    await user.tab();
    
    const secondAction = screen.getByRole('button', { name: /explore my discoveries/i });
    expect(secondAction).toHaveFocus();
  });

  test('maintains semantic HTML structure', () => {
    render(<NarrativeNavigation basketId="test-123" variant="sidebar" />);
    
    // Should use semantic navigation element
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    
    // Should have proper list structure for navigation items
    const navButtons = screen.getAllByRole('button');
    expect(navButtons.length).toBeGreaterThan(0);
  });
});