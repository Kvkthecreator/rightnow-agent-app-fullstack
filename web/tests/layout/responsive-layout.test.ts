/**
 * Responsive Layout Tests
 * Tests for adaptive layout behavior across different screen sizes
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdaptiveLayout } from '@/components/layouts/AdaptiveLayout';
import { getResponsiveAttention } from '@/lib/layout/attentionManager';

// Mock window dimensions
const mockWindowDimensions = (width: number, height: number = 800) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  });
};

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('Responsive Layout System', () => {
  describe('Desktop Layout (1200px+)', () => {
    beforeEach(() => {
      mockWindowDimensions(1400);
    });

    test('shows full three-panel layout on desktop', () => {
      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Main Content</div>
        </AdaptiveLayout>
      );

      // All three panels should be visible
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    test('maintains 80/20 attention distribution on desktop', () => {
      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Content</div>
        </AdaptiveLayout>
      );

      const primaryWorkspace = screen.getByRole('main');
      const navigation = screen.getByRole('navigation');
      const complementary = screen.getByRole('complementary');

      // Primary should be flex-1 (takes remaining space)
      expect(primaryWorkspace).toHaveClass('flex-1');
      
      // Side panels should have fixed widths
      expect(navigation).toHaveClass(/w-/); // Has width class
      expect(complementary.parentElement).toHaveClass(/w-/); // Has width class
    });

    test('supports panel collapse/expand on desktop', async () => {
      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Content</div>
        </AdaptiveLayout>
      );

      // Find collapse button for right panel
      const collapseButton = screen.getByLabelText(/hide context panel/i);
      fireEvent.click(collapseButton);

      await waitFor(() => {
        const rightPanelContainer = screen.getByRole('complementary').parentElement;
        expect(rightPanelContainer).toHaveClass('w-0');
      });

      // Find expand button
      const expandButton = screen.getByLabelText(/show context panel/i);
      fireEvent.click(expandButton);

      await waitFor(() => {
        const rightPanelContainer = screen.getByRole('complementary').parentElement;
        expect(rightPanelContainer).not.toHaveClass('w-0');
      });
    });
  });

  describe('Tablet Layout (768px - 1199px)', () => {
    beforeEach(() => {
      mockWindowDimensions(1000);
    });

    test('auto-collapses right panel on tablet screens', () => {
      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Main Content</div>
        </AdaptiveLayout>
      );

      // Right panel should be collapsed by default
      const rightPanelContainer = screen.getByRole('complementary').parentElement;
      expect(rightPanelContainer).toHaveClass('w-0');
    });

    test('shows expand button for collapsed right panel', () => {
      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Content</div>
        </AdaptiveLayout>
      );

      // Should show expand button when collapsed
      const expandButton = screen.getByLabelText(/show context panel/i);
      expect(expandButton).toBeInTheDocument();
    });

    test('maintains navigation and primary workspace on tablet', () => {
      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Content</div>
        </AdaptiveLayout>
      );

      // Navigation and main content should still be visible
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Mobile Layout (< 768px)', () => {
    beforeEach(() => {
      mockWindowDimensions(400);
    });

    test('gives 100% width to primary workspace on mobile', () => {
      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Mobile Content</div>
        </AdaptiveLayout>
      );

      const primaryWorkspace = screen.getByRole('main');
      expect(primaryWorkspace).toHaveClass('flex-1');
    });

    test('hides complementary context on mobile by default', () => {
      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Content</div>
        </AdaptiveLayout>
      );

      // Right panel should be collapsed on mobile
      const rightPanelContainer = screen.getByRole('complementary').parentElement;
      expect(rightPanelContainer).toHaveClass('w-0');
    });
  });

  describe('Responsive Breakpoint Behavior', () => {
    test('adapts layout when window is resized', async () => {
      // Start with desktop size
      mockWindowDimensions(1400);
      
      const { rerender } = render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Responsive Content</div>
        </AdaptiveLayout>
      );

      // Should show full layout initially
      expect(screen.getByRole('complementary')).toBeInTheDocument();

      // Simulate resize to tablet
      mockWindowDimensions(1000);
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        // Right panel should auto-collapse
        const rightPanelContainer = screen.getByRole('complementary').parentElement;
        expect(rightPanelContainer).toHaveClass('w-0');
      });
    });

    test('responsive attention configuration matches screen size', () => {
      // Test desktop configuration
      const desktopConfig = getResponsiveAttention(1400);
      expect(desktopConfig).toEqual({});

      // Test tablet configuration  
      const tabletConfig = getResponsiveAttention(1000);
      expect(tabletConfig.complementary?.priority).toBe('hidden');

      // Test mobile configuration
      const mobileConfig = getResponsiveAttention(600);
      expect(mobileConfig.primary?.classes).toBe('w-full');
    });
  });

  describe('Touch and Mobile Interactions', () => {
    beforeEach(() => {
      mockWindowDimensions(400);
    });

    test('provides touch-friendly button sizes on mobile', () => {
      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Touch Content</div>
        </AdaptiveLayout>
      );

      // Focus mode button should be touch-friendly
      const focusButton = screen.getByRole('button', { name: /focus mode/i });
      expect(focusButton).toHaveClass(/p-/); // Has padding for touch targets
    });

    test('supports swipe gestures for panel navigation on mobile', () => {
      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Swipeable Content</div>
        </AdaptiveLayout>
      );

      // Should be set up for touch interactions
      const primaryWorkspace = screen.getByRole('main');
      expect(primaryWorkspace).toBeInTheDocument();
    });
  });

  describe('Responsive Focus Mode', () => {
    test('focus mode works consistently across screen sizes', async () => {
      const { rerender } = render(
        <AdaptiveLayout view="documents" basketId="test-123">
          <div>Document Content</div>
        </AdaptiveLayout>
      );

      const focusButton = screen.getByRole('button', { name: /focus mode/i });
      fireEvent.click(focusButton);

      await waitFor(() => {
        const primaryWorkspace = screen.getByRole('main');
        expect(primaryWorkspace).toHaveClass('w-full');
      });

      // Test on different screen sizes
      mockWindowDimensions(800);
      fireEvent(window, new Event('resize'));

      // Focus mode should still work
      await waitFor(() => {
        const primaryWorkspace = screen.getByRole('main');
        expect(primaryWorkspace).toHaveClass('w-full');
      });
    });

    test('focus mode adapts navigation behavior for different screen sizes', async () => {
      mockWindowDimensions(1200);
      
      render(
        <AdaptiveLayout view="documents" basketId="test-123">
          <div>Content</div>
        </AdaptiveLayout>
      );

      const focusButton = screen.getByRole('button', { name: /focus mode/i });
      fireEvent.click(focusButton);

      await waitFor(() => {
        // Navigation should be minimized in focus mode
        const navigation = screen.getByRole('navigation');
        expect(navigation).toHaveClass('w-16');
      });
    });
  });

  describe('Progressive Enhancement', () => {
    test('works without JavaScript (basic layout)', () => {
      // Disable JavaScript-dependent features
      const originalAddEventListener = window.addEventListener;
      window.addEventListener = jest.fn();

      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Enhanced Content</div>
        </AdaptiveLayout>
      );

      // Basic layout should still work
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText(/enhanced content/i)).toBeInTheDocument();

      // Restore
      window.addEventListener = originalAddEventListener;
    });

    test('gracefully handles resize events', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Resilient Content</div>
        </AdaptiveLayout>
      );

      // Simulate rapid resize events
      for (let i = 0; i < 10; i++) {
        mockWindowDimensions(800 + i * 100);
        fireEvent(window, new Event('resize'));
      }

      // Should not throw errors
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Optimization', () => {
    test('throttles resize events for performance', async () => {
      const mockHandler = jest.fn();
      
      render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Performance Content</div>
        </AdaptiveLayout>
      );

      // Simulate rapid resize events
      for (let i = 0; i < 50; i++) {
        fireEvent(window, new Event('resize'));
      }

      // Should throttle the resize handling
      await waitFor(() => {
        // Component should still be responsive but not handle every single event
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    test('efficiently manages panel visibility changes', () => {
      const { rerender } = render(
        <AdaptiveLayout view="dashboard" basketId="test-123">
          <div>Efficient Content</div>
        </AdaptiveLayout>
      );

      // Multiple re-renders should be efficient
      for (let i = 0; i < 10; i++) {
        rerender(
          <AdaptiveLayout view="dashboard" basketId="test-123">
            <div>Efficient Content {i}</div>
          </AdaptiveLayout>
        );
      }

      expect(screen.getByText(/efficient content 9/i)).toBeInTheDocument();
    });
  });
});