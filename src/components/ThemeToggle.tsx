
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="fixed top-20 left-4 z-40">
      <div className="bg-gradient-to-b from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/5 dark:shadow-white/5 border border-gray-200/20 dark:border-gray-700/20 p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className={cn(
            "h-10 w-10 p-0 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95",
            "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:shadow-md"
          )}
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 transform transition-transform duration-200 group-hover:scale-110" />
          ) : (
            <Sun className="h-5 w-5 transform transition-transform duration-200 group-hover:scale-110" />
          )}
        </Button>
      </div>
    </div>
  );
};
