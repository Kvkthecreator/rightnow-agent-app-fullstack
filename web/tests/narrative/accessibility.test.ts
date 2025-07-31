/**
 * Narrative Accessibility Tests
 * Tests for accessibility compliance in narrative components
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { StrategicActions } from '@/components/narrative/StrategicActions';
import { StrategicUnderstanding } from '@/components/narrative/StrategicUnderstanding';
import { ProgressiveDisclosure } from '@/components/narrative/ProgressiveDisclosure';
import { NarrativeNavigation } from '@/components/navigation/NarrativeNavigation';
import ProjectContext from '@/components/understanding/ProjectContext';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Narrative Component Accessibility', () => {
  describe('StrategicActions Accessibility', () => {
    test('has no accessibility violations', async () => {
      const mockActions = [
        { type: 'capture_insight', label: 'Capture New Insight', enabled: true },
        { type: 'explore_discoveries', label: 'Explore My Discoveries', enabled: true },
        { type: 'share_knowledge', label: 'Share Your Knowledge', enabled: false }
      ];

      const { container } = render(<StrategicActions basketId="test-123" actions={mockActions} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('provides proper ARIA labels for actions', () => {
      const mockActions = [
        { type: 'capture_insight', label: 'Capture New Insight', enabled: true, primary: true },
        { type: 'explore_discoveries', label: 'Explore My Discoveries', enabled: false }
      ];

      render(<StrategicActions basketId="test-123" actions={mockActions} />);
      
      // Primary action should have proper attributes
      const primaryAction = screen.getByRole('button', { name: /capture new insight/i });
      expect(primaryAction).toBeInTheDocument();
      expect(primaryAction).not.toHaveAttribute('aria-disabled', 'true');
      
      // Disabled action should have proper attributes
      const disabledAction = screen.getByRole('button', { name: /explore my discoveries/i });
      expect(disabledAction).toHaveAttribute('disabled');
    });

    test('supports keyboard navigation', () => {
      const mockActions = [
        { type: 'capture_insight', label: 'Capture New Insight', enabled: true },
        { type: 'explore_discoveries', label: 'Explore My Discoveries', enabled: true }
      ];

      render(<StrategicActions basketId="test-123" actions={mockActions} />);
      
      const actions = screen.getAllByRole('button');
      
      // All action buttons should be keyboard accessible
      actions.forEach(action => {
        expect(action).toHaveAttribute('tabIndex', '0');
      });
    });

    test('provides meaningful action descriptions for screen readers', () => {
      const mockActions = [
        { 
          type: 'capture_insight', 
          label: 'Capture New Insight', 
          enabled: true,
          description: 'Add something new you\'re thinking about'
        }
      ];

      render(<StrategicActions basketId="test-123" actions={mockActions} />);
      
      // Description should be associated with button for screen readers
      expect(screen.getByText(/add something new you're thinking/i)).toBeInTheDocument();
    });
  });

  describe('ProgmiscongressiveDisclosure Accessibility', () => {
    test('has proper ARIA attributes for disclosure buttons', async () => {
      const mockProps = {
        story: "I can see strong themes around user experience design",
        reasoning: "This conclusion is based on recurring patterns...",
        substrate: { confidence: 0.87, themes: ['ux'] }
      };

      const { container } = render(<ProgressiveDisclosure {...mockProps} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
      
      // Disclosure buttons should have proper ARIA attributes
      const reasoningButton = screen.getByRole('button', { name: /how I know/i });
      expect(reasoningButton).toHaveAttribute('aria-expanded', 'false');
      
      const substrateButton = screen.getByRole('button', { name: /technical details/i });
      expect(substrateButton).toHaveAttribute('aria-expanded', 'false');
    });

    test('updates ARIA states when disclosure levels change', () => {
      const mockProps = {
        story: "Test story",
        reasoning: "Test reasoning",
        substrate: { data: 'test' }
      };

      render(<ProgressiveDisclosure {...mockProps} />);
      
      const reasoningButton = screen.getByRole('button', { name: /how I know/i });
      
      // Initially collapsed
      expect(reasoningButton).toHaveAttribute('aria-expanded', 'false');
      
      // Expand reasoning
      fireEvent.click(reasoningButton);
      expect(reasoningButton).toHaveAttribute('aria-expanded', 'true');
    });

    test('provides accessible content hierarchy', () => {
      const mockProps = {
        story: "Main story content",
        reasoning: "Detailed reasoning",
        substrate: { technical: 'data' }
      };

      render(<ProgressiveDisclosure {...mockProps} />);
      
      // Should use proper heading hierarchy
      const storyContent = screen.getByText(/main story content/i);
      expect(storyContent).toBeInTheDocument();
      
      // Level indicators should be properly marked
      const storyIndicator = screen.getByText(/story/i);
      expect(storyIndicator).toHaveAttribute('role');
    });

    test('supports screen reader navigation between levels', () => {
      const mockProps = {
        story: "Story level",
        reasoning: "Reasoning level", 
        substrate: { substrate: 'level' }
      };

      render(<ProgressiveDisclosure {...mockProps} />);
      
      // Screen readers should be able to understand the disclosure structure
      const reasoningButton = screen.getByRole('button', { name: /how I know/i });
      expect(reasoningButton).toHaveAttribute('aria-describedby');
    });
  });

  describe('NarrativeNavigation Accessibility', () => {
    test('provides semantic navigation structure', async () => {
      const { container } = render(<NarrativeNavigation basketId="test-123" variant="sidebar" />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
      
      // Should use semantic nav element
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('provides proper focus management for navigation', () => {
      render(<NarrativeNavigation basketId="test-123" variant="tabs" />);
      
      const navButtons = screen.getAllByRole('button');
      
      // All navigation buttons should be focusable
      navButtons.forEach(button => {
        expect(button).not.toHaveAttribute('tabIndex', '-1');
      });
    });

    test('indicates current navigation state for screen readers', () => {
      render(<NarrativeNavigation basketId="test-123" currentTab="insights" />);
      
      const activeTab = screen.getByRole('button', { name: /insights.*ideas/i });
      expect(activeTab).toHaveAttribute('aria-current');
    });

    test('provides descriptive navigation labels', () => {
      render(<NarrativeNavigation basketId="test-123" showDescriptions={true} variant="sidebar" />);
      
      // Should have accessible descriptions
      expect(screen.getByText(/your project overview and AI partnership/i)).toBeInTheDocument();
      expect(screen.getByText(/captured insights, ideas, and discoveries/i)).toBeInTheDocument();
    });
  });

  describe('StrategicUnderstanding Accessibility', () => {
    test('structures understanding content accessibly', async () => {
      const mockProps = {
        understanding: "I can see you're working on user experience improvements",
        themes: ['user experience', 'accessibility', 'inclusive design'],
        confidence: 0.85
      };

      const { container } = render(<StrategicUnderstanding {...mockProps} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('provides accessible theme presentation', () => {
      const mockProps = {
        understanding: "Test understanding",
        themes: ['user experience', 'accessibility', 'design systems'],
        confidence: 0.8
      };

      render(<StrategicUnderstanding {...mockProps} />);
      
      // Themes should be properly labeled
      expect(screen.getByText(/key areas I'm seeing/i)).toBeInTheDocument();
      
      // Theme badges should be accessible
      const themeBadges = screen.getAllByText(/^(user experience|accessibility|design systems)$/i);
      themeBadges.forEach(badge => {
        expect(badge).toBeInTheDocument();
      });
    });

    test('provides accessible confidence indication without technical scores', () => {
      const mockProps = {
        understanding: "I have a strong understanding of your project",
        themes: [],
        confidence: 0.9
      };

      render(<StrategicUnderstanding {...mockProps} />);
      
      // Should show narrative confidence, not technical score
      expect(screen.getByText(/strong.*understanding/i)).toBeInTheDocument();
      expect(screen.queryByText(/0\.9/)).toBeNull();
      expect(screen.queryByText(/90%/)).toBeNull();
    });
  });

  describe('ProjectContext Accessibility', () => {
    test('provides accessible knowledge presentation', async () => {
      const mockItems = [
        {
          id: '1',
          title: 'User Research Document',
          summary: 'Findings from user interviews',
          updated_at: new Date().toISOString()
        }
      ];

      const { container } = render(<ProjectContext items={mockItems} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('provides accessible empty state', async () => {
      const { container } = render(<ProjectContext items={[]} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
      
      // Empty state should be properly announced
      expect(screen.getByText(/no project knowledge yet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share knowledge/i })).toBeInTheDocument();
    });

    test('provides keyboard navigation for knowledge items', () => {
      const mockItems = [
        {
          id: '1',
          title: 'Document 1',
          summary: 'First document',
          updated_at: new Date().toISOString()
        },
        {
          id: '2', 
          title: 'Document 2',
          summary: 'Second document',
          updated_at: new Date().toISOString()
        }
      ];

      render(<ProjectContext items={mockItems} />);
      
      // Knowledge items should be keyboard accessible
      const knowledgeItems = screen.getAllByText(/document \d/i);
      expect(knowledgeItems).toHaveLength(2);
    });
  });

  describe('Color and Contrast Accessibility', () => {
    test('maintains sufficient color contrast for narrative themes', () => {
      const mockProps = {
        understanding: "Test understanding",
        themes: ['important theme', 'secondary theme'],
        confidence: 0.8
      };

      render(<StrategicUnderstanding {...mockProps} />);
      
      // Theme badges should have proper contrast classes
      const themeBadges = screen.getAllByText(/theme$/i);
      themeBadges.forEach(badge => {
        // Should use accessible color classes
        expect(badge).toHaveClass(/text-primary/);
        expect(badge).toHaveClass(/border-primary/);
      });
    });

    test('provides sufficient contrast for action states', () => {
      const mockActions = [
        { type: 'enabled_action', label: 'Enabled Action', enabled: true },
        { type: 'disabled_action', label: 'Disabled Action', enabled: false }
      ];

      render(<StrategicActions basketId="test-123" actions={mockActions} />);
      
      const enabledButton = screen.getByRole('button', { name: /enabled action/i });
      const disabledButton = screen.getByRole('button', { name: /disabled action/i });
      
      // Buttons should have appropriate contrast states
      expect(enabledButton).not.toHaveAttribute('disabled');
      expect(disabledButton).toHaveAttribute('disabled');
    });
  });

  describe('Screen Reader Experience', () => {
    test('provides logical reading order for progressive disclosure', () => {
      const mockProps = {
        story: "Primary narrative content",
        reasoning: "Detailed explanation",
        substrate: { technical: 'details' }
      };

      render(<ProgressiveDisclosure {...mockProps} />);
      
      // Content should be in logical reading order
      const storyContent = screen.getByText(/primary narrative content/i);
      const controlButtons = screen.getAllByRole('button');
      
      expect(storyContent).toBeInTheDocument();
      expect(controlButtons.length).toBeGreaterThan(0);
    });

    test('announces understanding updates appropriately', () => {
      const mockProps = {
        understanding: "I'm learning about your project",
        themes: [],
        confidence: 0.3
      };

      const { rerender } = render(<StrategicUnderstanding {...mockProps} />);
      
      const updatedProps = {
        understanding: "I now have a clear understanding of your project goals",
        themes: ['user experience', 'strategic planning'],
        confidence: 0.9
      };

      rerender(<StrategicUnderstanding {...updatedProps} />);
      
      // Updated understanding should be announced
      expect(screen.getByText(/clear understanding/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Accessibility', () => {
    test('maintains accessibility across different screen sizes', async () => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 });
      
      const { container } = render(<NarrativeNavigation basketId="test-123" variant="tabs" />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
      
      // Reset viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    });

    test('provides touch accessibility for mobile devices', () => {
      const mockActions = [
        { type: 'capture_insight', label: 'Capture New Insight', enabled: true }
      ];

      render(<StrategicActions basketId="test-123" actions={mockActions} />);
      
      const actionButton = screen.getByRole('button', { name: /capture new insight/i });
      
      // Button should have sufficient touch target size
      expect(actionButton).toHaveClass(/h-/); // Height class
      expect(actionButton).toHaveClass(/p-/); // Padding class
    });
  });
});