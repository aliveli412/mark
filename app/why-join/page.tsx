import type { Metadata } from "next";
import { PageBanner } from "@/components/PageBanner";

export const metadata: Metadata = { title: "Why join?" };

const reasons = [
  {
    title: "To discover the true link between the second and third degrees in Craft Freemasonry",
    body: "Our enlightening ceremony teaches you, as a Craftsman, invaluable and practical lessons and how to apply them as you conduct yourself through life. You will also gain a clearer understanding of many of the terms, phrases and characters which have been introduced to you during your journey through Craft Masonry.",
  },
  {
    title: "It is a bridge to other Orders in Masonry",
    body: "At least four other orders require you to be a Mark Master Mason before you can discover their symbolism and further aid your Masonic knowledge and journey.",
  },
  {
    title: "To find out why we are called the friendly degree",
    body: "Ask any Mark Master Mason to describe the Mark Degree and they will invariably smile first and then tell you that it is a most friendly of Masonic Orders. Brotherly love is the keystone of Mark Masonry and the friendliness of the degree is clearly seen and experienced in our Lodge rooms in the genuine warmth of welcome that is universally extended among all Mark Masons. Indeed, whilst our message is key, there is no doubt that among Mark Master Masons you will ever find friends.",
  },
  {
    title: "To help you better understand the Holy Royal Arch",
    body: "One of the consequences of the 1813 union between the Antients and Moderns in England was the specific recognition of the three Craft degrees only, including the Holy Royal Arch, thus excluding the Mark Degree. As a result of this, a Craft Mason who joins other orders before the Mark Degree may be confused by their symbolism. Our Degree aids your understanding by adding essential background to the history of the construction of the Temple, the importance of the Keystone and the work of the Overseers. Interestingly, in other recognised constitutions, the Mark Degree can be conferred in either Craft Lodges or Royal Arch Chapters and indeed is an essential pre-requisite before exaltation into a Chapter can take place.",
  },
  {
    title: "Social Activities",
    body: "As you would expect from the friendly Degree we are a sociable order with a variety of Masonic, family and sporting activities for you to enjoy. Throughout the year we host many local and Provincial events from a family luncheon and a Burns Night, to golf and cricket tournaments and Masonic lectures and sponsored walks.",
  },
  {
    title: "Charitable Giving – He gives twice who gives promptly",
    body: "The Mark Benevolent Fund (MBF) is a registered charity which came into existence in 1868 on the suggestion of the Reverend George Raymond Portal, Grand Master of the Mark Degree. His views on charity were far more radical and progressive than the general thinking of the time. He felt that for charity to be effective it had to be disbursed swiftly and without the bureaucratic formalities of other Masonic charities. To him it was wrong for there to be any delay in providing assistance to those in need and his own Latin tag “Bis dat qui cito dat” – he gives twice who gives promptly – became, and still is, the principal guideline of the MBF.",
  },
];

export default function WhyJoinPage() {
  return (
    <>
      <PageBanner title="Why join?" />
      <div className="wrap page">
        <div className="reasons">
          {reasons.map((reason, index) => (
            <section className="reason" key={reason.title}>
              <h2>
                <span className="num">{index + 1}. </span>
                {reason.title}
              </h2>
              <p>{reason.body}</p>
            </section>
          ))}
        </div>
        <article className="prose" style={{ marginTop: 28 }}>
          <p><strong>To become a Mark Master Mason you must be a Master Mason in the Craft.</strong></p>
          <p>
            The degree only has one ceremony which, if taken soon after you’ve been raised, is great continuation of your masonic knowledge. Although you can be advanced in to the Mark degree at any time.
          </p>
          <p>
            The Mark Degree is one of hope and encouragement and the ritual is built upon a single verse of Psalm 118, “The stone which the builders rejected has become the headstone of the corner”. It deals with the building of King Solomon’s Temple and the various Craftsmen employed, but its real message is one of contemplation of human strength and weakness.
          </p>
          <p>
            The Degree contains many messages for the discerning man and illustrates that the wisest of men can be mistaken, that the experts are often wrong, that the weakest can display greater perseverance than the strongest, that the insignificant has the potential for distinction and that we all have a part to play in the Building of Life.
          </p>
          <p>
            It is for each to put his own interpretation on the message which the Degree proclaims, but there is a firm statement that no man is beyond redemption and the possibility of distinction is always within our grasp.
          </p>
          <p>
            Finally the Degree reminds us that when the wisest and cleverest of the builders were gathered together only one exhibited the wisdom necessary to assume the mantle of leadership.
          </p>
          <p>
            The degree represents the everyday life of each one of us, for the Stone hewn from the virgin rock depicts us all on our journey through life, and its final recognition as perfection should be the guide to our conduct through life so that we too may finally be found worthy.
          </p>
        </article>
      </div>
    </>
  );
}
