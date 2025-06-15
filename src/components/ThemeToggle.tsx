import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className={cn(
          "h-10 w-10 p-0 rounded-xl bg-[#23272f] text-white border-none hover:bg-[#363d47]"
        )}
      >
        {theme === 'light' ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
};
