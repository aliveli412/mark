import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <section>
          <h2>Free Websites for all Mark lodges!!!</h2>
          <p>
            Our aim is to provide <strong>Free website for every lodge; </strong>
            a website where there will be <strong>no maintenance issues, updates, security</strong> etc.
            We will facilitate tools such as festive board and other event management tools, digital summons and minutes, and many more completely free.
          </p>
          <p>
            <Link href="/donations/donations-to-provide-free-websites">Click here for donation page.</Link>
          </p>
        </section>
        <section>
          <h2>Our social channels</h2>
          <ul className="socials">
            <li><a href="https://twitter.com/MMMasons" target="_blank" rel="noreferrer">X (Twitter)</a></li>
            <li><a href="https://www.facebook.com/MarkMasterMasons/" target="_blank" rel="noreferrer">Facebook</a></li>
            <li><a href="https://www.instagram.com/markmastermasons/" target="_blank" rel="noreferrer">Instagram</a></li>
          </ul>
        </section>
        <section>
          <h2>Contact us</h2>
          <p>
            We prefer all enquiries to be made by the <Link href="/contact">link provided here</Link>. If you need to talk to us then please leave your number on the form provided.
          </p>
        </section>
      </div>
      <div className="wrap legal">
        Copyright © Mark Master Masons.COM — click the link <Link href="/privacy-policy">here for the</Link> Privacy Policy!
      </div>
    </footer>
  );
}
