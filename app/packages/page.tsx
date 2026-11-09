import type { Metadata } from "next";
import { PageBanner } from "@/components/PageBanner";
import { packageFeatures, packages } from "@/lib/site";

export const metadata: Metadata = { title: "Packages" };

export default function PackagesPage() {
  return (
    <>
      <PageBanner title="Packages" />
      <div className="wrap page">
        <div className="package-intro">
          <img src="/images/app.png" alt="Lodge app on a phone" />
          <h2>
            Free Websites
            <br />
            Free hosting
            <br />
            FREE mobile apps!
            <br />
            Free Security updates
          </h2>
        </div>
        <h3 style={{ textAlign: "center", color: "#1e225e" }}>Free and Add-on packages with annual contribution</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="compare">
            <thead>
              <tr>
                <th className="feature"> </th>
                {packages.map((plan) => (
                  <th key={plan.name} className={plan.highlighted ? "highlight" : undefined}>
                    {plan.name}
                    <small>{plan.detail}</small>
                    <span style={{ display: "block", fontSize: 22, marginTop: 4 }}>{plan.price}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {packageFeatures.map((feature, index) => (
                <tr key={feature}>
                  <td className="feature">{feature}</td>
                  {packages.map((plan) => {
                    const cell = plan.cells[index];
                    return (
                      <td key={plan.name} className={plan.highlighted ? "highlight" : undefined}>
                        <span className={cell.included ? "yes" : "no"}>{cell.included ? "✓" : "✕"}</span>
                        {cell.note ? <span className="note">{cell.note}</span> : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ textAlign: "center" }}>
          <em>Mark package option does not cover the history of the lodge.</em>
          <br />
          <em>All packages includes regular security updates and backups.</em>
        </p>
        <h2>Other add-on options</h2>
        <ul>
          <li>We could scan and make your lodge summons, minutes available online for the lodge members</li>
          <li>We could scan and publish all lodge photos in photo gallery</li>
          <li>We could interview senior members of the lodge members for video gallery of the lodge.</li>
          <li>We can scan and make all your lodge archive available online on your lodge app.</li>
        </ul>
      </div>
    </>
  );
}
