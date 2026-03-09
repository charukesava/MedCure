import { useNavigate } from "react-router-dom";
import "../styles/Landing.css";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="hero-inner">
          {/* Left Column */}
          <div className="hero-left">
            <div className="hero-badge">
              <span className="hero-badge-icon">⚡</span>
              AI-Powered Healthcare Revolution
            </div>
            <h1 className="hero-heading">
              Your Personal
              <br />
              <span className="hero-heading-accent">AI Health Assistant</span>
            </h1>
            <p className="hero-description">
              Experience the future of healthcare. Get instant symptom analysis,
              track your vitals, and manage your well-being with our intelligent
              platform.
            </p>
            <div className="hero-buttons">
              <button
                className="btn-primary"
                onClick={() => navigate("/signup")}
              >
                Start Your Journey &rarr;
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate("/login")}
              >
                Watch Demo
              </button>
            </div>
            <div className="hero-trust">
              <div className="hero-avatars">
                <div className="avatar av1">👨‍⚕️</div>
                <div className="avatar av2">👩‍⚕️</div>
                <div className="avatar av3">🧑‍⚕️</div>
                <div className="avatar av4">👨‍💼</div>
              </div>
              <span className="hero-trust-text">Trusted by 10,000+ users</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="hero-right">
            <div className="hero-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=520&h=580&fit=crop&crop=top"
                alt="Doctor"
                className="hero-doctor-img"
              />
              <div className="health-score-card">
                <div className="hs-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 12h3l3-9 4 18 3-9h5"
                      stroke="#0D9488"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="hs-info">
                  <div className="hs-title">Health Score</div>
                  <div className="hs-sub">Updated just now</div>
                  <div className="hs-bar">
                    <div className="hs-fill"></div>
                  </div>
                  <div className="hs-score">Excellent (98/100)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="about-section">
        <div className="about-container">
          <div className="section-header">
            <h2 className="section-title">About AI Health Assistant</h2>
            <p className="section-subtitle">
              Revolutionizing Healthcare Access for Everyone
            </p>
          </div>
          <div className="about-content">
            <div className="about-text">
              <h3>Our Mission</h3>
              <p>
                AI Health Assistant is dedicated to democratizing healthcare
                access and providing affordable, accessible health services to
                everyone. We believe healthcare should be just a click away.
              </p>
              <p>
                Our platform combines cutting-edge AI technology with a
                comprehensive network of hospitals and healthcare providers to
                give you instant access to medical guidance, hospital
                information, and appointment booking services.
              </p>
              <h3>Why We Exist</h3>
              <p>
                Finding the right hospital, booking an appointment, or getting
                instant health advice has never been easier. We're here to
                bridge the gap between patients and healthcare providers, making
                medical services more accessible, affordable, and convenient for
                millions of people across India.
              </p>
            </div>
            <div className="about-benefits">
              <div className="benefit-item">
                <div className="benefit-icon">⚡</div>
                <h4>Instant Access</h4>
                <p>Get healthcare services anytime, anywhere</p>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">💰</div>
                <h4>100% Free</h4>
                <p>No hidden charges or subscription fees</p>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🔒</div>
                <h4>Secure & Private</h4>
                <p>Your health data is protected and confidential</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="usecases" className="use-cases-section">
        <div className="section-header">
          <h2 className="section-title">How People Use AI Health Assistant</h2>
        </div>
        <div className="use-cases-grid">
          <div className="use-case-card">
            <div className="case-number">1</div>
            <h3>Get Instant Health Advice</h3>
            <p>
              Have a health concern? Chat with our AI to get instant information
              about symptoms, common illnesses, and health tips. Perfect for
              quick guidance before visiting a doctor.
            </p>
            <div className="case-example">
              Example: "What causes a headache?"
            </div>
          </div>

          <div className="use-case-card">
            <div className="case-number">2</div>
            <h3>Find Nearby Healthcare</h3>
            <p>
              Searching for a hospital or clinic? Use our location-based finder
              to discover nearby hospitals with real-time information about
              facilities, services, and availability.
            </p>
            <div className="case-example">
              Example: "Find hospitals near me"
            </div>
          </div>

          <div className="use-case-card">
            <div className="case-number">3</div>
            <h3>Book Doctor Appointments</h3>
            <p>
              No more phone calls! Book appointments directly with doctors and
              specialists at your preferred hospitals. Check availability and
              confirm your slot instantly.
            </p>
            <div className="case-example">
              Example: "Book a pediatrician appointment"
            </div>
          </div>

          <div className="use-case-card">
            <div className="case-number">4</div>
            <h3>Emergency Support</h3>
            <p>
              In an emergency? Get quick access to ambulance services, nearest
              emergency centers, and contact information. Every second counts.
            </p>
            <div className="case-example">Example: "Emergency support"</div>
          </div>

          <div className="use-case-card">
            <div className="case-number">5</div>
            <h3>Stay Updated</h3>
            <p>
              Get real-time updates from hospitals about new services, medical
              camps, vaccination drives, and important health announcements.
            </p>
            <div className="case-example">
              Example: "Hospital updates near you"
            </div>
          </div>

          <div className="use-case-card">
            <div className="case-number">6</div>
            <h3>Manage Your Health</h3>
            <p>
              Keep track of all your appointments, medical consultations, and
              health information in one secure place for easy reference.
            </p>
            <div className="case-example">Example: "View my appointments"</div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="benefits-highlight">
        <div className="section-header">
          <h2 className="section-title">Why Choose AI Health Assistant?</h2>
        </div>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-number">✓</div>
            <h3>AI-Powered</h3>
            <p>
              Advanced AI technology for accurate health information and
              personalized recommendations
            </p>
          </div>
          <div className="benefit-card">
            <div className="benefit-number">✓</div>
            <h3>Comprehensive Network</h3>
            <p>
              Access to 5000+ hospitals and clinics across India with verified
              information
            </p>
          </div>
          <div className="benefit-card">
            <div className="benefit-number">✓</div>
            <h3>24/7 Availability</h3>
            <p>
              Get health guidance and services anytime, day or night, whenever
              you need
            </p>
          </div>
          <div className="benefit-card">
            <div className="benefit-number">✓</div>
            <h3>Simple & Easy</h3>
            <p>
              User-friendly interface designed for everyone, no technical skills
              required
            </p>
          </div>
          <div className="benefit-card">
            <div className="benefit-number">✓</div>
            <h3>Real-Time Updates</h3>
            <p>
              Stay informed with instant notifications about hospital services
              and medical camps
            </p>
          </div>
          <div className="benefit-card">
            <div className="benefit-number">✓</div>
            <h3>Complete Privacy</h3>
            <p>
              Your health information is encrypted and completely confidential
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <span className="section-tag">Features</span>
          <h2 className="section-title">Key Features</h2>
          <p className="section-sub">
            Everything you need for smarter healthcare, in one place.
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Health Chat</h3>
            <p>
              Chat with AI to get instant health advice and general medical
              information.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏥</div>
            <h3>Find Hospitals</h3>
            <p>
              Locate nearby hospitals, clinics, and healthcare facilities in
              your area.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Book Appointments</h3>
            <p>
              Schedule appointments with doctors at your preferred hospitals.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🗺️</div>
            <h3>Location Services</h3>
            <p>Get directions and maps to nearby medical facilities.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🚨</div>
            <h3>Emergency Alert</h3>
            <p>Quick access to emergency services when you need them most.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Hospital Updates</h3>
            <p>
              Stay informed with latest updates from hospitals across India.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="how-it-works">
        <div className="section-header">
          <span className="section-tag">How it Works</span>
          <h2 className="section-title">Get Started in Minutes</h2>
          <p className="section-sub">
            Simple steps to access world-class healthcare support.
          </p>
        </div>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Sign Up</h4>
            <p>Create your free account in minutes</p>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <h4>Browse Services</h4>
            <p>Explore all health services available</p>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <h4>Get Help</h4>
            <p>Chat, find hospitals, or book appointments</p>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <h4>Track History</h4>
            <p>Manage your appointments and health data</p>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="stats" className="stats-section">
        <div className="stat">
          <h3>5000+</h3>
          <p>Hospitals & Clinics</p>
        </div>
        <div className="stat">
          <h3>10000+</h3>
          <p>Active Users</p>
        </div>
        <div className="stat">
          <h3>24/7</h3>
          <p>Support Available</p>
        </div>
        <div className="stat">
          <h3>100%</h3>
          <p>Free Service</p>
        </div>
      </section>

      {/* CTA Section */}
      <section id="signup" className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>
          Join thousands of users who trust AI Health Assistant for their
          healthcare needs
        </p>
        <button className="btn-cta" onClick={() => navigate("/signup")}>
          Sign Up Now
        </button>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <h2>Get in Touch</h2>
        <div className="contact-container">
          <div className="contact-card">
            <div className="contact-icon">📱</div>
            <h3>Phone</h3>
            <p>
              <a href="tel:+917801048080">+91 7801048080</a>
            </p>
            <p className="contact-desc">Call us during business hours</p>
          </div>

          <div className="contact-card">
            <div className="contact-icon">✉️</div>
            <h3>Email</h3>
            <p>
              <a href="mailto:charukesava.k@gmail.com">
                charukesava.k@gmail.com
              </a>
            </p>
            <p className="contact-desc">We respond within 24 hours</p>
          </div>

          <div className="contact-card">
            <div className="contact-icon">🕐</div>
            <h3>Availability</h3>
            <p>Available 24/7</p>
            <p className="contact-desc">Always here to help you</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2026 AI Health Assistant. All rights reserved.</p>
        <p>Healthcare at your fingertips</p>
      </footer>
    </div>
  );
}
