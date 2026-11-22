import { API_URL } from "../config.ts";
import { FaGoogle } from "react-icons/fa";
import "../styling/Login.css";

export default function Login() {
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <div className="google-login-container">
      <div className="login-box">
        <div className="brand-header">
          <h1>MyPocket</h1>
          <p>Sign in with google</p>
        </div>

        <div className="form-wrapper">
          <button onClick={handleGoogleLogin} className="google-btn">
            <FaGoogle className="google-icon" />
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
