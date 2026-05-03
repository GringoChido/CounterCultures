import { EntityCard } from "@/app/(dashboard)/components/entity-card";
import { Mail, Eye } from "lucide-react";

const DesignDemoPage = () => {
  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl text-dash-text">EntityCard variants</h1>
        <p className="text-sm text-dash-text-secondary mt-1">
          Dev-only — used by Today, Pipeline, Leads, Shipments, Trade Program.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-dash-text">Lead</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <EntityCard
            variant="lead"
            id="LEAD-204"
            title="Casa de Luna — kitchen + bath spec"
            contact={{ name: "Gabor Arana", subtitle: "Showroom walk-in" }}
            brandChips={["Kohler", "BLANCO", "Brizo", "TOTO"]}
            status={{ label: "New", tone: "new" }}
            sla={{ dayInStage: 3, threshold: 5, label: "3 days old" }}
            href="/dashboard/leads"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-dash-text">Deal</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <EntityCard
            variant="deal"
            id="DEAL-118"
            value="$485K MXN"
            title="Hotel Rosewood SMA — phase 2"
            contact={{ name: "Mariana Cordero", subtitle: "Designer" }}
            brandChips={["Dornbracht", "Hansgrohe"]}
            status={{ label: "Proposal", tone: "in-progress" }}
            sla={{ dayInStage: 12, threshold: 14 }}
            href="/dashboard/pipeline"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-dash-text">Shipment</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <EntityCard
            variant="shipment"
            id="SHP-00042"
            value="$92K MXN"
            title="Container CC-042 — Kohler / TOTO"
            contact={{ name: "Aduana SMA", subtitle: "ETA shifted +4d" }}
            status={{ label: "In Customs", tone: "warning" }}
            sla={{ dayInStage: 5, threshold: 4, label: "5d / 4d SLA" }}
            href="/dashboard/shipments"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-dash-text">Trafico</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <EntityCard
            variant="trafico"
            id="TRF-00104"
            title="Trafico container CC-042 → SMA showroom"
            contact={{ name: "Mateo Vargas" }}
            status={{ label: "On the road", tone: "in-progress" }}
            href="/dashboard/shipments"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-dash-text">Trade Application</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <EntityCard
            variant="trade-app"
            id="TRD-008"
            title="Estudio Atelier — application pending review"
            contact={{ name: "Catalina Ríos", subtitle: "Architect, CDMX" }}
            status={{ label: "Pending", tone: "neutral" }}
            actions={
              <>
                <Eye className="w-3.5 h-3.5 text-dash-text-secondary hover:text-dash-text" />
                <Mail className="w-3.5 h-3.5 text-dash-text-secondary hover:text-dash-text" />
              </>
            }
            href="/dashboard/trade-program"
          />
        </div>
      </section>
    </div>
  );
};

export default DesignDemoPage;
