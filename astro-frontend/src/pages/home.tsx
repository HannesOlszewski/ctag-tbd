import PluginSelect from "@/components/PluginSelect";
import Layout from "@/layouts/layout";

export default function HomePage() {
  return (
    <Layout name="CTAG-TBD">
      <h4>Plugin Channel 0</h4>
      <PluginSelect channel="0" />

      <div className="divider" />

      <h4>Plugin Channel 1</h4>
      <PluginSelect channel="1" />

      <div className="divider" />
    </Layout>
  );
}
