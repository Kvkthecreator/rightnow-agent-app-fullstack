"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CreationMode } from "@/lib/hooks/useCreationMode";

interface Props {
    mode: CreationMode;
    onChange: (mode: CreationMode) => void;
}

export function CreationModeToggle({ mode, onChange }: Props) {
    return (
        <Tabs
            value={mode}
            onValueChange={(v) => onChange(v as CreationMode)}
            className="mb-4"
        >
            <TabsList>
                <TabsTrigger value="wizard">Guided</TabsTrigger>
                <TabsTrigger value="blank">Blank</TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
