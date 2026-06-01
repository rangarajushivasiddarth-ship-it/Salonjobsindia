import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions - Salon Jobs India',
  description: 'Terms and Conditions for using Salon Jobs India. Please read carefully before using our service.',
}

export default function TermsAndConditions() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Terms & Conditions</h1>
        <p className="text-muted-foreground mb-8">Last Updated: June 1, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-base leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Agreement to Terms</h2>
            <p className="text-foreground">
              By accessing and using Salon Jobs India ("Service"), you accept and agree to be bound by and comply with the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Use License</h2>
            <p className="text-foreground mb-3">
              Permission is granted to temporarily download one copy of the materials (information or software) from Salon Jobs India for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-2">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on the Service</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Disclaimer</h2>
            <p className="text-foreground">
              The materials on Salon Jobs India are provided "as is". Salon Jobs India makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Limitations</h2>
            <p className="text-foreground">
              In no event shall Salon Jobs India or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Salon Jobs India, even if Salon Jobs India or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Accuracy of Materials</h2>
            <p className="text-foreground">
              The materials appearing on Salon Jobs India could include technical, typographical, or photographic errors. Salon Jobs India does not warrant that any of the materials on the Service are accurate, complete, or current. Salon Jobs India may make changes to the materials contained on the Service at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Materials and Content</h2>
            <p className="text-foreground mb-3">
              Salon Jobs India has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Salon Jobs India of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Modifications</h2>
            <p className="text-foreground">
              Salon Jobs India may revise these Terms and Conditions for the Service at any time without notice. By using this Service, you are agreeing to be bound by the then current version of these Terms and Conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Governing Law</h2>
            <p className="text-foreground">
              These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts located in India.
            </p>
          </section>

          <section className="bg-destructive/10 border border-destructive/30 p-6 rounded-lg">
            <p className="text-sm text-foreground">
              <strong>Disclaimer:</strong> This Terms & Conditions agreement is designed to comply with Indian law and international standards. By using Salon Jobs India, you accept these terms in their entirety.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
