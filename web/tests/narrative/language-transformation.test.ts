/**
 * Language Transformation Tests
 * Tests for complete substrate vocabulary elimination and narrative consistency
 */

import { render, screen } from '@testing-library/react';
import { transformNavigationLanguage } from '@/components/navigation/NarrativeNavigation';
import { StrategicActions } from '@/components/narrative/StrategicActions';
import { StrategicUnderstanding } from '@/components/narrative/StrategicUnderstanding';
import ProjectContext from '@/components/understanding/ProjectContext';

describe('Narrative Language Transformation', () => {
  describe('Substrate Vocabulary Elimination', () => {
    test('eliminates all technical substrate terms from UI', () => {
      const mockActions = [
        { type: 'add_content', label: 'Add Content', enabled: true }
      ];

      render(<StrategicActions basketId="test-123" actions={mockActions} />);
      
      // Should NOT find any substrate vocabulary
      expect(screen.queryByText(/blocks?/i)).toBeNull();
      expect(screen.queryByText(/confidence.*score/i)).toBeNull();
      expect(screen.queryByText(/semantic.*type/i)).toBeNull();
      expect(screen.queryByText(/context.*items/i)).toBeNull();
      expect(screen.queryByText(/crud/i)).toBeNull();
      expect(screen.queryByText(/api/i)).toBeNull();
      expect(screen.queryByText(/metadata/i)).toBeNull();
    });

    test('uses narrative language for all actions', () => {
      const mockActions = [
        { type: 'capture_insight', label: 'Capture New Insight', enabled: true },
        { type: 'share_knowledge', label: 'Share Your Knowledge', enabled: true },
        { type: 'explore_discoveries', label: 'Explore My Discoveries', enabled: true }
      ];

      render(<StrategicActions basketId="test-123" actions={mockActions} />);
      
      // Should find narrative language
      expect(screen.getByText(/capture new insight/i)).toBeInTheDocument();
      expect(screen.getByText(/share your knowledge/i)).toBeInTheDocument();
      expect(screen.getByText(/explore my discoveries/i)).toBeInTheDocument();
    });

    test('transforms understanding display to narrative voice', () => {
      const mockProps = {
        understanding: "I understand you're working on a user experience project",
        themes: ['user experience', 'strategic planning', 'technical architecture'],
        confidence: 0.85
      };

      render(<StrategicUnderstanding {...mockProps} />);
      
      // Should use first-person AI voice
      expect(screen.getByText(/what I understand/i)).toBeInTheDocument();
      expect(screen.getByText(/I understand you're working/i)).toBeInTheDocument();
      
      // Should NOT show raw confidence scores
      expect(screen.queryByText(/0\.85/)).toBeNull();
      expect(screen.queryByText(/85%/)).toBeNull();
    });

    test('transforms context to knowledge language', () => {
      const mockContextItems = [
        {
          id: '1',
          title: 'User Research Document',
          summary: 'Research findings about user behavior',
          updated_at: new Date().toISOString()
        }
      ];

      render(<ProjectContext items={mockContextItems} />);
      
      // Should use knowledge-based language
      expect(screen.getByText(/what I know about your project/i)).toBeInTheDocument();
      expect(screen.queryByText(/context items/i)).toBeNull();
      expect(screen.queryByText(/metadata/i)).toBeNull();
    });
  });

  describe('Navigation Language Transformation', () => {
    test('transforms all legacy navigation terms', () => {
      const transformations = [
        ['Dashboard', 'Strategic Intelligence'],
        ['Blocks', 'Insights & Ideas'],
        ['Context', 'My Understanding'],
        ['Memory', 'Project Knowledge'],
        ['Analysis', 'Strategic Planning'],
        ['History', 'Evolution']
      ];

      transformations.forEach(([legacy, narrative]) => {
        expect(transformNavigationLanguage(legacy)).toBe(narrative);
      });
    });

    test('transforms action language consistently', () => {
      const actionTransformations = [
        ['Create Block', 'Capture Insight'],
        ['Block List', 'Insights List'],
        ['Context Items', 'Project Knowledge'],
        ['Memory Items', 'What I Remember'],
        ['Block Editor', 'Insight Editor'],
        ['Analysis Results', 'My Discoveries']
      ];

      actionTransformations.forEach(([legacy, narrative]) => {
        expect(transformNavigationLanguage(legacy)).toBe(narrative);
      });
    });
  });

  describe('Consistent AI Voice', () => {
    test('uses first-person AI perspective throughout', () => {
      const mockProps = {
        understanding: "I can see clear patterns in your work",
        themes: ['user experience'],
        confidence: 0.8
      };

      render(<StrategicUnderstanding {...mockProps} />);
      
      // Should consistently use "I" perspective
      expect(screen.getByText(/I can see/i)).toBeInTheDocument();
      expect(screen.getByText(/what I understand/i)).toBeInTheDocument();
      
      // Should NOT use third-person or system language
      expect(screen.queryByText(/the system/i)).toBeNull();
      expect(screen.queryByText(/the AI/i)).toBeNull();
      expect(screen.queryByText(/algorithm/i)).toBeNull();
    });

    test('uses collaborative partnership language', () => {
      const mockActions = [
        { type: 'capture_insight', label: 'Capture New Insight', enabled: true }
      ];

      render(<StrategicActions basketId="test-123" actions={mockActions} />);
      
      // Should use "we" and collaborative language
      expect(screen.getByText(/what we can do next/i)).toBeInTheDocument();
      
      // Should NOT use transactional language
      expect(screen.queryByText(/execute/i)).toBeNull();
      expect(screen.queryByText(/process/i)).toBeNull();
      expect(screen.queryByText(/operation/i)).toBeNull();
    });
  });

  describe('Progress and Status Language', () => {
    test('transforms confidence scores to narrative understanding levels', () => {
      const testCases = [
        { confidence: 0.95, expectedLevel: /strong.*understanding/i },
        { confidence: 0.75, expectedLevel: /developing.*understanding/i },
        { confidence: 0.55, expectedLevel: /starting to see patterns/i },
        { confidence: 0.35, expectedLevel: /getting to know/i }
      ];

      testCases.forEach(({ confidence, expectedLevel }) => {
        const mockProps = {
          understanding: "Test understanding",
          themes: [],
          confidence
        };

        const { unmount } = render(<StrategicUnderstanding {...mockProps} />);
        
        expect(screen.getByText(expectedLevel)).toBeInTheDocument();
        
        // Clean up for next test
        unmount();
      });
    });

    test('eliminates technical progress indicators', () => {
      const mockProps = {
        understanding: "Test understanding", 
        themes: ['test theme'],
        confidence: 0.87
      };

      render(<StrategicUnderstanding {...mockProps} />);
      
      // Should NOT show technical indicators
      expect(screen.queryByText(/87%/)).toBeNull();
      expect(screen.queryByText(/confidence.*score/i)).toBeNull();
      expect(screen.queryByText(/accuracy/i)).toBeNull();
      expect(screen.queryByText(/precision/i)).toBeNull();
    });
  });

  describe('Theme and Category Transformation', () => {
    test('transforms technical themes to narrative insights', () => {
      const mockProps = {
        understanding: "Test understanding",
        themes: [
          'api integration', 
          'user experience design',
          'data analytics implementation', 
          'business strategy planning'
        ],
        confidence: 0.8
      };

      render(<StrategicUnderstanding {...mockProps} />);
      
      // Should transform themes to narrative form
      expect(screen.getByText(/technical architecture/i)).toBeInTheDocument();
      expect(screen.getByText(/user experience and interface/i)).toBeInTheDocument();
      expect(screen.getByText(/data strategy/i)).toBeInTheDocument();
      expect(screen.getByText(/business strategy/i)).toBeInTheDocument();
      
      // Should NOT show raw technical themes
      expect(screen.queryByText(/api integration/i)).toBeNull();
      expect(screen.queryByText(/data analytics implementation/i)).toBeNull();
    });
  });
});

describe('Progressive Disclosure Language', () => {
  test('provides appropriate narrative for each disclosure level', () => {
    const mockActions = [
      { type: 'capture_insight', label: 'Capture New Insight', enabled: true }
    ];

    render(<StrategicActions basketId="test-123" actions={mockActions} intelligentSuggestions={true} />);
    
    // Story level should be conversational
    expect(screen.getByText(/clear next steps/i)).toBeInTheDocument();
    
    // Should NOT expose technical implementation details at story level
    expect(screen.queryByText(/algorithm/i)).toBeNull();
    expect(screen.queryByText(/processing/i)).toBeNull();
    expect(screen.queryByText(/database/i)).toBeNull();
  });
});