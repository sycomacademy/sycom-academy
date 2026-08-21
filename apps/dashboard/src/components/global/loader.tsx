import { Spinner } from "@sycom-learn/ui/components/kibo-ui/spinner";
import { cn } from "@sycom-learn/ui/lib/utils";

export default function Loader({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn("flex size-full flex-1 flex-col items-center justify-center", className)}>
      <Spinner className="size-6 text-primary" variant="bars" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
