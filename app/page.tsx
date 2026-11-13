import Link from "next/link";
import { ProvinceDirectory } from "@/components/ProvinceDirectory";
import { stats } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <img
          src="/images/hero.jpg"
          alt="Mark Master Masons wearing aprons and presenting keystones and ashlar"
        />
      </section>
      <section className="stats" aria-label="Portal figures">
        {stats.map((stat) => (
          <div className="stat" key={stat.label}>
            <strong>
              {stat.value}
              {stat.suffix ?? ""}
            </strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>
      <div className="wrap">
        <div className="aim">
          <p>
            Our aim is to provide <strong>Free website for every lodge; </strong>
            a website where there will be <strong>no maintenance issues, updates, security</strong> etc.
            <br />
            We will facilitate tools such as festive board and other event management tools, digital summons and minutes, and many more completely free of charge.
          </p>
        </div>
        <div className="tiles">
          <Link href="/packages">
            <img src="/images/services-websites.png" alt="Mark Portal for lodges, provinces, district lodges and grand lodges" />
          </Link>
          <Link href="/blog">
            <img src="/images/services-news.png" alt="Mark News" />
          </Link>
          <Link href="/packages">
            <img src="/images/services-apps.png" alt="iOS and Android mobile apps for lodges" />
          </Link>
        </div>
      </div>
      <section className="section band">
        <div className="wrap">
          <h2>Grand & District Lodges</h2>
          <p className="lede">
            The same provinces and districts marked on the portal map. Each name opens the lodge site that is already published.
          </p>
          <ProvinceDirectory />
        </div>
      </section>
    </>
  );
}
