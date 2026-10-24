import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-gray-400 text-sm mb-8">Last updated: October 27, 2025</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-600">

        <p>
          This Privacy Policy describes Our policies and procedures on the collection, use and
          disclosure of Your information when You use the Service and tells You about Your privacy
          rights and how the law protects You.
        </p>
        <p>
          We use Your Personal data to provide and improve the Service. By using the Service, You
          agree to the collection and use of information in accordance with this Privacy Policy.
        </p>

        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">1. Interpretation and Definitions</h2>
          <h3 className="font-semibold text-gray-800 mt-4 mb-2">Interpretation</h3>
          <p>
            The words whose initial letters are capitalized have meanings defined under the following
            conditions. The following definitions shall have the same meaning regardless of whether
            they appear in singular or plural.
          </p>

          <h3 className="font-semibold text-gray-800 mt-4 mb-2">Definitions</h3>
          <p>For the purposes of this Privacy Policy:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account:</strong> a unique account created for You to access our Service or parts of our Service.</li>
            <li><strong>Affiliate:</strong> an entity that controls, is controlled by, or is under common control with a party.</li>
            <li><strong>Company:</strong> refers to {SITE.name}, {SITE.contact.address}.</li>
            <li><strong>Cookies:</strong> small files placed on Your device to store browsing history and other data.</li>
            <li><strong>Country:</strong> India.</li>
            <li><strong>Device:</strong> any device that can access the Service such as a computer, cell phone, or tablet.</li>
            <li><strong>Personal Data:</strong> any information relating to an identified or identifiable individual.</li>
            <li><strong>Service:</strong> refers to the Website.</li>
            <li><strong>Service Provider:</strong> any person or company processing data on behalf of the Company.</li>
            <li><strong>Usage Data:</strong> data collected automatically from the Service.</li>
            <li><strong>Website:</strong> {SITE.name}, accessible from <a href={SITE.url} className="text-blue-600 hover:underline">{SITE.url}</a>.</li>
            <li><strong>You:</strong> the individual accessing or using the Service or the legal entity they represent.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">2. Collecting and Using Your Personal Data</h2>

          <h3 className="font-semibold text-gray-800 mt-4 mb-2">Types of Data Collected</h3>
          <p><strong>Personal Data</strong></p>
          <p>
            While using Our Service, We may ask You to provide Us with certain personally identifiable
            information that can be used to contact or identify You. This may include:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Email address</li>
            <li>First name and last name</li>
            <li>Phone number</li>
          </ul>

          <p className="mt-4"><strong>Usage Data</strong></p>
          <p>
            Usage Data is collected automatically when using the Service and may include IP address,
            browser type, pages visited, time spent, device identifiers, and other diagnostic data.
          </p>
          <p>
            For mobile devices, we may collect device type, unique ID, IP address, operating system,
            browser type, and other diagnostic information.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">3. Tracking Technologies and Cookies</h2>
          <p>
            We use Cookies and similar technologies to track activity on Our Service. Types include:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Cookies:</strong> small files on Your device. You can refuse them, but some Service features may not work.</li>
            <li><strong>Web Beacons:</strong> small files used to count users or track email engagement.</li>
          </ul>
          <p>
            Cookies can be Session or Persistent. Session Cookies are deleted after browser closes;
            Persistent Cookies remain. For details, see the Privacy Policies article.
          </p>
          <p>Examples of Cookies usage:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Essential Cookies:</strong> enable service functionality.</li>
            <li><strong>Notice Acceptance Cookies:</strong> track cookie consent.</li>
            <li><strong>Functionality Cookies:</strong> remember preferences like login or language.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">4. Use of Your Personal Data</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>To provide and maintain our Service.</li>
            <li>To manage Your Account and registration.</li>
            <li>For contract performance and purchases.</li>
            <li>To contact You via email, calls, SMS, or app notifications.</li>
            <li>To provide news, offers, and information on similar goods/services.</li>
            <li>To manage requests to Us.</li>
            <li>For business transfers such as mergers or sales.</li>
            <li>Other purposes like data analysis and improving Services.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">5. Sharing Your Personal Information</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>With Service Providers for analytics or contacting You.</li>
            <li>During business transfers or mergers.</li>
            <li>With Affiliates bound to this Privacy Policy.</li>
            <li>With business partners for products or promotions.</li>
            <li>With other users in public areas.</li>
            <li>With Your consent for other purposes.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">6. Retention of Your Personal Data</h2>
          <p>
            Personal Data is retained only as long as necessary to comply with legal obligations,
            resolve disputes, or enforce agreements. Usage Data is generally retained for shorter
            periods unless legally required otherwise.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">7. Transfer of Your Personal Data</h2>
          <p>
            Your information may be processed in countries with different data protection laws. By
            submitting Your information, You consent to such transfers under reasonable security
            measures.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">8. Delete Your Personal Data</h2>
          <p>
            You may delete or request deletion of Personal Data via your Account or by contacting Us.
            Certain information may be retained due to legal obligations.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">9. Disclosure of Your Personal Data</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Business Transactions:</strong> mergers, acquisitions, asset sales.</li>
            <li><strong>Law enforcement:</strong> when required by law.</li>
            <li><strong>Other legal requirements:</strong> protect Company rights, investigate wrongdoing, protect public safety.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">10. Security of Your Personal Data</h2>
          <p>
            We strive to protect Your data, but no method of electronic storage or transmission is
            100% secure.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">11. Children&apos;s Privacy</h2>
          <p>
            Our Service does not address anyone under 13. If You are aware we collected data from a
            child, please contact us. Parental consent may be required in some countries.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">12. Links to Other Websites</h2>
          <p>
            Our Service may contain links to other websites not operated by Us. We are not responsible
            for their content or privacy policies.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">13. Changes to this Privacy Policy</h2>
          <p>
            We may update this Privacy Policy and will notify You via email or a prominent notice.
            Please review periodically.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">14. Contact Us</h2>
          <p>
            Email: <a href={`mailto:${SITE.contact.email}`} className="text-blue-600 hover:underline">{SITE.contact.email}</a>
            <br />
            Phone: <a href={SITE.contact.phoneHref} className="text-blue-600 hover:underline">{SITE.contact.phoneDisplay}</a>
          </p>
        </section>

      </div>
    </div>
  );
}