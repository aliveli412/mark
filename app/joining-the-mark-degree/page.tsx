import type { Metadata } from "next";
import { PageBanner } from "@/components/PageBanner";

export const metadata: Metadata = { title: "Joining the Mark Degree" };

export default function JoiningPage() {
  return (
    <>
      <PageBanner title="Joining the Mark Degree" />
      <div className="wrap page prose">
        <p>To become a Mark Master Mason you must be a Master Mason in the Craft.</p>
        <p>The degree only has one ceremony which, if taken soon after you’ve been raised, is great continuation of your masonic knowledge. Although you can be advanced in to the Mark degree at any time.</p>
        <p>The Mark Degree is one of hope and encouragement and the ritual is built upon a single verse of Psalm 118, “The stone which the builders rejected has become the headstone of the corner”. It deals with the building of King Solomon’s Temple and the various Craftsmen employed, but its real message is one of contemplation of human strength and weakness.</p>
        <p>The Degree contains many messages for the discerning man and illustrates that the wisest of men can be mistaken, that the experts are often wrong, that the weakest can display greater perseverance than the strongest, that the insignificant has the potential for distinction and that we all have a part to play in the Building of Life.</p>
        <p>It is for each to put his own interpretation on the message which the Degree proclaims, but there is a firm statement that no man is beyond redemption and the possibility of distinction is always within our grasp.</p>
        <p>Finally the Degree reminds us that when the wisest and cleverest of the builders were gathered together only one exhibited the wisdom necessary to assume the mantle of leadership.</p>
        <p>The degree represents the everyday life of each one of us, for the Stone hewn from the virgin rock depicts us all on our journey through life, and its final recognition as perfection should be the guide to our conduct through life so that we too may finally be found worthy.</p>
      </div>
    </>
  );
}
