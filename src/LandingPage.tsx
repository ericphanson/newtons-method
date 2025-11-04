import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Understanding Optimization Methods
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Interactive visualizations to understand how optimization algorithms work.
            Learn the intuition behind Newton's Method and L-BFGS through step-by-step exploration.
          </p>
        </div>

        {/* Method Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Newton's Method Card */}
          <Link to="/newton" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-blue-600">Newton's Method</h2>
                <ArrowRight className="text-blue-600 group-hover:translate-x-2 transition-transform" size={32} />
              </div>

              <p className="text-gray-700 mb-4 leading-relaxed">
                The gold standard for optimization. Uses second-order derivatives (the Hessian matrix)
                to find the minimum in fewer iterations than gradient descent.
              </p>

              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-blue-900 mb-2">You'll learn:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• How curvature information accelerates convergence</li>
                  <li>• What the Hessian matrix represents</li>
                  <li>• Why eigenvalues matter for optimization</li>
                  <li>• The computational cost of exact second derivatives</li>
                </ul>
              </div>

              <div className="flex items-center text-blue-600 font-semibold">
                Start here
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </div>
            </div>
          </Link>

          {/* L-BFGS Card */}
          <Link to="/lbfgs" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-purple-600">L-BFGS</h2>
                <ArrowRight className="text-purple-600 group-hover:translate-x-2 transition-transform" size={32} />
              </div>

              <p className="text-gray-700 mb-4 leading-relaxed">
                The practical choice for large-scale optimization. Approximates Newton's method
                using only gradient information and a small memory buffer.
              </p>

              <div className="bg-purple-50 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-purple-900 mb-2">You'll learn:</h3>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• How to approximate the Hessian without computing it</li>
                  <li>• The two-loop recursion algorithm</li>
                  <li>• Memory vs. accuracy tradeoffs</li>
                  <li>• Why it's used in production ML systems</li>
                </ul>
              </div>

              <div className="flex items-center text-purple-600 font-semibold">
                Explore L-BFGS
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </div>
            </div>
          </Link>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-16 text-gray-600">
          <p className="text-sm">
            💡 <strong>Recommended:</strong> Start with Newton's Method to understand the foundations,
            then explore L-BFGS to see how it achieves similar results with less computation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
