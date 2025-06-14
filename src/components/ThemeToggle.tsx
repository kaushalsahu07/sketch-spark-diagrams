
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="fixed top-16 left-2 z-40 sm:top-4 sm:left-4">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg sm:rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-1.5 sm:p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className={cn(
            "h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-md sm:rounded-lg transition-all duration-200",
            "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          )}
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};
