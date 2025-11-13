"use client";

import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  Upload,
  FileBox,
  Trash2,
  Download,
  Loader2,
  AlertCircle,
  X,
  Search,
  Filter,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { toast } from "sonner";

interface ReferenceAsset {
  id: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  asset_type: string;
  asset_category: string;
  agent_scope: string[];
  description: string | null;
  tags: string[];
  created_at: string;
  storage_path: string;
}

interface AssetType {
  asset_type: string;
  display_name: string;
  category: string;
  allowed_mime_types: string[];
}

interface ContextAssetsClientProps {
  projectId: string;
  basketId: string;
}

const AGENT_TYPES = [
  { value: "research", label: "Research Agent" },
  { value: "content", label: "Content Agent" },
  { value: "reporting", label: "Reporting Agent" },
];

export default function ContextAssetsClient({ projectId, basketId }: ContextAssetsClientProps) {
  const [assets, setAssets] = useState<ReferenceAsset[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAgent, setFilterAgent] = useState<string>("all");

  // Upload form state
  const [selectedAssetType, setSelectedAssetType] = useState<string>("");
  const [selectedAgentScope, setSelectedAgentScope] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch asset types
  const fetchAssetTypes = async () => {
    try {
      const response = await fetch(`/api/baskets/${basketId}/asset-types`);
      if (!response.ok) throw new Error("Failed to fetch asset types");
      const data = await response.json();
      setAssetTypes(data);
      if (data.length > 0) {
        setSelectedAssetType(data[0].asset_type);
      }
    } catch (err) {
      console.error("[Assets] Error fetching asset types:", err);
      toast.error("Failed to load asset types");
    }
  };

  // Fetch assets
  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/baskets/${basketId}/assets`);
      if (!response.ok) throw new Error("Failed to fetch assets");
      const data = await response.json();
      setAssets(data.assets || []);
      setError(null);
    } catch (err) {
      console.error("[Assets] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetTypes();
    fetchAssets();
  }, [basketId]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }
    if (!selectedAssetType) {
      toast.error("Please select an asset type");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("asset_type", selectedAssetType);
      if (description) formData.append("description", description);
      if (selectedAgentScope.length > 0) {
        formData.append("agent_scope", selectedAgentScope.join(","));
      }
      if (tags.length > 0) {
        formData.append("tags", tags.join(","));
      }
      formData.append("permanence", "permanent");

      const response = await fetch(`/api/baskets/${basketId}/assets`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(errorData.detail || "Upload failed");
      }

      toast.success("Asset uploaded successfully");

      // Reset form
      setSelectedFile(null);
      setDescription("");
      setTags([]);
      setSelectedAgentScope([]);

      // Refresh assets list
      await fetchAssets();
    } catch (err) {
      console.error("[Assets] Upload error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to upload asset");
    } finally {
      setUploading(false);
    }
  };

  // Handle delete
  const handleDelete = async (assetId: string, fileName: string) => {
    if (!confirm(`Delete "${fileName}"?`)) return;

    try {
      const response = await fetch(`/api/baskets/${basketId}/assets/${assetId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete asset");

      toast.success("Asset deleted");
      await fetchAssets();
    } catch (err) {
      console.error("[Assets] Delete error:", err);
      toast.error("Failed to delete asset");
    }
  };

  // Handle download
  const handleDownload = async (assetId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/baskets/${basketId}/assets/${assetId}/signed-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expires_in: 3600 }),
      });

      if (!response.ok) throw new Error("Failed to get download URL");

      const data = await response.json();
      window.open(data.signed_url, "_blank");
    } catch (err) {
      console.error("[Assets] Download error:", err);
      toast.error("Failed to download asset");
    }
  };

  // Add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  // Toggle agent scope
  const toggleAgentScope = (agentType: string) => {
    setSelectedAgentScope((prev) =>
      prev.includes(agentType)
        ? prev.filter((a) => a !== agentType)
        : [...prev, agentType]
    );
  };

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      searchQuery === "" ||
      asset.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || asset.asset_type === filterType;

    const matchesAgent =
      filterAgent === "all" ||
      (asset.agent_scope && asset.agent_scope.includes(filterAgent));

    return matchesSearch && matchesType && matchesAgent;
  });

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Upload Asset</h3>

        <div className="space-y-4">
          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/20 hover:border-primary/50",
              selectedFile && "border-primary bg-primary/5"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            {selectedFile ? (
              <div>
                <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-foreground">
                  {isDragActive ? "Drop file here" : "Drag and drop a file, or click to select"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Max file size: 50MB</p>
              </div>
            )}
          </div>

          {/* Asset Type Selector */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Asset Type</label>
            <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
              <SelectTrigger>
                <SelectValue placeholder="Select asset type" />
              </SelectTrigger>
              <SelectContent>
                {assetTypes.map((type) => (
                  <SelectItem key={type.asset_type} value={type.asset_type}>
                    {type.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Agent Scope Selector */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Agent Scope (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {AGENT_TYPES.map((agent) => (
                <Badge
                  key={agent.value}
                  variant={selectedAgentScope.includes(agent.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleAgentScope(agent.value)}
                >
                  {agent.label}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to make asset available to all agents
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Description (optional)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this asset..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Tags (optional)
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag..."
              />
              <Button onClick={handleAddTag} variant="outline" size="sm">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Asset
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Assets List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Assets ({filteredAssets.length})
          </h3>
          <div className="flex gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="pl-9 w-64"
              />
            </div>

            {/* Filter by Type */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {assetTypes.map((type) => (
                  <SelectItem key={type.asset_type} value={type.asset_type}>
                    {type.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter by Agent */}
            <Select value={filterAgent} onValueChange={setFilterAgent}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {AGENT_TYPES.map((agent) => (
                  <SelectItem key={agent.value} value={agent.value}>
                    {agent.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Assets Grid */}
        {filteredAssets.length === 0 ? (
          <Card className="p-12 text-center">
            <FileBox className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              {assets.length === 0
                ? "No assets yet. Upload your first asset above."
                : "No assets match your filters."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset) => (
              <Card key={asset.id} className="p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getFileIcon(asset.mime_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {asset.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(asset.file_size_bytes)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(asset.id, asset.file_name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(asset.id, asset.file_name)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {asset.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {asset.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {assetTypes.find((t) => t.asset_type === asset.asset_type)?.display_name ||
                      asset.asset_type}
                  </Badge>
                  {asset.agent_scope && asset.agent_scope.length > 0 && (
                    <>
                      {asset.agent_scope.map((agent) => (
                        <Badge key={agent} variant="outline" className="text-xs">
                          {AGENT_TYPES.find((a) => a.value === agent)?.label || agent}
                        </Badge>
                      ))}
                    </>
                  )}
                </div>

                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {asset.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
