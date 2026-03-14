import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-slate-300 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          </div>

          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">1. Information We Collect</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Email address and password (for authentication)</li>
                <li>Profile information (name, avatar)</li>
                <li>Video files you upload</li>
                <li>Usage data and analytics</li>
                <li>Device and browser information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process video files and generate clips</li>
                <li>Authenticate users and manage accounts</li>
                <li>Send notifications and updates</li>
                <li>Analyze usage patterns to improve user experience</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">3. Information Sharing</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li><strong>Service Providers:</strong> Third-party services that help us operate our platform (e.g., Supabase for database, OpenAI for AI services)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, sale, or transfer of assets</li>
              </ul>
              <p className="text-slate-300 leading-relaxed mt-4">
                Your video content is processed using AI services (OpenAI). We ensure these services have appropriate data protection agreements in place.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">4. Data Security</h2>
              <p className="text-slate-300 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These include encryption, secure servers, and regular security audits. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">5. Data Retention</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this policy:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li><strong>Account Information:</strong> Retained until you delete your account</li>
                <li><strong>Video Files:</strong> Retained according to your account settings and subscription plan</li>
                <li><strong>Analytics Data:</strong> Retained for analysis purposes, typically 24 months</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">6. Your Rights</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Objection:</strong> Object to processing of your information</li>
                <li><strong>Portability:</strong> Request transfer of your information</li>
              </ul>
              <p className="text-slate-300 leading-relaxed mt-4">
                To exercise these rights, please contact us at privacy@aivideorepurposer.com
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">7. Cookies and Tracking</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Remember your login session</li>
                <li>Analyze user behavior and preferences</li>
                <li>Improve website performance</li>
              </ul>
              <p className="text-slate-300 leading-relaxed mt-4">
                You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">8. Third-Party Services</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Our service integrates with third-party providers:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li><strong>Supabase:</strong> Database and authentication services</li>
                <li><strong>OpenAI:</strong> AI-powered video analysis and transcription</li>
              </ul>
              <p className="text-slate-300 leading-relaxed mt-4">
                These services have their own privacy policies. We encourage you to review them.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">9. Children&apos;s Privacy</h2>
              <p className="text-slate-300 leading-relaxed">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will take steps to delete it.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">10. International Data Transfers</h2>
              <p className="text-slate-300 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">11. Changes to This Policy</h2>
              <p className="text-slate-300 leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">12. Contact Us</h2>
              <p className="text-slate-300 leading-relaxed">
                If you have questions about this privacy policy or our data practices, please contact us at:
              </p>
              <p className="text-slate-300 leading-relaxed mt-2">
                <strong>Email:</strong> privacy@aivideorepurposer.com<br />
                <strong>Address:</strong> [Your Business Address]
              </p>
            </section>

            <p className="text-slate-400 text-sm mt-8 pt-8 border-t border-white/10">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
