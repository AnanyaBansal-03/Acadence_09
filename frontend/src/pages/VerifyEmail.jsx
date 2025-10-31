import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/auth/verify-email?token=${token}`);
      setStatus('success');
      setMessage(response.data.message);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setStatus('error');
      if (error.response?.data?.expired) {
        setMessage('Verification link has expired. Please request a new one below.');
      } else {
        setMessage(error.response?.data?.message || 'Verification failed. Please try again.');
      }
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    setResendLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/resend-verification', {
        email: resendEmail
      });
      alert(response.data.message);
      setResendEmail('');
    } catch (error) {
      alert(error.response?.data?.message || 'Error sending verification email');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Status Icon */}
        <div className="text-center mb-6">
          {status === 'verifying' && (
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
          )}
          
          {status === 'success' && (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          
          {status === 'error' && (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <h2 className={`text-2xl font-bold mb-2 ${
            status === 'success' ? 'text-green-600' : 
            status === 'error' ? 'text-red-600' : 
            'text-gray-800'
          }`}>
            {status === 'success' ? 'Email Verified!' : 
             status === 'error' ? 'Verification Failed' : 
             'Verifying Email...'}
          </h2>
          <p className="text-gray-600">{message}</p>
        </div>

        {/* Redirect message for success */}
        {status === 'success' && (
          <div className="text-center text-sm text-gray-500 mb-4">
            Redirecting to login page in 3 seconds...
          </div>
        )}

        {/* Resend verification form for expired/error */}
        {status === 'error' && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Request New Verification Email</h3>
            <form onSubmit={handleResendVerification} className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={resendLoading}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </form>
          </div>
        )}

        {/* Manual navigation buttons */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Go to Login Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
