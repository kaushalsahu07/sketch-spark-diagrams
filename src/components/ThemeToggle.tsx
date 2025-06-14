
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="fixed top-4 left-2 z-40 sm:top-6 sm:left-4">
      <div className="bg-gradient-to-b from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg shadow-black/5 dark:shadow-white/5 border border-gray-200/20 dark:border-gray-700/20 p-2 sm:p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className={cn(
            "h-8 w-8 sm:h-10 sm:w-10 p-0 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95",
            "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:shadow-md"
          )}
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4 sm:h-5 sm:w-5 transform transition-transform duration-200 group-hover:scale-110" />
          ) : (
            <Sun className="h-4 w-4 sm:h-5 sm:w-5 transform transition-transform duration-200 group-hover:scale-110" />
          )}
        </Button>
      </div>
    </div>
  );
};
