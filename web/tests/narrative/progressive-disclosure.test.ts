/**
 * Progressive Disclosure Tests
 * Tests for the progressive disclosure pattern implementation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProgressiveDisclosure } from '@/components/narrative/ProgressiveDisclosure';
import { ProgressiveLayout } from '@/components/layouts/ProgressiveLayout';

describe('Progressive Disclosure Component', () => {
  const mockProps = {
    story: "I can see strong themes around user experience design",
    reasoning: "This conclusion is based on recurring patterns in your documents and conversations about user interface improvements and user research findings.",
    substrate: {
      themes: ['user-experience', 'interface-design', 'user-research'],
      confidence: 0.87,
      analysis_id: "analysis-123",
      patterns_found: 15,
      documents_analyzed: 8
    }
  };

  describe('Default Behavior', () => {
    test('shows story level by default', () => {
      render(<ProgressiveDisclosure {...mockProps} />);
      
      expect(screen.getByText(mockProps.story)).toBeInTheDocument();
      expect(screen.queryByText(mockProps.reasoning)).toBeNull();
      expect(screen.queryByText(/analysis-123/)).toBeNull();
    });

    test('provides disclosure controls when reasoning available', () => {
      render(<ProgressiveDisclosure {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /how I know/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /technical details/i })).toBeInTheDocument();
    });

    test('hides disclosure controls when only story provided', () => {
      render(<ProgressiveDisclosure story={mockProps.story} />);
      
      expect(screen.queryByRole('button', { name: /how I know/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /technical details/i })).toBeNull();
    });
  });

  describe('Disclosure Interaction', () => {
    test('reveals reasoning on "How I Know" click', async () => {
      render(<ProgressiveDisclosure {...mockProps} />);
      
      const reasoningButton = screen.getByRole('button', { name: /how I know/i });
      fireEvent.click(reasoningButton);
      
      await waitFor(() => {
        expect(screen.getByText(mockProps.reasoning)).toBeInTheDocument();
      });
    });

    test('reveals substrate on "Technical Details" click', async () => {
      render(<ProgressiveDisclosure {...mockProps} />);
      
      const substrateButton = screen.getByRole('button', { name: /technical details/i });
      fireEvent.click(substrateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/analysis-123/)).toBeInTheDocument();
        expect(screen.getByText(/0.87/)).toBeInTheDocument();
      });
    });

    test('allows navigation between levels', async () => {
      render(<ProgressiveDisclosure {...mockProps} />);
      
      // Go to reasoning
      fireEvent.click(screen.getByRole('button', { name: /how I know/i }));
      await waitFor(() => {
        expect(screen.getByText(mockProps.reasoning)).toBeInTheDocument();
      });
      
      // Go to substrate
      fireEvent.click(screen.getByRole('button', { name: /technical details/i }));
      await waitFor(() => {
        expect(screen.getByText(/analysis-123/)).toBeInTheDocument();
      });
      
      // Go back to story
      fireEvent.click(screen.getByRole('button', { name: /story/i }));
      await waitFor(() => {
        expect(screen.getByText(mockProps.story)).toBeInTheDocument();
        expect(screen.queryByText(mockProps.reasoning)).toBeNull();
      });
    });
  });

  describe('Visual Hierarchy', () => {
    test('shows appropriate level indicators', async () => {
      render(<ProgressiveDisclosure {...mockProps} />);
      
      // Story level indicator
      expect(screen.getByText(/story/i)).toBeInTheDocument();
      
      // Switch to reasoning
      fireEvent.click(screen.getByRole('button', { name: /how I know/i }));
      await waitFor(() => {
        expect(screen.getByText(/how I know/i)).toHaveClass('active');
      });
      
      // Switch to substrate  
      fireEvent.click(screen.getByRole('button', { name: /technical details/i }));
      await waitFor(() => {
        expect(screen.getByText(/technical details/i)).toHaveClass('active');
      });
    });

    test('provides helpful context for level transitions', () => {
      render(<ProgressiveDisclosure {...mockProps} />);
      
      // Should show hint about deeper levels
      expect(screen.getByText(/want to see how I know/i)).toBeInTheDocument();
    });
  });

  describe('Content Rendering', () => {
    test('renders story as React node when provided as JSX', () => {
      const storyJsx = (
        <div>
          <strong>Strong understanding</strong> of your project goals
        </div>
      );
      
      render(<ProgressiveDisclosure story={storyJsx} />);
      
      expect(screen.getByText(/strong understanding/i)).toBeInTheDocument();
      expect(screen.getByRole('strong')).toBeInTheDocument();
    });

    test('renders substrate data appropriately', async () => {
      render(<ProgressiveDisclosure {...mockProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /technical details/i }));
      
      await waitFor(() => {
        // Should format substrate data readably
        expect(screen.getByText(/themes:/i)).toBeInTheDocument();
        expect(screen.getByText(/confidence:/i)).toBeInTheDocument();
        expect(screen.getByText(/patterns found:/i)).toBeInTheDocument();
      });
    });

    test('handles empty or null substrate gracefully', () => {
      render(<ProgressiveDisclosure story={mockProps.story} reasoning={mockProps.reasoning} substrate={null} />);
      
      // Should only show reasoning button, not substrate
      expect(screen.getByRole('button', { name: /how I know/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /technical details/i })).toBeNull();
    });
  });

  describe('Children Integration', () => {
    test('renders children content alongside disclosure', () => {
      render(
        <ProgressiveDisclosure {...mockProps}>
          <div data-testid="child-content">Child component content</div>
        </ProgressiveDisclosure>
      );
      
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText(/child component content/i)).toBeInTheDocument();
    });

    test('maintains children visibility across level changes', async () => {
      render(
        <ProgressiveDisclosure {...mockProps}>
          <div data-testid="persistent-child">Always visible</div>
        </ProgressiveDisclosure>
      );
      
      // Should be visible at story level
      expect(screen.getByTestId('persistent-child')).toBeInTheDocument();
      
      // Should remain visible at reasoning level
      fireEvent.click(screen.getByRole('button', { name: /how I know/i }));
      await waitFor(() => {
        expect(screen.getByTestId('persistent-child')).toBeInTheDocument();
      });
      
      // Should remain visible at substrate level
      fireEvent.click(screen.getByRole('button', { name: /technical details/i }));
      await waitFor(() => {
        expect(screen.getByTestId('persistent-child')).toBeInTheDocument();
      });
    });
  });
});

describe('Progressive Layout Component', () => {
  test('provides layout structure for progressive components', () => {
    render(
      <ProgressiveLayout title="Test Layout">
        <div>Test content</div>
      </ProgressiveLayout>
    );
    
    expect(screen.getByText(/test layout/i)).toBeInTheDocument();
    expect(screen.getByText(/test content/i)).toBeInTheDocument();
  });

  test('supports different default levels', () => {
    render(
      <ProgressiveLayout defaultLevel="reasoning" showLevelIndicator={true}>
        <div>Content</div>
      </ProgressiveLayout>
    );
    
    // Should start at reasoning level
    expect(screen.getByText(/how I know/i)).toHaveClass('active');
  });

  test('calls level change callback', () => {
    const mockCallback = jest.fn();
    
    render(
      <ProgressiveLayout onLevelChange={mockCallback}>
        <div>Content</div>
      </ProgressiveLayout>
    );
    
    fireEvent.click(screen.getByRole('button', { name: /how I know/i }));
    expect(mockCallback).toHaveBeenCalledWith('reasoning');
    
    fireEvent.click(screen.getByRole('button', { name: /technical/i }));
    expect(mockCallback).toHaveBeenCalledWith('substrate');
  });
});

describe('Accessibility', () => {
  test('provides proper ARIA labels and roles', () => {
    render(<ProgressiveDisclosure {...mockProps} />);
    
    // Disclosure buttons should have proper roles
    expect(screen.getByRole('button', { name: /how I know/i })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /technical details/i })).toHaveAttribute('aria-expanded', 'false');
  });

  test('updates ARIA states on disclosure', async () => {
    render(<ProgressiveDisclosure {...mockProps} />);
    
    const reasoningButton = screen.getByRole('button', { name: /how I know/i });
    fireEvent.click(reasoningButton);
    
    await waitFor(() => {
      expect(reasoningButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  test('provides keyboard navigation', () => {
    render(<ProgressiveDisclosure {...mockProps} />);
    
    const reasoningButton = screen.getByRole('button', { name: /how I know/i });
    
    // Should be focusable
    reasoningButton.focus();
    expect(document.activeElement).toBe(reasoningButton);
    
    // Should respond to Enter key
    fireEvent.keyDown(reasoningButton, { key: 'Enter' });
    expect(screen.getByText(mockProps.reasoning)).toBeInTheDocument();
  });
});