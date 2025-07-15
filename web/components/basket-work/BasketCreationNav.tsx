"use client";

import { Button } from "@/components/ui/Button";
import { FileText, Blocks, StickyNote, BookOpen } from "lucide-react";

interface Props {
    onCreateContext?: () => void;
    onCreateBlock?: () => void;
    onCreateDocument?: () => void;
    onCreateDump?: () => void;
}

export default function BasketCreationNav({
    onCreateContext,
    onCreateBlock,
    onCreateDocument,
    onCreateDump,
}: Props) {
    return (
        <div className="flex flex-col space-y-2 p-2 w-16 border-r bg-muted/40 text-muted-foreground">
            <Button
                size="sm"
                variant="ghost"
                onClick={onCreateContext}
                title="New Context Item"
            >
                <StickyNote size={18} />
            </Button>
            <Button
                size="sm"
                variant="ghost"
                onClick={onCreateBlock}
                title="New Block"
            >
                <Blocks size={18} />
            </Button>
            <Button
                size="sm"
                variant="ghost"
                onClick={onCreateDocument}
                title="New Document"
            >
                <FileText size={18} />
            </Button>
            <Button
                size="sm"
                variant="ghost"
                onClick={onCreateDump}
                title="New Raw Dump"
            >
                <BookOpen size={18} />
            </Button>
        </div>
    );
}
