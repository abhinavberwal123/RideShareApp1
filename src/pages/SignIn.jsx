// ==== FILE: src/pages/SignIn.jsx ====
import React from "react";

function SignIn() {
    return (
        <div className="page-container">
            <h1>Sign In</h1>
            <form>
                <input type="text" placeholder="Username" />
                <input type="password" placeholder="Password" />
                <button type="submit">Login</button>
            </form>
        </div>
    );
}

export default SignIn;
