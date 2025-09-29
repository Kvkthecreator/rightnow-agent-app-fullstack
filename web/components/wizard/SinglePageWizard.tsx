"use client";
import { useCreateBasket } from "@/hooks/useCreateBasket";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

function AnchorField({
  id,
  label,
  placeholder,
  value,
  onChange,
  optional = false,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-medium">
        <label htmlFor={id}>{label}</label>
        {optional && (
          <span className="text-xs font-normal text-muted-foreground">Optional</span>
        )}
      </div>
      <Textarea
        id={id}
        rows={6}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-xs text-right text-muted-foreground">
        {value.trim().length} chars
      </p>
    </div>
  );
}

export function SinglePageWizard() {
  const state = useCreateBasket();

  return (
    <div className="mx-auto max-w-2xl space-y-6" data-testid="sp-wizard">
      <div className="space-y-2">
        <label htmlFor="basket-name" className="text-sm font-medium">
          Basket name
        </label>
        <Input
          id="basket-name"
          value={state.basketName}
          onChange={(event) => state.setBasketName(event.target.value)}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold">Core anchors</h2>
        <p className="text-sm text-muted-foreground">
          Describe the foundations of this basket. These anchors help Yarnnn orient
          Product and Campaign brains. You can refine them later from the Memory
          view.
        </p>
      </div>

      <AnchorField
        id="problem-statement"
        label="Problem statement"
        placeholder="What pain are you solving?"
        value={state.problemStatement}
        onChange={state.setProblemStatement}
      />

      <AnchorField
        id="primary-customer"
        label="Primary customer"
        placeholder="Who feels it? Capture persona, environment, and motivation."
        value={state.primaryCustomer}
        onChange={state.setPrimaryCustomer}
      />

      <AnchorField
        id="product-vision"
        label="Vision & differentiation"
        placeholder="Why this approach wins."
        value={state.productVision}
        onChange={state.setProductVision}
      />

      <AnchorField
        id="success-metrics"
        label="Success metrics"
        placeholder="How will you measure progress?"
        value={state.successMetrics}
        onChange={state.setSuccessMetrics}
        optional
      />

      <div className="text-right">
        <Button onClick={state.submit} disabled={!state.canSubmit}>
          {state.hasAnchorDraft ? "Create & seed anchors" : "Create basket"}
        </Button>
      </div>
    </div>
  );
}

export default SinglePageWizard;
