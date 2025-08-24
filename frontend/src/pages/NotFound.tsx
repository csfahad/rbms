import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="text-center">
        <h2 className="text-8xl font-bold text-primary">404</h2>
        <h3 className="mt-4 text-3xl font-bold text-gray-900">Page Not Found</h3>
        <p className="mt-3 text-lg text-gray-600">
          Oops! The page you are looking for does not exist.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="btn btn-primary flex items-center justify-center"
          >
            <Home className="h-5 w-5 mr-2" />
            Go Home
          </Link>
          <Link
            to="/search"
            className="btn btn-secondary flex items-center justify-center"
          >
            <Search className="h-5 w-5 mr-2" />
            Search Trains
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;