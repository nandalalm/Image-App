import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { AuthApi } from "../services";
import { useToast } from "../hooks/useToast";
import { useAppDispatch } from "../redux/store";
import { setAccessToken, setUser } from "../redux/authSlice";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const email = location.state?.email || "";
  const { show } = useToast();
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pastedData = value.slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return; 

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    
    if (otpString.length !== 6) {
      setError("Please enter a complete 6-digit OTP");
      return;
    }

    if (timeLeft === 0) {
      setError("OTP has expired. Please request a new one.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await AuthApi.verifyOtp({ 
        email, 
        otp: otpString 
      });

      dispatch(setAccessToken(response.accessToken));
      dispatch(setUser(response.user || null));

      show("Email verified successfully! Welcome!", "success");
      navigate("/home");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || "OTP verification failed";
      setError(message);
      if (message.includes("Registration session expired")) {
        show("Registration session expired. Please register again.", "error");
        navigate("/register");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError(null);
    
    try {
      await AuthApi.resendOtp(email);
      setTimeLeft(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || "Failed to resend OTP";
      setError(message);
      if (message.includes("Registration session expired")) {
        show("Registration session expired. Please register again.", "error");
        navigate("/register");
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-6">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Check your email</h1>
            <p className="text-sm text-gray-600 mb-1">
              We sent a verification code to
            </p>
            <p className="text-sm font-medium text-gray-900">{email}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* OTP Input */}
            <div>
              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0"
                  />
                ))}
              </div>
            </div>

            <div className="text-center">
              {timeLeft > 0 ? (
                <p className="text-xs text-gray-500">
                  Expires in <span className="font-medium text-gray-900">{timeLeft}s</span>
                </p>
              ) : (
                <p className="text-xs text-red-600 font-medium">
                  Code expired
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-2">
                <p className="text-red-700 text-xs text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || timeLeft === 0}
              className="w-full bg-blue-500 text-white py-2.5 rounded-lg hover:bg-blue-600 disabled:opacity-60 transition-colors font-medium text-sm"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>

          <div className="text-center mt-4 space-y-3">
            {canResend ? (
              <button
                onClick={handleResendOtp}
                disabled={resendLoading}
                className="text-blue-600 hover:text-blue-700 font-medium text-xs disabled:opacity-50"
              >
                {resendLoading ? "Sending..." : "Resend code"}
              </button>
            ) : (
              <p className="text-xs text-gray-500">
                Didn't receive the code? Resend in {timeLeft}s
              </p>
            )}
            
            <div className="pt-3 border-t border-gray-100">
              <Link 
                to="/register" 
                className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to registration
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
