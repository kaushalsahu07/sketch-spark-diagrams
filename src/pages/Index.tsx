
import { useState } from "react";
import { Canvas } from "@/components/Canvas";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sidebar } from "@/components/Sidebar";

const Index = () => {
  const [color, setColor] = useState("#1e40af");
  const [strokeWidth, setStrokeWidth] = useState(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Sidebar 
        color={color}
        onColorChange={setColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
      />
      <Canvas color={color} strokeWidth={strokeWidth} />
    </div>
  );
};

export default Index;
