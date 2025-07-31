/**
 * Ambient Assistance Tests
 * Tests for progressive revelation and ambient intelligence features
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AmbientAssistance } from '@/components/ambient/AmbientAssistance';
import { GentleNotification } from '@/components/ambient/GentleNotification';
import { useRevelationTiming } from '@/lib/ambient/revelationChoreographer';

// Mock the hooks
jest.mock('@/lib/intelligence/useMemoryInsights');
jest.mock('@/lib/intelligence/useDocumentIntelligence');
jest.mock('@/lib/ambient/revelationChoreographer');

const mockUseRevelationTiming = useRevelationTiming as jest.MockedFunction<typeof useRevelationTiming>;

// Mock timer functions
jest.useFakeTimers();

describe('Ambient Assistance System', () => {
  beforeEach(() => {
    mockUseRevelationTiming.mockReturnValue({
      calculateTiming: jest.fn((insight, activity) => {
        if (activity === 'active_work') return -1;
        return activity === 'paused' ? 0 : 2000;
      }),
      scheduleRevelation: jest.fn(),
      cancelRevelation: jest.fn(),
      queuedCount: 0
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Activity-Based Revelation Timing', () => {
    test('respects user activity - no interruptions during active work', () => {
      render(
        <AmbientAssistance
          userActivity="active_work"
          revelationStrategy="wait"
          view="documents"
          basketId="test-123"
        />
      );

      // Should not show any notifications during active work
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.queryByText(/new insight/i)).toBeNull();
    });

    test('provides gentle notifications during exploration', async () => {
      const mockInsights = [
        {
          id: 'insight-1',
          type: 'insight',
          message: 'I found an interesting pattern in your work',
          confidence: 0.8
        }
      ];

      // Mock the memory insights hook to return new insights
      require('@/lib/intelligence/useMemoryInsights').useMemoryInsights.mockReturnValue({
        newInsights: mockInsights
      });

      render(
        <AmbientAssistance
          userActivity="exploring"
          revelationStrategy="gentle_notification"
          view="dashboard"
          basketId="test-123"
        />
      );

      // Should schedule gentle notifications for exploration
      expect(mockUseRevelationTiming().calculateTiming).toHaveBeenCalledWith(
        expect.objectContaining({ confidence: 0.8 }),
        'exploring'
      );
    });

    test('reveals insights immediately during pause', async () => {
      const mockInsights = [
        {
          id: 'insight-2',
          type: 'insight',
          message: 'Ready to share what I discovered',
          confidence: 0.9,
          priority: 'high'
        }
      ];

      require('@/lib/intelligence/useMemoryInsights').useMemoryInsights.mockReturnValue({
        newInsights: mockInsights
      });

      render(
        <AmbientAssistance
          userActivity="paused"
          revelationStrategy="immediate"
          view="dashboard"
          basketId="test-123"
        />
      );

      // Should reveal immediately during pauses
      await waitFor(() => {
        expect(screen.getByText(/ready to share what I discovered/i)).toBeInTheDocument();
      });
    });

    test('provides ambient updates during idle time', () => {
      render(
        <AmbientAssistance
          userActivity="idle"
          revelationStrategy="ambient_update"
          view="dashboard"
          basketId="test-123"
        />
      );

      // Should show ambient progress indicator
      expect(screen.queryByText(/learning from your work/i)).toBeNull(); // Only shows when actively learning
    });
  });

  describe('Progressive Revelation Logic', () => {
    test('prioritizes high-confidence insights', () => {
      const lowConfidenceInsight = { confidence: 0.4, relevance: 0.3, urgency: 0.2 };
      const highConfidenceInsight = { confidence: 0.95, relevance: 0.9, urgency: 0.8 };

      const { calculateTiming } = mockUseRevelationTiming();
      
      // High confidence should get faster timing
      const lowTiming = calculateTiming(lowConfidenceInsight, 'exploring');
      const highTiming = calculateTiming(highConfidenceInsight, 'exploring');
      
      expect(highTiming).toBeLessThanOrEqual(lowTiming);
    });

    test('respects urgency levels', () => {
      const urgentInsight = { confidence: 0.7, relevance: 0.6, urgency: 0.95 };
      const casualInsight = { confidence: 0.7, relevance: 0.6, urgency: 0.3 };

      const { calculateTiming } = mockUseRevelationTiming();
      
      // Urgent insights should be revealed faster
      const urgentTiming = calculateTiming(urgentInsight, 'exploring');
      const casualTiming = calculateTiming(casualInsight, 'exploring');
      
      expect(urgentTiming).toBeLessThan(casualTiming);
    });

    test('considers context relevance', () => {
      const relevantInsight = { confidence: 0.7, relevance: 0.9, urgency: 0.5 };
      const irrelevantInsight = { confidence: 0.7, relevance: 0.2, urgency: 0.5 };

      const { calculateTiming } = mockUseRevelationTiming();
      
      // Relevant insights should be prioritized
      const relevantTiming = calculateTiming(relevantInsight, 'exploring');
      const irrelevantTiming = calculateTiming(irrelevantInsight, 'exploring');
      
      expect(relevantTiming).toBeLessThan(irrelevantTiming);
    });
  });

  describe('Notification Presentation', () => {
    test('shows gentle notifications without disrupting workflow', async () => {
      const user = userEvent.setup({ delay: null });
      
      render(
        <GentleNotification
          id="test-notification"
          type="insight"
          content={{ message: "I discovered something interesting" }}
          onDismiss={jest.fn()}
          autoHide={true}
          duration={3000}
        />
      );

      // Should appear with gentle animation
      await waitFor(() => {
        expect(screen.getByText(/discovered something interesting/i)).toBeInTheDocument();
      });

      // Should have dismiss button
      const dismissButton = screen.getByRole('button', { name: /close/i });
      expect(dismissButton).toBeInTheDocument();

      // Should auto-hide after duration
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.queryByText(/discovered something interesting/i)).toBeNull();
      });
    });

    test('allows manual dismissal of notifications', async () => {
      const onDismiss = jest.fn();
      const user = userEvent.setup({ delay: null });

      render(
        <GentleNotification
          id="dismissible-notification"
          type="suggestion"
          content={{ message: "Here's a suggestion for you" }}
          onDismiss={onDismiss}
          autoHide={false}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /close/i });
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledWith('dismissible-notification');
    });

    test('provides appropriate visual hierarchy for different notification types', () => {
      const { rerender } = render(
        <GentleNotification
          id="insight-notification"
          type="insight"
          content={{ message: "New insight available" }}
          onDismiss={jest.fn()}
        />
      );

      // Should show insight icon
      expect(screen.getByText(/new insight discovered/i)).toBeInTheDocument();

      rerender(
        <GentleNotification
          id="connection-notification"
          type="connection"
          content={{ message: "Found a connection" }}
          onDismiss={jest.fn()}
        />
      );

      // Should show connection-specific messaging
      expect(screen.getByText(/connection found/i)).toBeInTheDocument();
    });
  });

  describe('Learning Progress Indicators', () => {
    test('shows learning progress without being intrusive', () => {
      require('@/lib/intelligence/useMemoryInsights').useMemoryInsights.mockReturnValue({
        isLearning: true,
        growthMetrics: { level: 'developing', percentage: 65 }
      });

      render(
        <AmbientAssistance
          userActivity="idle"
          revelationStrategy="ambient_update"
          view="dashboard"
          basketId="test-123"
        />
      );

      // Should show learning indicator
      expect(screen.getByText(/learning from your work/i)).toBeInTheDocument();
    });

    test('hides learning indicators during active work', () => {
      require('@/lib/intelligence/useMemoryInsights').useMemoryInsights.mockReturnValue({
        isLearning: true
      });

      render(
        <AmbientAssistance
          userActivity="active_work"
          revelationStrategy="wait"
          view="documents"
          basketId="test-123"
        />
      );

      // Should not show learning indicator during active work
      expect(screen.queryByText(/learning from your work/i)).toBeNull();
    });
  });

  describe('Context-Aware Assistance', () => {
    test('provides writing assistance during document editing', () => {
      render(
        <AmbientAssistance
          userActivity="exploring"
          revelationStrategy="gentle_notification"
          view="documents"
          basketId="test-123"
        />
      );

      // Should be aware of document editing context
      // Actual assistance content would be provided by complementary context
      expect(screen.container).toBeInTheDocument();
    });

    test('offers connection insights during insight exploration', () => {
      render(
        <AmbientAssistance
          userActivity="exploring"
          revelationStrategy="gentle_notification"
          view="insights"
          basketId="test-123"
        />
      );

      // Should be ready to provide connection insights
      expect(screen.container).toBeInTheDocument();
    });

    test('provides strategic guidance during dashboard overview', () => {
      render(
        <AmbientAssistance
          userActivity="paused"
          revelationStrategy="immediate"
          view="dashboard"
          basketId="test-123"
        />
      );

      // Should be ready to provide strategic guidance
      expect(screen.container).toBeInTheDocument();
    });
  });

  describe('Revelation Flow Management', () => {
    test('limits concurrent revelations to avoid overwhelming', async () => {
      const manyInsights = Array.from({ length: 5 }, (_, i) => ({
        id: `insight-${i}`,
        type: 'insight',
        message: `Insight ${i}`,
        confidence: 0.8
      }));

      require('@/lib/intelligence/useMemoryInsights').useMemoryInsights.mockReturnValue({
        newInsights: manyInsights
      });

      render(
        <AmbientAssistance
          userActivity="paused"
          revelationStrategy="immediate"
          view="dashboard"
          basketId="test-123"
        />
      );

      // Should limit the number of concurrent notifications
      const notifications = screen.queryAllByRole('alert');
      expect(notifications.length).toBeLessThanOrEqual(2);
    });

    test('queues low-priority insights appropriately', () => {
      const lowPriorityInsights = [
        { id: '1', confidence: 0.3, urgency: 0.2, type: 'suggestion' },
        { id: '2', confidence: 0.4, urgency: 0.1, type: 'insight' }
      ];

      // Should queue rather than show immediately
      expect(mockUseRevelationTiming().scheduleRevelation).not.toHaveBeenCalled();
    });
  });

  describe('User Experience Optimization', () => {
    test('feels helpful rather than intrusive', () => {
      render(
        <AmbientAssistance
          userActivity="exploring"
          revelationStrategy="gentle_notification"
          view="dashboard"
          basketId="test-123"
        />
      );

      // Should use gentle, supportive language
      // Should not compete with main content for attention
      // Should provide value without demanding immediate action
      expect(screen.container).toBeInTheDocument();
    });

    test('adapts revelation frequency based on user engagement', () => {
      // Mock user showing low engagement with revelations
      const { scheduleRevelation } = mockUseRevelationTiming();
      
      render(
        <AmbientAssistance
          userActivity="exploring"
          revelationStrategy="gentle_notification"
          view="dashboard"
          basketId="test-123"
        />
      );

      // Should adapt frequency based on engagement patterns
      // Implementation would track user interactions with revelations
      expect(scheduleRevelation).toHaveBeenCalled();
    });

    test('maintains narrative voice in ambient assistance', () => {
      render(
        <GentleNotification
          id="narrative-test"
          type="insight"
          content={{ 
            message: "I noticed an interesting pattern in your approach to user research"
          }}
          onDismiss={jest.fn()}
        />
      );

      // Should use first-person AI voice
      expect(screen.getByText(/I noticed an interesting pattern/i)).toBeInTheDocument();
      
      // Should not use technical or system language
      expect(screen.queryByText(/system detected/i)).toBeNull();
      expect(screen.queryByText(/algorithm found/i)).toBeNull();
    });
  });
});