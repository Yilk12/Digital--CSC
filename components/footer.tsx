"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUp, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Globe } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/about" || pathname?.startsWith("/about/")) return null;

  const [email, setEmail] = React.useState("");
  const [showBackToTop, setShowBackToTop] = React.useState(false);

  // Show back to top button when scrolled down
  React.useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Newsletter subscription:', email);
    setEmail("");
  };

  

  const quickLinks = [
    { label: "FAQs", href: "/faq" },
    { label: "Knowledge Base", href: "/knowledge-base" },
    { label: "Tickets", href: "/tickets" },
    { label: "Analytics", href: "/analytics" },
  ];

  const supportLinks = [
    { label: "Help Center", href: "/help" },
    { label: "Contact", href: "/contact" },
    { label: "Feedback", href: "/feedback" },
    { label: "Report Issue", href: "/report" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Accessibility", href: "/accessibility" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com/ecsc", label: "Facebook" },
    { icon: Twitter, href: "https://twitter.com/ecsc", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com/company/ecsc", label: "LinkedIn" },
    { icon: Globe, href: "https://www.ecsc.gov.et", label: "Main Portal" },
  ];

  return (
    <>
      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: "fixed",
            bottom: "120px",
            right: "24px",
            background: "#1565c0",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = "#0d47a1";
            (e.target as HTMLButtonElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = "#1565c0";
            (e.target as HTMLButtonElement).style.transform = "translateY(0)";
          }}
          aria-label="Back to top"
        >
          <ArrowUp size={20} />
        </button>
      )}

      <footer style={{
        width: "100%",
        background: "#1a1a1a",
        color: "#fff",
        padding: "8px 12px",
        fontSize: "0.85rem",
        marginTop: "auto",
        borderTop: "1px solid #333"
      }}>
        {/* Footer right-side Contact button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <a
            href="/contact"
            style={{
              color: "#fff",
              background: "#1565c0",
              textDecoration: "none",
              fontWeight: 600,
              padding: "8px 12px",
              borderRadius: 6,
              fontSize: "0.9rem",
              boxShadow: "0 2px 6px rgba(21,101,192,0.24)",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "#0d47a1"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "#1565c0"; }}
          >
            Contact
          </a>
        </div>

        <div style={{ 
          maxWidth: 1100, 
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
          marginBottom: "10px"
        }}>
          {/* Quick Links */}
          <div>
            <h3 style={{ 
              fontSize: "1rem", 
              fontWeight: 600, 
              marginBottom: "12px",
              color: "#fff"
            }}>
              Quick Links
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {quickLinks.map((link) => (
                <li key={link.label} style={{ marginBottom: "8px" }}>
                  <a 
                    href={link.href} 
                    style={{ 
                      color: "#ccc", 
                      textDecoration: "none",
                      transition: "color 0.2s ease",
                      fontSize: "0.85rem"
                    }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = "#1565c0"}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = "#ccc"}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 style={{ 
              fontSize: "1rem", 
              fontWeight: 600, 
              marginBottom: "12px",
              color: "#fff"
            }}>
              Support
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {supportLinks.map((link) => (
                <li key={link.label} style={{ marginBottom: "8px" }}>
                  <a 
                    href={link.href} 
                    style={{ 
                      color: "#ccc", 
                      textDecoration: "none",
                      transition: "color 0.2s ease",
                      fontSize: "0.85rem"
                    }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = "#1565c0"}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = "#ccc"}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 style={{ 
              fontSize: "1rem", 
              fontWeight: 600, 
              marginBottom: "12px",
              color: "#fff"
            }}>
              Contact Information
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Mail size={16} color="#1565c0" />
                <a 
                  href="mailto:info@ecsc.gov.et" 
                  style={{ 
                    color: "#ccc", 
                    textDecoration: "none",
                    fontSize: "0.85rem",
                    transition: "color 0.2s ease"
                  }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.color = "#1565c0"}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.color = "#ccc"}
                >
                  info@ecsc.gov.et
                </a>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Phone size={16} color="#1565c0" />
                <a 
                  href="tel:+251111234567" 
                  style={{ 
                    color: "#ccc", 
                    textDecoration: "none",
                    fontSize: "0.85rem",
                    transition: "color 0.2s ease"
                  }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.color = "#1565c0"}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.color = "#ccc"}
                >
                  +251 11 123 4567
                </a>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <MapPin size={16} color="#1565c0" style={{ marginTop: "2px" }} />
                <span style={{ color: "#ccc", fontSize: "0.85rem" }}>
                  Arat Kilo, Addis Ababa, Ethiopia
                </span>
              </div>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div>
            <h3 style={{ 
              fontSize: "1rem", 
              fontWeight: 600, 
              marginBottom: "12px",
              color: "#fff"
            }}>
              Stay Updated
            </h3>
            <p style={{ 
              color: "#ccc", 
              fontSize: "0.85rem", 
              marginBottom: "12px",
              lineHeight: "1.4"
            }}>
              Subscribe to our newsletter for updates and announcements.
            </p>
            <form onSubmit={handleNewsletterSubmit} style={{ display: "flex", gap: "8px" }}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  border: "1px solid #333",
                  borderRadius: "6px",
                  background: "#2a2a2a",
                  color: "#fff",
                  fontSize: "0.85rem",
                  outline: "none"
                }}
              />
              <button
                type="submit"
                style={{
                  background: "#1565c0",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  transition: "background 0.2s ease"
                }}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.background = "#0d47a1"}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.background = "#1565c0"}
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        

        {/* Social Media & Legal Links */}
        <div style={{ 
          borderTop: "1px solid #333", 
          paddingTop: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
          {/* Social Media Icons */}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            {socialLinks.map((social) => {
              const IconComponent = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "30px",
                    height: "30px",
                    background: "#2a2a2a",
                    borderRadius: "50%",
                    color: "#ccc",
                    textDecoration: "none",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.background = "#1565c0";
                    (e.target as HTMLElement).style.color = "#fff";
                    (e.target as HTMLElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.background = "#2a2a2a";
                    (e.target as HTMLElement).style.color = "#ccc";
                    (e.target as HTMLElement).style.transform = "translateY(0)";
                  }}
                  aria-label={social.label}
                >
                  <IconComponent size={18} />
                </a>
              );
            })}
          </div>

          {/* Legal Links */}
          <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            flexWrap: "wrap",
            gap: "12px"
          }}>
            {legalLinks.map((link) => (
              <a 
                key={link.label}
                href={link.href} 
                style={{ 
                  color: "#ccc", 
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  transition: "color 0.2s ease"
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.color = "#1565c0"}
                onMouseLeave={(e) => (e.target as HTMLElement).style.color = "#ccc"}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Copyright Notice */}
          <div style={{ 
            textAlign: "center", 
            fontSize: "0.8rem",
            color: "#888",
            paddingTop: "8px",
            borderTop: "1px solid #333"
          }}>
            <p style={{ margin: 0 }}>
              {new Date().getFullYear()} Ethiopian Civil Service Commission. All rights reserved.
            </p>
            <p style={{ margin: "6px 0 0 0", fontSize: "0.8rem" }}>
              Help desk and Knowledge Base System
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
