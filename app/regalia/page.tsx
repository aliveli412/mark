import type { Metadata } from "next";
import { PageBanner } from "@/components/PageBanner";

export const metadata: Metadata = { title: "Regalia" };

export default function RegaliaPage() {
  return (
    <>
      <PageBanner title="Regalia" />
      <div className="wrap page">
        <article className="prose">
          <img src="/images/breast-jewel.jpg" alt="Mark Master Mason breast jewel, a keystone" style={{ float: "left", width: 220, margin: "0 18px 12px 0" }} />
          <h2>Mark Master Mason</h2>
          <p>
            Members of the Mark degree wear aprons of white kid having a triangular flap, all bordered with ribbon of light blue with crimson edges. The ribbons bears three rosettes of similar colour. Masters and Past Masters have the rosettes replaced by silver levels.
          </p>
          <p>
            The breast jewel is an ivory (or other material) keystone having a silver lewis which is suspended from a one-inch silver bar by a ribbon in the same colours as the apron. Each face of the keystone bears certain characters, on the reverse in English and on the Obverse in Hebrew.
          </p>
          <p>
            Officers wear a collar four inches in width in light blue and crimson. Their badge of office is suspended therefrom superimposed on a keystone.
          </p>
          <h2>Provincial Grand Officers</h2>
          <p>
            Provincial officers wear aprons decorated with four-inch ribbon having a royal blue centre and crimson edges. The emblem of office is contained within a garter which bears the name of the province or district which is placed in the centre of the apron. The breast jewel is the same as that for Mark Masters save that the furnishings are gold and the ribbon is of dark blue and crimson. A collar of matching colours is worn, it is four-inches in width and suspended from the apex hangs the emblem of office, surmounting a circle if acting rank and within an oval garter bearing the name of the province if past rank. There are both full-dress and undress aprons and collars.
          </p>
          <h2>Grand Officers</h2>
          <p>
            A Grand Officer’s regalia is identical in colouring to that of a provincial Grand Officer but the emblem of office is surrounded by a wreath of rose leaves and hyssop with three levels in gold. The collar is also three inches in width and is also decorated with rose leaves and hyssop. Again there are full-dress and undress sets of regalia.
          </p>
          <h2>Provincial Grand Master</h2>
        </article>
      </div>
    </>
  );
}
