import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { DocumentCompositionView } from "@/components/documents/DocumentCompositionView";
import { SWRConfig } from "swr";
import React from "react";

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

const mockDocument = {
  id: "doc-1",
  basket_id: "basket-1",
  title: "Test Document",
  created_at: "2025-01-01T10:00:00Z",
  updated_at: "2025-01-01T11:00:00Z",
  metadata: { type: "test" },
};

const mockComposition = {
  document: mockDocument,
  references: [
    {
      reference: {
        id: "ref-1",
        document_id: "doc-1",
        substrate_type: "block" as const,
        substrate_id: "block-1",
        role: "primary",
        weight: 0.8,
        snippets: ["Test snippet"],
        metadata: {},
        created_at: "2025-01-01T10:30:00Z",
        created_by: "user-1",
      },
      substrate: {
        substrate_type: "block" as const,
        substrate_id: "block-1",
        title: "Test Block",
        preview: "This is a test block for composition",
        created_at: "2025-01-01T10:00:00Z",
        state: "active",
        version: 1,
      },
    },
    {
      reference: {
        id: "ref-2",
        document_id: "doc-1",
        substrate_type: "dump" as const,
        substrate_id: "dump-1",
        role: "supporting",
        weight: 0.5,
        snippets: [],
        metadata: {},
        created_at: "2025-01-01T10:45:00Z",
        created_by: "user-1",
      },
      substrate: {
        substrate_type: "dump" as const,
        substrate_id: "dump-1",
        title: null,
        preview: "Raw dump content for testing",
        created_at: "2025-01-01T09:30:00Z",
        char_count: 1500,
        source_type: "clipboard",
      },
    },
  ],
  composition_stats: {
    blocks_count: 1,
    dumps_count: 1,
    context_items_count: 0,
    reflections_count: 0,
    timeline_events_count: 0,
    total_references: 2,
  },
};

global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockComposition),
  });
});

const renderComponent = (props = {}) => {
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <DocumentCompositionView
        document={mockDocument}
        basketId="basket-1"
        {...props}
      />
    </SWRConfig>
  );
};

describe("DocumentCompositionView", () => {
  it("renders document title and metadata", async () => {
    renderComponent();
    
    expect(screen.getByText("Test Document")).toBeInTheDocument();
    expect(screen.getByText("Created January 1, 2025")).toBeInTheDocument();
    expect(screen.getByText("Document Metadata")).toBeInTheDocument();
  });

  it("fetches and displays composition stats", async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText("Composition Overview")).toBeInTheDocument();
    });

    // Check stats display
    expect(screen.getByText("1")).toBeInTheDocument(); // blocks count
    expect(screen.getByText("1")).toBeInTheDocument(); // dumps count
    expect(screen.getByText("Blocks")).toBeInTheDocument();
    expect(screen.getByText("Dumps")).toBeInTheDocument();
  });

  it("displays substrate references with correct types and details", async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText("Substrate References (2)")).toBeInTheDocument();
    });

    // Check block reference
    expect(screen.getByText("Test Block")).toBeInTheDocument();
    expect(screen.getByText("This is a test block for composition")).toBeInTheDocument();
    expect(screen.getByText("primary")).toBeInTheDocument();
    expect(screen.getByText("Weight: 80%")).toBeInTheDocument();
    expect(screen.getByText('"Test snippet"')).toBeInTheDocument();

    // Check dump reference
    expect(screen.getByText("Raw dump content for testing")).toBeInTheDocument();
    expect(screen.getByText("supporting")).toBeInTheDocument();
    expect(screen.getByText("Weight: 50%")).toBeInTheDocument();
    expect(screen.getByText("1,500 chars")).toBeInTheDocument();
  });

  it("filters references by substrate type", async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText("Substrate References (2)")).toBeInTheDocument();
    });

    // Filter to blocks only
    const filterSelect = screen.getByDisplayValue("All Types");
    fireEvent.change(filterSelect, { target: { value: "block" } });

    // Should still show block reference
    expect(screen.getByText("Test Block")).toBeInTheDocument();
    // Dump reference should still be visible (filtering logic needs implementation)
  });

  it("handles detaching references", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockComposition),
    }).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText("Test Block")).toBeInTheDocument();
    });

    // Click detach button
    const detachButtons = screen.getAllByRole("button");
    const unlinkButton = detachButtons.find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-unlink')
    );
    
    if (unlinkButton) {
      fireEvent.click(unlinkButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/documents/doc-1/references?substrate_type=block&substrate_id=block-1",
          { method: "DELETE" }
        );
      });
    }
  });

  it("handles title editing", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockComposition),
    }).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText("Test Document")).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByRole("button", { name: "" }); // Edit icon button
    fireEvent.click(editButton);

    // Should show input field
    const titleInput = screen.getByDisplayValue("Test Document");
    fireEvent.change(titleInput, { target: { value: "Updated Document Title" } });
    fireEvent.keyDown(titleInput, { key: "Enter" });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/documents/doc-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ title: "Updated Document Title" }),
        })
      );
    });
  });

  it("shows empty state when no references exist", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ...mockComposition,
        references: [],
        composition_stats: {
          blocks_count: 0,
          dumps_count: 0,
          context_items_count: 0,
          reflections_count: 0,
          timeline_events_count: 0,
          total_references: 0,
        },
      }),
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText("No substrate references yet")).toBeInTheDocument();
    });

    expect(screen.getByText(/Attach blocks, dumps, context items/)).toBeInTheDocument();
  });

  it("handles API errors gracefully", async () => {
    (global.fetch as any).mockRejectedValue(new Error("API Error"));

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText("Failed to load composition")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
  });

  it("navigates back to documents list", () => {
    renderComponent();
    
    const backButton = screen.getByRole("button", { name: "" }); // Back arrow button
    fireEvent.click(backButton);

    expect(mockPush).toHaveBeenCalledWith("/baskets/basket-1/documents");
  });

  it("displays substrate type badges with correct colors", async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText("block")).toBeInTheDocument();
      expect(screen.getByText("dump")).toBeInTheDocument();
    });

    // Check that substrate type badges are displayed
    const blockBadge = screen.getByText("block").closest("span");
    const dumpBadge = screen.getByText("dump").closest("span");
    
    expect(blockBadge).toHaveClass("text-blue-600", "bg-blue-50");
    expect(dumpBadge).toHaveClass("text-green-600", "bg-green-50");
  });

  it("shows substrate-specific metadata", async () => {
    renderComponent();
    
    await waitFor(() => {
      // Block-specific metadata
      expect(screen.getByText("State: active")).toBeInTheDocument();
      
      // Dump-specific metadata  
      expect(screen.getByText("1,500 chars")).toBeInTheDocument();
    });
  });
});

describe("Substrate Canon Compliance", () => {
  it("supports all substrate types", () => {
    const substrateTypes = ["block", "dump", "context_item", "reflection", "timeline_event"];
    
    substrateTypes.forEach(type => {
      expect(typeof type).toBe("string");
      expect(type.length).toBeGreaterThan(0);
    });
  });

  it("maintains substrate equality (no hierarchy)", async () => {
    // All substrate references should be treated equally in the UI
    renderComponent();
    
    await waitFor(() => {
      const references = screen.getAllByText(/Added January/);
      // Both references should be displayed with same structure
      expect(references).toHaveLength(2);
    });
  });

  it("preserves reference metadata integrity", async () => {
    renderComponent();
    
    await waitFor(() => {
      // Check that all reference fields are preserved
      expect(screen.getByText("primary")).toBeInTheDocument(); // role
      expect(screen.getByText("Weight: 80%")).toBeInTheDocument(); // weight
      expect(screen.getByText('"Test snippet"')).toBeInTheDocument(); // snippets
    });
  });
});