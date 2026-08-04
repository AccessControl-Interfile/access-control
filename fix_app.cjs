const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add isMobile state
if (!code.includes('const [isMobile, setIsMobile]')) {
  code = code.replace(
    'const [loading, setLoading] = useState(true);',
    'const [loading, setLoading] = useState(true);\n  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);\n\n  useEffect(() => {\n    const handleResize = () => setIsMobile(window.innerWidth < 1024);\n    window.addEventListener(\'resize\', handleResize);\n    return () => window.removeEventListener(\'resize\', handleResize);\n  }, []);'
  );
}

// Update nav class
code = code.replace(
  '<nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar overflow-x-hidden">',
  '<nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar overflow-x-hidden grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-col lg:space-y-1 gap-2 lg:gap-0">'
);

// Update all instances of animate={{ opacity: (isSidebarPinned || isSidebarHovered) ? 1 : 0, x: (isSidebarPinned || isSidebarHovered) ? 0 : -10 }}
code = code.replace(
  /animate={{ opacity: \(isSidebarPinned \|\| isSidebarHovered\) \? 1 : 0, x: \(isSidebarPinned \|\| isSidebarHovered\) \? 0 : -10 }}/g,
  'animate={{ opacity: (isMobile || isSidebarPinned || isSidebarHovered) ? 1 : 0, x: (isMobile || isSidebarPinned || isSidebarHovered) ? 0 : -10 }}'
);

code = code.replace(
  /animate={{ opacity: \(isSidebarPinned \|\| isSidebarHovered\) \? 1 : 0, width: \(isSidebarPinned \|\| isSidebarHovered\) \? 'auto' : 0 }}/g,
  'animate={{ opacity: (isMobile || isSidebarPinned || isSidebarHovered) ? 1 : 0, width: (isMobile || isSidebarPinned || isSidebarHovered) ? \'auto\' : 0 }}'
);

fs.writeFileSync('src/App.tsx', code);
