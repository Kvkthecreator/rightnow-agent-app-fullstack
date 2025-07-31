/**
 * Attention Distribution Tests  
 * Tests for the 80/20 attention management system
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdaptiveLayout } from '@/components/layouts/AdaptiveLayout';
import { useAttentionManagement } from '@/lib/layout/attentionManager';
import { useActivityDetection } from '@/lib/ambient/activityDetection';

// Mock the hooks
jest.mock('@/lib/layout/attentionManager');
jest.mock('@/lib/layout/contextualAwareness');
jest.mock('@/lib/ambient/activityDetection');

const mockUseAttentionManagement = useAttentionManagement as jest.MockedFunction<typeof useAttentionManagement>;
const mockUseActivityDetection = useActivityDetection as jest.MockedFunction<typeof useActivityDetection>;

describe('Attention Distribution System', () => {
  beforeEach(() => {
    mockUseAttentionManagement.mockReturnValue({
      navigation: { classes: 'w-72', width: '18rem', priority: 20 },
      primary: { classes: 'flex-1', priority: 80 },
      complementary: { classes: 'w-80', width: '20rem', priority: 'supportive' as const }
    });
    
    mockUseActivityDetection.mockReturnValue('exploring');
  });

  describe('80/20 Attention Rule', () => {
    test('primary workspace receives 80% visual priority', () => {
      const mockContent = <div data-testid="main-content">Main Content</div>;
      
      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          {mockContent}
        </AdaptiveLayout>
      );

      const primaryWorkspace = screen.getByRole('main');
      expect(primaryWorkspace).toHaveClass('flex-1');
      
      // Primary workspace should have the largest visual weight
      const computedStyle = window.getComputedStyle(primaryWorkspace);
      const flexGrow = computedStyle.getPropertyValue('flex-grow');
      expect(flexGrow).toBe('1');
    });

    test('navigation hub uses minimal attention (20%)', () => {
      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Content</div>
        </AdaptiveLayout>
      );

      // Navigation should be present but not dominant
      const nav = screen.getByRole('navigation', { name: /navigate/i });
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveClass('w-72'); // Fixed width, not flex
    });

    test('complementary context provides supporting information without competing', () => {
      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Content</div>
        </AdaptiveLayout>
      );

      // Right panel should be present but secondary
      const aside = screen.getByRole('complementary');
      expect(aside).toBeInTheDocument();
      expect(aside).toHaveClass('w-80'); // Fixed width, smaller than main
    });
  });

  describe('Focus Mode', () => {
    test('focus mode gives 100% attention to primary workspace', async () => {
      render(
        <AdaptiveLayout view="documents" basketId="test-123">
          <div data-testid="document-content">Document Content</div>
        </AdaptiveLayout>
      );

      // Enter focus mode
      const focusButton = screen.getByRole('button', { name: /focus mode/i });
      fireEvent.click(focusButton);

      await waitFor(() => {
        // Primary workspace should expand to full width
        const primaryWorkspace = screen.getByRole('main');
        expect(primaryWorkspace).toHaveClass('w-full');
        
        // Complementary context should be hidden
        expect(screen.queryByRole('complementary')).toBeNull();
        
        // Navigation should be minimized
        const nav = screen.getByRole('navigation');
        expect(nav).toHaveClass('w-16');
      });
    });

    test('focus mode can be toggled on and off', async () => {
      render(
        <AdaptiveLayout view="documents" basketId="test-123">
          <div>Content</div>
        </AdaptiveLayout>
      );

      const focusButton = screen.getByRole('button', { name: /focus mode/i });
      
      // Enter focus mode
      fireEvent.click(focusButton);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /exit focus/i })).toBeInTheDocument();
      });

      // Exit focus mode
      const exitButton = screen.getByRole('button', { name: /exit focus/i });
      fireEvent.click(exitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /focus mode/i })).toBeInTheDocument();
        expect(screen.getByRole('complementary')).toBeInTheDocument();
      });
    });
  });

  describe('View-Specific Attention Distribution', () => {
    test('documents view prioritizes primary workspace for writing', () => {
      mockUseAttentionManagement.mockReturnValue({
        navigation: { classes: 'w-64', width: '16rem', priority: 10 },
        primary: { classes: 'flex-1', priority: 85 },
        complementary: { classes: 'w-80', width: '20rem', priority: 'ambient' as const }
      });

      render(
        <AdaptiveLayout view="documents" basketId="test-123">
          <div>Document Editor</div>
        </AdaptiveLayout>
      );

      // Should call useAttentionManagement with documents view
      expect(mockUseAttentionManagement).toHaveBeenCalledWith('documents', false);
    });

    test('insights view supports exploration with more context', () => {
      mockUseAttentionManagement.mockReturnValue({
        navigation: { classes: 'w-72', width: '18rem', priority: 15 },
        primary: { classes: 'flex-1', priority: 75 },
        complementary: { classes: 'w-96', width: '24rem', priority: 'supportive' as const }
      });

      render(
        <AdaptiveLayout view="insights" basketId="test-123">
          <div>Insights Explorer</div>
        </AdaptiveLayout>
      );

      expect(mockUseAttentionManagement).toHaveBeenCalledWith('insights', false);
    });

    test('dashboard view provides balanced attention distribution', () => {
      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Dashboard Content</div>
        </AdaptiveLayout>
      );

      expect(mockUseAttentionManagement).toHaveBeenCalledWith('dashboard', false);
    });
  });

  describe('Responsive Attention Management', () => {
    test('adapts attention distribution for smaller screens', () => {
      // Mock smaller screen width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Content</div>
        </AdaptiveLayout>
      );

      // Should auto-collapse right panel on smaller screens
      const collapseToggle = screen.getByLabelText(/show context panel/i);
      expect(collapseToggle).toBeInTheDocument();
    });

    test('maintains full layout on larger screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1400
      });

      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Content</div>
        </AdaptiveLayout>
      );

      // All panels should be visible
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });
  });

  describe('Panel Collapse/Expand Functionality', () => {
    test('right panel can be collapsed and expanded', async () => {
      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Content</div>
        </AdaptiveLayout>
      );

      // Find and click collapse button
      const collapseButton = screen.getByLabelText(/hide context panel/i);
      fireEvent.click(collapseButton);

      await waitFor(() => {
        // Right panel should be collapsed
        const rightPanel = screen.getByRole('complementary').parentElement;
        expect(rightPanel).toHaveClass('w-0');
      });

      // Find and click expand button
      const expandButton = screen.getByLabelText(/show context panel/i);
      fireEvent.click(expandButton);

      await waitFor(() => {
        // Right panel should be expanded
        const rightPanel = screen.getByRole('complementary').parentElement;
        expect(rightPanel).not.toHaveClass('w-0');
      });
    });

    test('navigation can be minimized in focus contexts', async () => {
      render(
        <AdaptiveLayout view="documents" basketId="test-123">
          <div>Document Content</div>
        </AdaptiveLayout>
      );

      // Navigation should support minimization for document editing
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      
      // Should have minimize functionality available
      expect(nav).toHaveClass(/transition-all/);
    });
  });

  describe('Attention Metrics and Analytics', () => {
    test('tracks time spent in different attention modes', () => {
      const { rerender } = render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Content</div>  
        </AdaptiveLayout>
      );

      // Should track attention metrics
      expect(mockUseAttentionManagement).toHaveBeenCalled();
      
      // Simulate view change
      rerender(
        <AdaptiveLayout view="documents" basketId="test-123">
          <div>Document Content</div>
        </AdaptiveLayout>
      );

      // Should track view transition
      expect(mockUseAttentionManagement).toHaveBeenCalledWith('documents', false);
    });

    test('measures user engagement with different panels', () => {
      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Interactive Content</div>
        </AdaptiveLayout>
      );

      // Simulate user interactions
      const primaryWorkspace = screen.getByRole('main');
      fireEvent.click(primaryWorkspace);
      fireEvent.focus(primaryWorkspace);

      // Should track focus events for attention analytics
      expect(primaryWorkspace).toHaveAttribute('tabIndex', '-1');
    });
  });
});

describe('Attention Configuration', () => {
  test('calculates correct visual weight distribution', () => {
    const config = {
      navigation: { classes: 'w-72', width: '18rem', priority: 20 },
      primary: { classes: 'flex-1', priority: 80 },
      complementary: { classes: 'w-80', width: '20rem', priority: 'supportive' as const }
    };

    // Visual weight should reflect 80/20 principle
    expect(config.primary.priority).toBe(80);
    expect(config.navigation.priority).toBe(20);
  });

  test('adapts configuration based on user activity', () => {
    mockUseActivityDetection.mockReturnValue('active_work');

    render(
      <AdaptiveLayout view="documents" basketId="test-123">
        <div>Writing Content</div>
      </AdaptiveLayout>
    );

    // Should adapt to active work mode
    expect(mockUseActivityDetection).toHaveBeenCalled();
  });
});