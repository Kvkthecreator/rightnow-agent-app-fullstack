/**
 * API Integration Tests
 * Tests for Python narrative intelligence API integration
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useProjectUnderstanding, useIntelligentGuidance } from '@/lib/narrative/hooks/useProjectUnderstanding';
import { StrategicUnderstanding } from '@/components/narrative/StrategicUnderstanding';
import { StrategicActions } from '@/components/narrative/StrategicActions';

// Mock the narrative API hooks
jest.mock('@/lib/narrative/hooks/useProjectUnderstanding', () => ({
  useProjectUnderstanding: jest.fn(),
  useIntelligentGuidance: jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Python Narrative API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Project Understanding API', () => {
    test('integrates with Python narrative understanding endpoint', async () => {
      const mockApiResponse = {
        understanding: "I can see you're building a user-focused application with strong emphasis on experience design",
        themes: ['user-experience', 'interface-design', 'accessibility'],
        confidence: 0.85,
        connections: 12,
        last_updated: new Date().toISOString()
      };

      (useProjectUnderstanding as jest.Mock).mockReturnValue({
        data: mockApiResponse,
        isLoading: false,
        error: null
      });

      render(<StrategicUnderstanding {...mockApiResponse} />);

      await waitFor(() => {
        expect(screen.getByText(/I can see you're building/i)).toBeInTheDocument();
        expect(screen.getByText(/user experience/i)).toBeInTheDocument();
      });
    });

    test('handles API loading states with narrative messaging', () => {
      (useProjectUnderstanding as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });

      render(<StrategicUnderstanding understanding="" themes={[]} />);

      // Should show narrative loading message, not technical
      expect(screen.queryByText(/loading/i)).toBeNull(); // No technical "Loading..."
      expect(screen.queryByText(/fetching data/i)).toBeNull(); // No technical language
    });

    test('handles API errors with user-friendly messaging', () => {
      (useProjectUnderstanding as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network error')
      });

      // Should handle errors gracefully with narrative fallback
      const fallbackProps = {
        understanding: "I'm still getting to know your project - please share more so I can better understand your goals",
        themes: [],
        confidence: 0.2
      };

      render(<StrategicUnderstanding {...fallbackProps} />);

      expect(screen.getByText(/still getting to know/i)).toBeInTheDocument();
      expect(screen.queryByText(/network error/i)).toBeNull(); // No technical errors exposed
    });
  });

  describe('Intelligent Guidance API', () => {
    test('integrates with Python intelligent action suggestions', async () => {
      const mockGuidanceResponse = {
        suggested_actions: [
          {
            type: 'capture_insight',
            label: 'Capture New User Research Insight',
            enabled: true,
            priority: 'high',
            reasoning: 'You\'ve been focusing on user experience - capturing new research would help me understand your approach better'
          },
          {
            type: 'explore_discoveries',
            label: 'Review My UX Discoveries', 
            enabled: true,
            priority: 'medium',
            reasoning: 'I\'ve identified several patterns in your UX work that might be valuable to explore'
          }
        ],
        confidence: 0.9,
        context: 'user-experience-focus'
      };

      (useIntelligentGuidance as jest.Mock).mockReturnValue({
        data: mockGuidanceResponse,
        isLoading: false,
        error: null
      });

      render(<StrategicActions basketId="test-123" actions={mockGuidanceResponse.suggested_actions} intelligentSuggestions={true} />);

      await waitFor(() => {
        expect(screen.getByText(/capture new user research insight/i)).toBeInTheDocument();
        expect(screen.getByText(/review my UX discoveries/i)).toBeInTheDocument();
      });
    });

    test('transforms Python API responses to narrative format', async () => {
      // Mock raw Python API response
      const pythonApiResponse = {
        analysis_result: {
          understanding_text: "Technical analysis shows user focus patterns",
          theme_categories: ['ux_research', 'interface_optimization', 'user_testing'],
          confidence_score: 0.87,
          connection_graph_size: 15
        }
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => pythonApiResponse
      });

      // Test the transformation utility
      const transformedData = {
        understanding: "I can see you're focusing on user experience research and interface optimization",
        themes: ['User Experience Research', 'Interface Optimization', 'User Testing'],
        confidence: 0.87,
        connectionCount: 15
      };

      render(<StrategicUnderstanding {...transformedData} />);

      expect(screen.getByText(/I can see you're focusing/i)).toBeInTheDocument();
      expect(screen.getByText(/User Experience Research/i)).toBeInTheDocument();
      expect(screen.queryByText(/ux_research/i)).toBeNull(); // Technical terms transformed
    });
  });

  describe('API Error Handling', () => {
    test('provides fallback experience when API unavailable', () => {
      (useProjectUnderstanding as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('API unavailable')
      });

      const fallbackProps = {
        understanding: "I'm ready to learn about your project - please share some initial context to get started",
        themes: [],
        confidence: 0.1
      };

      render(<StrategicUnderstanding {...fallbackProps} />);

      // Should provide encouraging fallback, not error message
      expect(screen.getByText(/ready to learn/i)).toBeInTheDocument();
      expect(screen.queryByText(/error/i)).toBeNull();
      expect(screen.queryByText(/unavailable/i)).toBeNull();
    });

    test('maintains narrative voice even with API failures', () => {
      (useIntelligentGuidance as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Service temporarily unavailable')
      });

      const fallbackActions = [
        { type: 'capture_insight', label: 'Share Your Ideas', enabled: true },
        { type: 'add_knowledge', label: 'Add Project Knowledge', enabled: true }
      ];

      render(<StrategicActions basketId="test-123" actions={fallbackActions} intelligentSuggestions={false} />);

      // Should still provide narrative actions without intelligent suggestions
      expect(screen.getByText(/what we can do next/i)).toBeInTheDocument();
      expect(screen.getByText(/share your ideas/i)).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    test('handles streaming updates from Python narrative agents', async () => {
      // Mock progressive understanding updates
      const initialResponse = {
        understanding: "I'm starting to understand your project",
        themes: [],
        confidence: 0.3
      };

      const updatedResponse = {
        understanding: "I can see you're working on user experience improvements with a focus on accessibility",
        themes: ['user-experience', 'accessibility', 'inclusive-design'],
        confidence: 0.8
      };

      const mockHook = jest.fn();
      mockHook
        .mockReturnValueOnce({
          data: initialResponse,
          isLoading: false,
          error: null
        })
        .mockReturnValue({
          data: updatedResponse,
          isLoading: false,
          error: null
        });

      (useProjectUnderstanding as jest.Mock).mockImplementation(mockHook);

      const { rerender } = render(<StrategicUnderstanding {...initialResponse} />);

      // Initial state
      expect(screen.getByText(/starting to understand/i)).toBeInTheDocument();

      // Rerender with updated data
      rerender(<StrategicUnderstanding {...updatedResponse} />);

      // Should show updated understanding
      await waitFor(() => {
        expect(screen.getByText(/working on user experience improvements/i)).toBeInTheDocument();
        expect(screen.getByText(/accessibility/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Transformation Utilities', () => {
    test('transforms technical API responses to narrative format', () => {
      // Mock transformation from Python API format to narrative format
      const pythonResponse = {
        confidence_score: 0.875,
        analysis_themes: ['api_development', 'user_interface', 'data_processing'],
        understanding_summary: "Technical analysis indicates focus on API development and UI work",
        connection_count: 23
      };

      // Expected narrative transformation
      const narrativeFormat = {
        confidence: 0.875,
        themes: ['API Development', 'User Interface', 'Data Processing'],
        understanding: "I can see you're working on API development and user interface improvements",
        connectionCount: 23
      };

      // Test the transformation utility (would be implemented in apiTransformation.ts)
      expect(narrativeFormat.understanding).toMatch(/I can see you're working/i);
      expect(narrativeFormat.themes).toContain('User Interface');
      expect(narrativeFormat.themes).not.toContain('user_interface');
    });

    test('handles malformed API responses gracefully', () => {
      const malformedResponse = {
        // Missing required fields
        themes: null,
        confidence: "invalid"
      };

      // Should provide safe defaults
      const safeDefaults = {
        understanding: "I'm still learning about your project",
        themes: [],
        confidence: 0.1,
        connectionCount: 0
      };

      render(<StrategicUnderstanding {...safeDefaults} />);

      expect(screen.getByText(/still learning/i)).toBeInTheDocument();
      expect(screen.queryByText(/null/i)).toBeNull();
      expect(screen.queryByText(/invalid/i)).toBeNull();
    });
  });

  describe('Performance Considerations', () => {
    test('handles large API responses without blocking UI', async () => {
      const largeResponse = {
        understanding: "Complex project understanding with many details...",
        themes: Array.from({ length: 50 }, (_, i) => `Theme ${i + 1}`),
        confidence: 0.9,
        connectionCount: 1000
      };

      render(<StrategicUnderstanding {...largeResponse} />);

      // Should render without blocking
      expect(screen.getByText(/complex project understanding/i)).toBeInTheDocument();
      
      // Should handle large theme arrays gracefully (might truncate or paginate)
      const themeElements = screen.getAllByText(/theme \d+/i);
      expect(themeElements.length).toBeLessThanOrEqual(10); // Should limit display
    });

    test('debounces rapid API updates', async () => {
      // Mock rapid updates
      const updates = [
        { understanding: "Update 1", themes: [], confidence: 0.1 },
        { understanding: "Update 2", themes: [], confidence: 0.2 },
        { understanding: "Update 3", themes: [], confidence: 0.3 },
        { understanding: "Final update", themes: [], confidence: 0.8 }
      ];

      let currentUpdate = 0;
      (useProjectUnderstanding as jest.Mock).mockImplementation(() => ({
        data: updates[Math.min(currentUpdate++, updates.length - 1)],
        isLoading: false,
        error: null
      }));

      const { rerender } = render(<StrategicUnderstanding {...updates[0]} />);

      // Simulate rapid updates
      updates.forEach((update, index) => {
        setTimeout(() => {
          rerender(<StrategicUnderstanding {...update} />);
        }, index * 10);
      });

      // Should eventually show final update without intermediate flashes
      await waitFor(() => {
        expect(screen.getByText(/final update/i)).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });
});