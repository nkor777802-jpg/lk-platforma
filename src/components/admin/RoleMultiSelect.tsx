import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ROLE_LABEL, type AppRole } from "@/lib/roles";

interface RoleMultiSelectProps {
  value: AppRole[];
  options: AppRole[];
  onChange: (value: AppRole[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function RoleMultiSelect({
  value,
  options,
  onChange,
  placeholder = "Выберите роли",
  disabled,
}: RoleMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggle = (role: AppRole) => {
    if (value.includes(role)) {
      onChange(value.filter((r) => r !== role));
    } else {
      onChange([...value, role]);
    }
  };

  const label =
    value.length === 0
      ? placeholder
      : value
          .map((r) => ROLE_LABEL[r])
          .sort()
          .join(", ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between text-left font-normal",
            value.length === 0 && "text-muted-foreground",
          )}
        >
          <span className="truncate">{label}</span>
          <Check className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2">
        <div className="flex flex-col gap-1">
          {options.map((role) => {
            const checked = value.includes(role);
            return (
              <label
                key={role}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(role)}
                />
                <span className="flex-1">{ROLE_LABEL[role]}</span>
              </label>
            );
          })}
          {options.length === 0 && (
            <span className="px-2 py-1.5 text-sm text-muted-foreground">
              Нет доступных ролей
            </span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
