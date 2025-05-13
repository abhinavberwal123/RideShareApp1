import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Signup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [userType, setUserType] = useState("consumer");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { register, loginWithGoogle, getDashboardUrl } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await register(email, password, name, userType);
            navigate(getDashboardUrl()); // Navigate to appropriate dashboard based on role
        } catch (error) {
            console.error("Registration error:", error);
            setError("Failed to create an account. " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setError("");
        setLoading(true);

        try {
            await loginWithGoogle();
            // Wait a moment for the user role to be fetched from Firestore
            setTimeout(() => {
                navigate(getDashboardUrl()); // Navigate to appropriate dashboard based on role
            }, 500);
        } catch (error) {
            console.error("Google sign-up error:", error);
            setError("Failed to sign up with Google. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <h2>Sign Up</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit} className="kyc-form">
                <label>Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            document.getElementById('email-field').focus();
                        }
                    }}
                    required
                />

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
                            document.getElementById('consumer-radio').focus();
                        }
                    }}
                    required
                />

                <label>Account Type</label>
                <div className="role-selection">
                    <label className="role-option">
                        <input
                            id="consumer-radio"
                            type="radio"
                            name="userType"
                            value="consumer"
                            checked={userType === "consumer"}
                            onChange={(e) => setUserType(e.target.value)}
                        />
                        <span>Passenger</span>
                    </label>
                    <label className="role-option">
                        <input
                            type="radio"
                            name="userType"
                            value="driver"
                            checked={userType === "driver"}
                            onChange={(e) => setUserType(e.target.value)}
                        />
                        <span>Driver</span>
                    </label>
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Creating Account..." : "Sign Up"}
                </button>
            </form>

            <div className="social-login">
                <button 
                    type="button" 
                    onClick={handleGoogleSignUp} 
                    disabled={loading}
                    className="google-signin-button"
                >
                    Sign up with Google
                </button>
            </div>
        </div>
    );
};

export default Signup;
