import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="mb-4 text-4xl sm:text-5xl md:text-6xl 2xl:text-7xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-base sm:text-lg md:text-xl 2xl:text-2xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/80 text-sm sm:text-base 2xl:text-lg">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
