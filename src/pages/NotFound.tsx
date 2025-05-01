
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Special handling for GitHub callback failures
    if (location.pathname.includes('github-callback') || location.search.includes('code=')) {
      console.error("GitHub callback failed - current URL:", window.location.href);
    }
  }, [location]);

  // Check if this appears to be a GitHub callback
  const isGithubCallback = location.pathname.includes('github-callback') || 
                           location.search.includes('code=');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-4xl font-bold mb-4 text-red-600">404</h1>
        <p className="text-xl text-gray-600 mb-4">Page not found</p>
        
        {isGithubCallback && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h2 className="text-lg font-medium text-yellow-800 mb-2">GitHub Authentication Issue</h2>
            <p className="text-sm text-yellow-700 mb-3">
              There was a problem with your GitHub authentication callback. This might be due to:
            </p>
            <ul className="list-disc pl-5 text-sm text-yellow-700 mb-3">
              <li>Mismatched callback URL configuration in GitHub OAuth app settings</li>
              <li>Authentication session expired</li>
              <li>Incorrect URL formatting</li>
            </ul>
            <p className="text-sm text-yellow-700">
              Please try connecting your GitHub account again from the home page.
            </p>
          </div>
        )}
        
        <Link 
          to="/" 
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
