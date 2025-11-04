"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [projectType, setProjectType] = useState<string>('research');
  const [projectName, setProjectName] = useState('');
  const [initialContext, setInitialContext] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: projectName,
          project_type: projectType,
          initial_context: initialContext,
          description: description || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to create project' }));
        throw new Error(typeof errorData.detail === 'string' ? errorData.detail : errorData.detail?.message || 'Failed to create project');
      }

      const result = await response.json();

      // Success! Close dialog and redirect to project
      onOpenChange(false);

      // Reset form
      setProjectType('research');
      setProjectName('');
      setInitialContext('');
      setDescription('');

      // Show success message
      alert(`✅ Project created successfully!\n\nProject: ${result.project_name}\nProject ID: ${result.project_id}\nBasket ID: ${result.basket_id}\nRemaining Trials: ${result.remaining_trials ?? 'N/A'}\n\n${result.next_step}`);

      // Redirect to projects list (or project detail when that route exists)
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Failed to create project:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up a new project workspace with initial context. Your project will have a dedicated knowledge basket and workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Healthcare AI Research"
              required
              minLength={1}
              maxLength={200}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Give your project a descriptive name
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-type">Project Type</Label>
            <Select value={projectType} onValueChange={setProjectType}>
              <SelectTrigger id="project-type">
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="research">Research Project</SelectItem>
                <SelectItem value="content_creation">Content Creation</SelectItem>
                <SelectItem value="reporting">Reporting & Analysis</SelectItem>
                <SelectItem value="analysis">Data Analysis</SelectItem>
                <SelectItem value="general">General Purpose</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the type of work this project will focus on
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initial-context">Initial Context</Label>
            <Textarea
              id="initial-context"
              value={initialContext}
              onChange={(e) => setInitialContext(e.target.value)}
              placeholder="Describe what you want to accomplish with this project..."
              className="min-h-[150px] resize-none"
              required
              minLength={10}
              maxLength={50000}
            />
            <p className="text-xs text-muted-foreground">
              Provide context, goals, or initial notes for this project (10-50,000 characters)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief project description..."
              className="min-h-[80px] resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              Optional summary visible on project cards (max 1,000 characters)
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              <strong>Error:</strong> {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !projectName.trim() || !initialContext.trim() || initialContext.length < 10}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
