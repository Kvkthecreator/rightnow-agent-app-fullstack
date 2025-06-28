"use client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Props {
    basketName: string;
    status: string;
    scope: string[];
    onRunBlockifier?: () => void;
    isRunningBlockifier?: boolean;
}

export default function BasketHeader({
    basketName,
    status,
    scope,
    onRunBlockifier,
    isRunningBlockifier,
}: Props) {
    return (
        <header className="flex items-center justify-between border-b pb-2 mb-4">
            <div>
                <h1 className="text-xl font-semibold truncate">{basketName}</h1>
                <div className="flex gap-2 mt-1">
                    <Badge variant="secondary">{status}</Badge>
                    {scope.map((s) => (
                        <Badge key={s} variant="outline">
                            {s}
                        </Badge>
                    ))}
                </div>
            </div>
            {onRunBlockifier && (
                <Button
                    size="sm"
                    onClick={onRunBlockifier}
                    disabled={isRunningBlockifier}
                >
                    {isRunningBlockifier ? "Running..." : "Run Blockifier"}
                </Button>
            )}
        </header>
    );
}
