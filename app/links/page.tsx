import type { Metadata } from "next";
import { PageBanner } from "@/components/PageBanner";

export const metadata: Metadata = { title: "Links" };

const links = [
  {
    href: "http://www.glmmm.com/",
    title: "Grand Lodge of Mark Master Masons",
  },
  {
    href: "http://www.markprovinceoflondon.com/",
    title: "Provincial Grand Lodge of Mark Master Masons London",
  },
  {
    href: "http://www.ugle.org.uk/",
    title: "United Grand Lodge of England (UGLE)",
    text: "The United Grand Lodge of England is the governing body of Freemasonry in England, Wales and the Channel Islands.",
  },
  {
    href: "https://www.londonmasons.org.uk/",
    title: "Metropolitan Grand Lodge of London",
    text: "Official website for Freemasonry in London, operated by London Management, now the Metropolitan Grand Lodge of London.",
  },
];

export default function LinksPage() {
  return (
    <>
      <PageBanner title="Links" />
      <div className="wrap page prose">
        <p>This page provides links to other Masonic Sites that may be of interest.</p>
        <ul className="links-list">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noreferrer">{link.title}</a>
              {link.text ? <p>{link.text}</p> : null}
            </li>
          ))}
        </ul>
        <p>
          ‘We do not guarantee that Web sites accessed via links on this page or Web site are either Masonic in nature or have been approved or endorsed by the United Grand Lodge of England. We specifically do not warrant that any other Web sites accessible from their pages are recognised by, or have the approval of, the United Grand Lodge of England.
        </p>
        <h2>Periodicals held by Masonic Periodicals Online</h2>
        <p><a href="https://masonicperiodicals.org/" target="_blank" rel="noreferrer">https://masonicperiodicals.org/</a></p>
        <h2>Royal Masonic Benevolent Institution (RMBI)</h2>
        <p>
          <a href="http://www.rmbi.org.uk/" target="_blank" rel="noreferrer">Caring for older Freemasons and their dependants.</a>
        </p>
        <p>Royal Masonic Trust for Girls and Boys (RMTGB).</p>
        <p>Masonic charitable organisation dedicated to relieving poverty and providing and education for the children of the family of a Freemason.</p>
        <h2>Masonic Charitable Fund (MCF)</h2>
        <p>
          <a href="https://mcf.org.uk/" target="_blank" rel="noreferrer">Masonic Charitable Fund</a>
        </p>
        <p>
          The Masonic Samaritan Fund and The Freemasons’ Grand Charity have been incoporated and renamed the Masonic Charitable Fund is a grant making charity that supports Freemasons and their dependants who have an identified medical need and, faced with a long wait for treatment, are unable to afford their own private care, it is a grant-making charity, which is funded by Freemasons and their families. Last year it gave grants totalling nearly £7 million to support people in need and fund the work of charities helping the wider community.
        </p>
      </div>
    </>
  );
}
