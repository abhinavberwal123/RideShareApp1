// ==== FILE: src/pages/SignIn.jsx ====
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function SignIn() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle, getDashboardUrl } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);
            // Wait a moment for the user role to be fetched from Firestore
            setTimeout(() => {
                navigate(getDashboardUrl()); // Navigate to appropriate dashboard based on role
            }, 500);
        } catch (error) {
            console.error("Login error:", error);
            setError("Failed to sign in. Please check your credentials.");
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError("");
        setLoading(true);

        try {
            await loginWithGoogle();
            // Wait a moment for the user role to be fetched from Firestore
            setTimeout(() => {
                navigate(getDashboardUrl()); // Navigate to appropriate dashboard based on role
            }, 500);
        } catch (error) {
            console.error("Google sign-in error:", error);
            setError("Failed to sign in with Google. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <h1>Sign In</h1>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit} className="kyc-form">
                <label>Email</label>
                <input 
                    id="email-field"
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            document.getElementById('password-field').focus();
                        }
                    }}
                    required 
                />

                <label>Password</label>
                <input 
                    id="password-field"
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            document.getElementById('submit-button').click();
                        }
                    }}
                    required 
                />

                <button id="submit-button" type="submit" disabled={loading}>
                    {loading ? "Signing in..." : "Login"}
                </button>
            </form>

            <div className="social-login">
                <button 
                    type="button" 
                    onClick={handleGoogleSignIn} 
                    disabled={loading}
                    className="google-signin-button"
                >
                    Sign in with Google
                </button>
            </div>
        </div>
    );
}

export default SignIn;
