import { siteConfig } from "@/config/site.config";
import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="border-t border-border">

      <Container>

        <div className="grid gap-10 py-16 md:grid-cols-4">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-primary">
                T
              </span>

              <span className="font-bold">
                {siteConfig.name}
              </span>
            </div>

            <p className="mt-5 max-w-xs text-xs leading-5 text-text-secondary">
              Taverna is a premier valet car care and concierge platform
              delivering dealer-grade service and ultimate convenience right
              to your home or office.
            </p>

            <div className="mt-5 flex gap-2">
              <SocialButton>◎</SocialButton>
              <SocialButton>f</SocialButton>
              <SocialButton>𝕏</SocialButton>
            </div>
          </div>

          {/* Services */}
          <FooterColumn
            title="OUR SERVICES"
            links={[
              "Valet Detail Packages",
              "Maintenance Concierge",
              "Custom Ceramic Coatings",
              "Corporate Fleet Programs",
            ]}
          />

          {/* Company */}
          <FooterColumn
            title="COMPANY"
            links={[
              "About Us",
              "Careers",
              "Become a Partner",
              "Contact Support",
            ]}
          />

          {/* Contact */}
          <div>
            <h3 className="text-xs font-bold">
              CONTACT INFO
            </h3>

            <div className="mt-5 space-y-3 text-xs text-text-secondary">
              <p>✉ {siteConfig.contact.email}</p>
              <p>☎ {siteConfig.contact.phone}</p>
              <p>{siteConfig.contact.address}</p>
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="flex flex-col justify-between gap-4 border-t border-border py-7 text-xs text-text-secondary md:flex-row">
          <p>
            © 2026 Taverna Valet. All rights reserved.
          </p>

          <div className="flex gap-6">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>

      </Container>

    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: string[];
}) {
  return (
    <div>
      <h3 className="text-xs font-bold">
        {title}
      </h3>

      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link}>
            <a
              href="#"
              className="text-xs text-text-secondary hover:text-gray-900"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialButton({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <button className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs">
      {children}
    </button>
  );
}