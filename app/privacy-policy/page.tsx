import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Salon Jobs India',
  description: 'Privacy Policy for Salon Jobs India - Learn how we collect, use, and protect your personal information.',
}

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last Updated: June 1, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-base leading-relaxed">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p className="text-foreground">
              Salon Jobs India ("we", "our", "us", or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the "Service").
            </p>
            <p className="text-foreground mt-3">
              Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Service. By accessing and using Salon Jobs India, you acknowledge that you have read, understood, and agree to be bound by all the terms of this Privacy Policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3">2.1 Information You Provide Directly</h3>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-2">
              <li>Account Information: Name, email address, phone number, profile picture, location</li>
              <li>Professional Information: Work experience, qualifications, certifications, portfolio, resume</li>
              <li>Employment Details: Salon name (for salon owners), business registration, services offered</li>
              <li>Communication: Messages, applications, inquiries sent through our platform</li>
              <li>Payment Information: Bank details, UPI ID, payment method information</li>
              <li>Preferences: Job preferences, notifications settings, language preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.2 Information Collected Automatically</h3>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-2">
              <li>Device Information: Device type, OS, browser type, IP address, unique identifiers</li>
              <li>Usage Information: Pages viewed, features used, time spent, clicks, interactions</li>
              <li>Location Data: Approximate location (derived from IP address, if permissions granted)</li>
              <li>Cookies & Similar Technologies: Session tokens, preferences, analytics data</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.3 Third-Party Information</h3>
            <p className="text-foreground">
              We may receive information about you from third parties if you choose to use social login features or if information is shared with us by other users of our platform.
            </p>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
            <p className="text-foreground mb-3">We use the information we collect for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-2">
              <li>Providing and improving our Service</li>
              <li>Processing job applications and placements</li>
              <li>Communicating with you about jobs, opportunities, and updates</li>
              <li>Personalizing your experience and recommendations</li>
              <li>Processing payments and transactions</li>
              <li>Verifying your identity and preventing fraud</li>
              <li>Complying with legal obligations</li>
              <li>Marketing and promotional purposes (with your consent)</li>
              <li>Analytics and understanding user behavior</li>
              <li>Improving security and safety of our platform</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Information Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3">4.1 Information We Share</h3>
            <p className="text-foreground mb-3">
              We do NOT sell your personal information. However, we may share information in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-2">
              <li><strong>Between Users:</strong> Job seekers' profiles are visible to salon owners; salon owner information is visible to job seekers</li>
              <li><strong>Service Providers:</strong> Payment processors, hosting providers, analytics providers</li>
              <li><strong>Legal Requirements:</strong> When required by law or government requests</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or bankruptcy</li>
              <li><strong>With Your Consent:</strong> Any sharing beyond these purposes requires your explicit permission</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.2 Data Processing</h3>
            <p className="text-foreground">
              Your data is processed on servers located in India. We implement appropriate security measures to protect your information from unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Retention</h2>
            <p className="text-foreground">
              We retain your personal information for as long as your account is active or as needed to provide our Service. You can request deletion of your account and associated data at any time. Some information may be retained for legal, accounting, or legitimate business purposes for up to 3 years after account deletion.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Your Rights and Choices</h2>
            <p className="text-foreground mb-3">You have the following rights regarding your personal information:</p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-2">
              <li>Access: Request a copy of your personal data</li>
              <li>Correction: Update or correct inaccurate information</li>
              <li>Deletion: Request deletion of your account and data (subject to legal obligations)</li>
              <li>Opt-out: Unsubscribe from marketing communications</li>
              <li>Data Portability: Request your data in a portable format</li>
              <li>Object: Object to certain processing of your data</li>
            </ul>
            <p className="text-foreground mt-4">
              To exercise any of these rights, please contact us at <a href="mailto:support@salonjobsindia.com" className="text-yellow-500 hover:underline">support@salonjobsindia.com</a>
            </p>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Security Measures</h2>
            <p className="text-foreground">
              We implement industry-standard security measures to protect your personal information, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-2">
              <li>HTTPS/SSL encryption for all data in transit</li>
              <li>Password hashing and encryption for stored credentials</li>
              <li>Secure authentication mechanisms</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication requirements</li>
            </ul>
            <p className="text-foreground mt-3">
              However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Children's Privacy</h2>
            <p className="text-foreground">
              Salon Jobs India is not intended for children under the age of 18. We do not knowingly collect personal information from children under 18. If we learn that we have collected personal information from a child under 18, we will promptly delete such information and terminate the child's account.
            </p>
          </section>

          {/* Third-Party Links */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Third-Party Links</h2>
            <p className="text-foreground">
              Our Service may contain links to third-party websites and applications. We are not responsible for the privacy practices of third parties. Please review the privacy policies of any third-party sites before providing your information.
            </p>
          </section>

          {/* International Data Transfer */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. International Data Transfer</h2>
            <p className="text-foreground">
              Your information is primarily stored and processed in India. If you are located outside India, please be aware that your information will be transferred to, stored in, and processed in India in accordance with this Privacy Policy and applicable Indian laws.
            </p>
          </section>

          {/* Policy Updates */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-foreground">
              We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. The date of the last update will be reflected in the "Last Updated" date at the top of this page. Your continued use of our Service after any changes constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* Compliance */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Legal Compliance</h2>
            <p className="text-foreground mb-3">
              Salon Jobs India complies with applicable privacy laws including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-2">
              <li>Information Technology Act, 2000 (India)</li>
              <li>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</li>
              <li>General Data Protection Regulation (GDPR) for users in the European Union</li>
            </ul>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contact Us</h2>
            <p className="text-foreground mb-3">
              If you have questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="bg-input/30 p-6 rounded-lg border border-input">
              <p className="text-foreground"><strong>Email:</strong> <a href="mailto:support@salonjobsindia.com" className="text-yellow-500 hover:underline">support@salonjobsindia.com</a></p>
              <p className="text-foreground mt-2"><strong>Company:</strong> FItonze Private Limited</p>
              <p className="text-foreground mt-2"><strong>Website:</strong> <a href="https://salonjobsindia.com" className="text-yellow-500 hover:underline">https://salonjobsindia.com</a></p>
              <p className="text-foreground mt-2"><strong>Response Time:</strong> We will respond to privacy inquiries within 30 days</p>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="bg-destructive/10 border border-destructive/30 p-6 rounded-lg mt-8">
            <p className="text-sm text-foreground">
              <strong>Disclaimer:</strong> This Privacy Policy is designed to comply with Indian law and international standards. By using Salon Jobs India, you consent to our collection and use of personal information as outlined in this Privacy Policy.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
