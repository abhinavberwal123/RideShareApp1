// ==== FILE: src/pages/Home.jsx ====
import { Link } from "react-router-dom";
import "../styles/Home.css";
import rickshawImage from "../assets/rickshaw-hero.jpg"; // Add a hero image to your assets folder

function Home() {
    return (
        <div className="page-container home-container">
            <div className="hero-section">
                <img src={rickshawImage} alt="E-Rickshaw Service" className="hero-image" loading="lazy" />
                <h1 className="app-title">Delhi E-Rickshaw</h1>
                <p className="app-tagline">Fast, affordable, and eco-friendly rides across Delhi</p>
            </div>

            <div className="features-section">
                <div className="feature-card">
                    <div className="feature-icon">⚡</div>
                    <div className="feature-text">
                        <div className="feature-title">Quick Booking</div>
                        <div className="feature-description">Book your ride in seconds with just a few taps</div>
                    </div>
                </div>

                <div className="feature-card">
                    <div className="feature-icon">💰</div>
                    <div className="feature-text">
                        <div className="feature-title">Affordable Rates</div>
                        <div className="feature-description">Enjoy budget-friendly fares for all your trips</div>
                    </div>
                </div>

                <div className="feature-card">
                    <div className="feature-icon">🌿</div>
                    <div className="feature-text">
                        <div className="feature-title">Eco-Friendly</div>
                        <div className="feature-description">Zero emissions with our electric rickshaw fleet</div>
                    </div>
                </div>
            </div>

            <div className="cta-section">
                <div className="cta-buttons">
                    <Link to="/booking">
                        <button className="cta-button primary-button">Book a Ride Now</button>
                    </Link>
                    <Link to="/signup">
                        <button className="cta-button secondary-button">Create an Account</button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Home;
